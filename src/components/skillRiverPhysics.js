// Keep the horizontal current in CSS. Only vertical displacement is simulated,
// so a hit can never reverse a chip or close the horizontal gap to its neighbor.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function travelBounds(width, height, angle, offset, laneHeight) {
  const radians = Math.abs(angle) * Math.PI / 180;
  // Include the full rotated silhouette, 3px ambient bob and a 6px bank.
  const halfHeight = (Math.abs(Math.cos(radians)) * height + Math.abs(Math.sin(radians)) * width) / 2 + 3;
  const room = Math.max(0, laneHeight / 2 - halfHeight - 6);
  return { min: -room - offset, max: room - offset };
}

export function pointerInfluence(rect, pointer, previous, offset) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2 + offset;
  // Swept contact also catches a quick pass between animation frames.
  const dx = pointer.x - previous.x, dy = pointer.y - previous.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((cx - previous.x) * dx + (cy - previous.y) * dy) / lengthSquared, 0, 1) : 1;
  const x = previous.x + t * dx, y = previous.y + t * dy;
  const horizontal = Math.max(0, Math.abs(x - cx) - rect.width / 2);
  const vertical = Math.abs(y - cy);
  const reach = 32;
  const strength = Math.pow(Math.max(0, 1 - horizontal / reach), 2)
    * Math.max(0, 1 - vertical / (rect.height / 2 + reach));
  return { strength, side: Math.abs(y - cy) > 2 ? Math.sign(cy - y) : (dy < 0 ? -1 : 1) };
}

export function stepBuoy(state, target, bounds, seconds) {
  const dt = clamp(seconds, 0, 1 / 30);
  const desired = clamp(target, bounds.min, bounds.max);
  let velocity = state.velocity + ((desired - state.y) * 180 - state.velocity * 20) * dt;
  const next = state.y + velocity * dt;
  const y = clamp(next, bounds.min, bounds.max);
  if (y !== next) velocity = 0;
  if (Math.abs(y - desired) < .04 && Math.abs(velocity) < .4) return { y: desired, velocity: 0 };
  return { y, velocity };
}
