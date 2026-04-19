/**
 * Pure physics functions shared by Falcon9 (browser) and the headless simulator.
 * No DOM, canvas, or engine imports — safe to use in any environment.
 */

export function distanceToBottom(
  angle: number,
  shipWidth: number,
  shipHeight: number,
): number {
  return (
    Math.abs((shipWidth / 2) * Math.sin(angle)) +
    Math.abs((shipHeight / 2) * Math.cos(angle))
  );
}

export function resolveBoosterSealed(
  canReignite: boolean,
  everFired: boolean,
  currentlyFiring: boolean,
  alreadySealed: boolean,
): boolean {
  if (alreadySealed) return true;
  return !canReignite && everFired && !currentlyFiring;
}

export function consumeFuel(
  fuelRemaining: number,
  rate: number,
  activeCount: number,
  dt: number,
): number {
  if (activeCount === 0) return fuelRemaining;
  return Math.max(0, fuelRemaining - rate * activeCount * dt);
}

export interface AngleState {
  angle: number;
  rotMomentum: number;
}

/**
 * Reference airspeed at which grid fins reach full authority.
 * Below this speed, grid fin effectiveness (and rotational drag) scales
 * linearly — mimicking the real aerodynamic dependence on dynamic pressure.
 */
export const GRID_FIN_REF_SPEED = 1.0;

/**
 * Clamp a thruster input to [0, 1].
 * Accepts booleans (true→1, false→0) or numbers for proportional control.
 */
export function clampThruster(v: number | boolean): number {
  const n = Number(v);
  return n !== n ? 0 : Math.max(0, Math.min(1, n)); // NaN → 0
}

export function stepAngle(
  angle: number,
  rotMomentum: number,
  t: number,
  leftActive: number,
  rightActive: number,
  gravity: number,
  drag: number,
  boosterActive: boolean,
  velX: number,
  velY: number,
): AngleState {
  // Grid fin authority scales with airspeed (linear approximation of
  // dynamic-pressure dependence).  When the main engine is firing, TVC
  // provides full steering regardless of airspeed.
  const airspeed = Math.sqrt(velX * velX + velY * velY);
  const gridFinFactor = Math.min(airspeed / GRID_FIN_REF_SPEED, 1.0);
  const steerFactor = boosterActive ? 1.0 : gridFinFactor;

  const torque = 0.01 * steerFactor * t;
  // Net steering: rightActive pushes clockwise (+), leftActive counter-clockwise (−).
  // Values are 0–1 allowing proportional control.
  rotMomentum += torque * (rightActive - leftActive);

  rotMomentum += 0.75 * Math.sin(angle) * gravity * t;

  // Rotational drag — aerodynamic damping scales with airspeed
  const dragVal = drag * gridFinFactor * 0.01 * t;
  rotMomentum += rotMomentum > 0 ? -dragVal : dragVal;

  angle += (Math.PI / 180) * rotMomentum;

  return { angle, rotMomentum };
}

export interface VelocityState {
  velX: number;
  velY: number;
}

export function stepVelocity(
  velX: number,
  velY: number,
  angle: number,
  t: number,
  boosterActive: boolean,
  gravity: number,
  thrustPower: number,
): VelocityState {
  velY += gravity * t;

  if (boosterActive) {
    velX += thrustPower * Math.sin(angle) * t;
    velY -= thrustPower * Math.cos(angle) * t;
  }

  return { velX, velY };
}

export interface PositionResult {
  posX: number;
  posY: number;
  landed: boolean;
  landingVelocity: number | null;
}

export function stepPosition(
  posX: number,
  posY: number,
  velX: number,
  velY: number,
  angle: number,
  t: number,
  canvasHeight: number,
  shipWidth: number,
  shipHeight: number,
): PositionResult {
  const minH = canvasHeight - distanceToBottom(angle, shipWidth, shipHeight);
  const newX = posX + velX * t;
  const newY = Math.min(posY + velY * t, minH);

  if (newY >= minH) {
    return {
      posX: newX,
      posY: newY,
      landed: true,
      landingVelocity: Math.abs(velY) + Math.abs(velX),
    };
  }

  return { posX: newX, posY: newY, landed: false, landingVelocity: null };
}
