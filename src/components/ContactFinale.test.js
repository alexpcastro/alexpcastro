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

test('the new ribbon sculpture is decorative, with a separate integrated accessible motion control', () => {
  render();
  const art = section().querySelector('.contact-sculpture');
  expect(art.getAttribute('aria-hidden')).toBe('true');
  expect(art.getAttribute('focusable')).toBe('false');
  expect(art.querySelector('a, button, [tabindex]')).toBeNull();
  expect(art.querySelectorAll('.contact-ribbon-light')).toHaveLength(3);
  expect(section().querySelector('.contact-orbit-flower, .contact-petal')).toBeNull();
  const control = section().querySelector('.contact-art-control');
  expect(control.getAttribute('aria-label')).toBe('Pause contact animation');
  expect(control.closest('[aria-hidden="true"]')).toBeNull();
  expect(control.parentElement.className).toBe('contact-art');
});

test('the open finale keeps its clean heading and uses continuous closed-path animation, not a time limit', () => {
  render();
  expect(section().querySelector('.contact-heading-row, .contact-eyebrow')).toBeNull();
  expect(section().textContent).not.toMatch(/Get in touch|Pause|Resume/);
  expect(section().querySelectorAll('a')).toHaveLength(4);
  const css = fs.readFileSync(path.join(__dirname, 'ContactFinale.css'), 'utf8');
  expect(css).toMatch(/\.contact-stage \{[^}]*border: 0;[^}]*border-radius: 0;[^}]*background: transparent;[^}]*box-shadow: none;/);
  expect(css.match(/animation: contact-[^;]+/g)).toHaveLength(2);
  expect(css.match(/animation: contact-[^;]+/g).every(rule => rule.includes('linear infinite'))).toBe(true);
  expect(css).toContain('rotate(-18deg)');
  expect(css).toContain('rotate(342deg)');
  expect(css).toContain('calc(var(--phase) - 100px)');
  section().querySelectorAll('.contact-ribbon-light').forEach(light => {
    expect(light.getAttribute('pathLength')).toBe('100');
    expect(light.getAttribute('stroke-dasharray')).toBe('13 87');
  });
});

test('repeated pause/resume and preference changes preserve a deliberate pause without remounting the art', () => {
  render();
  const art = section().querySelector('.contact-sculpture');
  const control = () => section().querySelector('.contact-art-control');
  for (let index = 0; index < 4; index++) {
    act(() => control().click());
    expect(section().dataset.motion).toBe(index % 2 === 0 ? 'paused' : 'running');
    expect(control().getAttribute('aria-pressed')).toBe(String(index % 2 === 0));
    expect(control().getAttribute('aria-label')).toBe(index % 2 === 0 ? 'Resume contact animation' : 'Pause contact animation');
    expect(section().querySelector('.contact-sculpture')).toBe(art);
  }
  act(() => control().click());
  preferenceChanged(true);
  expect(control()).toBeNull();
  preferenceChanged(false);
  expect(section().dataset.motion).toBe('paused');
  expect(control().getAttribute('aria-pressed')).toBe('true');
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

test('offscreen and background suspend the continuous motion, and unmount cleans subscriptions', () => {
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
