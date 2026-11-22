// The thief: Sable, a burglar in a dark coat. WASD or arrows to move, Shift to sneak
// (slower, harder to spot), mouse click to throw a coin, Q to fire the jammer.
import { THIEF, TILE } from './config.js';
import { isSolid } from './levels.js';

/** A fresh thief at the level's spawn point. */
export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    sneaking: false,
    moving: false,
    stepPhase: 0,
  };
}

function hitsSolid(level, x, y) {
  const r = THIEF.radius - 2;
  const corners = [
    [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
  ];
  return corners.some(([cx, cy]) => isSolid(level, Math.floor(cx / TILE), Math.floor(cy / TILE)));
}

/** Move the thief one step from the input vector, sliding along walls. */
export function stepThief(thief, dx, dy, sneaking, dt, level) {
  const length = Math.hypot(dx, dy);
  thief.moving = length > 0.01;
  thief.sneaking = sneaking && thief.moving;
  if (!thief.moving) return;
  const speed = sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
  const nx = thief.x + (dx / length) * speed * dt;
  const ny = thief.y + (dy / length) * speed * dt;
  thief.facing = Math.atan2(dy, dx);
  thief.stepPhase += dt * (sneaking ? 5 : 9);
  if (!hitsSolid(level, nx, thief.y)) thief.x = nx;
  if (!hitsSolid(level, thief.x, ny)) thief.y = ny;
}

/** True when the thief stands still behind cover, so the alarm drains faster. */
export function isHiding(level, thief) {
  if (thief.moving) return false;
  const tx = Math.floor(thief.x / TILE);
  const ty = Math.floor(thief.y / TILE);
  for (let ox = -1; ox <= 1; ox += 1) {
    for (let oy = -1; oy <= 1; oy += 1) {
      if (level.cover.has(`${tx + ox},${ty + oy}`)) return true;
    }
  }
  return false;
}
