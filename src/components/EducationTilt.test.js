import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import EducationJourney from "./EducationJourney";

const REDUCED = '(prefers-reduced-motion: reduce)';
const COMPACT = '(max-width: 900px)';
const POINTER = '(hover: hover) and (pointer: fine)';
let root, container, originalMedia, originalObserver, originalConnection, originalRAF, originalCancel;
let media, observers, connection, frames, frameId, time, visibility, geometry;
const keys = ["pine-crest", "beau-soleil", "id-tech-miami", "barcelona", "oxford", "fordham-bs", "esade", "fordham-ms"];
const cards = () => keys.map(key => container.querySelector(`.education-stop--${key} .education-art-frame`)).filter(Boolean);
const buttons = () => keys.map(key => container.querySelector(`.education-stop--${key} .education-art-control`));
const send = (target, type, extras = {}) => act(() => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, extras); target.dispatchEvent(event);
});
const move = (index = 0, type = 'mouse') => send(buttons()[index] || cards()[index], 'pointermove', { pointerType: type, clientX: 200, clientY: 0, buttons: 0 });
const hover = index => send(buttons()[index], 'pointerover', { pointerType: 'mouse' });
const advance = (count = 100) => act(() => {
  for (let i = 0; i < count; i++) { time += 16; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); }
});
const updateMedia = (query, matches) => act(() => { media[query].matches = matches; media[query].listeners.forEach(listener => listener({ matches })); });
const intersect = (visible = true, selector) => act(() => observers.filter(observer => !selector || observer.target.matches(selector)).forEach(observer => observer.callback([{ isIntersecting: visible }])));
const ready = () => { act(() => root.render(<EducationJourney />)); intersect(); };
const angle = (index, axis) => parseFloat(cards()[index].style.getPropertyValue(`--card-tilt-${axis}`)) || 0;
const expectReset = () => {
  expect(frames.size).toBe(0);
  cards().forEach(card => expect(card.hasAttribute('data-tilting')).toBe(false));
};

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMedia = window.matchMedia; originalObserver = global.IntersectionObserver;
  originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  originalRAF = window.requestAnimationFrame; originalCancel = window.cancelAnimationFrame;
  media = Object.fromEntries([REDUCED, COMPACT, POINTER].map(query => {
    const item = { matches: query === POINTER, listeners: new Set() };
    item.addEventListener = (_, fn) => item.listeners.add(fn); item.removeEventListener = (_, fn) => item.listeners.delete(fn);
    return [query, item];
  }));
  window.matchMedia = jest.fn(query => media[query]);
  connection = { saveData: false, listeners: new Set(), addEventListener: (_, fn) => connection.listeners.add(fn), removeEventListener: (_, fn) => connection.listeners.delete(fn) };
  Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
  observers = [];
  global.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() {}
  };
  frames = new Map(); frameId = 0; time = performance.now();
  window.requestAnimationFrame = jest.fn(fn => { frames.set(++frameId, fn); return frameId; });
  window.cancelAnimationFrame = jest.fn(id => frames.delete(id));
  geometry = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
  visibility = 'visible'; jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  window.matchMedia = originalMedia; global.IntersectionObserver = originalObserver;
  window.requestAnimationFrame = originalRAF; window.cancelAnimationFrame = originalCancel;
  if (originalConnection) Object.defineProperty(navigator, 'connection', originalConnection); else delete navigator.connection;
  jest.restoreAllMocks(); delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('Education keeps the Experience shadow but deliberately amplifies its tilt, including static fallbacks', () => {
  ready();
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  const experience = fs.readFileSync(path.join(__dirname, 'ExperienceGallery.css'), 'utf8');
  const shadow = experience.match(/--chapter-shadow: ([^;]+)/)[1];
  expect(css).toContain(`--education-shadow: ${shadow}`);
  expect(css).toMatch(/\.education-art-surface \{[^}]*box-shadow:[^}]*var\(--education-shadow\)/);
  expect(css).toContain('.education-art-frame[data-tilting="true"] .education-art-surface');
  expect(css).toContain('outline: 1px solid var(--frame-edge)');
  expect(css).toMatch(/\.education-stop-art > img \{[^}]*position: absolute; inset: 0/);
  expect(css).toContain('perspective(520px) rotateX(calc(var(--card-tilt-x, 0deg) * 2.4)) rotateY(calc(var(--card-tilt-y, 0deg) * 2.75))');
  expect(experience).toContain('perspective(900px) rotateX(var(--card-tilt-x, 0deg)) rotateY(var(--card-tilt-y, 0deg))');
  expect(css).toContain('@media (min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  expect(css.split('@media print')[1]).toContain('box-shadow: none; transform: none !important');
  cards().forEach(card => {
    expect(card.querySelector('.education-stop-art > img')).not.toBeNull();
    expect(card.querySelector('.education-stop-art > .education-stop-heading')).not.toBeNull();
    expect(card.querySelector('.education-stop-details')).toBeNull();
    const frame = card.querySelector('.education-art-surface > .organic-frame');
    expect(frame).not.toBeNull();
    expect(frame.getAttribute('aria-hidden')).toBe('true');
    expect(frame.getAttribute('focusable')).toBe('false');
    expect(frame.parentElement).toBe(card.querySelector('.education-stop-art').parentElement);
  });
});

test('tilt shares the Experience easing while the matching hover video remains in the same surface', () => {
  ready(); hover(0); const clip = container.querySelector('video'); move(); advance(1);
  expect(angle(0, 'x')).toBeLessThan(0); expect(angle(0, 'x')).toBeGreaterThan(-10);
  advance();
  expect(angle(0, 'x')).toBe(-10); expect(angle(0, 'y')).toBe(-8);
  expect(container.querySelector('video')).toBe(clip);
  expect(clip.parentElement).toBe(cards()[0].querySelector('.education-stop-art'));
  expect(geometry.mock.instances.every(node => node === cards()[0])).toBe(true);
  expect(frames.size).toBe(0);
  send(buttons()[0], 'pointerout', { pointerType: 'mouse', relatedTarget: document.body }); advance();
  expect(container.querySelectorAll('video')).toHaveLength(1); expectReset();
});

test('rapid card switches retain one video and return the previous tilt to neutral', () => {
  ready(); hover(0); move(0); advance(); hover(1); move(1); advance();
  expect(container.querySelectorAll('video')).toHaveLength(1);
  expect(container.querySelector('video').getAttribute('src')).toContain('beau-soleil');
  expect(angle(0, 'x')).toBe(0); expect(angle(1, 'x')).toBe(-10);
});

test('compact layouts and touch/coarse input remain untilted while tap playback stays available', () => {
  ready(); move(0, 'touch'); move(0, 'pen'); expectReset();
  updateMedia(POINTER, false); move(); expectReset(); updateMedia(POINTER, true);
  move(); advance(); expect(angle(0, 'x')).toBe(-10);
  updateMedia(COMPACT, true); move();
  cards().forEach(card => expect(card.hasAttribute('data-tilting')).toBe(false));
  send(buttons()[1], 'pointerdown', { pointerType: 'touch' }); act(() => buttons()[1].click());
  expect(container.querySelector('video')).not.toBeNull();
  cards().forEach(card => expect(card.hasAttribute('data-tilting')).toBe(false));
  updateMedia(COMPACT, false); move(); advance(); expect(angle(0, 'x')).toBe(-10);
});

test('pause, reduced motion, save-data and hidden pages cancel transforms and scheduled work', () => {
  ready(); move(); advance(2); send(container.querySelector('#education'), 'keydown', { key: 'Escape' }); expectReset();
  send(container.querySelector('#education'), 'keydown', { key: 'Escape' }); move(); advance(2);
  updateMedia(REDUCED, true); expectReset(); move(); expectReset(); updateMedia(REDUCED, false);
  move(); advance(2); act(() => { connection.saveData = true; connection.listeners.forEach(listener => listener()); }); expectReset();
  act(() => { connection.saveData = false; connection.listeners.forEach(listener => listener()); }); move(); advance(2);
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); }); expectReset();
});

test('offscreen artwork, keyboard input and pointer cancellation reset tilt without breaking keyboard previews', () => {
  ready(); move(); advance(2); intersect(false, '.education-stop--pine-crest .education-stop-art'); expectReset(); intersect();
  move(); advance(2); act(() => buttons()[0].focus()); send(buttons()[0], 'keydown', { key: 'Tab' }); expectReset();
  expect(container.querySelector('video')).not.toBeNull();
  send(buttons()[0], 'keydown', { key: 'Escape' }); expect(container.querySelector('video')).toBeNull();
  move(); advance(2); send(buttons()[0], 'pointercancel', { pointerType: 'mouse' }); expectReset();
});

test('blur and unmount release tilt frames and media-query subscriptions', () => {
  ready(); move(); advance(2); act(() => window.dispatchEvent(new Event('blur'))); expectReset();
  move(); advance(2); act(() => root.render(null)); expectReset();
  Object.values(media).forEach(query => expect(query.listeners.size).toBe(0));
});
