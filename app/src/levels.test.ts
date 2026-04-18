/**
 * Integration tests — Level solutions (src/levels.ts)
 *
 * Each test:
 *  1. Takes the reference solution code string from LEVELS[n].solution
 *  2. Compiles it into a ControllerFn by exposing a minimal falcon9-like state
 *     proxy that maps the sandbox globals (falcon9.*, game.*) onto SimState
 *  3. Runs the headless simulator for up to 18 000 frames (~5 min at 60fps)
 *  4. Asserts the ship landed, won, stayed on pad (when required), and did not
 *     exceed the fuel budget
 *
 * The simulator is deterministic for levels with fixed spawn parameters; levels
 * with random spawn (L3's random angle, L6's random position) run 5 trials and
 * require a ≥80% pass rate.
 *
 * Canvas-size coverage
 * --------------------
 * The game iframe fills one half of the player's browser window, so its pixel
 * dimensions vary widely across devices and layouts.  Every solution is tested
 * against a representative matrix of canvas sizes (CANVAS_PROFILES) in addition
 * to the default 800×600 baseline.  This catches controller logic that
 * hard-codes pixel values or relies on canvas geometry implicitly.
 */

import { describe, it, expect } from "vitest";
import { LEVELS } from "./levels.js";
import { simulate, type SimState, type ControllerFn } from "./simulator.js";

// ── Canvas size profiles ──────────────────────────────────────────────────────
//
// Each entry represents a plausible browser game-panel size a player might see.
// Range covers the default simulator baseline (800×600) through a 1440p
// half-screen, in both landscape and near-square aspect ratios.
const CANVAS_PROFILES: Array<{ label: string; w: number; h: number }> = [
  { label: "800×600  (baseline)",           w:  800, h:  600 },
  { label: "640×700  (compact laptop)",     w:  640, h:  700 },
  { label: "720×800  (small laptop)",       w:  720, h:  800 },
  { label: "900×750  (medium laptop)",      w:  900, h:  750 },
  { label: "1000×850 (large laptop)",       w: 1000, h:  850 },
  { label: "1100×900 (1080p half-screen)",  w: 1100, h:  900 },
  { label: "1280×960 (1440p half-screen)",  w: 1280, h:  960 },
];

// ── Solution compiler ─────────────────────────────────────────────────────────
//
// The solution strings reference `falcon9` and `game` as globals and use
// setInterval for a game loop. We evaluate them in a controlled scope where:
//
//   falcon9  → proxy onto SimState (posX/posY mapped to position.x/y etc.)
//   game     → minimal stub with canvas and levels.current
//
// setInterval calls are collected; the returned ControllerFn calls them all
// synchronously once per simulated frame — matching the real 16ms interval.

function compileController(
  solutionCode: string,
  levelIndex: number,
  canvasWidth = 800,
  canvasHeight = 600,
): ControllerFn {
  const intervals: Array<() => void> = [];
  let initialised = false;

  // Stable nested objects — reassigned each frame to point at current state
  // so that closures captured in the solution code always see fresh values.
  let _state: SimState;

  const velocity = {
    get x() { return _state.velX; },
    set x(v: number) { _state.velX = v; },
    get y() { return _state.velY; },
    set y(v: number) { _state.velY = v; },
  };

  const position = {
    get x() { return _state.posX; },
    set x(v: number) { _state.posX = v; },
    get y() { return _state.posY; },
  };

  const falcon9 = {
    get fireBoosterEngine() { return _state.fireBoosterEngine; },
    set fireBoosterEngine(v: boolean) { _state.fireBoosterEngine = v; },
    get fireLeftThruster() { return _state.fireLeftThruster; },
    set fireLeftThruster(v: boolean) { _state.fireLeftThruster = v; },
    get fireRightThruster() { return _state.fireRightThruster; },
    set fireRightThruster(v: boolean) { _state.fireRightThruster = v; },
    get velocity() { return velocity; },
    get position() { return position; },
    get angle() { return _state.angle; },
    get rotationalMomentum() { return _state.rotMomentum; },
    get fuelRemaining() { return _state.fuelRemaining; },
    get altitude() { return (_state as SimState & { altitude: number }).altitude; },
    registerController: (fn: () => void) => { intervals.push(fn); },
  };

  const level = LEVELS[levelIndex].config;
  const game = {
    canvas: { width: canvasWidth, height: canvasHeight },
    levels: { current: level },
  };

  const fakeSetInterval = (fn: () => void) => { intervals.push(fn); };

  return (state: SimState) => {
    _state = state;

    if (!initialised) {
      initialised = true;
      // eslint-disable-next-line no-new-func
      const fn = new Function("falcon9", "game", "setInterval", solutionCode);
      fn(falcon9, game, fakeSetInterval);
    }

    for (const cb of intervals) cb();
  };
}

// ── Trial runner ──────────────────────────────────────────────────────────────

interface TrialOptions {
  trials?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

function runTrials(
  levelIndex: number,
  opts: TrialOptions = {},
) {
  const { trials = 1, canvasWidth = 800, canvasHeight = 600 } = opts;
  const { config, solution } = LEVELS[levelIndex];

  let passed = 0;
  let maxFrames = 0;
  for (let t = 0; t < trials; t++) {
    const controller = compileController(solution, levelIndex, canvasWidth, canvasHeight);
    const result = simulate(config, controller, { canvasWidth, canvasHeight });
    if (result.won) passed++;
    if (result.frames > maxFrames) maxFrames = result.frames;
  }

  const passRate = passed / trials;
  return { passed, trials, passRate, maxFrames };
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas-size sweep — all solutions must pass at every viewport profile
// ─────────────────────────────────────────────────────────────────────────────

describe.each(CANVAS_PROFILES)(
  "Level solutions — $label",
  ({ w, h }) => {
    it("L0 — Tutorial: auto-pilot solution lands", () => {
      expect(runTrials(0, { canvasWidth: w, canvasHeight: h }).passRate).toBe(1);
    });

    it("L1 — Hello, Moon: solution lands", () => {
      expect(runTrials(1, { canvasWidth: w, canvasHeight: h }).passRate).toBe(1);
    });

    it("L2 — Tilted: solution corrects angle and lands", () => {
      expect(runTrials(2, { canvasWidth: w, canvasHeight: h }).passRate).toBe(1);
    });

    it("L3 — Steady the Ship: solution wins ≥80% of random spawns", () => {
      const { passRate } = runTrials(3, { trials: 10, canvasWidth: w, canvasHeight: h });
      expect(passRate).toBeGreaterThanOrEqual(0.8);
    });

    it("L4 — Lateral Drift: solution cancels drift and lands", () => {
      const { passRate, maxFrames } = runTrials(4, { canvasWidth: w, canvasHeight: h });
      expect(passRate).toBe(1);
      // Guard against solutions that "work" by launching to space and falling back.
      // A direct descent from y=80 should land in well under 2 000 frames.
      expect(maxFrames).toBeLessThan(2_000);
    });

    it("L5 — Bullseye: solution hits and lands ON the pad", () => {
      const { config, solution } = LEVELS[5];
      const controller = compileController(solution, 5, w, h);
      const result = simulate(config, controller, { canvasWidth: w, canvasHeight: h });
      expect(result.won).toBe(true);
      expect(result.onPad).toBe(true);
    });

    it("L6 — On a Budget: solution wins within fuel budget", () => {
      const { config, solution } = LEVELS[6];
      const controller = compileController(solution, 6, w, h);
      const result = simulate(config, controller, { canvasWidth: w, canvasHeight: h });
      expect(result.won).toBe(true);
      expect(result.fuelUsed).toBeLessThan(config.fuel as number);
    });

    it("L7 — Minimum Power: solution wins ≥80% of spawns", () => {
      const { passRate } = runTrials(7, { trials: 3, canvasWidth: w, canvasHeight: h });
      expect(passRate).toBeGreaterThanOrEqual(0.8);
    });

    it("L8 — Precision Burn: solution hits the 40px pad", () => {
      const { config, solution } = LEVELS[8];
      const controller = compileController(solution, 8, w, h);
      const result = simulate(config, controller, { canvasWidth: w, canvasHeight: h });
      expect(result.won).toBe(true);
      expect(result.onPad).toBe(true);
    });

    it("L9 — The Long Fall: solution wins within fuel budget", () => {
      const { config, solution } = LEVELS[9];
      const controller = compileController(solution, 9, w, h);
      const result = simulate(config, controller, { canvasWidth: w, canvasHeight: h });
      expect(result.won).toBe(true);
      expect(result.fuelUsed).toBeLessThan(config.fuel as number);
    });

    it("L10 — Hoverslam: solution wins within fuel budget", () => {
      const { config, solution } = LEVELS[10];
      const controller = compileController(solution, 10, w, h);
      const result = simulate(config, controller, { canvasWidth: w, canvasHeight: h });
      expect(result.won).toBe(true);
      expect(result.fuelUsed).toBeLessThan(config.fuel as number);
    });
  },
);

// ── Regression: no solution times out ────────────────────────────────────────

it("all solutions land within 18 000 frames", () => {
  for (let i = 0; i < LEVELS.length; i++) {
    const { config, solution } = LEVELS[i];
    const controller = compileController(solution, i);
    const result = simulate(config, controller, { maxFrames: 18_000 });
    expect(result.reason, `${config.id} timed out`).toBe("landed");
  }
});
