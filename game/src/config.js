// Tunable constants for The Gilded Chip: canvas size, movement speeds, vision ranges,
// alarm rates and scoring. One place to tune the feel of the whole heist.
export const VIEW = { width: 1280, height: 720 };
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;

// The thief (Sable) walks briskly, sneaks at half pace, and is a small circle.
export const THIEF = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 92,
  // Detection fills slower while sneaking: the thief is harder to notice.
  sneakSpotFactor: 0.45,
};

// A guard walks its patrol, hurries when suspicious, and runs when the alarm is high.
export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  suspectSpeed: 108,
  chaseSpeed: 168,
  // How far a guard can see, and how wide its cone opens.
  viewRange: 235,
  viewHalfAngle: 0.62,
  // Seconds of being watched before the guard is sure it saw the thief.
  spotTime: 0.9,
  // How close a guard must get to grab the thief.
  catchRange: 26,
};

// A wall camera sweeps its cone back and forth and spots faster than a guard.
export const CAMERA = {
  viewRange: 260,
  viewHalfAngle: 0.5,
  sweepSpeed: 0.55,
  spotTime: 0.65,
};

// The alarm meter: 0 calm, 100 busted. Stages change guard behaviour.
export const ALARM = {
  max: 100,
  suspectAt: 34,
  lockdownAt: 67,
  // Points per second while a guard has the thief in its cone.
  guardRate: 26,
  // Points per second while a camera has the thief in its cone.
  cameraRate: 38,
  // The meter drains when nobody can see the thief.
  decayRate: 7,
  // Extra drain while the thief hides behind cover and stands still.
  hiddenDecayBonus: 6,
};

// Tools: coins to throw, jammers to blind cameras.
export const TOOLS = {
  coinsStart: 4,
  jammersStart: 2,
  jammerSeconds: 8,
  coinLureRadius: 170,
  coinInvestigateSeconds: 4,
};

// Scoring: loot value, plus a time bonus and a ghost bonus for staying unseen.
export const SCORE = {
  timeBonusPerSecond: 12,
  ghostBonus: 500,
  ghostAlarmMax: 33,
};

export const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  sneak: ['ShiftLeft', 'ShiftRight'],
  jammer: ['KeyQ'],
  restart: ['KeyR'],
  mute: ['KeyM'],
  pause: ['KeyP', 'Escape'],
  confirm: ['Enter', 'Space'],
};
