/**
 * Simulation utilities — shared by levels.test.ts and the interactive sim
 * script (sim.ts).
 *
 * Centralising compileController and runTrials here means ad-hoc debug runs
 * never need to re-implement the controller compilation logic.
 */

import { LEVELS } from "./levels.js";
import { simulate, type SimState, type SimResult, type ControllerFn } from "./simulator.js";

// ── Controller compiler ───────────────────────────────────────────────────────
//
// Translates a solution/starter code string into a ControllerFn that the
// headless simulator can call once per frame. Exposes the same falcon9 / game
// proxy objects the real game provides so solution code runs unchanged.

export function compileController(
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
    get rotateLeft() { return _state.rotateLeft; },
    set rotateLeft(v: number | boolean) { _state.rotateLeft = v; },
    get rotateRight() { return _state.rotateRight; },
    set rotateRight(v: number | boolean) { _state.rotateRight = v; },
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
    get width() { return canvasWidth; },
    get height() { return canvasHeight; },
    get scale() { return canvasHeight / 600; },
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

export interface TrialOptions {
  trials?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  /** Custom controller code — overrides the level's solution string. */
  code?: string;
}

export interface TrialResult {
  passed: number;
  trials: number;
  passRate: number;
  maxFrames: number;
  minFrames: number;
  results: SimResult[];
}

export function runTrials(
  levelIndex: number,
  opts: TrialOptions = {},
): TrialResult {
  const { trials = 1, canvasWidth = 800, canvasHeight = 600 } = opts;
  const { config, solution } = LEVELS[levelIndex];
  const code = opts.code ?? solution;

  let passed = 0;
  let maxFrames = 0;
  let minFrames = Infinity;
  const results: SimResult[] = [];

  for (let t = 0; t < trials; t++) {
    const controller = compileController(code, levelIndex, canvasWidth, canvasHeight);
    const result = simulate(config, controller, { canvasWidth, canvasHeight });
    if (result.won) passed++;
    if (result.frames > maxFrames) maxFrames = result.frames;
    if (result.frames < minFrames) minFrames = result.frames;
    results.push(result);
  }

  return {
    passed,
    trials,
    passRate: passed / trials,
    maxFrames,
    minFrames: minFrames === Infinity ? 0 : minFrames,
    results,
  };
}
