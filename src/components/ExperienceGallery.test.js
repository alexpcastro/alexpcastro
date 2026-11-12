import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ExperienceGallery from "./ExperienceGallery";

// Verify gallery motion independently of decoding the review video.
jest.mock('./CareerScene', () => props => <div className="test-scene" data-active={props.active} data-paused={props.motionPaused} data-allowed={props.allowMotion} />);
let container, root, originalMatchMedia, originalObserver, originalConnection, media, visibility;
const render = () => act(() => root.render(<ExperienceGallery />));
const gallery = () => container.querySelector('.experience-gallery');
const active = () => container.querySelector('.experience-card.is-active');
const control = () => active().querySelector('.gallery-picture[aria-pressed]');
const select = index => act(() => container.querySelectorAll('.gallery-picture')[index].click());

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMatchMedia = window.matchMedia;
  originalObserver = global.IntersectionObserver;
  originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  delete global.IntersectionObserver;
  visibility = 'visible';
  jest.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  media = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query === '(prefers-reduced-motion: reduce)' ? media : { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
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

test('every chapter can pause decorative motion and preserves pause across selection', () => {
  render();
  expect(gallery().dataset.motion).toBe('running');
  act(() => control().click());
  expect(gallery().dataset.motion).toBe('paused');
  for (const index of [1, 3, 5, 0]) {
    select(index);
    expect(control().getAttribute('aria-label')).toContain('Resume animation');
    expect(control().getAttribute('aria-pressed')).toBe('true');
    expect(active().querySelector('.test-scene').dataset.paused).toBe('true');
    expect(gallery().dataset.motion).toBe('paused');
    expect(control().classList.contains('gallery-picture')).toBe(true);
  }
  act(() => control().click());
  expect(gallery().dataset.motion).toBe('running');
  expect(control().getAttribute('aria-pressed')).toBe('false');
  expect(control().querySelector('svg').getAttribute('aria-hidden')).toBe('true');
});

test('motion suspends offscreen and in background tabs without losing a deliberate pause', () => {
  let notify;
  const observe = jest.fn(), disconnect = jest.fn();
  global.IntersectionObserver = jest.fn(callback => { notify = callback; return { observe, disconnect }; });
  render();
  expect(observe).toHaveBeenCalledWith(gallery());
  expect(gallery().dataset.motion).toBe('paused');
  act(() => notify([{ isIntersecting: true }]));
  expect(gallery().dataset.motion).toBe('running');
  act(() => { visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(gallery().dataset.motion).toBe('paused');
  act(() => { visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
  expect(gallery().dataset.motion).toBe('running');
  act(() => control().click());
  act(() => notify([{ isIntersecting: false }]));
  act(() => notify([{ isIntersecting: true }]));
  expect(gallery().dataset.motion).toBe('paused');
  act(() => root.render(null));
  expect(disconnect).toHaveBeenCalledTimes(1);
});

test('reduced-motion preference changes stop gallery and scene motion', () => {
  media.matches = true;
  render();
  expect(gallery().dataset.motion).toBe('paused');
  expect(control()).toBeNull();
  expect(active().querySelector('.test-scene').dataset.allowed).toBe('false');
  act(() => { media.matches = false; media.addEventListener.mock.calls[0][1](); });
  expect(gallery().dataset.motion).toBe('running');
  expect(control()).not.toBeNull();
  act(() => { media.matches = true; media.addEventListener.mock.calls[0][1](); });
  select(4);
  expect(gallery().dataset.motion).toBe('paused');
  expect(control()).toBeNull();
  expect(active().querySelector('.experience-story').hidden).toBe(false);
});

test('data-saving visitors have static artwork and no motion control', () => {
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  render();
  expect(gallery().dataset.motion).toBe('paused');
  expect(container.querySelector('.gallery-motion-control')).toBeNull();
  expect(active().querySelector('.test-scene').dataset.allowed).toBe('false');
});


test('mobile cards preserve pause and support directional, Home and End navigation', () => {
  const match = window.matchMedia;
  window.matchMedia = jest.fn(query => query === '(max-width: 760px)' ? { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() } : match(query));
  render();
  const buttons = [...container.querySelectorAll('.gallery-picture')];
  act(() => control().click());
  act(() => buttons[0].focus());
  for (const [key, index] of [['ArrowLeft', 5], ['ArrowUp', 4], ['Home', 0], ['End', 5], ['ArrowRight', 0], ['ArrowDown', 1]]) {
    act(() => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(buttons[index]);
    expect(buttons[index].getAttribute('aria-expanded')).toBe('true');
    expect(control().getAttribute('aria-label')).toContain('Resume animation');
    expect(gallery().dataset.motion).toBe('paused');
    expect(container.querySelectorAll('.experience-card.is-active')).toHaveLength(1);
  }
});

test('breakpoint changes preserve the actual card nodes, selection and keyboard focus', () => {
  const match = window.matchMedia;
  const viewport = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query === '(max-width: 760px)' ? viewport : match(query));
  render();
  select(4);
  const button = container.querySelector('#image-pure-digital');
  act(() => button.focus());
  const resize = matches => act(() => { viewport.matches = matches; viewport.addEventListener.mock.calls[0][1]({ matches }); });
  resize(true);
  expect(document.activeElement).toBe(button);
  expect(active().id).toBe('experience-pure-digital');
  resize(false);
  expect(document.activeElement).toBe(button);
  expect(container.querySelectorAll('.experience-card[hidden]')).toHaveLength(0);
  expect(active().id).toBe('experience-pure-digital');
});

test('mobile accordion animates heights in place, retains a paused departing scene, and handles interruptions', () => {
  jest.useFakeTimers();
  const originalAnimate = Element.prototype.animate;
  const animations = [];
  Element.prototype.animate = jest.fn((frames, options) => { const animation = { cancel: jest.fn(), frames, options }; animations.push(animation); return animation; });
  const match = window.matchMedia;
  window.matchMedia = jest.fn(query => query === '(max-width: 760px)' ? { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() } : match(query));
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const featured = this.classList.contains('is-active');
    return { left: 0, top: 0, width: 350, height: featured ? 500 : 64 };
  });
  try {
    render();
    const cards = [...container.querySelectorAll('.experience-card')];
    select(3);
    expect(animations).toHaveLength(14);
    expect(animations[0].frames).toEqual([{ height: '500px' }, { height: '64px' }]);
    expect(animations.filter(animation => 'height' in animation.frames[0])).toHaveLength(8);
    expect(animations.every(animation => !('width' in animation.frames[0]))).toBe(true);
    expect([...container.querySelectorAll('.experience-card')]).toEqual(cards);
    expect(cards.every(card => card.style.getPropertyValue('--mobile-slot') === '')).toBe(true);
    expect(cards[0].classList.contains('is-departing')).toBe(true);
    expect(cards[0].querySelector('.test-scene').dataset.active).toBe('true');
    expect(cards[0].querySelector('.test-scene').dataset.paused).toBe('true');
    expect(cards[0].querySelector('.experience-story').getAttribute('aria-hidden')).toBe('true');
    expect(cards[0].querySelector('.experience-story').hasAttribute('inert')).toBe(true);
    expect(container.querySelector('.gallery-track').dataset.rearranging).toBe('true');
    expect(animations).toHaveLength(14);
    select(5);
    expect(animations.slice(0, 14).every(animation => animation.cancel.mock.calls.length === 1)).toBe(true);
    expect(cards[3].classList.contains('is-departing')).toBe(true);
    act(() => jest.advanceTimersByTime(750));
    expect(container.querySelector('.is-departing')).toBeNull();
    expect(container.querySelector('.gallery-track').hasAttribute('data-rearranging')).toBe(false);
    select(2);
    act(() => control().click());
    expect(container.querySelector('.is-departing')).toBeNull();
    expect(container.querySelector('.gallery-track').hasAttribute('data-rearranging')).toBe(false);
    expect(gallery().dataset.motion).toBe('paused');
  } finally {
    Element.prototype.animate = originalAnimate;
    jest.useRealTimers();
  }
});


test('Experience has no separate animation buttons and the open artwork toggles motion', () => {
  render();
  expect(container.querySelector('.gallery-motion-control, .experience-story button')).toBeNull();
  expect(control().getAttribute('aria-label')).toContain('Pause animation');
  act(() => control().click());
  expect(control().getAttribute('aria-label')).toContain('Resume animation');
  expect(gallery().dataset.motion).toBe('paused');
  act(() => control().click());
  expect(gallery().dataset.motion).toBe('running');
  expect(container.querySelector('#gallery-help').textContent).toContain('Activate the open artwork');
});


test('project links are inline in organization names without duplicate or standalone rows', () => {
  render();
  const expected = [
    ['deloitte', 'AI Advantage, Deloitte', 'AI Advantage'],
    ['fordham', 'Disability Data Initiative, Fordham University', 'Disability Data Initiative'],
    ['columbia', 'Tow Center Research, Columbia University', 'Tow Center Research'],
    ['pure-digital', 'Pure Digital', 'Pure Digital'],
  ];
  for (const [id, text, label] of expected) {
    const story = container.querySelector(`#story-${id}`);
    const company = story.querySelector('.portfolio-company');
    const link = company.querySelector('a');
    expect(company.textContent).toBe(text);
    expect(link.textContent).toBe(label);
    expect(link.getAttribute('aria-label')).toBe(`${label} (opens in a new tab)`);
    expect(story.querySelectorAll('a')).toHaveLength(1);
    expect(company.nextElementSibling.className).toBe('portfolio-summary');
  }
  expect(container.querySelector('.experience-actions')).toBeNull();
});


test('each mobile card fits its own story instead of reserving the longest story height', () => {
  const match = window.matchMedia;
  const viewport = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(query => query === '(max-width: 760px)' ? viewport : match(query));
  const heights = { 'story-deloitte': 150, 'story-fordham': 180, 'story-columbia': 140, 'story-brokr': 190, 'story-pure-digital': 220, 'story-apc': 160 };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: 0, width: 350, height: 200 }));
  jest.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function () { return heights[this.id] || 0; });
  render();
  const cards = [...container.querySelectorAll('.experience-card')];
  const track = container.querySelector('.gallery-track');
  expect(track.style.getPropertyValue('--mobile-art-height')).toBe('200px');
  expect(track.style.getPropertyValue('--mobile-feature-height')).toBe('');
  cards.forEach(card => expect(card.style.getPropertyValue('--mobile-feature-height')).toBe(`${200 + heights[card.querySelector('.experience-story').id]}px`));
  act(() => { viewport.matches = false; viewport.addEventListener.mock.calls[0][1]({ matches: false }); });
  expect(track.style.getPropertyValue('--mobile-art-height')).toBe('');
  cards.forEach(card => expect(card.style.getPropertyValue('--mobile-feature-height')).toBe(''));
});
