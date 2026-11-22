// Wall cameras: fixed mounts that sweep their cone back and forth. A camera that spots
// the thief raises the alarm faster than a guard, but a jammer blinds it for a while.
import { CAMERA } from './config.js';
import { inVisionCone } from './vision.js';

/** A fresh camera, sweeping around its base angle. */
export function makeCamera(def, index) {
  return {
    id: index,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    phase: def.phase + index * 1.3,
    facing: def.baseAngle,
    jammedLeft: 0,
    // How sure this camera is that it saw the thief (0..1).
    suspicion: 0,
  };
}

/**
 * Advance one camera one step. Returns 'spotted' while the thief is in its sweeping cone.
 * A jammed camera does not move, does not see, and its suspicion drains.
 */
export function stepCamera(camera, dt, level, thief, time) {
  if (camera.jammedLeft > 0) {
    camera.jammedLeft = Math.max(0, camera.jammedLeft - dt);
    camera.suspicion = Math.max(0, camera.suspicion - dt * 0.5);
    return 'jammed';
  }
  camera.facing = camera.baseAngle + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * camera.sweep;
  const watcher = {
    x: camera.x, y: camera.y, facing: camera.facing,
    range: CAMERA.viewRange, halfAngle: CAMERA.viewHalfAngle,
  };
  const seesThief = inVisionCone(level, watcher, thief.x, thief.y);
  const spotFactor = thief.sneaking ? 0.45 : 1;
  if (seesThief) {
    camera.suspicion = Math.min(1, camera.suspicion + (dt / CAMERA.spotTime) * spotFactor);
  } else {
    camera.suspicion = Math.max(0, camera.suspicion - dt * 0.4);
  }
  return seesThief ? 'spotted' : 'clear';
}

/** Blind the camera nearest to (x, y) for `seconds`, if one is close enough. */
export function jamNearestCamera(cameras, x, y, seconds) {
  let best = null;
  let bestDistance = Infinity;
  for (const camera of cameras) {
    const d = Math.hypot(camera.x - x, camera.y - y);
    if (d < bestDistance) {
      best = camera;
      bestDistance = d;
    }
  }
  if (!best || bestDistance > 520) return null;
  best.jammedLeft = seconds;
  best.suspicion = 0;
  return best;
}
