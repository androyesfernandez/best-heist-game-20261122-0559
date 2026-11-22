// Line of sight and vision cones: a watcher (guard or camera) sees the thief only when
// the thief is inside its cone and no wall or cover blocks the ray between them.
import { TILE } from './config.js';
import { isSolid } from './levels.js';

function tileAt(x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

/**
 * True when the straight line from (x0, y0) to (x1, y1) crosses no solid tile.
 * Steps along the ray in small increments, so thin walls still block sight.
 */
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const { tx, ty } = tileAt(x0 + dx * t, y0 + dy * t);
    if (isSolid(level, tx, ty)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * True when the thief at (tx, ty) stands inside the watcher's cone: within range, within
 * the half-angle of the watcher's facing, and in clear line of sight.
 */
export function inVisionCone(level, watcher, thiefX, thiefY) {
  const dx = thiefX - watcher.x;
  const dy = thiefY - watcher.y;
  const distance = Math.hypot(dx, dy);
  if (distance > watcher.range) return false;
  if (distance < 18) return hasLineOfSight(level, watcher.x, watcher.y, thiefX, thiefY);
  const angleToThief = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleToThief, watcher.facing)) > watcher.halfAngle) return false;
  return hasLineOfSight(level, watcher.x, watcher.y, thiefX, thiefY);
}

/** The polygon of a vision cone, clipped by walls, for drawing. */
export function conePolygon(level, watcher, rayCount = 26) {
  const points = [{ x: watcher.x, y: watcher.y }];
  for (let i = 0; i <= rayCount; i += 1) {
    const angle = watcher.facing - watcher.halfAngle + (2 * watcher.halfAngle * i) / rayCount;
    const end = castRay(level, watcher.x, watcher.y, angle, watcher.range);
    points.push(end);
  }
  return points;
}

function castRay(level, x, y, angle, range) {
  const step = 6;
  let travelled = 0;
  let px = x;
  let py = y;
  while (travelled < range) {
    const nx = x + Math.cos(angle) * travelled;
    const ny = y + Math.sin(angle) * travelled;
    const { tx, ty } = tileAt(nx, ny);
    if (isSolid(level, tx, ty)) break;
    px = nx;
    py = ny;
    travelled += step;
  }
  return { x: px, y: py };
}
