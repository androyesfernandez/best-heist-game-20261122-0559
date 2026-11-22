// Game state: one heist across three floors. Holds the level, the thief, the guards, the
// cameras, the alarm, the tools and the score, and steps them all forward one frame.
import { buildLevel, LEVELS } from './levels.js';
import { makeGuard, stepGuard } from './guards.js';
import { makeCamera, stepCamera } from './cameras.js';
import { makeAlarm, stepAlarm, STAGE_LOCKDOWN } from './alarm.js';
import { makeThief, stepThief, isHiding } from './player.js';
import { makeTools, throwCoin, fireJammer, stepTools } from './tools.js';
import { collectLoot, allLootTaken, scoreFloor } from './loot.js';
import { playPickup, playCoin, playJammer, playAlarmRise, playCaught, playClear, playStep } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEARED = 'cleared';
export const SCREEN_WIN = 'win';

/** A fresh heist, waiting on the title screen. */
export function makeGame() {
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: null,
    thief: null,
    guards: [],
    cameras: [],
    alarm: null,
    tools: null,
    score: 0,
    lootValue: 0,
    seconds: 0,
    peakAlarm: 0,
    time: 0,
    banner: null,
    caughtReason: '',
    floorBreakdown: null,
    status: 'The Gilded Chip — press Enter to start the heist.',
  };
  loadFloor(game, 0);
  game.screen = SCREEN_TITLE;
  return game;
}

function loadFloor(game, index) {
  const level = buildLevel(index);
  game.levelIndex = index;
  game.level = level;
  game.thief = makeThief(level.spawn);
  game.guards = level.guards.map((def, i) => makeGuard(def, i));
  game.cameras = level.cameras.map((def, i) => makeCamera(def, i));
  game.alarm = makeAlarm();
  if (!game.tools) game.tools = makeTools();
  game.seconds = 0;
  game.peakAlarm = 0;
  game.lootValue = 0;
  game.floorBreakdown = null;
  game.caughtReason = '';
  game.banner = {
    title: level.name,
    sub: level.brief,
    bornAt: game.time,
  };
}

/** Start the heist from the title screen. */
export function startGame(game) {
  game.tools = makeTools();
  game.score = 0;
  loadFloor(game, 0);
  game.screen = SCREEN_PLAY;
  game.status = 'Heist started: reach the loot, then the exit.';
}

/** Restart the current floor after being caught. */
export function restartFloor(game) {
  loadFloor(game, game.levelIndex);
  game.screen = SCREEN_PLAY;
}

/** Jump to a floor for screenshot staging (keeps the heist's score and tools). */
export function jumpToFloor(game, index) {
  loadFloor(game, index);
  game.screen = SCREEN_PLAY;
}

/** Move on to the next floor, or to the win screen after the last one. */
export function nextFloor(game) {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = SCREEN_WIN;
    return;
  }
  loadFloor(game, game.levelIndex + 1);
  game.screen = SCREEN_PLAY;
}

/** Step the whole game forward one frame (dt seconds). */
export function stepGame(game, dt, input, audio) {
  game.time += dt;
  if (game.screen !== SCREEN_PLAY) return;

  game.seconds += dt;
  const move = { x: (input.right ? 1 : 0) - (input.left ? 1 : 0), y: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
  stepThief(game.thief, move.x, move.y, input.sneak, dt, game.level);
  if (game.thief.moving) playStep(audio, game.thief.sneaking, game.time);

  // Tools: click throws a coin (the click is taken once per frame by the caller).
  if (input.click) {
    if (throwCoin(game.tools, game.guards, input.click.x, input.click.y, game.time)) {
      playCoin(audio);
    }
  }

  let seenByGuard = false;
  let seenByCamera = false;
  let caught = false;
  for (const guard of game.guards) {
    const result = stepGuard(guard, dt, game.level, game.thief, game.alarm.stage, game.time);
    if (result === 'spotted') seenByGuard = true;
    if (result === 'caught') caught = true;
  }
  for (const camera of game.cameras) {
    const result = stepCamera(camera, dt, game.level, game.thief, game.time);
    if (result === 'spotted') seenByCamera = true;
  }
  stepTools(game.tools, game.time);

  const hidden = isHiding(game.level, game.thief);
  const stageBefore = game.alarm.stage;
  stepAlarm(game.alarm, dt, seenByGuard, seenByCamera, hidden);
  game.peakAlarm = Math.max(game.peakAlarm, game.alarm.value);
  if (game.alarm.stageChanged && game.alarm.stage > stageBefore) playAlarmRise(audio);

  // Loot.
  const gained = collectLoot(game.level, game.thief);
  if (gained > 0) {
    game.lootValue += gained;
    playPickup(audio);
    game.status = `Pocketed $${gained} of loot.`;
  }

  // Caught: the alarm maxed out, or a guard grabbed the thief.
  if (game.alarm.value >= 100 || caught) {
    game.screen = SCREEN_CAUGHT;
    game.caughtReason = game.alarm.value >= 100
      ? 'The alarm hit LOCKDOWN and security swarmed the floor.'
      : 'A guard grabbed you in the open.';
    playCaught(audio);
    game.status = 'Busted — press R to try the floor again.';
    return;
  }

  // Exit: open once every piece of loot is pocketed.
  const exit = game.level.exit;
  if (allLootTaken(game.level) && Math.hypot(game.thief.x - exit.x, game.thief.y - exit.y) < 30) {
    const breakdown = scoreFloor(game.level, game.seconds, game.peakAlarm);
    game.score += breakdown.total;
    game.floorBreakdown = breakdown;
    game.screen = game.levelIndex + 1 >= LEVELS.length ? SCREEN_WIN : SCREEN_CLEARED;
    playClear(audio);
    game.status = `Floor cleared: $${breakdown.total}. Total $${game.score}.`;
  }
}
