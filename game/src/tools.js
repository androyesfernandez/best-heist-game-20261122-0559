// Tools: a pocket of coins to throw and a jammer that blinds cameras. Both are limited,
// so the thief spends them where a patrol or a sweeping cone would otherwise block the way.
import { TOOLS } from './config.js';
import { lureGuards } from './guards.js';
import { jamNearestCamera } from './cameras.js';

/** A fresh tool belt for a new heist. */
export function makeTools() {
  return {
    coins: TOOLS.coinsStart,
    jammers: TOOLS.jammersStart,
    // Thrown coins lying on the floor, still ringing.
    thrown: [],
  };
}

/**
 * Throw a coin to (x, y): the nearest guard in earshot leaves its patrol to investigate.
 * Returns true when a coin was actually thrown.
 */
export function throwCoin(tools, guards, x, y, time) {
  if (tools.coins <= 0) return false;
  tools.coins -= 1;
  tools.thrown.push({ x, y, bornAt: time, life: 1.6 });
  lureGuards(guards, x, y, TOOLS.coinLureRadius);
  return true;
}

/** Fire the jammer: blind the nearest camera for a few seconds. Returns true if it worked. */
export function fireJammer(tools, cameras, x, y) {
  if (tools.jammers <= 0) return false;
  const hit = jamNearestCamera(cameras, x, y, TOOLS.jammerSeconds);
  if (!hit) return false;
  tools.jammers -= 1;
  return true;
}

/** Fade out thrown coins whose ring has died. */
export function stepTools(tools, time) {
  tools.thrown = tools.thrown.filter((coin) => time - coin.bornAt < coin.life);
}
