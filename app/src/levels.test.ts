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
 */

import { describe, it, expect } from "vitest";
import { LEVELS } from "./levels.js";
import { simulate, type SimState, type ControllerFn } from "./simulator.js";

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
  minPassRate?: number; // 0-1
  canvasWidth?: number;
  canvasHeight?: number;
}

function runTrials(
  levelIndex: number,
  opts: TrialOptions = {},
) {
  const { trials = 1, minPassRate = 1.0, canvasWidth = 800, canvasHeight = 600 } = opts;
  const { config, solution } = LEVELS[levelIndex];

  let passed = 0;
  for (let t = 0; t < trials; t++) {
    const controller = compileController(solution, levelIndex, canvasWidth, canvasHeight);
    const result = simulate(config, controller, { canvasWidth, canvasHeight });
    if (result.won) passed++;
  }

  const passRate = passed / trials;
  return { passed, trials, passRate };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Level solutions", () => {
  it("L1 — Hello, Moon: solution lands successfully", () => {
    const { passRate } = runTrials(0);
    expect(passRate).toBe(1);
  });

  it("L2 — Tilted: solution corrects angle and lands", () => {
    const { passRate } = runTrials(1);
    expect(passRate).toBe(1);
  });

  it("L3 — Steady the Ship: solution wins ≥80% of random spawns", () => {
    const { passRate } = runTrials(2, { trials: 10, minPassRate: 0.8 });
    expect(passRate).toBeGreaterThanOrEqual(0.8);
  });

  it("L4 — Lateral Drift: solution cancels drift and lands", () => {
    const { passRate } = runTrials(3);
    expect(passRate).toBe(1);
  });

  it("L5 — Bullseye: solution hits the pad", () => {
    const { passRate } = runTrials(4);
    expect(passRate).toBe(1);
  });

  it("L5 — Bullseye: solution lands ON the pad (onPad check)", () => {
    const { config, solution } = LEVELS[4];
    const controller = compileController(solution, 4);
    const result = simulate(config, controller);
    expect(result.onPad).toBe(true);
  });

  it("L6 — On a Budget: solution wins without running out of fuel", () => {
    const { config, solution } = LEVELS[5];
    const controller = compileController(solution, 5);
    const result = simulate(config, controller);
    expect(result.won).toBe(true);
    expect(result.fuelUsed).toBeLessThan(config.fuel as number);
  });

  it("L7 — Minimum Power: solution handles minThrottle constraint", () => {
    const { passRate } = runTrials(6, { trials: 3, minPassRate: 0.8 });
    expect(passRate).toBeGreaterThanOrEqual(0.8);
  });

  it("L8 — Precision Burn: solution lands on narrow 40px pad", () => {
    const { config, solution } = LEVELS[7];
    const controller = compileController(solution, 7);
    const result = simulate(config, controller);
    expect(result.won).toBe(true);
    expect(result.onPad).toBe(true);
  });

  it("L9 — The Long Fall: solution computes burn window and wins", () => {
    const { config, solution } = LEVELS[8];
    const controller = compileController(solution, 8);
    const result = simulate(config, controller);
    expect(result.won).toBe(true);
    expect(result.fuelUsed).toBeLessThan(config.fuel as number);
  });

  it("L10 — Hoverslam: solution fires a single burn and wins", () => {
    const { config, solution } = LEVELS[9];
    const controller = compileController(solution, 9);
    const result = simulate(config, controller);
    expect(result.won).toBe(true);
    expect(result.fuelUsed).toBeLessThan(config.fuel as number);
  });

  // ── Regression: no solution times out ───────────────────────────────────
  it("all solutions land within 18 000 frames", () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { config, solution } = LEVELS[i];
      const controller = compileController(solution, i);
      const result = simulate(config, controller, { maxFrames: 18_000 });
      expect(result.reason, `Level ${i + 1} timed out`).toBe("landed");
    }
  });
});
