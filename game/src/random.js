// A tiny seeded random generator (mulberry32) so a level and its screenshot scenes
// play the same way every time for the same seed. No Math.random in game logic.
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a value in [min, max) from a seeded generator. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one item from an array with a seeded generator. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
