import React, { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import useCardTilt, { pointerTilt } from "./useCardTilt";

function Harness({ enabled = true }) {
  const cardRefs = useRef([]);
  const tilt = useCardTilt({ enabled, cardRefs });
  return <div onKeyDown={tilt.reset}>{[0, 1].map(index => <article key={index} ref={node => { cardRefs.current[index] = node; }}
    onPointerMove={event => tilt.move(event, index)} onPointerLeave={() => tilt.leave(index)}>
    <div className="surface">Card {index}</div>
  </article>)}</div>;
}

let container, root, media, originalMatchMedia, originalRAF, originalCancel, frames, time, frameId, rect;
const cards = () => [...container.querySelectorAll('article')];
const render = enabled => act(() => root.render(<Harness enabled={enabled} />));
const point = (index, x, y, pointerType = 'mouse', buttons = 0) => act(() => {
  const event = new Event('pointermove', { bubbles: true });
  Object.assign(event, { pointerType, clientX: x, clientY: y, buttons });
  cards()[index].dispatchEvent(event);
});
const advance = (count = 1) => act(() => {
  for (let i = 0; i < count; i++) {
    time += 16;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(time));
  }
});
const angle = (index, axis) => parseFloat(cards()[index].style.getPropertyValue(`--card-tilt-${axis}`)) || 0;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  originalMatchMedia = window.matchMedia; originalRAF = window.requestAnimationFrame; originalCancel = window.cancelAnimationFrame;
  media = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => media);
  frames = new Map(); frameId = 0; time = performance.now();
  window.requestAnimationFrame = jest.fn(callback => { frames.set(++frameId, callback); return frameId; });
  window.cancelAnimationFrame = jest.fn(id => frames.delete(id));
  rect = { left: 0, top: 0, width: 400, height: 200 };
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => rect);
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  window.matchMedia = originalMatchMedia; window.requestAnimationFrame = originalRAF; window.cancelAnimationFrame = originalCancel;
  jest.restoreAllMocks(); delete global.IS_REACT_ACT_ENVIRONMENT;
});

test('the pointer-facing corner comes forward and angles stay clamped', () => {
  expect(pointerTilt(rect, 400, 0)).toEqual({ x: -10, y: -8 });
  expect(pointerTilt(rect, 0, 200)).toEqual({ x: 10, y: 8 });
  expect(pointerTilt(rect, 999, -999)).toEqual({ x: -10, y: -8 });
  expect(pointerTilt(rect, 300, 150)).toEqual({ x: 5, y: -4 });
  expect(pointerTilt({ ...rect, width: 0 }, 30, 40)).toEqual({ x: 0, y: 0 });
});

test('movement eases to the pointer, settles without an idle frame loop, and returns smoothly', () => {
  render(true); point(0, 400, 0); advance();
  expect(angle(0, 'x')).toBeLessThan(0); expect(angle(0, 'x')).toBeGreaterThan(-10);
  advance(100);
  expect(angle(0, 'x')).toBe(-10); expect(angle(0, 'y')).toBe(-8); expect(frames.size).toBe(0);
  act(() => cards()[0].dispatchEvent(new Event('pointerout', { bubbles: true })));
  advance(); expect(angle(0, 'x')).toBeLessThan(0); expect(angle(0, 'x')).toBeGreaterThan(-10);
  advance(100);
  expect(cards()[0].hasAttribute('data-tilting')).toBe(false); expect(angle(0, 'x')).toBe(0); expect(frames.size).toBe(0);
});

test('switching cards resets the previous card while the new one follows independently', () => {
  render(true); point(0, 400, 0); advance(60); point(1, 0, 200); advance(100);
  expect(angle(0, 'x')).toBe(0); expect(angle(1, 'x')).toBe(10); expect(angle(1, 'y')).toBe(8);
  expect(cards()[0].hasAttribute('data-tilting')).toBe(false);
});

test('geometry is read from the stable outer card as the gallery expands', () => {
  render(true); point(0, 400, 100); advance(3); expect(angle(0, 'y')).toBeLessThan(0);
  rect.width = 800; advance(100); expect(angle(0, 'y')).toBe(0); expect(frames.size).toBe(0);
});

test('touch, pen, coarse pointers and disabled motion never start tilt', () => {
  render(true); point(0, 400, 0, 'touch'); point(0, 400, 0, 'pen'); expect(frames.size).toBe(0);
  act(() => { media.matches = false; media.addEventListener.mock.calls[0][1](); });
  point(0, 400, 0); expect(frames.size).toBe(0);
  render(false); point(0, 400, 0); expect(frames.size).toBe(0);
});

test('pause, keyboard input, blur and unmount clear transforms and scheduled work', () => {
  render(true); point(0, 400, 0); advance(3); render(false);
  expect(frames.size).toBe(0); expect(cards()[0].hasAttribute('data-tilting')).toBe(false);
  render(true); point(0, 400, 0); advance(3);
  act(() => cards()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })));
  expect(frames.size).toBe(0); expect(angle(0, 'x')).toBe(0);
  point(0, 400, 0); advance(3); act(() => window.dispatchEvent(new Event('blur')));
  expect(frames.size).toBe(0); expect(angle(0, 'x')).toBe(0);
  point(0, 400, 0); advance(); act(() => root.render(null)); expect(frames.size).toBe(0);
});
