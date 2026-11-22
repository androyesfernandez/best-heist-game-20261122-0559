// The HUD: a top bar with the floor name, the alarm meter (the game's heartbeat), loot,
// tools and time; and a bottom hint line. Drawn on the canvas so it shows in screenshots.
import { VIEW } from './config.js';
import { stageLabel, stageColour, STAGE_LOCKDOWN } from './alarm.js';
import { lootTakenCount } from './loot.js';

const BAR_X = 430;
const BAR_Y = 14;
const BAR_W = 420;
const BAR_H = 20;

/** Draw the whole HUD over the current frame. */
export function drawHud(ctx, state) {
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, 52);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 52, VIEW.width, 2);

  // Floor name and timer, left.
  ctx.fillStyle = '#f2e6c9';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${state.levelIndex + 1}. ${state.level.name}`, 18, 20);
  ctx.fillStyle = '#9fb3c8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`TIME ${formatTime(state.seconds)}  ·  PAR ${formatTime(state.level.parSeconds)}`, 18, 40);

  // Alarm meter, centre: label, bar with stage ticks, stage word.
  ctx.fillStyle = '#f2e6c9';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', BAR_X - 62, BAR_Y + BAR_H / 2);
  drawAlarmBar(ctx, state.alarm);
  const stage = state.alarm.stage;
  ctx.fillStyle = stageColour(stage);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(stageLabel(stage), BAR_X + BAR_W + 12, BAR_Y + BAR_H / 2);
  if (stage === STAGE_LOCKDOWN) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('! THEY KNOW YOU ARE HERE !', VIEW.width / 2, 74);
  }

  // Loot, tools and score, right.
  const lootCount = lootTakenCount(state.level);
  const lootTotal = state.level.loot.length;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`LOOT ${lootCount}/${lootTotal}  $${state.lootValue.toLocaleString()}`, VIEW.width - 18, 20);
  ctx.fillStyle = '#9fb3c8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`COINS ${state.tools.coins}  ·  JAMMER ${state.tools.jammers} (Q)  ·  SCORE ${state.score.toLocaleString()}`, VIEW.width - 18, 40);

  // Bottom hint line.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
  ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
  ctx.fillStyle = '#8fa3b8';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move  ·  Shift sneak  ·  Click throws a coin  ·  Q jams a camera  ·  P pause  ·  M mute', VIEW.width / 2, VIEW.height - 13);
  ctx.restore();
}

function drawAlarmBar(ctx, alarm) {
  ctx.fillStyle = '#1a2230';
  ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
  const fill = Math.round((BAR_W * alarm.value) / 100);
  const gradient = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
  gradient.addColorStop(0, '#37d67a');
  gradient.addColorStop(0.34, '#37d67a');
  gradient.addColorStop(0.36, '#ffb02e');
  gradient.addColorStop(0.67, '#ffb02e');
  gradient.addColorStop(0.69, '#ff4d4d');
  gradient.addColorStop(1, '#ff4d4d');
  ctx.fillStyle = gradient;
  ctx.fillRect(BAR_X, BAR_Y, fill, BAR_H);
  // Stage ticks at 34 and 67.
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(BAR_X + Math.round(BAR_W * 0.34) - 1, BAR_Y, 2, BAR_H);
  ctx.fillRect(BAR_X + Math.round(BAR_W * 0.67) - 1, BAR_Y, 2, BAR_H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(BAR_X - 0.75, BAR_Y - 0.75, BAR_W + 1.5, BAR_H + 1.5);
  // Numeric readout.
  ctx.fillStyle = '#f2e6c9';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(alarm.value)}`, BAR_X + BAR_W / 2, BAR_Y + BAR_H / 2 + 0.5);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
