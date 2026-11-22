// Loot: chip stacks and gold bars scattered over each floor. The exit stays locked until
// every piece is pocketed, and the score counts loot value plus a time bonus and a ghost
// bonus for finishing with the alarm still low.
import { SCORE } from './config.js';

/** True when every piece of loot on this floor has been taken. */
export function allLootTaken(level) {
  return level.loot.every((item) => item.taken);
}

export function lootTakenCount(level) {
  return level.loot.filter((item) => item.taken).length;
}

export function lootValueTaken(level) {
  return level.loot.filter((item) => item.taken).reduce((sum, item) => sum + item.value, 0);
}

/**
 * Pocket any loot within reach of the thief. Returns the value just pocketed (0 if none).
 */
export function collectLoot(level, thief) {
  let gained = 0;
  for (const item of level.loot) {
    if (!item.taken && Math.hypot(item.x - thief.x, item.y - thief.y) < 30) {
      item.taken = true;
      gained += item.value;
    }
  }
  return gained;
}

/**
 * Score a cleared floor: the loot's value, a time bonus against the floor's par time,
 * and a ghost bonus when the alarm never rose past calm.
 */
export function scoreFloor(level, seconds, peakAlarm) {
  const loot = lootValueTaken(level);
  const timeBonus = Math.max(0, Math.round((level.parSeconds - seconds) * SCORE.timeBonusPerSecond));
  const ghost = peakAlarm <= SCORE.ghostAlarmMax ? SCORE.ghostBonus : 0;
  return { loot, timeBonus, ghost, total: loot + timeBonus + ghost };
}
