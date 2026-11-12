import { useEffect } from "react";
import { pointerInfluence, stepBuoy, travelBounds } from "./skillRiverPhysics";

export default function useSkillCurrent(fieldRef, running) {
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !running) return undefined;
    const finePointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const slots = [...field.querySelectorAll('.skill-drift')].map(node => ({
      node, lane: node.closest('.skills-lane'),
      offset: parseFloat(node.style.getPropertyValue('--offset')) || 0,
      angle: parseFloat(node.style.getPropertyValue('--angle')) || 0,
      y: parseFloat(node.style.getPropertyValue('--impact-y')) || 0,
      velocity: 0, contact: false, side: 1, output: node.style.getPropertyValue('--impact-y'),
    }));
    let pointer = null, previous = null, pointerTime = 0, speed = 0;
    let frame = 0, lastFrame = 0, disposed = false;

    const wake = () => {
      if (!frame && !disposed && finePointer.matches) frame = requestAnimationFrame(animate);
    };
    const animate = time => {
      frame = 0;
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 1 / 30) : 1 / 60;
      lastFrame = time;
      // Read all geometry before writing any transforms. No React state updates,
      // layout writes, or animation work when idle, paused, offscreen or on touch.
      const fieldRect = field.getBoundingClientRect();
      const laneHeights = new Map();
      slots.forEach(slot => {
        if (!laneHeights.has(slot.lane)) laneHeights.set(slot.lane, slot.lane.getBoundingClientRect().height);
      });
      const measured = slots.map(slot => ({ slot, rect: slot.node.getBoundingClientRect() }));
      let settling = false;
      measured.forEach(({ slot, rect }) => {
        if (!rect.width || !rect.height) return;
        const bounds = travelBounds(rect.width, rect.height, slot.angle, slot.offset, laneHeights.get(slot.lane));
        const visible = rect.right > fieldRect.left - 40 && rect.left < fieldRect.right + 40;
        const hit = pointer && visible ? pointerInfluence(rect, pointer, previous || pointer, slot.offset) : { strength: 0 };
        if (hit.strength > .02) {
          if (!slot.contact) {
            slot.side = hit.side;
            slot.velocity += slot.side * (75 + Math.min(150, speed * .08)) * hit.strength;
          }
          slot.contact = true;
        } else slot.contact = false;
        // Keep the chosen side through contact so crossing the center of a chip
        // does not make it flicker back and forth around the pointer.
        const target = slot.contact ? slot.side * 32 * hit.strength : 0;
        const next = stepBuoy(slot, target, bounds, dt);
        slot.y = next.y;
        slot.velocity = next.velocity;
        const rest = Math.max(bounds.min, Math.min(bounds.max, 0));
        if (Math.abs(slot.y - rest) > .04 || Math.abs(slot.velocity) > .4) settling = true;
      });
      measured.forEach(({ slot }) => {
        const output = Math.abs(slot.y) < .0005 ? '' : `${slot.y.toFixed(3)}px`;
        if (output === slot.output) return;
        if (output) slot.node.style.setProperty('--impact-y', output);
        else slot.node.style.removeProperty('--impact-y');
        slot.output = output;
      });
      if (pointer) previous = { ...pointer };
      speed *= .8;
      if (pointer || settling) wake();
      else lastFrame = 0;
    };
    const move = event => {
      if (!finePointer.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
      const now = performance.now();
      const next = { x: event.clientX, y: event.clientY };
      if (pointer) speed = Math.min(2400, Math.hypot(next.x - pointer.x, next.y - pointer.y) / Math.max(8, now - pointerTime) * 1000);
      previous = pointer || next;
      pointer = next;
      pointerTime = now;
      wake();
    };
    const leave = () => {
      const active = pointer || slots.some(slot => slot.y || slot.velocity);
      pointer = null; previous = null; speed = 0;
      if (active) wake();
    };
    const changePointer = () => {
      if (finePointer.matches) { if (slots.some(slot => slot.y)) wake(); return; }
      pointer = null;
      cancelAnimationFrame(frame);
      frame = 0;
      slots.forEach(slot => { slot.y = 0; slot.velocity = 0; slot.contact = false; slot.output = ''; slot.node.style.removeProperty('--impact-y'); });
    };
    field.addEventListener('pointermove', move, { passive: true });
    field.addEventListener('pointerenter', move, { passive: true });
    field.addEventListener('pointerleave', leave);
    field.addEventListener('pointercancel', leave);
    window.addEventListener('blur', leave);
    window.addEventListener('scroll', leave, { capture: true, passive: true });
    finePointer.addEventListener('change', changePointer);
    if (slots.some(slot => slot.y)) wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      field.removeEventListener('pointermove', move);
      field.removeEventListener('pointerenter', move);
      field.removeEventListener('pointerleave', leave);
      field.removeEventListener('pointercancel', leave);
      window.removeEventListener('blur', leave);
      window.removeEventListener('scroll', leave, true);
      finePointer.removeEventListener('change', changePointer);
      // Preserve the current pose on Pause. Resuming gently returns displaced
      // chips to the current rather than snapping them to their original place.
    };
  }, [fieldRef, running]);
}
