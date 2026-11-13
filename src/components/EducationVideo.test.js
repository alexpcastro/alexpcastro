import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import EducationJourney from "./EducationJourney";
import { educationVideos } from "../data/educationVideos";

let root, container, originalMedia, originalObserver, originalConnection, observers, media, connection, visibility, play, pause, load;
const savedClips = { ...educationVideos };
const keys = ["barcelona", "oxford", "fordham-bs", "esade", "fordham-ms", "pine-crest", "beau-soleil", "id-tech-miami"];
const render = () => act(() => root.render(<EducationJourney autoCycle={false} />));
const controls = () => keys.map(key => container.querySelector(`.education-stop--${key} .education-art-control`)).filter(Boolean);
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

test('idle artwork loads no video and retains eight responsive stills and distinct accessible controls', () => {
  ready();
  expect(video()).toBeNull();
  expect(play).not.toHaveBeenCalled();
  expect(container.querySelectorAll('img')).toHaveLength(8);
  expect(controls()).toHaveLength(8);
  expect(new Set(controls().map(button => button.getAttribute('aria-label'))).size).toBe(8);
  controls().forEach(button => expect(button.getAttribute('aria-describedby')).toBe('education-animation-hint'));
});

test('hover plays only that clip muted inline; leaving releases it and reveals the exact same poster', () => {
  ready();
  const poster = container.querySelector('.education-stop--barcelona img');
  const firstControl = controls()[0];
  hover(0);
  const first = video();
  expect(first.getAttribute('src')).toBe('/test-only/barcelona.mp4');
  expect(first.getAttribute('poster')).toBe('/education/asb-artwork-1280.jpg?v=20261112-immersive');
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
  expect(container.querySelector('.education-stop--barcelona img')).toBe(poster);
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

test('keyboard focus previews, Escape stops, activation keeps playing, and blur stops', () => {
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
  expect(video()).not.toBeNull();
  click(button);
  act(() => button.blur());
  expect(video()).toBeNull();
});

test('touch starts on the first tap, ignores synthetic hover/focus, and continues on second tap', () => {
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
  expect(video()).not.toBeNull();
});

test('global pause stops a preview and resume waits for a fresh interaction', () => {
  ready(); hover(0);
  const toggle = container.querySelector('#education');
  send(toggle, 'keydown', { key: 'Escape' });
  expect(video()).toBeNull();
  expect(controls()[0].disabled).toBe(true);
  send(toggle, 'keydown', { key: 'Escape' });
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


test('all production mappings point to distinct nonempty local clips', () => {
  expect(Object.keys(savedClips).sort()).toEqual([...keys].sort());
  const sources = Object.values(savedClips).map(clip => clip.src);
  expect(new Set(sources).size).toBe(sources.length);
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


test.each(['pine-crest', 'beau-soleil', 'id-tech-miami'])('new %s entry plays its actual matching clip and preserves the poster', key => {
  Object.keys(educationVideos).forEach(id => delete educationVideos[id]);
  Object.assign(educationVideos, savedClips);
  ready();
  const button = container.querySelector(`.education-stop--${key} .education-art-control`);
  const poster = container.querySelector(`.education-stop--${key} img`);
  expect(video()).toBeNull();
  send(button, 'pointerover', { pointerType: 'mouse' });
  expect(video().getAttribute('src')).toBe(`/education/video/${key}-immersive-5s.mp4`);
  expect(video().getAttribute('poster')).toBe(`/education/${key}-artwork-1280.jpg?v=20261112-immersive`);
  expect(video().preload).toBe('none');
  leave(button);
  expect(video()).toBeNull();
  expect(container.querySelector(`.education-stop--${key} img`)).toBe(poster);
});


test.each(['barcelona', 'oxford', 'fordham-bs', 'esade', 'fordham-ms'])('refreshed %s scene plays its new matching video', key => {
  Object.keys(educationVideos).forEach(id => delete educationVideos[id]);
  Object.assign(educationVideos, savedClips);
  ready();
  const card = container.querySelector(`.education-stop--${key}`);
  const button = card.querySelector('.education-art-control');
  expect(button).not.toBeNull();
  expect(video()).toBeNull();
  send(button, 'pointerover', { pointerType: 'mouse' });
  const fileKey = key === 'barcelona' ? 'asb' : key;
  expect(video().getAttribute('src')).toBe(`/education/video/${fileKey}-refresh-immersive-5s.mp4`);
  expect(video().getAttribute('poster')).toBe(`/education/${fileKey}-artwork-1280.jpg?v=20261112-immersive`);
  expect(video().loop).toBe(true);
  expect(video().muted).toBe(true);
  leave(button);
  expect(video()).toBeNull();
});

const mobileLayout = () => {
  const compactMedia = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query === '(max-width: 900px)' ? compactMedia : media);
};

test('mobile cards autoplay muted inline only when the section and individual cards are visible', () => {
  mobileLayout(); render();
  expect(video()).toBeNull();
  intersect(true, '#education');
  expect(video()).toBeNull();
  intersect(true, '.education-stop--barcelona .education-stop-art');
  expect(container.querySelectorAll('video')).toHaveLength(1);
  expect(video().getAttribute('src')).toBe('/test-only/barcelona.mp4');
  expect(video().autoplay && video().muted && video().playsInline && video().loop).toBe(true);
  intersect(true, '.education-stop--oxford .education-stop-art');
  expect(container.querySelectorAll('video')).toHaveLength(2);
  intersect(false, '.education-stop--barcelona .education-stop-art');
  expect(container.querySelectorAll('video')).toHaveLength(1);
  expect(video().getAttribute('src')).toBe('/test-only/oxford.mp4');
  expect(pause).toHaveBeenCalled();
  intersect(false, '#education');
  expect(video()).toBeNull();
});

test('mobile autoplay resumes on reentry and page visibility but respects global pause', () => {
  mobileLayout(); ready();
  expect(container.querySelectorAll('video')).toHaveLength(8);
  intersect(false); expect(video()).toBeNull();
  intersect(); expect(container.querySelectorAll('video')).toHaveLength(8);
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(video()).toBeNull();
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(container.querySelectorAll('video')).toHaveLength(8);
  const toggle = container.querySelector('#education');
  send(toggle, 'keydown', { key: 'Escape' }); expect(video()).toBeNull();
  send(toggle, 'keydown', { key: 'Escape' }); expect(container.querySelectorAll('video')).toHaveLength(8);
});

test('mobile taps keep autoplaying cards running', () => {
  mobileLayout(); ready();
  const button = controls()[0];
  click(button);
  expect(container.querySelectorAll('video')).toHaveLength(8);
  click(button);
  expect(container.querySelectorAll('video')).toHaveLength(8);
  send(button, 'keydown', { key: 'Escape' });
  expect(container.querySelector('.education-stop--barcelona video')).toBeNull();
});

test('mobile autoplay never overrides reduced motion or save data', () => {
  mobileLayout(); media.matches = true; ready();
  expect(video()).toBeNull(); expect(play).not.toHaveBeenCalled();
  preference(false); expect(container.querySelectorAll('video')).toHaveLength(8);
  saveData(true); expect(video()).toBeNull();
  saveData(false); expect(container.querySelectorAll('video')).toHaveLength(8);
  preference(true); expect(video()).toBeNull();
});

test('rejected mobile autoplay stays on the poster and waits for a manual retry', async () => {
  mobileLayout(); play.mockRejectedValue(new Error('NotAllowedError'));
  await act(async () => { root.render(<EducationJourney autoCycle={false} />); });
  await act(async () => { intersect(); });
  expect(video()).toBeNull();
  const calls = play.mock.calls.length;
  intersect(false); intersect();
  expect(play).toHaveBeenCalledTimes(calls);
  play.mockResolvedValue();
  await act(async () => { controls()[0].click(); });
  expect(container.querySelector('.education-stop--barcelona video')).not.toBeNull();
});

// Production desktop tour coverage; interaction-only tests above retain the
// underlying media controls independently of the tour coordinator.
const tour = () => { act(() => root.render(<EducationJourney />)); intersect(); };
const activeSchool = () => container.querySelector('.education-stop[data-active="true"]');
test('desktop tour opens Pine Crest without a click and advances after five seconds playing', () => {
  jest.useFakeTimers(); tour();
  expect(activeSchool().className).toContain('pine-crest');
  expect(video().getAttribute('src')).toBe('/test-only/pine-crest.mp4');
  send(video(), 'playing');
  act(() => jest.advanceTimersByTime(4999));
  expect(activeSchool().className).toContain('pine-crest');
  act(() => jest.advanceTimersByTime(1));
  expect(activeSchool().className).toContain('beau-soleil');
  expect(container.querySelectorAll('video')).toHaveLength(1);
  send(video(), 'playing'); act(() => jest.advanceTimersByTime(5000));
  expect(activeSchool().className).toContain('id-tech-miami');
  act(() => root.render(null)); expect(jest.getTimerCount()).toBe(0); jest.useRealTimers();
});
test('desktop hover holds selected school, leaving resumes and global pause freezes the tour', () => {
  jest.useFakeTimers(); tour(); hover(1);
  const heldVideo = video();
  click(controls()[1]);
  expect(video()).toBe(heldVideo);
  expect(video().loop).toBe(true);
  send(video(), 'playing'); act(() => jest.advanceTimersByTime(20000));
  expect(activeSchool().className).toContain('oxford');
  leave(controls()[1]); act(() => jest.advanceTimersByTime(5000));
  expect(activeSchool().className).toContain('fordham-bs');
  send(container.querySelector('#education'), 'keydown', { key: 'Escape' });
  act(() => jest.advanceTimersByTime(20000));
  expect(video()).toBeNull(); expect(activeSchool().className).toContain('fordham-bs');
  send(container.querySelector('#education'), 'keydown', { key: 'Escape' });
  expect(video()).not.toBeNull();
  act(() => root.render(null)); jest.useRealTimers();
});
test('desktop tour pauses offscreen and on hidden tabs and wraps across all schools', () => {
  jest.useFakeTimers(); tour(); send(video(), 'playing');
  intersect(false); act(() => jest.advanceTimersByTime(20000));
  expect(video()).toBeNull(); expect(activeSchool().className).toContain('pine-crest');
  intersect();
  for (let i = 0; i < 8; i++) { send(video(), 'playing'); act(() => jest.advanceTimersByTime(5000)); }
  expect(activeSchool().className).toContain('pine-crest');
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  act(() => jest.advanceTimersByTime(20000)); expect(video()).toBeNull();
  act(() => root.render(null)); jest.useRealTimers();
});
test('desktop tour handles stalled media without getting stuck and Escape stops', () => {
  jest.useFakeTimers(); tour();
  act(() => jest.advanceTimersByTime(10000));
  expect(activeSchool().className).toContain('beau-soleil');
  const button = activeSchool().querySelector('button');
  send(button, 'keydown', { key: 'Escape' });
  act(() => jest.advanceTimersByTime(20000)); expect(video()).toBeNull();
  expect(container.querySelector('#education').dataset.motion).toBe('paused');
  act(() => root.render(null)); jest.useRealTimers();
});
test('tour respects reduced-motion and sequences one mobile card at a time', () => {
  media.matches = true; tour(); expect(video()).toBeNull();
  expect(container.querySelector('[data-auto-cycle="true"]')).toBeNull();
  act(() => root.render(null)); media.matches = false; mobileLayout(); tour();
  expect(container.querySelector('[data-auto-cycle="true"]')).not.toBeNull();
  expect(container.querySelector('[data-carousel="true"]')).not.toBeNull();
  expect(container.querySelectorAll('video')).toHaveLength(1);
});

test('mobile carousel starts with Pine Crest, advances every five seconds and centers without page scrolling', () => {
  jest.useFakeTimers(); mobileLayout(); tour();
  const rail = container.querySelector('[data-carousel="true"]');
  expect(activeSchool().className).toContain('pine-crest');
  expect(container.querySelectorAll('video')).toHaveLength(1);
  send(video(), 'playing'); act(() => jest.advanceTimersByTime(5000));
  expect(activeSchool().className).toContain('beau-soleil');
  expect(rail).not.toBeNull();
  intersect(false); act(() => jest.advanceTimersByTime(20000));
  expect(video()).toBeNull();
  expect(activeSchool().className).toContain('beau-soleil');
  act(() => root.render(null)); jest.useRealTimers();
});
test('mobile swipe holds playback sequencing and selects nearest school after scroll settles', () => {
  jest.useFakeTimers(); mobileLayout(); tour();
  const rail = container.querySelector('[data-carousel="true"]');
  Object.defineProperty(rail, 'clientWidth', { value: 400 });
  Object.defineProperty(rail, 'scrollWidth', { value: 2000 });
  [...rail.children].forEach((card, index) => {
    Object.defineProperty(card, 'offsetLeft', { value: index * 200 });
    Object.defineProperty(card, 'offsetWidth', { value: 180 });
  });
  send(rail, 'pointerdown', { pointerType: 'touch', clientX: 200 });
  send(rail, 'pointermove', { pointerType: 'touch', clientX: 100 });
  rail.scrollLeft = 500;
  send(rail, 'scroll'); send(rail, 'pointerup', { pointerType: 'touch', clientX: 100 });
  act(() => jest.advanceTimersByTime(180));
  expect(activeSchool().className).toContain('barcelona');
  expect(container.querySelectorAll('video')).toHaveLength(1);
  act(() => root.render(null)); jest.useRealTimers();
});
test('mobile arrow navigation selects the next card and preserves explicit pause', () => {
  mobileLayout(); tour();
  const rail = container.querySelector('[data-carousel="true"]');
  send(rail, 'keydown', { key: 'ArrowRight' });
  expect(activeSchool().className).toContain('beau-soleil');
  click(activeSchool().querySelector('button'));
  expect(video()).not.toBeNull();
  send(container.querySelector('#education'), 'keydown', { key: 'Escape' });
  expect(video()).toBeNull();
  expect(container.querySelector('#education').dataset.motion).toBe('paused');
});

test('mobile swipe expands the selected card immediately without waiting for scroll debounce', () => {
  jest.useFakeTimers(); mobileLayout(); tour();
  const rail = container.querySelector('[data-carousel="true"]');
  Object.defineProperty(rail, 'clientWidth', { value: 400 });
  Object.defineProperty(rail, 'scrollWidth', { value: 2000 });
  [...rail.children].forEach((card, index) => {
    Object.defineProperty(card, 'offsetLeft', { value: index * 200 });
    Object.defineProperty(card, 'offsetWidth', { value: 180 });
  });
  send(rail, 'pointerdown', { pointerType: 'touch', clientX: 250 });
  send(rail, 'pointermove', { pointerType: 'touch', clientX: 150 });
  rail.scrollLeft = 500; send(rail, 'scroll');
  // No timer advancement: expansion follows the swipe in the same update.
  expect(activeSchool().className).toContain('barcelona');
  send(rail, 'pointerup', { pointerType: 'touch', clientX: 150 });
  expect(activeSchool().className).toContain('barcelona');
  send(video(), 'playing'); act(() => jest.advanceTimersByTime(4999));
  expect(activeSchool().className).toContain('barcelona');
  act(() => jest.advanceTimersByTime(1));
  expect(activeSchool().className).toContain('oxford');
  act(() => root.render(null)); jest.useRealTimers();
});
