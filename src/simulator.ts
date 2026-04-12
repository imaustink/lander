/**
 * Headless physics simulator — runs the Falcon9 update loop synchronously
 * in any environment (including Node / Vitest) without a DOM or canvas.
 *
 * The simulator mirrors the real engine's dt-normalised physics exactly.
 * Tests supply a controller function that runs once per simulated frame and
 * sets fireBoosterEngine / fireLeftThruster / fireRightThruster on the state.
 */

import type { LevelConfig } from "./engine/level.js";
import { getRandomInt } from "./engine/utils.js";
import {
  distanceToBottom,
  resolveBoosterSealed,
  consumeFuel,
  stepAngle,
  stepVelocity,
  stepPosition,
} from "./engine/physics.js";

// ── Simulator state ───────────────────────────────────────────────────────────

export interface SimState {
  posX: number;
  posY: number;
  velX: number;
  velY: number;
  angle: number;
  rotMomentum: number;
  fuelRemaining: number;
  /** True once the ship has touched down */
  landed: boolean;
  /** Combined landing velocity (set on touchdown) */
  landingVelocity: number | null;
  /** True if the landing pad constraint was satisfied */
  onPad: boolean;
  /** True if the landing was within maxLandingVelocity AND onPad */
  won: boolean;
  /** Total frames elapsed */
  frame: number;
  // Thruster state written by the controller each frame
  fireBoosterEngine: boolean;
  fireLeftThruster: boolean;
  fireRightThruster: boolean;
  // Internal
  _boosterEverFired: boolean;
  _boosterSealed: boolean;
}

export interface SimOptions {
  /** Canvas size used for geometry calculations. Default: 800×600 */
  canvasWidth?: number;
  canvasHeight?: number;
  /** Fixed dt per frame in ms. Default: 16.67 (60fps) */
  dt?: number;
  /** Maximum frames before aborting. Default: 18000 (5 min at 60fps) */
  maxFrames?: number;
  /** Ship constants */
  shipWidth?: number;
  shipHeight?: number;
  dragCoefficient?: number;
}

export type ControllerFn = (state: SimState) => void;

export interface SimResult {
  won: boolean;
  landed: boolean;
  landingVelocity: number | null;
  onPad: boolean;
  frames: number;
  fuelUsed: number;
  /** Reason the run ended */
  reason: "landed" | "timeout";
}

// ─────────────────────────────────────────────────────────────────────────────

export function simulate(
  level: LevelConfig,
  controller: ControllerFn,
  opts: SimOptions = {},
): SimResult {
  const canvasWidth  = opts.canvasWidth  ?? 800;
  const canvasHeight = opts.canvasHeight ?? 600;
  const dt           = opts.dt           ?? 16.67;
  const maxFrames    = opts.maxFrames    ?? 18_000;
  const shipWidth    = opts.shipWidth    ?? 14;
  const shipHeight   = opts.shipHeight   ?? 72;
  const drag         = opts.dragCoefficient ?? 0.05;

  // Resolve initial state from level config — mirrors Falcon9 constructor
  const initPosX =
    level.initialPosition?.x ?? canvasWidth / 2;
  const initPosY =
    level.initialPosition?.y ?? getRandomInt(0, canvasHeight / 4);
  const initVelX = level.initialVelocity?.x ?? getRandomInt(-1000, 1000) / 1000;
  const initVelY = level.initialVelocity?.y ?? getRandomInt(0, 1000) / 1000;
  const initAngle = level.initialAngle ?? getRandomInt(-500, 500) / 1000;
  const initSpin  = level.initialSpin  ?? getRandomInt(-100, 100) / 1000;

  const state: SimState = {
    posX:  initPosX,
    posY:  initPosY,
    velX:  initVelX,
    velY:  initVelY,
    angle: initAngle,
    rotMomentum: initSpin,
    fuelRemaining: level.fuel,
    landed: false,
    landingVelocity: null,
    onPad: false,
    won: false,
    frame: 0,
    fireBoosterEngine: false,
    fireLeftThruster:  false,
    fireRightThruster: false,
    _boosterEverFired: false,
    _boosterSealed:    false,
  };

  // Expose altitude as a computed getter — mirrors Falcon9.altitude
  const getAltitude = (): number => {
    const minH = canvasHeight - distanceToBottom(state.angle, shipWidth, shipHeight);
    return minH - state.posY;
  };
  // Patch altitude onto state for controller convenience
  Object.defineProperty(state, "altitude", { get: getAltitude });

  const fuelStart = level.fuel;
  const gravity   = level.gravity;
  const thrustPower = level.minThrottle ?? level.enginePower;

  for (let f = 0; f < maxFrames; f++) {
    state.frame = f;

    // ── Controller writes thruster flags ───────────────────────────────────
    controller(state);

    const t = dt / 16.67; // normalise to 60fps-equivalent step
    const hasFuel = isFinite(state.fuelRemaining) ? state.fuelRemaining > 0 : true;

    // Resolve sealed state
    state._boosterSealed = resolveBoosterSealed(
      level.canReignite,
      state._boosterEverFired,
      state.fireBoosterEngine,
      state._boosterSealed,
    );
    const booster = state.fireBoosterEngine && hasFuel && !state._boosterSealed;
    const left    = state.fireLeftThruster  && hasFuel;
    const right   = state.fireRightThruster && hasFuel;
    if (booster) state._boosterEverFired = true;

    // Fuel consumption — thrusters (grid fins / thrust vectoring) are free;
    // only the main booster engine burns propellant.
    if (hasFuel && isFinite(state.fuelRemaining)) {
      const active = booster ? 1 : 0;
      state.fuelRemaining = consumeFuel(state.fuelRemaining, level.fuelConsumptionRate, active, dt);
    }

    // ── Angle update ───────────────────────────────────────────────────────
    ({ angle: state.angle, rotMomentum: state.rotMomentum } = stepAngle(
      state.angle, state.rotMomentum, t, left, right, gravity, drag,
    ));

    // ── Velocity update ────────────────────────────────────────────────────
    ({ velX: state.velX, velY: state.velY } = stepVelocity(
      state.velX, state.velY, state.angle, t, booster, gravity, thrustPower,
    ));

    // ── Position update ────────────────────────────────────────────────────
    const pos = stepPosition(
      state.posX, state.posY, state.velX, state.velY,
      state.angle, t, canvasHeight, shipWidth, shipHeight,
    );
    state.posX = pos.posX;
    state.posY = pos.posY;

    if (pos.landed) {
      state.landed        = true;
      state.landingVelocity = pos.landingVelocity;
      state.velX = 0;
      state.velY = 0;
      state.rotMomentum = 0;

      const padConf = level.landingPad;
      if (padConf === undefined) {
        state.onPad = true;
      } else {
        const cx   = padConf.centerX ?? canvasWidth / 2;
        const half = padConf.width / 2;
        state.onPad = state.posX >= cx - half && state.posX <= cx + half;
      }
      state.won = state.landingVelocity! < level.maxLandingVelocity && state.onPad;

      return {
        won: state.won,
        landed: true,
        landingVelocity: state.landingVelocity,
        onPad: state.onPad,
        frames: f + 1,
        fuelUsed: isFinite(fuelStart) ? fuelStart - state.fuelRemaining : 0,
        reason: "landed",
      };
    }
  }

  return {
    won: false,
    landed: false,
    landingVelocity: null,
    onPad: false,
    frames: maxFrames,
    fuelUsed: isFinite(fuelStart) ? fuelStart - state.fuelRemaining : 0,
    reason: "timeout",
  };
}
