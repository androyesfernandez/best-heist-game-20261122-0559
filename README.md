# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/androyesfernandez/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/androyesfernandez/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Gilded Chip** — a top-down casino heist in three floors, drawn entirely in
canvas 2D. You are Sable, a burglar in the Aurum Casino after the tables close: sneak
past patrolling guards whose raycast vision cones sweep the felt, slip under the
wall cameras' sweeping red cones, pocket every chip stack and gold bar, and reach
the green EXIT before the alarm meter maxes out. Being seen fills the alarm — at
SUSPICIOUS the guards hurry, at LOCKDOWN they run you down — and hiding behind the
slot machines lets it fall again. Throw a coin with a click to pull a guard off its
patrol, fire the jammer (Q) to blind the nearest camera, hold Shift to sneak slower
and quieter. Each floor adds guards, cameras and tighter patrols: the Casino Floor
(2 guards, 1 camera), the Vault Corridor (3 guards, 2 cameras), the Counting Room
(4 guards, 3 cameras). Score counts loot value, a time bonus against par, and a
ghost bonus for finishing with the alarm still calm. Procedural WebAudio footsteps,
coin clinks and alarm stings; no assets, no network, keyboard and mouse.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Any static file server pointed at `game/` works just as well — the game is plain HTML and
ES modules with no build step and no network calls. Hand the entry in with
`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ktpzxevq&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
