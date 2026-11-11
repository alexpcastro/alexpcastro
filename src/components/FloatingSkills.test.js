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
