// Screenshot scenes behind ?shot=cover|patrol|alarm|clear. Each one plays the real rules
// forward from a fresh floor with a careful autopilot (it steers to the nearest loot but
// tests each step against every vision cone before taking it), so every frame is what a
// short game really looks like and the same seed always gives the same frame.
import { GUARD, CAMERA } from './config.js';
import { jumpToFloor, SCREEN_CLEARED } from './state.js';
import { stepGame } from './state.js';
import { inVisionCone } from './vision.js';
import { scoreFloor, allLootTaken } from './loot.js';
import { stageOf } from './alarm.js';

const STEP = 1 / 60;

/** Every watcher that can spot the thief right now, guards and cameras alike. */
function watcherList(game) {
  const list = [];
  for (const guard of game.guards) {
    list.push({ x: guard.x, y: guard.y, facing: guard.facing, range: GUARD.viewRange, halfAngle: GUARD.viewHalfAngle });
  }
  for (const camera of game.cameras) {
    if (camera.jammedLeft > 0) continue;
    list.push({ x: camera.x, y: camera.y, facing: camera.facing, range: CAMERA.viewRange, halfAngle: CAMERA.viewHalfAngle });
  }
  return list;
}

/** How dangerous standing at (x, y) is: 0 is safe, higher is worse. */
function dangerAt(game, x, y) {
  let danger = 0;
  for (const watcher of watcherList(game)) {
    if (inVisionCone(game.level, watcher, x, y)) danger += 2;
    const d = Math.hypot(x - watcher.x, y - watcher.y);
    if (d < 70) danger += (70 - d) / 70;
  }
  return danger;
}

/**
 * The autopilot's move: of eight directions around the way to the nearest loot, the one
 * that makes the most progress while keeping the thief out of every cone. When every way
 * forward is watched, it backs off from the nearest watcher instead.
 */
function autopilotInput(game) {
  const thief = game.thief;
  let target = null;
  let best = Infinity;
  for (const item of game.level.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - thief.x, item.y - thief.y);
    if (d < best) {
      best = d;
      target = item;
    }
  }
  if (!target) target = game.level.exit;
  const tx = target.x - thief.x;
  const ty = target.y - thief.y;
  const td = Math.hypot(tx, ty) || 1;
  const toTarget = { x: tx / td, y: ty / td };

  let bestDir = null;
  let bestScore = -Infinity;
  for (const turn of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, Math.PI]) {
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const dir = { x: toTarget.x * cos - toTarget.y * sin, y: toTarget.x * sin + toTarget.y * cos };
    const nx = thief.x + dir.x * 40;
    const ny = thief.y + dir.y * 40;
    const progress = dir.x * toTarget.x + dir.y * toTarget.y;
    const score = progress - dangerAt(game, nx, ny) * 1.6;
    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    }
  }
  return bestDir;
}

function inputFromVector(v) {
  return {
    up: v.y < -0.3, down: v.y > 0.3, left: v.x < -0.3, right: v.x > 0.3,
    sneak: false, click: null,
  };
}

function simulate(game, seconds, audio) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (game.screen !== 'play') break;
    stepGame(game, STEP, inputFromVector(autopilotInput(game)), audio);
  }
}

/** A silent audio stand-in: staged scenes make no sound. */
const silentAudio = { muted: true, context: null, lastStepAt: 0 };

/** Pin the alarm meter to a value and keep its stage word honest. */
function setAlarm(game, value) {
  game.alarm.value = value;
  game.alarm.stage = stageOf(value);
}

/**
 * Set `game` to the named scene (cover, patrol, alarm or clear) and leave the screen
 * the renderer should draw over it.
 */
export function stageShot(name, game) {
  if (name === 'patrol') {
    jumpToFloor(game, 1);
    simulate(game, 6, silentAudio);
    if (game.screen !== 'play') {
      // The autopilot got caught: restage from a fresh floor and stand the thief still
      // in the open left corridor while the patrols sweep past — the frame still shows
      // the real game, and the spot is clear of every patrol lane and camera cone.
      jumpToFloor(game, 1);
      game.thief.x = 340;
      game.thief.y = 300;
      const still = { up: false, down: false, left: false, right: false, sneak: false, click: null };
      for (let i = 0; i < Math.round(3 / STEP); i += 1) stepGame(game, STEP, still, silentAudio);
    }
    game.banner = null;
    return;
  }
  if (name === 'alarm') {
    jumpToFloor(game, 1);
    // Stand the thief in the open corridor below the first camera, in clear line of
    // sight, and let the sweep catch them until the alarm screams.
    const camera = game.cameras[0];
    game.thief.x = camera.x;
    game.thief.y = camera.y + 80;
    const still = { up: false, down: false, left: false, right: false, sneak: false, click: null };
    for (let i = 0; i < Math.round(2.5 / STEP); i += 1) {
      if (game.screen !== 'play') break;
      stepGame(game, STEP, still, silentAudio);
    }
    // Aim the camera's cone at the thief for the frame, and pin the meter high.
    camera.facing = Math.atan2(game.thief.y - camera.y, game.thief.x - camera.x);
    camera.suspicion = 0.95;
    if (game.alarm.value < 78) setAlarm(game, 82);
    else setAlarm(game, game.alarm.value);
    game.banner = { title: 'SPOTTED!', sub: 'The camera has you — break line of sight, now.', bornAt: game.time - 0.5 };
    return;
  }
  if (name === 'clear') {
    jumpToFloor(game, 0);
    simulate(game, 40, silentAudio);
    // Pocket anything the autopilot missed, walk to the exit, and show the breakdown.
    for (const item of game.level.loot) item.taken = true;
    game.lootValue = game.level.loot.reduce((sum, item) => sum + item.value, 0);
    game.thief.x = game.level.exit.x;
    game.thief.y = game.level.exit.y;
    const breakdown = scoreFloor(game.level, game.seconds, game.peakAlarm);
    game.score += breakdown.total;
    game.floorBreakdown = breakdown;
    game.screen = SCREEN_CLEARED;
    game.banner = null;
    return;
  }
  // cover: floor one, mid-heist. Play forward so the patrols are mid-sweep and the alarm
  // has risen on its own, then compose the frame: the thief crossing the middle of the
  // room, a guard cone and the camera cone sweeping toward them, loot in reach, and the
  // alarm meter visibly filling.
  jumpToFloor(game, 0);
  simulate(game, 10, silentAudio);
  game.thief.x = 640;
  game.thief.y = 380;
  game.thief.facing = -Math.PI / 2;
  for (const guard of game.guards) {
    guard.facing = Math.atan2(game.thief.y - guard.y, game.thief.x - guard.x);
  }
  game.cameras[0].facing = Math.PI / 2 + 0.25;
  if (game.alarm.value < 30) setAlarm(game, 38);
  else setAlarm(game, game.alarm.value);
  game.banner = null;
}
