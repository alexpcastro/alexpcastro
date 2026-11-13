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
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
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

test('retains all eight school identities and degree distinctions without below-image explanations', () => {
  render();
  expect(section().getAttribute('aria-labelledby')).toBe('education-heading');
  expect([...section().querySelectorAll('h3')].map(heading => heading.textContent)).toEqual([
    'Pine Crest School', 'Collège Alpin Beau Soleil', 'iD Tech Camp', 'American School of Barcelona', 'University of Oxford', 'Fordham University', 'Esade', 'Fordham University'
  ]);
  expect(section().querySelector('.education-stop--fordham-bs').getAttribute('aria-label')).toContain('BS Computer Science');
  expect(section().querySelector('.education-stop--fordham-ms').getAttribute('aria-label')).toContain('MS Computer Science');
  expect(section().querySelector('.education-stop--id-tech-miami .education-stop-institution').textContent).toBe('University of Miami');
  expect(section().querySelector('.education-stop-details, .education-degrees, .education-paper, .education-school-detail')).toBeNull();
  expect(section().textContent).not.toMatch(/Kindergarten|7th grade|Summer camp|High school|Physics|Business|ScreenCoin|specializations/);
});


test('education images are generated, local, lazy and truthfully described without visible photo credits', () => {
  render();
  expect(section().querySelectorAll('img')).toHaveLength(8);
  section().querySelectorAll('img').forEach(image => {
    expect(image.alt.length).toBeGreaterThan(15);
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(__dirname, '../../public', image.getAttribute('src').split('?')[0]))).toBe(true);
  });
  expect(section().querySelector('.education-city-mark, .education-monogram')).toBeNull();
  const asb = section().querySelector('.education-stop--barcelona img');
  expect(asb.getAttribute('src')).toBe('/education/asb-artwork-640.jpg?v=20261112-immersive');
  expect(asb.alt).toContain('AI-generated illustration');
  expect(asb.alt).toContain('high-school students');
  expect(section().querySelectorAll('img[srcset]')).toHaveLength(8);
  expect(new Set([...section().querySelectorAll('img')].map(image => image.getAttribute('src').split('?')[0])).size).toBe(8);
  section().querySelectorAll('img[srcset]').forEach(image => {
    expect(image.getAttribute('sizes')).toContain('(max-width: 900px)');
    image.getAttribute('srcset').split(', ').forEach(candidate => {
      expect(fs.existsSync(path.join(__dirname, '../../public', candidate.split(' ')[0].split('?')[0]))).toBe(true);
    });
    expect(image.alt).toMatch(/^AI-generated/);
  });
  const credits = fs.readFileSync(path.join(__dirname, '../../public/education/ATTRIBUTION.txt'), 'utf8');
  expect(credits).toContain('AI-generated illustrations');
  expect(credits).toContain('not documentary campus photographs');
  ['pine-crest', 'beau-soleil', 'id-tech-miami', 'asb', 'oxford', 'fordham-bs', 'esade', 'fordham-ms'].forEach(id => expect(credits).toContain(`${id}-artwork-{640,1280}.jpg`));
  expect(credits).toContain('https://creativecommons.org/licenses/by/4.0/');
  expect(section().querySelector('.education-photo-credits, a[href*="ATTRIBUTION"]')).toBeNull();
  expect(section().textContent).not.toMatch(/Image credits|CC BY|Wikimedia|ICGC/i);
  section().querySelectorAll('img').forEach(image => expect(image.getAttribute('src').split('?')[0]).toMatch(/-artwork-640\.jpg$/));
  expect(section().querySelector('.education-timeline-rail')).toBeNull();
});

test('pause/resume is repeatable without hiding facts or replacing imagery', () => {
  render();
  const firstImage = section().querySelector('img');
  for (let index = 0; index < 4; index++) {
    act(() => section().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(section().dataset.motion).toBe(index % 2 === 0 ? 'paused' : 'running');
    expect(section().querySelector('img')).toBe(firstImage);
    expect(section().querySelectorAll('article')).toHaveLength(8);
  }
});

test('reduced motion and preference changes preserve a static readable layout and deliberate pause', () => {
  media.matches = true;
  render();
  expect(section().dataset.motion).toBe('paused');
  expect(control()).toBeNull();
  expect(section().querySelectorAll('article')).toHaveLength(8);
  act(() => { media.matches = false; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  act(() => section().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  act(() => { media.matches = true; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  expect(control()).toBeNull();
  act(() => { media.matches = false; media.addEventListener.mock.calls.find(([type]) => type === 'change')[1](); });
  expect(section().dataset.motion).toBe('paused');
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


test('school cards retain chronological DOM order and date chips without a timeline or scroll region', () => {
  render();
  expect(section().querySelectorAll('.education-stop')).toHaveLength(8);
  expect([...section().querySelectorAll('.education-date-chip')].map(node => node.textContent)).toEqual(['c. 2001–2009', 'Summers 2007 & 2008', 'Summer 2009', '2009–2013', 'Winter 2013', '2013–2017', 'Summer 2014', '2020–2022']);
  expect(section().querySelector('.education-timeline, .education-timeline-viewport, .education-timeline-rail, .education-stop-marker, .education-stop-dot')).toBeNull();
  expect(section().querySelectorAll('.education-stop--fordham')).toHaveLength(2);
  const labels = [...section().querySelectorAll('article')].map(node => node.getAttribute('aria-label'));
  expect(new Set(labels).size).toBe(8);
  const headingIds = [...section().querySelectorAll('h3')].map(node => node.id);
  expect(new Set(headingIds).size).toBe(8);
});


test('each image contains its date chip, place and school with no trailing content', () => {
  render();
  section().querySelectorAll('.education-stop').forEach(stop => {
    const art = stop.querySelector('.education-stop-art');
    const date = art.querySelector('.education-date-chip');
    expect(date).not.toBeNull();
    expect(art.querySelector('.education-stop-place')).not.toBeNull();
    expect(art.querySelector('h3')).not.toBeNull();
    expect(art.closest('.education-art-frame').nextElementSibling).toBeNull();
    expect(date.compareDocumentPosition(art.querySelector('.education-stop-heading')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toMatch(/\.education-stop-heading \{[^}]*background: linear-gradient/);
  expect(css).toMatch(/\.education-date-chip \{[^}]*border-radius: 12px/);
  expect(css).toContain('margin-top: auto');
  expect(css.split('@media print')[1]).toMatch(/\.education-stop-heading \{[^}]*position: static/);
});


test('eight desktop cards fit one row while smaller screens wrap without horizontal scrolling', () => {
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toContain('grid-template-columns: repeat(8, minmax(0, 1fr))');
  expect(css).toContain('--education-art-height: 310px');
  expect(css.split('@media (max-width: 900px)')[1]).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
  expect(css.split('@media (max-width: 600px)')[1]).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
  expect(css).not.toMatch(/min-width: calc|white-space: nowrap|text-overflow: ellipsis/);
  expect(css).toContain('max-width: 100cqw;');
  expect(css).toContain('overscroll-behavior-x: contain');
  expect(css).toContain('overflow-wrap: anywhere');
  expect(css).not.toContain('education-timeline');
});


test('early entries retain approximate years, supplied seasons and verified locations in the image overlays', () => {
  render();
  expect(section().querySelector('.education-stop--pine-crest .education-date-chip').textContent).toBe('c. 2001–2009');
  expect(section().querySelector('.education-stop--pine-crest').textContent).toContain('Fort Lauderdale, Florida');
  expect(section().querySelector('.education-stop--beau-soleil').textContent).toContain('Summers 2007 & 2008');
  expect(section().querySelector('.education-stop--beau-soleil').textContent).toContain('Villars-sur-Ollon, Switzerland');
  expect(section().querySelector('.education-stop--id-tech-miami').textContent).toContain('University of Miami');
  expect(section().querySelector('.education-stop--id-tech-miami').textContent).toContain('Coral Gables, Florida');
});

test('mobile Education rail bleeds to shell edges like the skills river without widening the page', () => {
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toMatch(/\.education-card-grid\[data-carousel="true"\] \{[^}]*width: 100cqw;[^}]*max-width: 100cqw;[^}]*margin-left: calc\(50% - 50cqw\)/);
  expect(css).toContain('overflow-x: auto');
  expect(css.split('@media print')[1]).toContain('margin-left: 0;');
});


test('active education artwork has a normal cursor; inactive selection stays clickable', () => {
  const css = fs.readFileSync(path.join(__dirname, 'EducationJourney.css'), 'utf8');
  expect(css).toContain('.education-stop[data-active="true"] .education-art-control,');
  expect(css).toMatch(/\.education-art-control\[aria-pressed="true"\]\s*\{ cursor: default;/);
  expect(css).toMatch(/(?:^|\n)\.education-art-control\s*\{[^}]*cursor: pointer/);
});


test('no pause button is rendered', () => {
  render();
  expect(control()).toBeNull();
});
