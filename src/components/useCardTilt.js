import { useCallback, useEffect, useRef } from "react";

const CAPABILITY = "(hover: hover) and (pointer: fine)";
const MAX_TILT_X = 10;
const MAX_TILT_Y = 8;
const clamp = value => Math.max(-1, Math.min(1, value));

export function pointerTilt(rect, x, y) {
  if (!rect.width || !rect.height) return { x: 0, y: 0 };
  // The edge nearest the pointer comes forward, rather than pressing away.
  return { x: clamp((y - rect.top) / rect.height * 2 - 1) * MAX_TILT_X,
    y: -clamp((x - rect.left) / rect.width * 2 - 1) * MAX_TILT_Y };
}

/** The outer card is an untransformed hit area. Only its inner surface tilts,
 * keeping pointer math stable while the gallery expands and the video plays. */
export default function useCardTilt({ enabled, cardRefs }) {
  const capable = useRef(false);
  const state = useRef({ values: [], pointer: null, frame: null, time: null, until: 0 });
  const clearCard = useCallback(card => {
    card?.style.removeProperty("--card-tilt-x");
    card?.style.removeProperty("--card-tilt-y");
    card?.removeAttribute("data-tilting");
  }, []);
  const reset = useCallback(() => {
    const current = state.current;
    if (current.frame !== null) window.cancelAnimationFrame(current.frame);
    current.frame = null; current.pointer = null; current.time = null; current.values = [];
    cardRefs.current.forEach(clearCard);
  }, [cardRefs, clearCard]);

  useEffect(() => {
    const media = window.matchMedia(CAPABILITY);
    const update = () => { capable.current = enabled && media.matches; if (!capable.current) reset(); };
    update();
    media.addEventListener("change", update);
    window.addEventListener("blur", reset);
    window.addEventListener("beforeprint", reset);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("blur", reset);
      window.removeEventListener("beforeprint", reset);
      capable.current = false;
      reset();
    };
  }, [enabled, reset]);

  const tick = time => {
    const current = state.current;
    current.frame = null;
    if (!capable.current) { reset(); return; }
    const dt = current.time === null ? 16 : Math.min(32, Math.max(1, time - current.time));
    current.time = time;
    const follow = 1 - Math.exp(-dt / 85);
    let target = { x: 0, y: 0 };
    if (current.pointer) {
      const card = cardRefs.current[current.pointer.index];
      if (card) target = pointerTilt(card.getBoundingClientRect(), current.pointer.x, current.pointer.y);
    }
    let settling = false;
    // One geometry read above, then all transform writes together.
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const value = current.values[index] || { x: 0, y: 0 };
      const goal = current.pointer?.index === index ? target : { x: 0, y: 0 };
      value.x += (goal.x - value.x) * follow;
      value.y += (goal.y - value.y) * follow;
      if (Math.abs(goal.x - value.x) + Math.abs(goal.y - value.y) > .008) settling = true;
      else { value.x = goal.x; value.y = goal.y; }
      current.values[index] = value;
      if (Math.abs(value.x) + Math.abs(value.y) < .008) clearCard(card);
      else {
        card.style.setProperty("--card-tilt-x", `${value.x.toFixed(3)}deg`);
        card.style.setProperty("--card-tilt-y", `${value.y.toFixed(3)}deg`);
        card.setAttribute("data-tilting", "true");
      }
    });
    // Track geometry through the 600ms expansion, then sleep until new input.
    if (settling || (current.pointer && time < current.until)) current.frame = window.requestAnimationFrame(tick);
    else current.time = null;
  };
  const start = () => {
    if (state.current.frame === null) state.current.frame = window.requestAnimationFrame(tick);
  };
  const leave = index => {
    if (state.current.pointer?.index !== index) return;
    state.current.pointer = null;
    start();
  };
  const move = (event, index) => {
    if (!enabled || !capable.current || event.pointerType !== "mouse") return;
    if (event.buttons) { leave(index); return; }
    state.current.pointer = { index, x: event.clientX, y: event.clientY };
    state.current.until = performance.now() + 680;
    start();
  };
  return { move, leave, reset };
}
