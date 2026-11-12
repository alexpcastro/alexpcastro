import React, { act } from "react";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import EducationJourney from "./EducationJourney";

let root, container, originalMatchMedia, originalObserver, originalConnection, media, visibility;
const render = () => act(() => root.render(<EducationJourney />));
const section = () => container.querySelector('#education');
const control = () => container.querySelector('.education-motion-control');
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

test('retains the four schools, both degrees and verified publication without the removed specialization line', () => {
  render();
  expect(section().getAttribute('aria-labelledby')).toBe('education-heading');
  expect([...section().querySelectorAll('h3')].map(heading => heading.textContent)).toEqual([
    'American School of Barcelona', 'University of Oxford', 'Fordham University', 'Esade', 'Fordham University'
  ]);
  ['MS, Computer Science · 2022', 'BS, Computer Science · 2017'].forEach(text => expect(section().textContent).toContain(text));
  expect(section().textContent).not.toContain('AI and Data Science specializations.');
  expect(section().querySelectorAll('.education-school-detail')[0].textContent).toBe('High school');
  expect(section().querySelectorAll('.education-school-detail')[1].textContent).toBe('Physics');
  expect(section().querySelectorAll('.education-school-detail')[2].textContent).toBe('Business');
  const paper = section().querySelector('.education-paper');
  expect(paper.href).toBe('https://ieeexplore.ieee.org/document/9854976');
  expect(paper.textContent).toContain('Co-author, ScreenCoin · IEEE COINS 2022');
  expect(paper.rel).toBe('noopener noreferrer');
  expect(section().textContent).not.toMatch(/pending|research assistant/i);
});

test('education images are generated, local, lazy and truthfully described without visible photo credits', () => {
  render();
  expect(section().querySelectorAll('img')).toHaveLength(5);
  section().querySelectorAll('img').forEach(image => {
    expect(image.alt.length).toBeGreaterThan(15);
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(__dirname, '../../public', image.getAttribute('src')))).toBe(true);
  });
  expect(section().querySelector('.education-city-mark, .education-monogram')).toBeNull();
  const asb = section().querySelector('.education-stop--barcelona img');
  expect(asb.getAttribute('src')).toBe('/education/asb-artwork-640.jpg');
  expect(asb.alt).toContain('AI-generated illustration');
  expect(asb.alt).toContain('high-school desk');
  expect(section().querySelectorAll('img[srcset]')).toHaveLength(5);
  expect(new Set([...section().querySelectorAll('img')].map(image => image.getAttribute('src'))).size).toBe(5);
  section().querySelectorAll('img[srcset]').forEach(image => {
    expect(image.getAttribute('sizes')).toContain('(max-width: 900px)');
    image.getAttribute('srcset').split(', ').forEach(candidate => {
      expect(fs.existsSync(path.join(__dirname, '../../public', candidate.split(' ')[0]))).toBe(true);
    });
    expect(image.alt).toMatch(/^AI-generated/);
  });
  const credits = fs.readFileSync(path.join(__dirname, '../../public/education/ATTRIBUTION.txt'), 'utf8');
  expect(credits).toContain('AI-generated illustrations');
  expect(credits).toContain('not documentary campus photographs');
  ['asb', 'oxford', 'fordham-bs', 'esade', 'fordham-ms'].forEach(id => expect(credits).toContain(`${id}-artwork-{640,1280}.jpg`));
  expect(credits).toContain('https://creativecommons.org/licenses/by/4.0/');
  expect(section().querySelector('.education-photo-credits, a[href*="ATTRIBUTION"]')).toBeNull();
  expect(section().textContent).not.toMatch(/Image credits|CC BY|Wikimedia|ICGC/i);
  section().querySelectorAll('img').forEach(image => expect(image.getAttribute('src')).toMatch(/-artwork-640\.jpg$/));
  expect(section().querySelector('.education-timeline-rail').getAttribute('aria-hidden')).toBe('true');
  expect(section().querySelector('.education-timeline-rail').querySelector('a, button, [tabindex]')).toBeNull();
});

test('pause/resume is repeatable without hiding facts or replacing imagery', () => {
  render();
  const firstImage = section().querySelector('img');
  for (let index = 0; index < 4; index++) {
    act(() => control().click());
    expect(section().dataset.motion).toBe(index % 2 === 0 ? 'paused' : 'running');
    expect(control().getAttribute('aria-pressed')).toBe(String(index % 2 === 0));
    expect(control().getAttribute('aria-label')).toBe(index % 2 === 0 ? 'Resume education motion' : 'Pause education motion');
    expect(section().querySelector('img')).toBe(firstImage);
    expect(section().querySelectorAll('article')).toHaveLength(5);
  }
});

test('reduced motion and preference changes preserve a static readable layout and deliberate pause', () => {
  media.matches = true;
  render();
  expect(section().dataset.motion).toBe('paused');
  expect(control()).toBeNull();
  expect(section().querySelectorAll('article')).toHaveLength(5);
  act(() => { media.matches = false; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  act(() => control().click());
  act(() => { media.matches = true; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  expect(control()).toBeNull();
  act(() => { media.matches = false; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  expect(section().dataset.motion).toBe('paused');
  expect(control().getAttribute('aria-pressed')).toBe('true');
});

test('data saving disables all automatic motion', () => {
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  render();
  expect(section().dataset.motion).toBe('paused');
  expect(control()).toBeNull();
});

test('offscreen and hidden tabs suspend motion, and unmount cleans subscriptions', () => {
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
  expect(disconnect).toHaveBeenCalledTimes(observe.mock.calls.length);
  expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
});

test('motion is confined to decorative elements and CSS provides static reduced-motion and print fallbacks', () => {
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css).toContain('@media print');
  expect(css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)@media/)[1]).toContain('animation: none');
  expect(css.split('@media print')[1]).toContain('animation: none');
  expect(css).toContain('@media (forced-colors: active)');
  expect(css).toContain('animation-play-state: paused');
  expect(css).not.toMatch(/\.education-stop-heading[^}]*animation:/);
  expect(css).not.toMatch(/\.education-stop-details[^}]*animation:/);
});


test('schools progress chronologically in DOM order with equal timeline entries and no separate Fordham card', () => {
  render();
  expect(section().querySelector('.education-foundation, .education-canvas')).toBeNull();
  expect(section().querySelectorAll('.education-stop')).toHaveLength(5);
  expect([...section().querySelectorAll('.education-stop-marker p')].map(node => node.textContent)).toEqual(['2009–2013', 'Winter 2013', '2013–2017', 'Summer 2014', '2020–2022']);
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
  expect(css).toContain('@media (max-width: 900px)');
  expect(css).toContain('education-line-flow-vertical');
  expect(css).toContain('background-position: 144px 0');
  expect(css).toContain('background-position: 0 144px');
  expect([...section().querySelectorAll('.education-degrees p')].map(node => node.textContent)).toEqual(['BS, Computer Science · 2017', 'MS, Computer Science · 2022']);
  expect(section().querySelectorAll('.education-stop--fordham')).toHaveLength(2);
  expect(section().querySelector('.education-stop--fordham-bs .education-paper')).toBeNull();
  expect(section().querySelector('.education-stop--fordham-ms .education-paper')).not.toBeNull();
  const headingIds = [...section().querySelectorAll('h3')].map(node => node.id);
  expect(new Set(headingIds).size).toBe(5);
});


test('places each school and location over its image, with details directly below the timeline date', () => {
  render();
  section().querySelectorAll('.education-stop').forEach(stop => {
    const art = stop.querySelector('.education-stop-art');
    expect(art.querySelector('.education-stop-place')).not.toBeNull();
    expect(art.querySelector('h3')).not.toBeNull();
    expect(art.closest('.education-art-frame').nextElementSibling.className).toBe('education-stop-marker');
    expect(art.closest('.education-art-frame').nextElementSibling.nextElementSibling.className).toBe('education-stop-details');
    expect(art.querySelector('.education-stop-details')).toBeNull();
  });
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toMatch(/\.education-stop-heading \{[^}]*position: absolute/);
  expect(css).toMatch(/\.education-stop-heading \{[^}]*background: linear-gradient/);
  expect(css).toContain('--education-art-height');
  expect(css.split('@media print')[1]).toMatch(/\.education-stop-heading \{[^}]*position: static/);
});


test('mobile uses compact image bands without school dividers or clipped title text', () => {
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  const mobile = css.split('@media (max-width: 900px)')[1].split('@keyframes education-line-flow-vertical')[0];
  expect(mobile).toContain('--education-art-height: 64px');
  expect(mobile).toMatch(/\.education-stop-heading \{[^}]*position: relative/);
  expect(mobile).toContain('height: auto');
  expect(mobile).toContain('font-size: clamp(16px, 4.4vw, 20px)');
  expect(mobile).not.toMatch(/white-space: nowrap|text-overflow: ellipsis/);
  expect(css).not.toContain('.education-stop:not(:last-child)::after');
  expect(css.split('@media print')[1]).toMatch(/\.education-stop-art > img \{[^}]*position: static/);
});
