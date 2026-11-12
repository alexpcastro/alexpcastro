import { pointerInfluence, stepBuoy, travelBounds } from './skillRiverPhysics';

test('nearby and swept pointers hit the buoy, while distant pointers do nothing', () => {
  const rect = { left: 100, top: 27, width: 150, height: 42 };
  expect(pointerInfluence(rect, { x: 175, y: 40 }, { x: 175, y: 40 }, 0)).toEqual(expect.objectContaining({ side: 1 }));
  expect(pointerInfluence(rect, { x: 175, y: 60 }, { x: 175, y: 60 }, 0).side).toBe(-1);
  expect(pointerInfluence(rect, { x: 0, y: 400 }, { x: 0, y: 400 }, 0).strength).toBe(0);
  expect(pointerInfluence(rect, { x: 500, y: 48 }, { x: -100, y: 48 }, 0).strength).toBe(1);
});

test('displacement is bounded by the rotated chip silhouette, bob and lane gap', () => {
  for (const width of [60, 150, 280, 530]) for (const height of [40, 51]) for (const angle of [-2, 0, 2]) for (const offset of [-8, 6, 8]) {
    const bounds = travelBounds(width, height, angle, offset, 96);
    const radians = Math.abs(angle) * Math.PI / 180;
    const halfHeight = (Math.cos(radians) * height + Math.sin(radians) * width) / 2 + 3;
    let state = { y: 0, velocity: 1000 };
    for (let frame = 0; frame < 60; frame++) {
      state = stepBuoy(state, frame % 2 ? 1000 : -1000, bounds, .0167);
      expect(state.y + offset - halfHeight).toBeGreaterThanOrEqual(-42.0001);
      expect(state.y + offset + halfHeight).toBeLessThanOrEqual(42.0001);
    }
    // Adjacent 96px lanes retain a >= 12px vertical gap at their extremes.
    expect(bounds.max + offset + halfHeight).toBeLessThanOrEqual(42.0001);
  }
});

test('a hit settles naturally without reversing the horizontal current or running forever', () => {
  let state = { y: 20, velocity: -180 };
  const bounds = { min: -28, max: 28 };
  for (let frame = 0; frame < 240; frame++) state = stepBuoy(state, 0, bounds, 1 / 60);
  expect(state).toEqual({ y: 0, velocity: 0 });
  expect(stepBuoy({ y: 0, velocity: 0 }, 30, bounds, 10)).toEqual(stepBuoy({ y: 0, velocity: 0 }, 30, bounds, 1 / 30));
  expect(Object.keys(state)).toEqual(['y', 'velocity']);
});
