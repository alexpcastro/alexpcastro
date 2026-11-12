import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import EducationJourney from "./EducationJourney";
import { educationVideos } from "../data/educationVideos";

let root, container, originalMedia, originalObserver, originalConnection, observers, media, connection, visibility, play, pause, load;
const savedClips = { ...educationVideos };
const keys = ["barcelona", "oxford", "fordham-bs", "esade", "fordham-ms"];
const render = () => act(() => root.render(<EducationJourney />));
const controls = () => [...container.querySelectorAll('.education-art-control')];
const video = () => container.querySelector('video');
const send = (target, type, extras = {}) => act(() => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.entries(extras).forEach(([key, value]) => Object.defineProperty(event, key, { value }));
  target.dispatchEvent(event);
});
const hover = index => send(controls()[index], 'pointerover', { pointerType: 'mouse' });
const leave = target => send(target, 'pointerout', { pointerType: 'mouse', relatedTarget: document.body });
const click = target => act(() => target.click());
const intersect = (visible = true, selector) => act(() => observers.filter(observer => observer.target?.isConnected && (!selector || observer.target.matches(selector))).forEach(observer => observer.callback([{ isIntersecting: visible }])));
const ready = () => { render(); intersect(); };
const preference = matches => act(() => { media.matches = matches; media.listeners.forEach(listener => listener()); });
const saveData = value => act(() => { connection.saveData = value; connection.listeners.forEach(listener => listener()); });

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMedia = window.matchMedia;
  originalObserver = global.IntersectionObserver;
  originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  observers = [];
  media = { matches: false, listeners: new Set(), addEventListener: (_, fn) => media.listeners.add(fn), removeEventListener: (_, fn) => media.listeners.delete(fn) };
  window.matchMedia = jest.fn(() => media);
  connection = { saveData: false, listeners: new Set(), addEventListener: (_, fn) => connection.listeners.add(fn), removeEventListener: (_, fn) => connection.listeners.delete(fn) };
  Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
  global.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.disconnect = jest.fn(); observers.push(this); }
    observe(target) { this.target = target; }
  };
  visibility = 'visible';
  jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  load = jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  Object.keys(educationVideos).forEach(key => delete educationVideos[key]);
  keys.forEach(key => { educationVideos[key] = { src: `/test-only/${key}.mp4` }; });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Object.keys(educationVideos).forEach(key => delete educationVideos[key]);
  Object.assign(educationVideos, savedClips);
  window.matchMedia = originalMedia;
  global.IntersectionObserver = originalObserver;
  if (originalConnection) Object.defineProperty(navigator, 'connection', originalConnection);
  else delete navigator.connection;
  jest.restoreAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('idle artwork loads no video and retains five responsive stills and distinct accessible controls', () => {
  ready();
  expect(video()).toBeNull();
  expect(play).not.toHaveBeenCalled();
  expect(container.querySelectorAll('img')).toHaveLength(5);
  expect(controls()).toHaveLength(5);
  expect(new Set(controls().map(button => button.getAttribute('aria-label'))).size).toBe(5);
  controls().forEach(button => expect(button.getAttribute('aria-describedby')).toBe('education-animation-hint'));
});

test('hover plays only that clip muted inline; leaving releases it and reveals the exact same poster', () => {
  ready();
  const poster = container.querySelector('img');
  const firstControl = controls()[0];
  hover(0);
  const first = video();
  expect(first.getAttribute('src')).toBe('/test-only/barcelona.mp4');
  expect(first.getAttribute('poster')).toBe('/education/asb-artwork-1280.jpg');
  expect(first.loop && first.muted && first.playsInline).toBe(true);
  expect(first.preload).toBe('none');
  expect(first.controls).toBe(false);
  expect(first.getAttribute('aria-hidden')).toBe('true');
  expect(first.tabIndex).toBe(-1);
  expect(first.classList.contains('is-playing')).toBe(false);
  send(first, 'playing');
  expect(first.classList.contains('is-playing')).toBe(true);
  leave(firstControl);
  expect(video()).toBeNull();
  expect(pause).toHaveBeenCalled();
  expect(load).toHaveBeenCalled();
  expect(first.hasAttribute('src')).toBe(false);
  expect(container.querySelector('img')).toBe(poster);
  hover(0);
  expect(video()).not.toBe(first);
});

test('rapidly moving between images never plays two videos and late leave does not stop the new one', () => {
  ready(); hover(0);
  const firstControl = controls()[0];
  hover(1);
  expect(container.querySelectorAll('video')).toHaveLength(1);
  expect(video().getAttribute('src')).toBe('/test-only/oxford.mp4');
  leave(firstControl);
  expect(video().getAttribute('src')).toBe('/test-only/oxford.mp4');
});

test('keyboard focus previews, Escape stops, activation toggles, and blur stops', () => {
  ready();
  const button = controls()[2];
  act(() => button.focus());
  expect(video().getAttribute('src')).toBe('/test-only/fordham-bs.mp4');
  expect(button.getAttribute('aria-pressed')).toBe('true');
  send(button, 'keydown', { key: 'Escape' });
  expect(video()).toBeNull();
  click(button);
  expect(video()).not.toBeNull();
  click(button);
  expect(video()).toBeNull();
  click(button);
  act(() => button.blur());
  expect(video()).toBeNull();
});

test('touch starts on the first tap, ignores synthetic hover/focus, and stops on second tap', () => {
  ready();
  const button = controls()[3];
  send(button, 'pointerover', { pointerType: 'touch' });
  send(button, 'pointerdown', { pointerType: 'touch' });
  act(() => button.focus());
  expect(video()).toBeNull();
  click(button);
  expect(video().getAttribute('src')).toBe('/test-only/esade.mp4');
  send(button, 'pointerout', { pointerType: 'touch' });
  expect(video()).not.toBeNull();
  click(button);
  expect(video()).toBeNull();
});

test('global pause stops a preview and resume waits for a fresh interaction', () => {
  ready(); hover(0);
  const toggle = container.querySelector('.education-motion-control');
  click(toggle);
  expect(video()).toBeNull();
  expect(controls()[0].disabled).toBe(true);
  click(toggle);
  expect(video()).toBeNull();
  expect(controls()[0].disabled).toBe(false);
  click(controls()[0]);
  expect(video()).not.toBeNull();
});

test('reduced-motion and save-data preferences prevent all video requests and react live', () => {
  media.matches = true;
  ready();
  expect(controls()).toHaveLength(0);
  expect(video()).toBeNull();
  expect(play).not.toHaveBeenCalled();
  preference(false); hover(0);
  expect(video()).not.toBeNull();
  preference(true);
  expect(video()).toBeNull();
  preference(false);
  expect(video()).toBeNull();
  saveData(true);
  expect(controls()).toHaveLength(0);
  saveData(false); hover(1);
  expect(video()).not.toBeNull();
  saveData(true);
  expect(video()).toBeNull();
});

test('offscreen cards and hidden pages release videos without restarting on return', () => {
  ready(); hover(0);
  intersect(false, '.education-stop--barcelona .education-stop-art');
  expect(video()).toBeNull();
  intersect();
  expect(video()).toBeNull();
  hover(1);
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(video()).toBeNull();
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(video()).toBeNull();
  hover(2);
  intersect(false, '#education');
  expect(video()).toBeNull();
});

test('failed media keeps its poster and facts and never retries automatically', () => {
  ready(); hover(4);
  const poster = container.querySelector('.education-stop--fordham-ms img');
  send(video(), 'error');
  expect(video()).toBeNull();
  expect(container.querySelector('.education-stop--fordham-ms .education-art-control')).toBeNull();
  expect(container.querySelector('.education-stop--fordham-ms img')).toBe(poster);
  expect(container.textContent).toContain('2020–2022');
  const attempts = play.mock.calls.length;
  intersect(false); intersect();
  expect(play).toHaveBeenCalledTimes(attempts);
});

test('blocked playback falls back safely and can be retried by deliberate activation', async () => {
  play.mockRejectedValueOnce(new Error('Autoplay blocked'));
  ready(); hover(0);
  await act(async () => { await Promise.resolve(); });
  expect(video()).toBeNull();
  expect(controls()[0].getAttribute('aria-pressed')).toBe('false');
  click(controls()[0]);
  expect(video()).not.toBeNull();
});

test('a stale playback rejection cannot stop a newer clip', async () => {
  let reject;
  play.mockImplementationOnce(() => new Promise((_, no) => { reject = no; }));
  ready(); hover(0); hover(1);
  const second = video();
  await act(async () => { reject(new Error('Interrupted')); await Promise.resolve(); });
  expect(video()).toBe(second);
  expect(second.getAttribute('src')).toBe('/test-only/oxford.mp4');
});

test('unmount releases media, observers, and preference subscriptions', () => {
  ready(); hover(0);
  act(() => root.render(null));
  expect(pause).toHaveBeenCalled();
  expect(load).toHaveBeenCalled();
  observers.forEach(observer => expect(observer.disconnect).toHaveBeenCalledTimes(1));
  expect(media.listeners.size).toBe(0);
  expect(connection.listeners.size).toBe(0);
});


test('all five production mappings point to distinct nonempty local clips', () => {
  expect(Object.keys(savedClips)).toEqual(keys);
  const sources = Object.values(savedClips).map(clip => clip.src);
  expect(new Set(sources).size).toBe(5);
  sources.forEach(src => {
    expect(src).toMatch(/^\/education\/video\/.+-immersive-5s\.mp4$/);
    expect(fs.statSync(path.join(__dirname, '../../public', src)).size).toBeGreaterThan(100000);
  });
});


test('offscreen artwork remains keyboard reachable and waits for visibility before loading', () => {
  render();
  const button = controls()[4];
  expect(button.disabled).toBe(false);
  act(() => button.focus());
  expect(video()).toBeNull();
  intersect();
  expect(video().getAttribute('src')).toBe('/test-only/fordham-ms.mp4');
});
