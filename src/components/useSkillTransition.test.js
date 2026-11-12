import React, { act } from "react";
import { createRoot } from "react-dom/client";
import FloatingSkills from "./FloatingSkills";

let container, root, originalMedia, originalAnimate, animations, media;
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
const toggle = () => act(() => container.querySelector('.skills-view-control').click());
const layer = () => document.querySelector('.skills-transition-layer');
const section = () => container.querySelector('#skills');

beforeEach(() => {
  jest.useFakeTimers();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMedia = window.matchMedia;
  originalAnimate = Element.prototype.animate;
  jest.spyOn(global, 'setTimeout');
  jest.spyOn(global, 'clearTimeout');
  media = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => media);
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  animations = [];
  Element.prototype.animate = jest.fn(function (frames, options) {
    let finish;
    const finished = new Promise(resolve => { finish = resolve; });
    const animation = { node: this, frames, options, finished, finish, cancel: jest.fn() };
    animations.push(animation);
    return animation;
  });
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.id === 'skills') return rect(0, 100, 1024, this.querySelector('.skills-field') ? 500 : 300);
    if (this.classList.contains('skills-field')) return rect(0, 150, 1024, 400);
    if (this.classList.contains('skill-chip')) {
      const grouped = !!this.closest('.skills-catalog');
      return rect(grouped ? 80 : 120, grouped ? 180 : 240, grouped ? 90 : 150, grouped ? 24 : 42);
    }
    return rect(0, 0, 0, 0);
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<FloatingSkills />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = originalMedia;
  if (originalAnimate) Element.prototype.animate = originalAnimate;
  else delete Element.prototype.animate;
  jest.restoreAllMocks();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('the same 53 skill identities shrink from the river into accessible groups', () => {
  toggle();
  expect(layer().getAttribute('aria-hidden')).toBe('true');
  expect(layer().querySelectorAll('.skills-transition-chip')).toHaveLength(53);
  expect(new Set([...layer().children].map(chip => chip.textContent)).size).toBe(53);
  expect(section().dataset.skillTransition).toBe('active');
  expect(section().dataset.motion).toBe('paused');
  expect(container.querySelectorAll('#skills-catalog li')).toHaveLength(53);
  expect(container.querySelector('#skills-catalog').classList.contains('visually-hidden')).toBe(false);
  const chipAnimation = animations.find(animation => animation.node.classList.contains('skills-transition-chip'));
  expect(chipAnimation.frames[0].transform).toContain('scale(1.6666666666666667, 1.75)');
  expect(chipAnimation.frames[1].transform).toContain('scale(1, 1)');
  expect(animations.find(animation => animation.node === section()).frames).toEqual([{ height: '500px' }, { height: '300px' }]);
  act(() => jest.advanceTimersByTime(1000));
  expect(layer()).toBeNull();
  expect(section().dataset.skillTransition).toBeUndefined();
  expect(animations.every(animation => animation.cancel.mock.calls.length === 1)).toBe(true);
});

test('returning to the river grows matching chips and resumes its unchanged motion', () => {
  toggle();
  act(() => jest.advanceTimersByTime(1000));
  toggle();
  expect(layer()).not.toBeNull();
  expect(section().dataset.motion).toBe('paused');
  expect(container.querySelectorAll('.skills-field .skill-chip')).toHaveLength(106);
  act(() => jest.advanceTimersByTime(1000));
  expect(section().dataset.motion).toBe('running');
  expect(layer()).toBeNull();
});

test('quick reversals replace the previous bridge without orphaned chips or animations', () => {
  toggle();
  const first = layer();
  const firstAnimations = [...animations];
  toggle();
  expect(first.isConnected).toBe(false);
  expect(firstAnimations.every(animation => animation.cancel.mock.calls.length === 1)).toBe(true);
  expect(document.querySelectorAll('.skills-transition-layer')).toHaveLength(1);
  act(() => jest.advanceTimersByTime(1000));
  expect(layer()).toBeNull();
  expect(section().dataset.motion).toBe('running');
});

test('resizing or scrolling cleans up screen-space copies immediately', () => {
  toggle();
  act(() => window.dispatchEvent(new Event('resize')));
  expect(layer()).toBeNull();
  expect(section().dataset.skillTransition).toBeUndefined();
  toggle();
  act(() => window.dispatchEvent(new Event('scroll')));
  expect(layer()).toBeNull();
  expect(section().dataset.motion).toBe('running');
});

test('a live reduced-motion preference cancels the bridge and leaves every skill readable', () => {
  toggle();
  act(() => {
    media.matches = true;
    media.addEventListener.mock.calls.find(([event]) => event === 'change')[1]();
  });
  expect(layer()).toBeNull();
  expect(container.querySelectorAll('#skills-catalog li')).toHaveLength(53);
  expect(container.querySelector('.skills-field')).toBeNull();
});

test('without Web Animations the toggle is immediate, complete, and accessible', () => {
  delete Element.prototype.animate;
  toggle();
  expect(layer()).toBeNull();
  expect(container.querySelectorAll('#skills-catalog li')).toHaveLength(53);
  toggle();
  expect(section().dataset.motion).toBe('running');
});

test('completion and unmount each remove temporary layers and outstanding work', async () => {
  toggle();
  await act(async () => {
    animations.forEach(animation => animation.finish());
    await Promise.resolve();
  });
  expect(layer()).toBeNull();
  toggle();
  expect(layer()).not.toBeNull();
  act(() => root.render(null));
  expect(layer()).toBeNull();
  const fallbackTimers = setTimeout.mock.calls.map((call, index) => call[1] === 920 ? setTimeout.mock.results[index].value : null).filter(Boolean);
  expect(fallbackTimers).toHaveLength(2);
  fallbackTimers.forEach(timer => expect(clearTimeout).toHaveBeenCalledWith(timer));
});
