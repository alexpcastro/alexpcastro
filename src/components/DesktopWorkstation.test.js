import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DesktopWorkstation from "./DesktopWorkstation";

let container, root, frames, nextFrame, media, mediaListeners, observers, hidden;
let originalHidden, originalObserver, originalMatchMedia;
const scene = () => container.querySelector('svg[role="presentation"]');
const part = (name) => container.querySelector(`[data-part="${name}"]`);
const render = () => act(() => root.render(<DesktopWorkstation />));
const advanceFrame = (timestamp) => act(() => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach(callback => callback(timestamp));
});
const changePreference = (matches) => act(() => {
  media.matches = matches;
  [...mediaListeners].forEach(listener => listener({ matches }));
});
const changeVisibility = (value) => act(() => {
  hidden = value;
  document.dispatchEvent(new Event("visibilitychange"));
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  frames = new Map();
  nextFrame = 0;
  mediaListeners = new Set();
  observers = [];
  hidden = false;
  originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  jest.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(id => frames.delete(id));
  originalMatchMedia = window.matchMedia;
  media = {
    matches: false,
    addEventListener: jest.fn((event, callback) => mediaListeners.add(callback)),
    removeEventListener: jest.fn((event, callback) => mediaListeners.delete(callback)),
  };
  window.matchMedia = jest.fn(() => media);
  originalObserver = window.IntersectionObserver;
  window.IntersectionObserver = jest.fn().mockImplementation(callback => {
    const observer = { observe: jest.fn(), disconnect: jest.fn(), notify: (isIntersecting) => act(() => callback([{ isIntersecting }])) };
    observers.push(observer);
    return observer;
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  if (originalHidden) Object.defineProperty(document, "hidden", originalHidden);
  else delete document.hidden;
  window.IntersectionObserver = originalObserver;
  window.matchMedia = originalMatchMedia;
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test("mounts a decorative scene with an accessible pause control and moving elements", () => {
  render();
  expect(scene().getAttribute("aria-hidden")).toBe("true");
  expect(container.firstChild.getAttribute("data-motion")).toBe("playing");
  const button = container.querySelector("button");
  expect(button.getAttribute("aria-label")).toBe("Pause workstation animation");
  expect(button.getAttribute("aria-pressed")).toBe("false");
  expect(observers[0].observe).toHaveBeenCalledWith(scene());
  expect(frames.size).toBe(1);
  advanceFrame(40);
  const before = scene().outerHTML;
  advanceFrame(80);
  expect(scene().outerHTML).not.toBe(before);
  ["monitor", "keyboard", "mouse", "reflection"].forEach(name => expect(part(name).hasAttribute("transform")).toBe(true));
  expect(container.querySelector("[data-key]").hasAttribute("transform")).toBe(true);
  expect(frames.size).toBe(1);
});

test("pauses all frame work and resumes from the same visual time without a reset", () => {
  render();
  advanceFrame(40);
  advanceFrame(80);
  advanceFrame(120);
  const before = scene().outerHTML;
  const staleFrame = [...frames.values()][0];
  act(() => container.querySelector("button").click());
  expect(container.firstChild.getAttribute("data-motion")).toBe("paused");
  expect(container.querySelector("button").getAttribute("aria-label")).toBe("Play workstation animation");
  expect(container.querySelector("button").getAttribute("aria-pressed")).toBe("true");
  expect(frames.size).toBe(0);
  expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  act(() => staleFrame(1000));
  expect(scene().outerHTML).toBe(before);
  act(() => container.querySelector("button").click());
  expect(frames.size).toBe(1);
  advanceFrame(5000);
  expect(scene().outerHTML).toBe(before);
  advanceFrame(5040);
  expect(scene().outerHTML).not.toBe(before);
});

test("caps SVG writes to 30fps while maintaining only one animation request", () => {
  render();
  const writes = jest.spyOn(part("monitor"), "setAttribute");
  for (let timestamp = 0; timestamp <= 100; timestamp += 10) advanceFrame(timestamp);
  expect(writes).toHaveBeenCalledTimes(2);
  expect(frames.size).toBe(1);
});

test("initial reduced-motion preference leaves a static illustration without animation controls", () => {
  media.matches = true;
  render();
  expect(container.firstChild.getAttribute("data-motion")).toBe("reduced");
  expect(scene()).not.toBeNull();
  expect(container.querySelector("button")).toBeNull();
  expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  expect(observers).toHaveLength(0);
});

test("live reduced-motion changes stop animation and restore it when disabled", () => {
  render();
  advanceFrame(40);
  const before = scene().outerHTML;
  changePreference(true);
  expect(frames.size).toBe(0);
  expect(container.firstChild.getAttribute("data-motion")).toBe("reduced");
  expect(observers[0].disconnect).toHaveBeenCalled();
  advanceFrame(1000);
  expect(scene().outerHTML).toBe(before);
  changePreference(false);
  expect(container.firstChild.getAttribute("data-motion")).toBe("playing");
  expect(frames.size).toBe(1);
});

test("preserves a deliberate pause through reduced-motion preference changes", () => {
  render();
  act(() => container.querySelector("button").click());
  changePreference(true);
  changePreference(false);
  expect(container.firstChild.getAttribute("data-motion")).toBe("paused");
  expect(frames.size).toBe(0);
});

test("hidden documents suspend animation and resume without a time jump", () => {
  render();
  advanceFrame(40);
  advanceFrame(80);
  const before = scene().outerHTML;
  changeVisibility(true);
  expect(frames.size).toBe(0);
  changeVisibility(false);
  expect(frames.size).toBe(1);
  advanceFrame(10000);
  expect(scene().outerHTML).toBe(before);
  advanceFrame(10040);
  expect(scene().outerHTML).not.toBe(before);
});

test("offscreen scenes suspend and wait for both visibility conditions to resume", () => {
  render();
  observers[0].notify(false);
  expect(frames.size).toBe(0);
  changeVisibility(true);
  observers[0].notify(true);
  expect(frames.size).toBe(0);
  changeVisibility(false);
  expect(frames.size).toBe(1);
  observers[0].notify(true);
  expect(frames.size).toBe(1);
});

test("an initially hidden document does not request frames until visible", () => {
  hidden = true;
  render();
  expect(frames.size).toBe(0);
  changeVisibility(false);
  expect(frames.size).toBe(1);
});

test("unmount cancels frames, removes listeners, and makes stale callbacks inert", () => {
  const removeListener = jest.spyOn(document, "removeEventListener");
  render();
  advanceFrame(40);
  const detachedScene = scene();
  const before = detachedScene.outerHTML;
  const staleFrame = [...frames.values()][0];
  act(() => root.render(null));
  expect(frames.size).toBe(0);
  expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  expect(mediaListeners.size).toBe(0);
  expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  act(() => staleFrame(10000));
  observers[0].notify(true);
  changeVisibility(false);
  expect(frames.size).toBe(0);
  expect(detachedScene.outerHTML).toBe(before);
});

test("StrictMode cleanup leaves one active animation and cleans up every observer", () => {
  act(() => root.render(<React.StrictMode><DesktopWorkstation /></React.StrictMode>));
  expect(frames.size).toBe(1);
  expect(mediaListeners.size).toBe(1);
  act(() => root.render(null));
  expect(frames.size).toBe(0);
  observers.forEach(observer => expect(observer.disconnect).toHaveBeenCalledTimes(1));
});

test("works when optional matchMedia and IntersectionObserver APIs are unavailable", () => {
  window.matchMedia = undefined;
  window.IntersectionObserver = undefined;
  render();
  advanceFrame(40);
  expect(part("monitor").hasAttribute("transform")).toBe(true);
  expect(frames.size).toBe(1);
});

test("SVG paint and clipping references resolve locally with unique IDs across instances", () => {
  act(() => root.render(<><DesktopWorkstation /><DesktopWorkstation /></>));
  const ids = [...container.querySelectorAll("[id]")].map(node => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  container.querySelectorAll('svg[role="presentation"]').forEach(svg => {
    const localIds = new Set([...svg.querySelectorAll("[id]")].map(node => node.id));
    const references = [...svg.querySelectorAll("*")].flatMap(node => [...node.attributes]
      .flatMap(attribute => [...attribute.value.matchAll(/url\(#([^)]*)\)/g)].map(match => match[1])));
    expect(references.length).toBeGreaterThan(0);
    references.forEach(id => expect(localIds.has(id)).toBe(true));
  });
});

test("animation updates reuse SVG nodes without React commits or layout measurements", () => {
  const commits = jest.fn();
  act(() => root.render(<React.Profiler id="workstation" onRender={commits}><DesktopWorkstation /></React.Profiler>));
  const initialNodes = [...scene().querySelectorAll("*")];
  const initialCommits = commits.mock.calls.length;
  const measurements = jest.spyOn(Element.prototype, "getBoundingClientRect");
  for (let timestamp = 40; timestamp <= 1000; timestamp += 40) advanceFrame(timestamp);
  expect([...scene().querySelectorAll("*")]).toEqual(initialNodes);
  expect(commits).toHaveBeenCalledTimes(initialCommits);
  expect(measurements).not.toHaveBeenCalled();
  expect(frames.size).toBe(1);
});

test("animated cream keycaps preserve the separate warm function-key accent", () => {
  render();
  const keys = [...scene().querySelectorAll("[data-key]")];
  expect(keys).toHaveLength(18);
  const accent = part("keyboard").querySelector('path[fill="#c8956c"]');
  expect(accent).not.toBeNull();
  expect(accent.hasAttribute("data-key")).toBe(false);
  const accentBefore = accent.outerHTML;
  const keysBefore = keys.map(key => key.getAttribute("fill"));
  for (let timestamp = 40; timestamp <= 4000; timestamp += 40) advanceFrame(timestamp);
  expect(accent.outerHTML).toBe(accentBefore);
  expect(keys.map(key => key.getAttribute("fill"))).not.toEqual(keysBefore);
  expect(scene().querySelector("filter")).toBeNull();
  expect(scene().outerHTML).not.toMatch(/NaN|Infinity/);
});
