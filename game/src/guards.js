// Guards: they walk their patrol, pause at each waypoint, turn to scan, and react when
// they see the thief — first suspicious, then chasing. Alarm stages make them faster and
// bolder. A thrown coin pulls the nearest guard off its patrol to investigate.
import { GUARD, ALARM } from './config.js';
import { inVisionCone } from './vision.js';
import { isSolid } from './levels.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';

/** A fresh guard standing at its first waypoint, facing along its patrol. */
export function makeGuard(def, index) {
  const start = def.waypoints[0];
  const next = def.waypoints[1] || def.waypoints[0];
  return {
    id: index,
    x: start.x,
    y: start.y,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    pause: def.pause,
    pauseLeft: 0,
    facing: Math.atan2(next.y - start.y, next.x - start.x),
    mode: GUARD_PATROL,
    // How sure this guard is that it saw the thief (0..1).
    suspicion: 0,
    // Where the guard last saw, or was lured to look at, the thief.
    lastSeen: null,
    investigateLeft: 0,
    chaseLeft: 0,
    scanPhase: index * 1.7,
  };
}

function moveTowards(guard, tx, ty, speed, dt, level) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + (dx / distance) * step;
  const ny = guard.y + (dy / distance) * step;
  guard.facing = Math.atan2(dy, dx);
  if (!hitsSolid(level, nx, guard.y)) guard.x = nx;
  if (!hitsSolid(level, guard.x, ny)) guard.y = ny;
  return distance <= step + 0.5;
}

function hitsSolid(level, x, y) {
  const r = GUARD.radius - 2;
  const corners = [
    [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
  ];
  return corners.some(([cx, cy]) => isSolid(level, Math.floor(cx / 40), Math.floor(cy / 40)));
}

function speedFor(guard, alarmStage) {
  if (guard.mode === GUARD_CHASE) return GUARD.chaseSpeed;
  if (guard.mode === GUARD_SUSPICIOUS || guard.mode === GUARD_INVESTIGATE) return GUARD.suspectSpeed;
  return GUARD.patrolSpeed * (alarmStage === 2 ? 1.45 : alarmStage === 1 ? 1.18 : 1);
}

/**
 * Advance one guard one step. Returns 'spotted' while the thief is in this guard's cone,
 * so the alarm can rise, and 'caught' when the guard grabs the thief.
 */
export function stepGuard(guard, dt, level, thief, alarmStage, time) {
  const watcher = { x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.viewRange, halfAngle: GUARD.viewHalfAngle };
  const seesThief = inVisionCone(level, watcher, thief.x, thief.y);
  const spotFactor = thief.sneaking ? 0.45 : 1;
  if (seesThief) {
    guard.suspicion = Math.min(1, guard.suspicion + (dt / GUARD.spotTime) * spotFactor);
    guard.lastSeen = { x: thief.x, y: thief.y };
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - dt * 0.35);
  }

  if (guard.suspicion >= 1 || (alarmStage === 2 && guard.lastSeen)) {
    guard.mode = GUARD_CHASE;
    guard.chaseLeft = 3;
  } else if (guard.suspicion > 0.35 && guard.mode === GUARD_PATROL) {
    guard.mode = GUARD_SUSPICIOUS;
  }

  const speed = speedFor(guard, alarmStage);
  if (guard.mode === GUARD_CHASE && guard.lastSeen) {
    guard.chaseLeft -= dt;
    const arrived = moveTowards(guard, guard.lastSeen.x, guard.lastSeen.y, speed, dt, level);
    if (arrived || guard.chaseLeft <= 0) {
      guard.mode = GUARD_SUSPICIOUS;
      guard.suspicion = Math.max(guard.suspicion, 0.5);
    }
    if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRange) return 'caught';
  } else if (guard.mode === GUARD_INVESTIGATE && guard.lastSeen) {
    guard.investigateLeft -= dt;
    const arrived = moveTowards(guard, guard.lastSeen.x, guard.lastSeen.y, speed, dt, level);
    if (arrived || guard.investigateLeft <= 0) {
      guard.mode = GUARD_SUSPICIOUS;
      guard.suspicion = 0.4;
    }
  } else if (guard.mode === GUARD_SUSPICIOUS && guard.lastSeen) {
    const arrived = moveTowards(guard, guard.lastSeen.x, guard.lastSeen.y, speed, dt, level);
    if (arrived) {
      guard.mode = GUARD_PATROL;
      guard.suspicion = 0;
      guard.lastSeen = null;
    }
  } else {
    guard.mode = GUARD_PATROL;
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      // Scan the room while paused: slow head turn.
      guard.facing += Math.sin(time * 0.9 + guard.scanPhase) * dt * 0.55;
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      const arrived = moveTowards(guard, target.x, target.y, speed, dt, level);
      if (arrived) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = guard.pause;
      }
    }
  }

  if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRange) return 'caught';
  return seesThief ? 'spotted' : 'clear';
}

/** Lure the nearest patrolling guard to a thrown coin. */
export function lureGuards(guards, x, y, radius) {
  let best = null;
  let bestDistance = Infinity;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < radius && d < bestDistance && guard.mode !== GUARD_CHASE) {
      best = guard;
      bestDistance = d;
    }
  }
  if (!best) return false;
  best.mode = GUARD_INVESTIGATE;
  best.lastSeen = { x, y };
  best.investigateLeft = 4;
  best.suspicion = 0.3;
  return true;
}
