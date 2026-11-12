import React, { act } from "react";
import { createRoot } from "react-dom/client";
import FloatingSkills from "./FloatingSkills";
import { skillSections } from "../data/skills";

let container, root, originalMatchMedia, originalObserver, originalConnection, media, visibility;
const render = () => act(() => root.render(<FloatingSkills />));
const field = () => container.querySelector('.skills-field');
const section = () => container.querySelector('#skills');
const catalog = () => container.querySelector('#skills-catalog');
const control = () => container.querySelector('.skills-motion-control');
const view = () => container.querySelector('.skills-view-control');
const labels = skillSections.flatMap(category => category.skills);

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMatchMedia = window.matchMedia;
  originalObserver = global.IntersectionObserver;
  originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  delete global.IntersectionObserver;
  visibility = 'visible';
  jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  media = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => media);
  Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = originalMatchMedia;
  global.IntersectionObserver = originalObserver;
  if (originalConnection) Object.defineProperty(navigator, 'connection', originalConnection);
  else delete navigator.connection;
  jest.restoreAllMocks();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('all 53 existing skills appear exactly once in the accessible, categorized inventory', () => {
  render();
  expect(labels).toHaveLength(53);
  expect(new Set(labels).size).toBe(labels.length);
  expect([...catalog().querySelectorAll('li')].map(chip => chip.textContent)).toEqual(labels);
  expect(catalog().classList.contains('visually-hidden')).toBe(true);
  expect(catalog().closest('[aria-hidden="true"]')).toBeNull();
  expect(catalog().querySelectorAll('h3')).toHaveLength(4);
  expect(section().getAttribute('aria-labelledby')).toBe('skills-heading');
});

test('four decorative lanes repeat identical groups with every skill preserved and no interactive duplicates', () => {
  render();
  expect(field().getAttribute('aria-hidden')).toBe('true');
  expect(field().querySelector('button, a, [tabindex]')).toBeNull();
  const tracks = [...field().querySelectorAll('.skills-track')];
  expect(tracks).toHaveLength(4);
  const firstCopies = [];
  tracks.forEach(track => {
    const copies = track.querySelectorAll('.skills-group');
    expect(copies).toHaveLength(2);
    expect(copies[0].innerHTML).toBe(copies[1].innerHTML);
    firstCopies.push(...[...copies[0].querySelectorAll('.skill-chip')].map(chip => chip.textContent));
  });
  expect(firstCopies.sort()).toEqual([...labels].sort());
  expect(new Set([...field().querySelectorAll('.skill-drift')].map(slot => slot.style.getPropertyValue('--offset'))).size).toBeGreaterThan(4);
  expect(section().dataset.motion).toBe('running');
});

test('pause and resume support repeated toggles and preserve the field DOM', () => {
  render();
  const originalField = field();
  for (let index = 0; index < 4; index++) {
    act(() => control().click());
    expect(section().dataset.motion).toBe(index % 2 === 0 ? 'paused' : 'running');
    expect(control().getAttribute('aria-pressed')).toBe(String(index % 2 === 0));
    expect(control().getAttribute('aria-label')).toBe(index % 2 === 0 ? 'Resume skill motion' : 'Pause skill motion');
    expect(field()).toBe(originalField);
  }
});

test('view all shows every skill, restores floating mode, and remembers a deliberate pause', () => {
  render();
  act(() => control().click());
  act(() => view().click());
  expect(field()).toBeNull();
  expect(control()).toBeNull();
  expect(catalog().classList.contains('visually-hidden')).toBe(false);
  expect(catalog().querySelectorAll('li')).toHaveLength(53);
  expect(view().getAttribute('aria-pressed')).toBe('true');
  expect(view().textContent).toContain('Show floating skills');
  act(() => view().click());
  expect(field()).not.toBeNull();
  expect(section().dataset.motion).toBe('paused');
  act(() => control().click());
  expect(section().dataset.motion).toBe('running');
});

test('reduced motion starts with a readable static inventory and follows preference changes', () => {
  media.matches = true;
  render();
  expect(field()).toBeNull();
  expect(control()).toBeNull();
  expect(view()).toBeNull();
  expect(catalog().classList.contains('visually-hidden')).toBe(false);
  act(() => { media.matches = false; media.addEventListener.mock.calls.find(([name]) => name === 'change')[1](); });
  expect(field()).not.toBeNull();
  act(() => { media.matches = true; media.addEventListener.mock.calls.find(([name]) => name === 'change')[1](); });
  expect(field()).toBeNull();
  expect(catalog().querySelectorAll('li')).toHaveLength(53);
});

test('data saving visitors receive the complete static catalog', () => {
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  render();
  expect(field()).toBeNull();
  expect(catalog().classList.contains('visually-hidden')).toBe(false);
  expect(catalog().querySelectorAll('li')).toHaveLength(53);
});

test('motion suspends outside the viewport and in background tabs, with cleanup', () => {
  let notify;
  const observe = jest.fn(), disconnect = jest.fn();
  global.IntersectionObserver = jest.fn(callback => { notify = callback; return { observe, disconnect }; });
  render();
  expect(observe).toHaveBeenCalledWith(section());
  expect(section().dataset.motion).toBe('paused');
  act(() => notify([{ isIntersecting: true }]));
  expect(section().dataset.motion).toBe('running');
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(section().dataset.motion).toBe('paused');
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(section().dataset.motion).toBe('running');
  act(() => notify([{ isIntersecting: false }]));
  expect(section().dataset.motion).toBe('paused');
  act(() => root.render(null));
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

function interactiveRiver() {
  const callbacks = new Map();
  let sequence = 0, time = 0;
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callbacks.set(++sequence, callback); return sequence; });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => callbacks.delete(id));
  const fine = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia.mockImplementation(query => query.includes('any-pointer') ? fine : media);
  render();
  const buoy = field().querySelector('.skill-drift');
  jest.spyOn(field(), 'getBoundingClientRect').mockReturnValue({ left: 0, right: 600, top: 0, bottom: 420, width: 600, height: 420 });
  field().querySelectorAll('.skills-lane').forEach(lane => jest.spyOn(lane, 'getBoundingClientRect').mockReturnValue({ height: 96 }));
  field().querySelectorAll('.skill-drift').forEach(node => jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({ left: -2000, right: -1900, top: 27, width: 100, height: 42 }));
  buoy.getBoundingClientRect.mockReturnValue({ left: 100, right: 250, top: 27, width: 150, height: 42 });
  const point = (type = 'pointermove', pointerType = 'mouse', x = 170, y = 30) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { pointerType: { value: pointerType }, clientX: { value: x }, clientY: { value: y } });
    act(() => field().dispatchEvent(event));
    return event;
  };
  const frames = count => {
    for (let index = 0; index < count; index++) {
      const pending = [...callbacks.values()]; callbacks.clear(); time += 1000 / 60;
      act(() => pending.forEach(callback => callback(time)));
    }
  };
  return { buoy, point, frames, callbacks, fine, displacement: () => parseFloat(buoy.style.getPropertyValue('--impact-y')) || 0 };
}

test('mouse contact displaces only the vertical pose, then settles and stops the frame loop', () => {
  const river = interactiveRiver();
  expect(river.callbacks.size).toBe(0);
  river.point(); river.frames(12);
  expect(river.displacement()).toBeGreaterThan(5);
  expect(river.displacement()).toBeLessThan(32);
  expect(river.buoy.style.getPropertyValue('--impact-x')).toBe('');
  expect(field().querySelector('.skills-track').style.transform).toBe('');
  river.point('pointerleave'); river.frames(240);
  expect(river.displacement()).toBe(0);
  expect(river.callbacks.size).toBe(0);
});

test('touch gestures and coarse pointers are never intercepted or animated by the hit response', () => {
  const river = interactiveRiver();
  expect(river.point('pointermove', 'touch').defaultPrevented).toBe(false);
  expect(river.callbacks.size).toBe(0);
  river.fine.matches = false;
  river.point();
  expect(river.callbacks.size).toBe(0);
});

test('Pause freezes a displaced pose, Resume recovers, and View all cancels pending work', () => {
  const river = interactiveRiver();
  river.point(); river.frames(12);
  const displaced = river.displacement();
  act(() => control().click());
  expect(river.callbacks.size).toBe(0);
  river.frames(10);
  expect(river.displacement()).toBe(displaced);
  act(() => control().click());
  river.frames(240);
  expect(river.displacement()).toBe(0);
  expect(river.callbacks.size).toBe(0);
  river.point(); river.frames(4);
  act(() => view().click());
  expect(river.callbacks.size).toBe(0);
  expect(field()).toBeNull();
});

test('cancellation settles a hit and unmount removes all queued interaction frames', () => {
  const river = interactiveRiver();
  river.point(); river.frames(12);
  river.point('pointercancel'); river.frames(240);
  expect(river.displacement()).toBe(0);
  expect(river.callbacks.size).toBe(0);
  river.point(); river.frames(2);
  act(() => root.render(null));
  expect(river.callbacks.size).toBe(0);
  expect(river.fine.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

test('switching to coarse input or reduced motion cancels an active hit immediately', () => {
  const river = interactiveRiver();
  river.point(); river.frames(8);
  expect(river.displacement()).not.toBe(0);
  act(() => {
    river.fine.matches = false;
    river.fine.addEventListener.mock.calls[0][1]();
  });
  expect(river.callbacks.size).toBe(0);
  expect(river.displacement()).toBe(0);
  act(() => {
    river.fine.matches = true;
    river.fine.addEventListener.mock.calls[0][1]();
  });
  river.point(); river.frames(8);
  act(() => { media.matches = true; media.addEventListener.mock.calls[0][1](); });
  expect(field()).toBeNull();
  expect(river.callbacks.size).toBe(0);
});


test('the compact chip catalog keeps category styling, full names, and the original river', () => {
  render();
  const originalRiver = field().innerHTML;
  act(() => view().click());
  const lists = [...catalog().querySelectorAll('ul[role="list"]')];
  expect(lists).toHaveLength(skillSections.length);
  lists.forEach((list, index) => {
    const chips = [...list.querySelectorAll('li')];
    expect(chips.map(item => item.textContent)).toEqual(skillSections[index].skills);
    chips.forEach(chip => {
      expect(chip.classList.contains('skill-chip')).toBe(true);
      expect(chip.classList.contains(`skill-chip--${skillSections[index].id}`)).toBe(true);
      expect(chip.classList.contains('skill-chip--featured')).toBe(false);
    });
  });
  expect(catalog().querySelector('[hidden], [aria-hidden="true"]')).toBeNull();
  expect(catalog().textContent).toContain('Gemini Enterprise Agent Platform (formerly Vertex AI)');
  expect(catalog().querySelectorAll('li')).toHaveLength(53);
  act(() => view().click());
  expect(field().querySelectorAll('.skills-track')).toHaveLength(4);
  expect(field().querySelectorAll('.skill-chip')).toHaveLength(106);
  expect(field().innerHTML).toBe(originalRiver);
});
