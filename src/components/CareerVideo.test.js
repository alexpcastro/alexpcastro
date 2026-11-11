import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ExperienceGallery from "./ExperienceGallery";
import { careerVideos } from "../data/careerVideos";

let container, root, originalMatchMedia, originalObserver, visibilityDescriptor, connectionDescriptor;
let observers, mediaQueries, connectionListeners, connection, play, pause;
const kinds = ["deloitte", "fordham", "columbia", "brokr", "pure-digital", "apc"];
const render = () => act(() => root.render(<ExperienceGallery />));
const enableClips = () => kinds.forEach(kind => { careerVideos[kind] = { src: `/test-only/${kind}.mp4` }; });
const intersect = (visible = true) => act(() => observers[observers.length - 1].callback([
  { isIntersecting: visible, intersectionRatio: visible ? 1 : 0 },
]));
const activeStory = () => container.querySelector('.experience-card.is-active .experience-story');
const select = index => act(() => container.querySelectorAll(".gallery-picture")[index].click());
const changeMotion = matches => act(() => {
  const media = mediaQueries.get("(prefers-reduced-motion: reduce)");
  media.matches = matches;
  media.listeners.forEach(listener => listener({ matches }));
});
const setVisibility = value => act(() => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value });
  document.dispatchEvent(new Event("visibilitychange"));
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  observers = [];
  mediaQueries = new Map();
  originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn(query => {
    if (!mediaQueries.has(query)) {
      const listeners = new Set();
      mediaQueries.set(query, { matches: false, listeners,
        addEventListener: (_, callback) => listeners.add(callback),
        removeEventListener: (_, callback) => listeners.delete(callback) });
    }
    return mediaQueries.get(query);
  });
  originalObserver = global.IntersectionObserver;
  global.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.disconnect = jest.fn(); observers.push(this); }
    observe(target) { this.target = target; }
  };
  visibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  connectionDescriptor = Object.getOwnPropertyDescriptor(navigator, "connection");
  connectionListeners = new Set();
  connection = { saveData: false, addEventListener: (_, callback) => connectionListeners.add(callback),
    removeEventListener: (_, callback) => connectionListeners.delete(callback) };
  Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
  play = jest.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  pause = jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Object.keys(careerVideos).forEach(key => { delete careerVideos[key]; });
  window.matchMedia = originalMatchMedia;
  global.IntersectionObserver = originalObserver;
  if (visibilityDescriptor) Object.defineProperty(document, "visibilityState", visibilityDescriptor);
  else delete document.visibilityState;
  if (connectionDescriptor) Object.defineProperty(navigator, "connection", connectionDescriptor);
  else delete navigator.connection;
  jest.restoreAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test("the empty production map leaves six stills, no media requests and no video controls", () => {
  render();
  expect(container.querySelectorAll("img.career-scene")).toHaveLength(6);
  expect(container.querySelector("video, source, .career-video-layer, .gallery-motion-control")).toBeNull();
  expect(play).not.toHaveBeenCalled();
});

test("only the open chapter loads in view and loops muted inline above its exact still", () => {
  enableClips();
  render();
  expect(container.querySelectorAll(".career-video-layer")).toHaveLength(1);
  expect(container.querySelector("video")).toBeNull();
  expect(play).not.toHaveBeenCalled();
  intersect();
  let video = container.querySelector("video");
  expect(container.querySelectorAll("video")).toHaveLength(1);
  expect(video.getAttribute("src")).toBe("/test-only/deloitte.mp4");
  expect(video.getAttribute("poster")).toBe("/artwork/deloitte-neon-1280.jpg");
  expect(video.loop).toBe(true);
  expect(video.muted).toBe(true);
  expect(video.playsInline).toBe(true);
  expect(video.controls).toBe(false);
  expect(video.preload).toBe("none");
  expect(video.tabIndex).toBe(-1);
  expect(video.getAttribute("aria-hidden")).toBe("true");
  expect(video.classList.contains("is-playing")).toBe(false);
  expect(container.querySelectorAll("img.career-scene")).toHaveLength(6);
  act(() => video.dispatchEvent(new Event("playing")));
  expect(video.classList.contains("is-playing")).toBe(true);
  select(3);
  expect(pause).toHaveBeenCalled();
  expect(container.querySelector("video")).toBeNull();
  intersect();
  video = container.querySelector("video");
  expect(container.querySelectorAll("video")).toHaveLength(1);
  expect(video.getAttribute("src")).toBe("/test-only/brokr.mp4");
  expect(video.getAttribute("poster")).toBe("/artwork/brokr-neon-1280.jpg");
  expect(video.classList.contains("is-playing")).toBe(false);
});

test("the separate pause control stops motion and preserves that choice across chapter changes", () => {
  enableClips(); render(); intersect();
  let control = activeStory().querySelector(".gallery-motion-control");
  expect(control.closest(".gallery-picture")).toBeNull();
  expect(control.textContent).toBe("Pause animation");
  expect(control.getAttribute("aria-pressed")).toBe("false");
  act(() => control.click());
  expect(pause).toHaveBeenCalled();
  expect(control.textContent).toBe("Resume animation");
  expect(control.getAttribute("aria-pressed")).toBe("true");
  play.mockClear();
  select(2); intersect();
  expect(play).not.toHaveBeenCalled();
  control = activeStory().querySelector(".gallery-motion-control");
  expect(control.textContent).toBe("Resume animation");
  act(() => control.click());
  expect(play).toHaveBeenCalledTimes(1);
});

test("leaving the viewport or hiding the page unloads and pauses the clip", () => {
  enableClips(); render(); intersect();
  const first = container.querySelector("video");
  act(() => first.dispatchEvent(new Event("playing")));
  intersect(false);
  expect(container.querySelector("video")).toBeNull();
  expect(pause).toHaveBeenCalled();
  intersect();
  expect(container.querySelector("video")).not.toBe(first);
  expect(container.querySelector("video").classList.contains("is-playing")).toBe(false);
  setVisibility("hidden");
  expect(container.querySelector("video")).toBeNull();
  setVisibility("visible");
  expect(container.querySelectorAll("video")).toHaveLength(1);
});

test("reduced motion prevents video requests and reacts to live preference changes", () => {
  enableClips();
  window.matchMedia("(prefers-reduced-motion: reduce)").matches = true;
  render();
  expect(container.querySelector("video, .career-video-layer, .gallery-motion-control")).toBeNull();
  expect(play).not.toHaveBeenCalled();
  changeMotion(false); intersect();
  expect(container.querySelector("video")).not.toBeNull();
  changeMotion(true);
  expect(container.querySelector("video, .career-video-layer, .gallery-motion-control")).toBeNull();
  expect(observers[0].disconnect).toHaveBeenCalled();
});

test("data-saving visitors keep stills without video requests or motion controls", () => {
  enableClips(); connection.saveData = true; render();
  expect(container.querySelector("video, .career-video-layer, .gallery-motion-control")).toBeNull();
  expect(play).not.toHaveBeenCalled();
  act(() => { connection.saveData = false; connectionListeners.forEach(listener => listener()); });
  intersect();
  expect(container.querySelector("video")).not.toBeNull();
  act(() => { connection.saveData = true; connectionListeners.forEach(listener => listener()); });
  expect(container.querySelector("video, .career-video-layer, .gallery-motion-control")).toBeNull();
});

test("a failed video leaves the original responsive still and does not retry in a loop", () => {
  enableClips(); render(); intersect();
  act(() => container.querySelector("video").dispatchEvent(new Event("error")));
  expect(container.querySelector("video")).toBeNull();
  expect(container.querySelector("img").getAttribute("src")).toBe("/artwork/deloitte-neon-1280.jpg");
  const attempts = play.mock.calls.length;
  intersect(false); intersect();
  expect(container.querySelector("video")).toBeNull();
  expect(play).toHaveBeenCalledTimes(attempts);
});

test("blocked autoplay preserves the still without an unhandled rejection", async () => {
  enableClips();
  play.mockRejectedValue(new Error("Autoplay blocked"));
  render(); intersect();
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector("video").classList.contains("is-playing")).toBe(false);
  expect(container.querySelector("img.career-scene")).not.toBeNull();
});

test("a late play rejection after changing chapters does not change the new video", async () => {
  enableClips();
  let reject;
  play.mockImplementationOnce(() => new Promise((_, rejectPlay) => { reject = rejectPlay; }));
  render(); intersect(); select(1); intersect();
  const next = container.querySelector("video");
  act(() => next.dispatchEvent(new Event("playing")));
  await act(async () => { reject(new Error("Playback interrupted")); await Promise.resolve(); });
  expect(next.classList.contains("is-playing")).toBe(true);
  expect(next.getAttribute("src")).toBe("/test-only/fordham.mp4");
});
