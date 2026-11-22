// Rendering: the casino floor in canvas 2D — green felt carpet with a gold pattern, marble
// walls, slot machines and tables as cover, sweeping vision cones, the thief, the loot and
// the exit. Screens (title, pause, caught, cleared, win) are drawn here too.
import { VIEW, TILE, COLS, ROWS, GUARD } from './config.js';
import { conePolygon } from './vision.js';
import { CAMERA } from './config.js';
import { drawHud } from './hud.js';
import { allLootTaken } from './loot.js';

const FLOOR_A = '#14532d';
const FLOOR_B = '#0f3d21';
const WALL_TOP = '#3d2f1d';
const WALL_FACE = '#241a10';

/** Draw the current frame for the game state. */
export function draw(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, state.level, time);
  drawExit(ctx, state);
  drawLoot(ctx, state.level, time);
  drawCoins(ctx, state);
  drawCameraCones(ctx, state);
  drawGuardCones(ctx, state);
  drawCameras(ctx, state, time);
  drawGuards(ctx, state, time);
  drawThief(ctx, state, time);
  drawHud(ctx, state);
  drawBanner(ctx, state, time);
  if (state.screen !== 'play') drawScreen(ctx, state);
}

function drawFloor(ctx, level, time) {
  for (let ty = 0; ty < ROWS; ty += 1) {
    for (let tx = 0; tx < COLS; tx += 1) {
      const x = tx * TILE;
      const y = ty * TILE;
      const key = `${tx},${ty}`;
      if (level.walls.has(key)) {
        ctx.fillStyle = WALL_FACE;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(x, y, TILE, 8);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x, y + 8, TILE, 2);
      } else if (level.cover.has(key)) {
        drawCoverTile(ctx, level, tx, ty, x, y, time);
      } else {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(x, y, TILE, TILE);
        // Felt pattern: a small gold diamond at each tile centre.
        ctx.fillStyle = 'rgba(201, 162, 39, 0.10)';
        ctx.beginPath();
        ctx.moveTo(x + TILE / 2, y + 12);
        ctx.lineTo(x + TILE - 12, y + TILE / 2);
        ctx.lineTo(x + TILE / 2, y + TILE - 12);
        ctx.lineTo(x + 12, y + TILE / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawCoverTile(ctx, level, tx, ty, x, y, time) {
  // Slot machines and gaming tables: dark wood with a glowing top.
  ctx.fillStyle = '#1c2433';
  ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = '#2b3a55';
  ctx.fillRect(x + 3, y + 3, TILE - 6, 10);
  const glow = 0.5 + 0.3 * Math.sin(time * 2 + (tx * 7 + ty * 3));
  ctx.fillStyle = `rgba(255, 183, 77, ${0.25 + glow * 0.25})`;
  ctx.fillRect(x + 9, y + 14, TILE - 18, 12);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 9px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$$$', x + TILE / 2, y + 20);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
}

function drawExit(ctx, state) {
  const exit = state.level.exit;
  const open = allLootTaken(state.level);
  const pulse = open ? 0.55 + 0.35 * Math.sin(state.time * 4) : 0.18;
  ctx.save();
  ctx.fillStyle = open ? `rgba(55, 214, 122, ${pulse})` : 'rgba(120, 130, 140, 0.25)';
  ctx.beginPath();
  ctx.arc(exit.x, exit.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = open ? '#37d67a' : '#8a94a3';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = open ? '#d7ffe8' : '#c8ccd2';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', exit.x, exit.y - 1);
  if (!open) {
    const left = state.level.loot.length - state.level.loot.filter((l) => l.taken).length;
    ctx.fillStyle = '#f2e6c9';
    ctx.font = '11px Georgia, serif';
    // Keep the label inside the frame when the exit sits near the right edge.
    const labelX = Math.min(exit.x, VIEW.width - 78);
    ctx.fillText(`LOCKED · ${left} LOOT LEFT`, labelX, exit.y + 40);
  }
  ctx.restore();
}

function drawLoot(ctx, level, time) {
  for (const item of level.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 3 + item.x) * 2;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    // Glow halo so loot reads at a glance.
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    glow.addColorStop(0, 'rgba(255, 215, 106, 0.55)');
    glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === 'gold') {
      ctx.fillStyle = '#ffd76a';
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-13, 7);
      ctx.lineTo(-8, -7);
      ctx.lineTo(8, -7);
      ctx.lineTo(13, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6d1f';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GOLD', 0, 1);
    } else {
      // A stack of casino chips.
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#f2e6c9';
        ctx.beginPath();
        ctx.ellipse(0, 6 - i * 5, 12, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a1f16';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${item.value}`, 0, -16);
    }
    ctx.restore();
  }
}

function drawCoins(ctx, state) {
  for (const coin of state.tools.thrown) {
    const age = state.time - coin.bornAt;
    const radius = 4 + age * 10;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 215, 106, ${Math.max(0, 0.9 - age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCameraCones(ctx, state) {
  for (const camera of state.cameras) {
    if (camera.jammedLeft > 0) continue;
    const watcher = {
      x: camera.x, y: camera.y, facing: camera.facing,
      range: CAMERA.viewRange, halfAngle: CAMERA.viewHalfAngle,
    };
    const poly = conePolygon(state.level, watcher, 22);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 77, 77, 0.20)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawGuardCones(ctx, state) {
  for (const guard of state.guards) {
    const watcher = {
      x: guard.x, y: guard.y, facing: guard.facing,
      range: GUARD.viewRange, halfAngle: GUARD.viewHalfAngle,
    };
    const poly = conePolygon(state.level, watcher, 22);
    const alert = guard.suspicion > 0.35 || guard.mode === 'chase';
    ctx.save();
    ctx.fillStyle = alert ? 'rgba(255, 77, 77, 0.30)' : 'rgba(255, 214, 90, 0.20)';
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alert ? 'rgba(255, 77, 77, 0.55)' : 'rgba(255, 214, 90, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawCameras(ctx, state, time) {
  for (const camera of state.cameras) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    // Ceiling mount.
    ctx.fillStyle = '#39445a';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7.5, -7.5, 15, 15);
    // Lens pointing along the sweep.
    ctx.rotate(camera.facing);
    ctx.fillStyle = camera.jammedLeft > 0 ? '#5a6478' : '#ff4d4d';
    ctx.beginPath();
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Jammed: a static spark and a label.
    if (camera.jammedLeft > 0) {
      ctx.save();
      ctx.fillStyle = '#9fb3c8';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`JAMMED ${Math.ceil(camera.jammedLeft)}s`, camera.x, camera.y - 16);
      ctx.restore();
    } else if (camera.suspicion > 0.05) {
      drawSuspicionArc(ctx, camera.x, camera.y, camera.suspicion, time);
    }
  }
}

function drawGuards(ctx, state, time) {
  for (const guard of state.guards) {
    const bob = Math.sin(time * 6 + guard.id * 2) * 1.5;
    ctx.save();
    ctx.translate(guard.x, guard.y + bob);
    // Navy uniform, gold buttons, peaked cap.
    ctx.fillStyle = '#1d2f52';
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(0, -GUARD.radius + 2, 6, Math.PI, 0);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#f2e6c9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(guard.facing) * 18, Math.sin(guard.facing) * 18);
    ctx.stroke();
    ctx.restore();
    if (guard.suspicion > 0.05) drawSuspicionArc(ctx, guard.x, guard.y, guard.suspicion, time);
    if (guard.mode === 'chase') {
      ctx.save();
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 24);
      ctx.restore();
    }
  }
}

function drawSuspicionArc(ctx, x, y, amount, time) {
  ctx.save();
  ctx.strokeStyle = amount > 0.8 ? '#ff4d4d' : '#ffb02e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 21, -Math.PI / 2, -Math.PI / 2 + amount * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawThief(ctx, state, time) {
  const thief = state.thief;
  const bob = thief.moving ? Math.sin(thief.stepPhase) * 1.5 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(thief.x, thief.y + bob);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dark coat, gold mask, burglar's cap.
  ctx.fillStyle = '#15181f';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(0, -4, 7, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#15181f';
  ctx.beginPath();
  ctx.arc(-2.5, -1, 1.6, 0, Math.PI * 2);
  ctx.arc(2.5, -1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = '#f2e6c9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(thief.facing) * 16, Math.sin(thief.facing) * 16);
  ctx.stroke();
  ctx.restore();
  if (thief.sneaking) {
    ctx.save();
    ctx.fillStyle = '#9fb3c8';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', thief.x, thief.y - 22);
    ctx.restore();
  }
}

function drawBanner(ctx, state, time) {
  if (!state.banner) return;
  const age = time - state.banner.bornAt;
  if (age > 2.6) return;
  const alpha = age < 0.2 ? age / 0.2 : age > 2.1 ? (2.6 - age) / 0.5 : 1;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  ctx.fillRect(VIEW.width / 2 - 260, 84, 520, 54);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(VIEW.width / 2 - 260, 84, 520, 54);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.banner.title, VIEW.width / 2, 103);
  ctx.fillStyle = '#f2e6c9';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(state.banner.sub, VIEW.width / 2, 124);
  ctx.restore();
}

function drawScreen(ctx, state) {
  const screen = state.screen;
  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (screen === 'title') {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText('THE GILDED CHIP', VIEW.width / 2, 168);
    ctx.fillStyle = '#f2e6c9';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('A casino heist in three floors — steal the Aurum, leave unseen.', VIEW.width / 2, 214);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(VIEW.width / 2 - 120, 244, 240, 2);
    ctx.fillStyle = '#e8ddc0';
    ctx.font = '16px Georgia, serif';
    const lines = [
      'You are Sable, burglar of the Aurum Casino.',
      'Cross each floor, dodge the guards’ vision cones',
      'and the sweeping cameras, pocket every chip stack',
      'and gold bar, then slip out the green EXIT.',
      '',
      'The ALARM rises when you are seen — at LOCKDOWN',
      'the guards run you down. Hide behind the machines',
      'to let it fall. Click throws a coin to lure a guard;',
      'Q jams the nearest camera. Shift sneaks, slow and quiet.',
    ];
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 286 + i * 26));
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('Press ENTER or click to start the heist', VIEW.width / 2, 580);
    ctx.fillStyle = '#8fa3b8';
    ctx.font = '13px Georgia, serif';
    ctx.fillText('WASD / arrows move · Shift sneak · Click throws a coin · Q jams a camera · P pause · M mute', VIEW.width / 2, 616);
  } else if (screen === 'paused') {
    ctx.fillStyle = '#f2e6c9';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('PAUSED', VIEW.width / 2, 320);
    ctx.font = '17px Georgia, serif';
    ctx.fillText('Press P or Escape to keep sneaking · R restarts this floor', VIEW.width / 2, 372);
  } else if (screen === 'caught') {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('BUSTED!', VIEW.width / 2, 300);
    ctx.fillStyle = '#f2e6c9';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(state.caughtReason || 'The guards caught up with you.', VIEW.width / 2, 352);
    ctx.font = '16px Georgia, serif';
    ctx.fillText('Press R to try this floor again', VIEW.width / 2, 400);
  } else if (screen === 'cleared') {
    const b = state.floorBreakdown;
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('FLOOR CLEARED', VIEW.width / 2, 240);
    ctx.fillStyle = '#f2e6c9';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(`${state.level.name} — you slipped out with the loot.`, VIEW.width / 2, 292);
    if (b) {
      ctx.font = '17px Georgia, serif';
      ctx.fillText(`Loot $${b.loot.toLocaleString()}  ·  Time bonus $${b.timeBonus.toLocaleString()}${b.ghost ? `  ·  GHOST bonus $${b.ghost.toLocaleString()}` : ''}`, VIEW.width / 2, 336);
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.fillText(`Floor score $${b.total.toLocaleString()}  ·  Total $${state.score.toLocaleString()}`, VIEW.width / 2, 376);
    }
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('Press ENTER for the next floor', VIEW.width / 2, 440);
  } else if (screen === 'win') {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('THE PERFECT HEIST', VIEW.width / 2, 280);
    ctx.fillStyle = '#f2e6c9';
    ctx.font = '19px Georgia, serif';
    ctx.fillText('Three floors, every chip and gold bar, and the Aurum never knew you were there.', VIEW.width / 2, 332);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(`Final score $${state.score.toLocaleString()}`, VIEW.width / 2, 384);
    ctx.fillStyle = '#37d67a';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText('Press R to run it again', VIEW.width / 2, 440);
  }
  ctx.restore();
}
