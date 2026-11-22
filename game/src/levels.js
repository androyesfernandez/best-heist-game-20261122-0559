// The three floors of the Aurum Casino, drawn as tile maps and parsed into walls, cover,
// loot, exits, guard patrols and cameras. One character per tile:
//   # wall   . floor   C cover (slot machine, table, planter: blocks sight and movement)
//   L loot (chip stack)   V vault loot (gold bar, worth more)   E exit   P thief start
// Guard waypoints and cameras are listed per level in tile coordinates.
import { TILE } from './config.js';

const LOOT_CHIPS = 250;
const LOOT_GOLD = 600;

function tileCentre(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function parseMap(rows) {
  const walls = new Set();
  const cover = new Set();
  const loot = [];
  let exit = null;
  let spawn = null;
  rows.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx += 1) {
      const ch = row[tx];
      const key = `${tx},${ty}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') cover.add(key);
      else if (ch === 'L') loot.push({ ...tileCentre(tx, ty), kind: 'chips', value: LOOT_CHIPS, taken: false });
      else if (ch === 'V') loot.push({ ...tileCentre(tx, ty), kind: 'gold', value: LOOT_GOLD, taken: false });
      else if (ch === 'E') exit = { ...tileCentre(tx, ty), tileX: tx, tileY: ty };
      else if (ch === 'P') spawn = tileCentre(tx, ty);
    }
  });
  return { walls, cover, loot, exit, spawn };
}

function patrol(points) {
  return points.map(([tx, ty]) => tileCentre(tx, ty));
}

function camera(tx, ty, baseAngle, sweep) {
  return { ...tileCentre(tx, ty), baseAngle, sweep, phase: 0 };
}

export const LEVELS = [
  {
    name: 'The Casino Floor',
    brief: 'Slip past the floor guards, lift every chip stack, and leave through the service door.',
    seed: 11,
    rows: [
      '################################',
      '#P....CC.......#......CC......E#',
      '#.....CC.......#......CC.......#',
      '#..............................#',
      '#..CC.......####....CC....CC...#',
      '#..CC.......#.......CC....CC...#',
      '#..........#...................#',
      '#....L.....#.....CC.......L....#',
      '#..........#.....CC............#',
      '#..####....#.........####......#',
      '#..#.......#.........#.........#',
      '#..#..CC...#....L....#...CC....#',
      '#..#..CC................CC.....#',
      '#......#.......####............#',
      '#..L...#.......#.....CC....L...#',
      '#......#.......#.....CC........#',
      '#......#.......................#',
      '################################',
    ],
    guards: [
      { waypoints: patrol([[6, 3], [9, 3], [9, 8], [6, 8]]), pause: 1.2 },
      { waypoints: patrol([[22, 10], [28, 10], [28, 16], [20, 16], [20, 12], [22, 12]]), pause: 1.6 },
    ],
    cameras: [camera(16, 1, Math.PI / 2, 0.9)],
    parSeconds: 75,
  },
  {
    name: 'The Vault Corridor',
    brief: 'The gold is behind the cashier cages. Two cameras sweep the corridor — time their cones.',
    seed: 23,
    rows: [
      '################################',
      '#P....#.......CC.......#......E#',
      '#.....#.......CC.......#.......#',
      '#.....#................#.......#',
      '#..CC.#..####......CC..#..CC...#',
      '#..CC.#..#........CC...#..CC...#',
      '#.....#..#.....................#',
      '#..L..#..#....CC......L........#',
      '#.....#..#....CC...............#',
      '#..####..#.........####........#',
      '#.......#.........V....#.......#',
      '#..CC...#....CC........#..CC...#',
      '#..CC........CC........#..CC...#',
      '#.....####.............#.......#',
      '#..L......#....CC......#...L...#',
      '#.........#....CC......#.......#',
      '#.........#....................#',
      '################################',
    ],
    guards: [
      { waypoints: patrol([[2, 2], [2, 14]]), pause: 1.0 },
      { waypoints: patrol([[13, 3], [13, 6], [21, 6], [21, 3]]), pause: 1.4 },
      { waypoints: patrol([[25, 2], [25, 8], [29, 8], [29, 2]]), pause: 1.1 },
    ],
    cameras: [
      camera(12, 1, Math.PI / 2, 1.0),
      camera(25, 16, -Math.PI / 2, 0.9),
    ],
    parSeconds: 95,
  },
  {
    name: 'The Counting Room',
    brief: 'Four guards, three cameras, one counting room. Take the gold and vanish like smoke.',
    seed: 37,
    rows: [
      '################################',
      '#P...CC....#......#....CC.....E#',
      '#....CC....#......#....CC......#',
      '#.........#......#.............#',
      '#..####...#..CC..#..####..CC...#',
      '#..#......#..CC..#..#.....CC...#',
      '#..#..CC..#......#..#..........#',
      '#..#..CC.....L...#..#....L.....#',
      '#..#...........V.#..#..........#',
      '#..#..####....CC.#..####.......#',
      '#.....#...........#......CC....#',
      '#..L..#....CC.....#......CC....#',
      '#.....#....CC...................#',
      '#..####....#......#..####......#',
      '#.........#..CC...#..#....L....#',
      '#..CC....#...CC...#..#.........#',
      '#..CC....#........#............#',
      '################################',
    ],
    guards: [
      { waypoints: patrol([[2, 1], [2, 15]]), pause: 0.9 },
      { waypoints: patrol([[12, 2], [12, 7], [15, 7], [15, 2]]), pause: 1.2 },
      { waypoints: patrol([[29, 3], [29, 9], [24, 9], [24, 3]]), pause: 1.0 },
      { waypoints: patrol([[2, 14], [8, 14]]), pause: 1.3 },
    ],
    cameras: [
      camera(12, 1, Math.PI / 2, 1.1),
      camera(20, 8, Math.PI, 0.8),
      camera(28, 16, -Math.PI / 2, 1.0),
    ],
    parSeconds: 120,
  },
];

/** Build a fresh, mutable level state from a level definition. */
export function buildLevel(index) {
  const def = LEVELS[index];
  const parsed = parseMap(def.rows);
  return {
    index,
    name: def.name,
    brief: def.brief,
    seed: def.seed,
    parSeconds: def.parSeconds,
    walls: parsed.walls,
    cover: parsed.cover,
    loot: parsed.loot.map((item) => ({ ...item })),
    exit: { ...parsed.exit },
    spawn: { ...parsed.spawn },
    guards: def.guards.map((g) => ({
      waypoints: g.waypoints.map((p) => ({ ...p })),
      pause: g.pause,
    })),
    cameras: def.cameras.map((c) => ({ ...c })),
  };
}

/** True when the tile at (tx, ty) blocks movement and sight. */
export function isSolid(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= 32 || ty >= 18) return true;
  return level.walls.has(`${tx},${ty}`) || level.cover.has(`${tx},${ty}`);
}

/** True when the tile at (tx, ty) is cover: it blocks sight but is furniture, not a wall. */
export function isCover(level, tx, ty) {
  return level.cover.has(`${tx},${ty}`);
}
