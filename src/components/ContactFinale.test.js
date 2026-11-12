import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import ContactFinale from "./ContactFinale";

let root, container, originalMatchMedia, originalObserver, originalConnection, media, visibility;
const render = () => act(() => root.render(<ContactFinale />));
const section = () => container.querySelector('#contact');
const preferenceChanged = value => act(() => {
  media.matches = value;
  media.addEventListener.mock.calls.find(([type]) => type === 'change')[1]();
});
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

test('the finale keeps the invitation, verified contact destinations and section navigation', () => {
  render();
  expect(section().getAttribute('aria-labelledby')).toBe('contact-heading');
  expect(section().tabIndex).toBe(-1);
  expect(section().querySelector('h2').textContent).toBe('Let’s talk.');
  expect(section().textContent).not.toContain('Good work starts with a conversation');
  expect(section().querySelector('.contact-email').getAttribute('href')).toBe('mailto:alexpcastro95@gmail.com');
  expect(section().querySelector('.contact-email').textContent).toContain('Say hello by email');
  expect(section().querySelector('.contact-address').textContent).toBe('alexpcastro95@gmail.com');
  expect([...section().querySelectorAll('a[target="_blank"]')].map(link => link.href)).toEqual([
    'https://linkedin.com/in/alexpcastro', 'https://github.com/alexpcastro'
  ]);
  section().querySelectorAll('a[target="_blank"]').forEach(link => {
    expect(link.rel).toBe('noopener noreferrer');
    expect(link.textContent).toContain('opens in a new tab');
  });
  expect(section().querySelector('.contact-back-top').getAttribute('href')).toBe('#home');
  expect(section().querySelector('a[download], form, img, video')).toBeNull();
  expect(section().querySelector('.portfolio-download').textContent).toBe('');
});

test('the orbital motif is decorative and never contains interactive targets', () => {
  render();
  const orbit = section().querySelector('.contact-orbit');
  expect(orbit.getAttribute('aria-hidden')).toBe('true');
  expect(orbit.querySelector('a, button, [tabindex]')).toBeNull();
  expect(orbit.querySelector('svg').getAttribute('focusable')).toBe('false');
});

test('the open finale has no eyebrow or motion controls and keeps all contact targets', () => {
  render();
  expect(section().querySelector('.contact-heading-row, .contact-eyebrow, button')).toBeNull();
  expect(section().textContent).not.toMatch(/Get in touch|Pause|Resume/);
  expect(section().querySelectorAll('a')).toHaveLength(4);
  const css = fs.readFileSync(path.join(__dirname, 'ContactFinale.css'), 'utf8');
  expect(css).toMatch(/\.contact-stage \{[^}]*border: 0;[^}]*border-radius: 0;[^}]*background: transparent;[^}]*box-shadow: none;/);
  expect(css).not.toContain('infinite');
  expect(css.match(/animation: contact-[^;]+/g)).toHaveLength(3);
  expect(css.match(/animation: contact-[^;]+/g).every(rule => rule.includes('4s ease-out both'))).toBe(true);
});

test('live reduced-motion preferences keep a static, readable finale without replacing links', () => {
  media.matches = true;
  render();
  const email = section().querySelector('.contact-email');
  expect(section().dataset.motion).toBe('paused');
  expect(section().dataset.motionAllowed).toBe('false');
  expect(section().querySelectorAll('a')).toHaveLength(4);
  preferenceChanged(false);
  expect(section().dataset.motion).toBe('running');
  preferenceChanged(true);
  expect(section().dataset.motion).toBe('paused');
  expect(section().querySelector('.contact-email')).toBe(email);
  expect(section().querySelector('button')).toBeNull();
});

test('data saving disables automatic animation and responds to connection changes', () => {
  const connection = { saveData: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
  render();
  expect(section().dataset.motion).toBe('paused');
  expect(section().querySelector('button')).toBeNull();
  act(() => { connection.saveData = false; connection.addEventListener.mock.calls[0][1](); });
  expect(section().dataset.motion).toBe('running');
  act(() => root.render(null));
  expect(connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

test('offscreen and background suspend the one-time motion, and unmount cleans subscriptions', () => {
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
  act(() => notify([{ isIntersecting: true }]));
  expect(section().dataset.motion).toBe('running');
  act(() => root.render(null));
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

test('CSS limits automatic motion to the decorative art and includes accessible static fallbacks', () => {
  const css = fs.readFileSync(path.join(__dirname, 'ContactFinale.css'), 'utf8');
  expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css).toContain('@media (forced-colors: active)');
  expect(css).toContain('@media print');
  expect(css).toContain('animation-play-state: paused');
  expect(css).toContain('min-height: 44px');
  expect(css).not.toMatch(/\.contact-invitation[^}]*animation:/);
  expect(css).not.toMatch(/\.contact-email[^}]*animation:/);
  expect(css).not.toMatch(/\.contact-finale h2[^}]*animation:/);
});
