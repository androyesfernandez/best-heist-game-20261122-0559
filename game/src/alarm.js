// The alarm meter: one number, 0 to 100, that drives the whole heist's tension. It rises
// while a guard or a camera can see the thief, drains when nobody can, and its stages
// change how the casino reacts: calm, suspicious, then lockdown.
import { ALARM } from './config.js';

export const STAGE_CALM = 0;
export const STAGE_SUSPECT = 1;
export const STAGE_LOCKDOWN = 2;

export function stageOf(value) {
  if (value >= ALARM.lockdownAt) return STAGE_LOCKDOWN;
  if (value >= ALARM.suspectAt) return STAGE_SUSPECT;
  return STAGE_CALM;
}

export function stageLabel(stage) {
  if (stage === STAGE_LOCKDOWN) return 'LOCKDOWN';
  if (stage === STAGE_SUSPECT) return 'SUSPICIOUS';
  return 'CALM';
}

export function stageColour(stage) {
  if (stage === STAGE_LOCKDOWN) return '#ff4d4d';
  if (stage === STAGE_SUSPECT) return '#ffb02e';
  return '#37d67a';
}

/** A fresh alarm meter. */
export function makeAlarm() {
  return { value: 0, stage: STAGE_CALM, stageChanged: false };
}

/**
 * Advance the meter one step. `seenByGuard` / `seenByCamera` say whether any watcher
 * has the thief in its cone right now; `hidden` says the thief is behind cover and
 * still, so the meter drains faster. Returns the new stage.
 */
export function stepAlarm(alarm, dt, seenByGuard, seenByCamera, hidden) {
  let delta = 0;
  if (seenByCamera) delta += ALARM.cameraRate;
  if (seenByGuard) delta += ALARM.guardRate;
  if (delta === 0) {
    delta -= ALARM.decayRate + (hidden ? ALARM.hiddenDecayBonus : 0);
  }
  alarm.value = Math.min(ALARM.max, Math.max(0, alarm.value + delta * dt));
  const stage = stageOf(alarm.value);
  alarm.stageChanged = stage !== alarm.stage;
  alarm.stage = stage;
  return stage;
}
