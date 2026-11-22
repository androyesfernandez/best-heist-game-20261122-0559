// Bootstrap: wire the canvas, the input and the audio, run the frame loop, and answer the
// ?shot= scenes the screenshot pipeline asks for. A staged scene plays the real rules
// forward from a fresh floor with a simple autopilot, so the frame is what the game
// really looks like — never a mockup.
import { VIEW, KEYS } from './config.js';
import { makeGame, stepGame, startGame, restartFloor, nextFloor, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CAUGHT, SCREEN_CLEARED, SCREEN_WIN } from './state.js';
import { makeInput, moveVector, wasPressed, takeClick } from './input.js';
import { makeAudio, unlockAudio, playJammer } from './audio.js';
import { fireJammer } from './tools.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const game = makeGame();
const input = makeInput(canvas);
const audio = makeAudio();
let lastStatus = '';

function resize() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', resize);
resize();

// Screenshot staging: ?shot=cover|patrol|alarm|clear stages a scene, then signals ready.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  startGame(game);
  stageShot(shotName, game);
  draw(ctx, game, game.time);
  window.__shotReady = true;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (wasPressed(input, KEYS.mute)) {
    audio.muted = !audio.muted;
    game.status = audio.muted ? 'Sound muted.' : 'Sound on.';
  }
  if (wasPressed(input, KEYS.pause) && (game.screen === SCREEN_PLAY || game.screen === SCREEN_PAUSED)) {
    game.screen = game.screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
  }
  if (game.screen === SCREEN_TITLE && (wasPressed(input, KEYS.confirm) || takeClick(input))) {
    unlockAudio(audio);
    startGame(game);
  } else if (game.screen === SCREEN_CAUGHT && wasPressed(input, KEYS.restart)) {
    restartFloor(game);
  } else if (game.screen === SCREEN_CLEARED && wasPressed(input, KEYS.confirm)) {
    nextFloor(game);
  } else if (game.screen === SCREEN_WIN && wasPressed(input, KEYS.restart)) {
    startGame(game);
  }
  if (wasPressed(input, KEYS.jammer) && game.screen === SCREEN_PLAY) {
    if (fireJammer(game.tools, game.cameras, game.thief.x, game.thief.y)) {
      playJammer(audio);
      game.status = 'Jammer fired — the nearest camera is blind.';
    } else {
      game.status = 'No jammer left, or no camera in range.';
    }
  }

  const move = moveVector(input);
  // In screenshot mode the staged frame is frozen: the game does not advance past it.
  if (!shotName) {
    stepGame(game, dt, { up: input.up, down: input.down, left: input.left, right: input.right, sneak: input.sneak, click: takeClick(input) }, audio);
  }
  draw(ctx, game, game.time);

  if (game.status !== lastStatus) {
    statusEl.textContent = game.status;
    lastStatus = game.status;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
