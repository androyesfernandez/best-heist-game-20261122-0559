// Procedural sound: every effect is a short oscillator or noise burst made with WebAudio,
// so the game needs no audio files. Starts on the first user gesture; M mutes.
export function makeAudio() {
  const audio = {
    context: null,
    muted: false,
    lastStepAt: 0,
  };
  return audio;
}

function ensureContext(audio) {
  if (audio.context) return audio.context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audio.context = new Ctor();
  } catch {
    return null;
  }
  return audio.context;
}

/** Unlock audio from a user gesture (click or key press). */
export function unlockAudio(audio) {
  const ctx = ensureContext(audio);
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(audio, frequency, duration, type, volume, slideTo) {
  if (audio.muted) return;
  const ctx = ensureContext(audio);
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playPickup(audio) {
  tone(audio, 880, 0.12, 'sine', 0.16, 1320);
  tone(audio, 1320, 0.18, 'sine', 0.1, 1760);
}

export function playCoin(audio) {
  tone(audio, 2400, 0.07, 'triangle', 0.12, 1800);
}

export function playJammer(audio) {
  tone(audio, 320, 0.35, 'sawtooth', 0.07, 90);
}

export function playAlarmRise(audio) {
  tone(audio, 620, 0.16, 'square', 0.08, 930);
  tone(audio, 930, 0.2, 'square', 0.06, 620);
}

export function playCaught(audio) {
  tone(audio, 220, 0.5, 'sawtooth', 0.14, 55);
  tone(audio, 110, 0.7, 'square', 0.1, 40);
}

export function playClear(audio) {
  tone(audio, 523, 0.14, 'sine', 0.14);
  tone(audio, 659, 0.14, 'sine', 0.14);
  tone(audio, 784, 0.3, 'sine', 0.14);
}

/** Soft footstep ticks while the thief walks, quieter while sneaking. */
export function playStep(audio, sneaking, time) {
  if (time - audio.lastStepAt < (sneaking ? 0.42 : 0.3)) return;
  audio.lastStepAt = time;
  tone(audio, sneaking ? 140 : 190, 0.05, 'sine', sneaking ? 0.03 : 0.05);
}
