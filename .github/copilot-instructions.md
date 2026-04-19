# Copilot Instructions — Moon Lander

## Project Overview

A browser-based educational game where players write JavaScript to control a Falcon 9-inspired rocket and land it safely on the moon. The player's code runs in a sandboxed `<iframe>` and manipulates three control properties on a `falcon9` object (`fireBoosterEngine`, `rotateLeft`, `rotateRight`) each frame to control the descent.

**Two-page Vite build**:
- `index.html` — editor UI (Monaco Editor + level selector + Run button)
- `frames/game.html` — minimal canvas page loaded as an iframe; user code is injected into this page at runtime

---

## Tech Stack

| Category | Tool |
|---|---|
| Language | TypeScript 5.4 (strict mode, ESNext target) |
| Build | Vite 5.2 (dual entry points) |
| Testing | Vitest 4.1 (Node environment, no DOM) |
| Code editor | Monaco Editor 0.36 (AMD loaded from `/vs/`) |
| Rendering | Browser Canvas 2D API |
| Module resolution | `"bundler"` (tsconfig) |

---

## Repository Layout

```
src/
├── game.ts          — Iframe bootstrap: creates GameEngine, wires falcon9 proxy
├── editor.ts        — Main page: Monaco, level selector, Run/Solution buttons
├── levels.ts        — All 10 level definitions (config + starter + solution strings)
├── simulator.ts     — Headless physics runner (DOM-free, used by tests)
├── levels.test.ts   — Integration tests via simulator
│
├── engine/
│   ├── game-engine.ts   — Game loop, entity manager, camera, lifecycle hooks
│   ├── entity.ts        — Entity interface (update/render/destroy)
│   ├── physics.ts       — Pure physics functions shared with simulator
│   ├── level.ts         — LevelConfig interface + LevelManager class
│   ├── input-manager.ts — Keyboard event system
│   ├── utils.ts         — getRandomInt / randomFloat helpers
│   └── vector2.ts       — Immutable 2D vector class
│
└── entities/
    ├── falcon-9.ts      — Player rocket (physics state + Canvas rendering)
    ├── moon-surface.ts  — Procedural terrain (craters + rocks)
    └── starfield.ts     — Parallax star background
```

---

## Key Interfaces & Types

### `Entity`
All game objects implement this interface — no base class or inheritance:
```ts
interface Entity {
  update(dt: number, game: GameEngine): void;
  render(ctx: CanvasRenderingContext2D, game: GameEngine): void;
  destroy?(): void;
}
```

### `LevelConfig`
Declarative level data consumed by both `GameEngine` and the headless `simulate()` function:
```ts
interface LevelConfig {
  id: string;
  gravity: number;
  fuel: number;
  fuelConsumptionRate: number;
  enginePower: number;
  canReignite: boolean;
  maxLandingVelocity: number;
  landingPad?: { width: number; centerX?: number };
  minThrottle?: number;        // forces pulse-based burns
  initialAngle?: number;
  initialSpin?: number;
  initialVelocity?: { x: number; y: number };
  initialPosition?: { x: number; y: number };
}
```

### `LevelData`
Wraps `LevelConfig` with displayable/executable code strings:
```ts
interface LevelData {
  config: LevelConfig;
  starter: string;    // shown in Monaco on first visit
  solution: string;   // revealed on "Show Solution"
}
```

### `SimState`
Flat physics snapshot used by the headless simulator — mirrors `Falcon9`'s internal state field-for-field.

### `Vector2`
Immutable 2D vector. Operations (`add`, `scale`) return new instances. Use `clone()` for safe copies.

---

## Architecture Rules

### Physics layer (`engine/physics.ts`)
- Contains **only pure functions** — zero DOM dependencies, no classes
- Shared between `Falcon9` (browser) and the headless `simulate()` (tests)
- All functions are **dt-normalised**: `t = dt / 16.67` (60 fps baseline)
- Do not add DOM references or side effects here

### Entity pattern
- Implement the `Entity` interface; do not extend a base class
- `GameEngine` is passed to `update()` and `render()` via dependency injection
- Entities register themselves by being pushed to `GameEngine._entities[]`
- Never let entities directly reference each other — use the `game` object if cross-entity data is needed

### Engine (`engine/game-engine.ts`)
- `dt` is capped at `MAX_DT = 100ms` to prevent physics spirals after tab-switch
- Camera: horizontal dead-zone scroll (30%–70% of canvas width)
- Lifecycle hooks: `onLevelLoad(level, index)` and `onEnd(won, details)` — override in `game.ts`

### Cross-frame communication
- The game iframe posts `{ type: "levelLoaded", index }` to the parent via `postMessage`
- The editor (`editor.ts`) listens for this to keep the level selector in sync on auto-advance
- User code is injected as a `<script>` tag in the iframe `<head>`, containing `window.__startLevel = N;` followed by the user's code

### Level code strings
- `starter` and `solution` fields in `LEVELS[]` are TypeScript template literals stored as data
- `levels.test.ts` evaluates them at test time via `new Function(...)` — keep them valid JS

---

## Coding Conventions

- **Pure functions over classes** for logic that requires testing without a DOM
- **Strict TypeScript** throughout — no `any`, no `// @ts-ignore` without justification
- **Interface-first** design — define the interface before the implementation
- **Composition over inheritance** — no class hierarchies; use interfaces and constructor injection
- **No OOP inheritance** — `entity.ts` uses an `interface`, not an `abstract class`
- Use `Vector2` for all 2D coordinate/velocity/force values; avoid raw `{ x, y }` object literals in physics code
- Keep `engine/` generic and reusable; put game-specific logic in `entities/` or `src/` root files
- `levels.ts` is **data-only** — no logic, no imports from the engine

---

## Physics Conventions

- Physics step size is normalised to 60fps: multiply raw values by `t = dt / 16.67`
- Landing is detected when the ship's bounding-box bottom edge reaches `groundY`
- Landing velocity = `|velY| + |velX|` (combined); compare against `config.maxLandingVelocity`
- `won` requires: velocity < `maxLandingVelocity` AND position within `landingPad` bounds (if defined)
- Rotational drag and angular dynamics are in `stepAngle()`; thrust vector is in `stepVelocity()`

---

## Testing

- **Framework**: Vitest, Node environment — no browser/DOM needed
- **All tests use the simulator** (`src/simulator.ts`) — never import `Falcon9`, `GameEngine`, or canvas APIs in tests
- `simulate(level, controller, opts) → SimResult` — runs up to 18,000 frames (~5 min at 60fps)
- Controller function signature: `(state: SimState) => void` — mutate state fields directly
- Use `passRate` assertions for non-deterministic levels (L3, L7): require `>= 0.8` over 10 trials
- Use strict `passRate === 1` for deterministic levels

**Run tests:**
```bash
npm test          # single run
npm run test:watch  # watch mode
```

---

## Build & Dev Commands

```bash
npm run dev       # hot-reload dev server on port 3000 (alias: npm start)
npm run build     # tsc --noEmit (type check) then vite build
npm run preview   # serve production build on port 3000
npm test          # vitest single run
npm run test:watch  # vitest watch mode
```

**Vite build notes:**
- Output goes to the project root (`.`) — `emptyOutDir: false` preserves `/vs/` Monaco assets
- Monaco is excluded from `optimizeDeps` due to its AMD module format
- Two entry points: `index.html` and `frames/game.html`

---

## Level Design Guidelines

When adding or modifying levels in `src/levels.ts`:

1. Add a `LevelConfig` with a unique `id` (e.g. `"level-11"`)
2. Write a `starter` template with `// TODO` comments guiding the player
3. Write a `solution` that passes the simulator test
4. Add a corresponding test case in `levels.test.ts` using `simulate()`
5. Levels should be progressively harder — consult the existing 10-level progression:
   - L1–L2: basic control
   - L3–L4: stabilisation (PD controller patterns)
   - L5: spatial targeting (landing pad)
   - L6–L7: resource constraints (fuel, minThrottle)
   - L8–L10: precision + advanced manoeuvres (hoverslam)

---

## User Code Sandbox

The three control flags on the `falcon9` object:
- `falcon9.fireBoosterEngine` — main engine (thrust upward along rocket axis), boolean
- `falcon9.rotateLeft` — rotates rocket counter-clockwise, 0–1 (proportional) or boolean
- `falcon9.rotateRight` — rotates rocket clockwise, 0–1 (proportional) or boolean

Read-only state accessible in user code: `falcon9.velY`, `falcon9.velX`, `falcon9.angle`, `falcon9.spin`, `falcon9.fuel`, `falcon9.posX`, `falcon9.posY`

The `game` object exposes: `game.groundY`, `game.width`, `game.height`

User code runs once per frame inside a `setInterval`-like wrapper injected by the game bootstrap.

---

## localStorage Keys

Editor persists per-level code under:
```
lander:code:level{n}   (e.g. "lander:code:level1")
```
Falls back to `LEVELS[n].starter` when no saved code exists.
