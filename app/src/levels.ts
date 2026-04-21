import type { LevelConfig } from "./engine/level.js";

// ─────────────────────────────────────────────────────────────────────────────
// Level data: config + per-level starter code + reference solution
//
// The `starter` string is what appears in the editor when a player first loads
// a level. It provides just enough scaffolding to understand the API without
// giving the answer away.
//
// The `solution` string is the reference algorithm that solves the level. It
// is both shown to the player via "Show Solution" and run by the test suite.
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelData {
  config: LevelConfig;
  /** Scaffolded starting code shown in editor when the level is first loaded */
  starter: string;
  /** Reference solution — shown on demand and verified by the test suite */
  solution: string;
}

export const LEVELS: LevelData[] = [
  // ── Level 0 — "Tutorial" ──────────────────────────────────────────────────
  {
    config: {
      id: "Tutorial",
      gravity: 0.003,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 5.0,
      initialAngle: 0,
      initialVelocity: { x: 0, yPerHeight: 0.00133 },
    },
    starter: `\
// Level 0 — Tutorial: Fly with Your Keyboard
// Welcome to Moon Lander! Use the arrow keys to fly the rocket
// and get a feel for the controls before you start writing code.
//
//   ↑ Arrow / Space — main booster engine (thrust up)
//   ← Arrow         — left thruster (rotates counter-clockwise)
//   → Arrow         — right thruster (rotates clockwise)
//
// Thrusters accept values from 0 to 1 for proportional control,
// or true/false for full on/off.
//
// When you're ready to automate the landing, move on to Level 1.
// Hit "Show Solution" to see a simple automatic controller!

// Track which keys are currently held down
const keys = new Set();
document.addEventListener("keydown", (e) => { keys.add(e.code); e.preventDefault(); });
document.addEventListener("keyup",   (e) => keys.delete(e.code));

falcon9.registerController(() => {
  falcon9.fireBoosterEngine = keys.has("ArrowUp") || keys.has("Space");
  falcon9.rotateLeft  = keys.has("ArrowLeft");
  falcon9.rotateRight = keys.has("ArrowRight");
});
`,
    solution: `\
// Level 0 — Tutorial (auto-pilot)
// Here's what a simple automatic controller looks like.
// It keeps the ship upright and slows the descent — no keyboard needed!
const s_0 = game.scale;
falcon9.registerController(() => {
  // Keep the ship upright using a PD controller
  const error = falcon9.angle + falcon9.rotationalMomentum * 5;
  falcon9.rotateLeft  = error > 0.05;
  falcon9.rotateRight = error < -0.05;

  // Fire the booster to slow descent when roughly upright
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.3 && falcon9.velocity.y > 1.0 * s_0;
});
`,
  },

  // ── Level 1 — "Hello, Moon" ───────────────────────────────────────────────
  {
    config: {
      id: "Hello, Moon",
      gravity: 0.004,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 3.0,
      initialAngle: 0,
      initialVelocity: { xPerWidth: 0.0000625, yPerHeight: 0.0025 },
    },
    starter: `\
// Level 1 — Hello, Moon
// The ship starts nearly upright and falling at moderate speed.
// Your goal: slow down before you hit the surface.
// Try firing the booster engine to control your descent.
//
// Available controls (true/false or 0–1 for proportional):
//   falcon9.fireBoosterEngine = true/false  (main engine)
//   falcon9.rotateLeft  = 0 to 1      (rotate counter-clockwise)
//   falcon9.rotateRight = 0 to 1      (rotate clockwise)
//
// Useful readings:
//   falcon9.velocity.y   — downward speed (positive = falling)
//   falcon9.angle        — tilt in radians (0 = straight up)

// Fire the booster whenever we're falling too fast.
// Try adjusting the threshold — what value keeps you from crashing?
falcon9.registerController(() => {
  falcon9.fireBoosterEngine = falcon9.velocity.y > /* ??? */ 1.5;
});
`,
    solution: `\
// Level 1 — Hello, Moon (solution)
// Fire booster whenever descending too fast; correct tilt with side thrusters.
const s_1 = game.scale;
falcon9.registerController(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;

  // Dampen any rotation to keep the ship upright
  falcon9.rotateLeft  = angle > 0.05 || spin > 0.5;
  falcon9.rotateRight = angle < -0.05 || spin < -0.5;

  falcon9.fireBoosterEngine = falcon9.velocity.y > 1.0 * s_1;
});
`,
  },

  // ── Level 2 — "Tilted" ────────────────────────────────────────────────────
  {
    config: {
      id: "Tilted",
      gravity: 0.008,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 2.0,
      initialAngle: 0.4,
      initialSpin: 0,
      initialVelocity: { xPerWidth: 0.00025, yPerHeight: 0.000333 },
      initialPosition: { yRatio: 0.13 },
    },
    starter: `\
// Level 2 — Tilted
// The ship spawns with a noticeable tilt.
// Firing the booster while tilted pushes you sideways — fix the angle first!
//
// Side thrusters accept 0–1 for proportional control (or true/false):
//   rotateLeft  → rotates counter-clockwise (reduces positive angle)
//   rotateRight → rotates clockwise (increases angle)
//
// Useful readings:
//   falcon9.angle              — current tilt (radians, 0 = upright)
//   falcon9.rotationalMomentum — how fast it's spinning

falcon9.registerController(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;

  // TODO: correct the angle before landing
  falcon9.rotateLeft  = /* ??? */ false;
  falcon9.rotateRight = /* ??? */ false;
  falcon9.fireBoosterEngine = /* ??? */ false;
});
`,
    solution: `\
// Level 2 — Tilted (solution)
// PD controller: correct angle and damp spin, then manage descent
const s_2 = game.scale;
falcon9.registerController(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  const error = angle + spin * 5; // predict where angle is heading

  falcon9.rotateLeft  = error > 0.05;
  falcon9.rotateRight = error < -0.05;
  falcon9.fireBoosterEngine = Math.abs(angle) < 0.3 && falcon9.velocity.y > 0.8 * s_2;
});
`,
  },

  // ── Level 3 — "Steady the Ship" ──────────────────────────────────────────
  {
    config: {
      id: "Steady the Ship",
      gravity: 0.010,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 1.5,
      initialAngle: 0,
      initialSpin: 0.1,
      initialVelocity: { x: 0, yPerHeight: 0.000667 },
      initialPosition: { xRatio: 0.5, yRatio: 0.167 },
    },
    starter: `\
// Level 3 — Steady the Ship
// Random tilt AND meaningful downward velocity. You must coordinate all
// three controls simultaneously in a feedback loop.
//
// Hint: a PD (proportional-derivative) controller works well here.
//   error     = current angle
//   derivative = rotationalMomentum  (how quickly the error is changing)
//   combined  = error + derivative * someGain

falcon9.registerController(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  const vy    = falcon9.velocity.y;

  // TODO: stabilise angle, then slow descent
  falcon9.rotateLeft  = false;
  falcon9.rotateRight = false;
  falcon9.fireBoosterEngine = false;
});
`,
    solution: `\
// Level 3 — Steady the Ship (solution)
const s_3 = game.scale;
falcon9.registerController(() => {
  const error = falcon9.angle + falcon9.rotationalMomentum * 8;

  falcon9.rotateLeft  = error > 0.04;
  falcon9.rotateRight = error < -0.04;
  // Only thrust when reasonably upright and falling faster than 0.5
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.4 && falcon9.velocity.y > 0.5 * s_3;
});
`,
  },

  // ── Level 4 — "Lateral Drift" ─────────────────────────────────────────────
  {
    config: {
      id: "Lateral Drift",
      gravity: 0.010,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 1.0,
      initialAngle: 0,
      initialSpin: 0,
      initialVelocity: { xPerWidth: 0.00125, yPerHeight: 0.0005 },
      initialPosition: { xRatio: 0.5, yRatio: 0.133 },
    },
    starter: `\
// Level 4 — Lateral Drift
// High horizontal velocity. Landing velocity = |vx| + |vy|, so sideways
// speed counts against you. You must tilt and thrust to cancel horizontal drift.
//
// Strategy: tilt INTO the drift direction and fire the booster to decelerate
// horizontally, then upright yourself before touchdown.
//
//   falcon9.velocity.x — horizontal speed (positive = drifting right)
//   falcon9.velocity.y — vertical speed

falcon9.registerController(() => {
  const vx = falcon9.velocity.x;
  const vy = falcon9.velocity.y;

  // TODO: cancel horizontal drift
  falcon9.rotateLeft  = false;
  falcon9.rotateRight = false;
  falcon9.fireBoosterEngine = false;
});
`,
    solution: `\
// Level 4 — Lateral Drift (solution)
// Cancel horizontal velocity by tilting into it; the tilted engine reduces
// both vx and vy simultaneously.
const s_4 = game.scale;
falcon9.registerController(() => {
  const vx = falcon9.velocity.x;
  const vy = falcon9.velocity.y;

  // Drive angle proportional to lateral drift: negative angle thrusts left.
  const targetAngle = Math.max(-0.5, Math.min(0.5, -vx * 0.5 / s_4));
  const error = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;

  falcon9.rotateLeft  = error > 0.05;
  falcon9.rotateRight = error < -0.05;

  // Budget the landing velocity: |vx| + |vy| must be < maxLandingVelocity.
  const vyThreshold = Math.max(0.3 * s_4, 0.85 * s_4 - Math.abs(vx));
  falcon9.fireBoosterEngine = Math.abs(error) < 0.4 && vy > vyThreshold;
});
`,
  },

  // ── Level 5 — "Bullseye" ──────────────────────────────────────────────────
  {
    config: {
      id: "Bullseye",
      gravity: 0.010,
      fuel: Infinity,
      fuelConsumptionRate: 0,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 1.0,
      landingPad: { width: 80 },
      initialAngle: 0.1,
      initialVelocity: { xPerWidth: 0.00025, yPerHeight: 0.0005 },
      initialPosition: { yRatio: 0.5 },
    },
    starter: `\
// Level 5 — Bullseye
// A landing pad appears in the centre of the screen. You must land ON it
// AND at safe speed. The pad is 80px wide.
//
// Useful readings:
//   falcon9.position.x  — current horizontal position
//   game.width          — total canvas width
// The pad centre is at game.width / 2.

falcon9.registerController(() => {
  const padX = game.width / 2;
  const dx   = falcon9.position.x - padX; // positive = right of pad

  // TODO: steer toward the pad while managing velocity
  falcon9.rotateLeft  = false;
  falcon9.rotateRight = false;
  falcon9.fireBoosterEngine = false;
});
`,
    solution: `\
// Level 5 — Bullseye (solution)
// The ship spawns directly above the pad but with a rightward drift.
// A PD controller maps position error and lateral velocity directly onto a
// target tilt angle — no inner velocity loop needed.
const s_5 = game.scale;
falcon9.registerController(() => {
  const padX = game.width / 2;   // pad is always at canvas centre
  const err  = padX - falcon9.position.x;  // +ve = pad is right of ship
  const vx   = falcon9.velocity.x;
  const vy   = falcon9.velocity.y;

  // Positive angle → sin(angle) > 0 → engine thrusts rightward.
  // kp drives toward the pad; kd damps lateral velocity to prevent overshoot.
  const targetAngle = Math.max(-0.4, Math.min(0.4,
    (err * 0.004 - vx * 2.0) / s_5
  ));

  const angleError = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;
  falcon9.rotateLeft  = angleError > 0.05;
  falcon9.rotateRight = angleError < -0.05;

  // Brake vertical descent whenever the rocket is nearly upright
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.45 && vy > 0.35 * s_5;
});
`,
  },

  // ── Level 6 — "On a Budget" ───────────────────────────────────────────────
  {
    config: {
      id: "On a Budget",
      gravity: 0.010,
      fuel: 500,
      fuelConsumptionRate: 0.05,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 1.0,
      landingPad: { width: 80 },
      initialAngle: 0.1,
      initialVelocity: { x: 0, yPerHeight: 0.000333 },
      initialPosition: { yRatio: 0.5 },
    },
    starter: `\
// Level 6 — On a Budget
// Fuel is now limited (500 units). Holding buttons burns it fast.
// You need an efficient closed-loop controller, not held keys.
//
// Check remaining fuel:   falcon9.fuelRemaining
//
// Tip: only fire thrusters when the error exceeds a threshold (dead-band),
// and avoid running the booster continuously.

falcon9.registerController(() => {
  const padX = game.width / 2;
  const dx   = falcon9.position.x - padX;

  // TODO: efficient controller with fuel awareness
  falcon9.rotateLeft  = false;
  falcon9.rotateRight = false;
  falcon9.fireBoosterEngine = false;
});
`,
    solution: `\
// Level 6 — On a Budget (solution)
// Stopping-distance latch: let the ship free-fall, fire ONE braking window.
// This minimises fuel use compared to a continuous hover controller.
const s_6 = game.scale;
const NET_DECEL_6 = (0.04 - 0.010) * s_6;
const TARGET_VY_6 = 0.55 * s_6;
let   burning_6   = false;

falcon9.registerController(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Keep upright — no lateral drift to manage.
  const angleError = falcon9.angle + falcon9.rotationalMomentum * 6;
  falcon9.rotateLeft  = angleError > 0.12;
  falcon9.rotateRight = angleError < -0.12;

  // Latch burn once stopping distance reaches remaining altitude.
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_6 * TARGET_VY_6) / (2 * NET_DECEL_6);
  if (!burning_6 && alt <= stoppingDist * 1.2 + 5 * s_6 && vy > TARGET_VY_6) { burning_6 = true; }
  if ( burning_6 && vy <= TARGET_VY_6) { burning_6 = false; }
  falcon9.fireBoosterEngine = burning_6 && Math.abs(falcon9.angle) < 0.45;
});
`,
  },

  // ── Level 7 — "Minimum Power" ────────────────────────────────────────────
  {
    config: {
      id: "Minimum Power",
      gravity: 0.010,
      fuel: 350,
      fuelConsumptionRate: 0.06,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 0.9,
      landingPad: { width: 60 },
      minThrottle: 0.06,
      initialAngle: 0,
      initialVelocity: { x: 0, yPerHeight: 0.0005 },
      initialPosition: { yRatio: 0.5 },
    },
    starter: `\
// Level 7 — Minimum Power
// The engine now fires at 1.5× normal thrust or not at all (minThrottle).
// You cannot feather the engine — only short pulses are effective.
// Over-correcting is now the main enemy.
//
// Strategy: use short timed burns; let momentum carry you between pulses.

falcon9.registerController(() => {
  const padX = game.width / 2;
  const dx   = falcon9.position.x - padX;
  const vy   = falcon9.velocity.y;

  // TODO: pulse-based control to avoid over-correction
  falcon9.rotateLeft  = false;
  falcon9.rotateRight = false;
  falcon9.fireBoosterEngine = false;
});
`,
    solution: `\
// Level 7 — Minimum Power (solution)
// Stopping-distance latch — let the ship fall freely, then fire ONE braking window.
const s_7 = game.scale;
const NET_DECEL_7 = (0.06 - 0.010) * s_7;
const TARGET_VY_7 = 0.5 * s_7;
let   burning_7   = false;

falcon9.registerController(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Null any residual tilt; wide dead-band avoids wasting powerful pulses.
  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.rotateLeft  = angleError > 0.15;
  falcon9.rotateRight = angleError < -0.15;

  // Latch: ignite once when stopping distance meets remaining altitude.
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_7 * TARGET_VY_7) / (2 * NET_DECEL_7);
  if (!burning_7 && alt <= stoppingDist * 1.15 + 5 * s_7 && vy > TARGET_VY_7) { burning_7 = true; }
  if ( burning_7 && vy <= TARGET_VY_7) { burning_7 = false; }
  falcon9.fireBoosterEngine = burning_7 && Math.abs(falcon9.angle) < 0.4;
});
`,
  },

  // ── Level 8 — "Precision Burn" ────────────────────────────────────────────
  {
    config: {
      id: "Precision Burn",
      gravity: 0.010,
      fuel: 180,
      fuelConsumptionRate: 0.09,
      enginePower: 0.04,
      canReignite: false,          // ONE ignition only — cut it and it's gone
      maxLandingVelocity: 0.7,
      landingPad: { width: 40 },
      minThrottle: 0.07,
      initialAngle: 0,
      initialSpin: 0.05,
      initialVelocity: { x: 0, yPerHeight: 0.0025 },
      initialPosition: { yRatio: 0.25 },
    },
    starter: `\
// Level 8 — Precision Burn
// canReignite = false: the engine fires ONCE. Cut it and it never restarts.
//
// Physics for this level:
//   minThrottle = 0.07   |   gravity = 0.010
//   net_decel   = 0.07 - 0.010 = 0.060
//
// If you cut the engine too early (at vy = 0.5 like Level 7), gravity
// accelerates you back above the landing-velocity limit before you touch down.
// You must burn all the way down to a very low vy before cutting.
//
// Strategy: latch ignition when stopping distance ≈ altitude,
//           then let the burn continue until vy is very low.

const s_s8 = game.scale;
const NET_DECEL = (0.07 - 0.010) * s_s8;
const TARGET_VY = /* aim lower than you think — gravity still acts after the burn */;
let   burning   = false;

falcon9.registerController(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.rotateLeft  = angleError > 0.07;
  falcon9.rotateRight = angleError < -0.07;

  const stoppingDist = Math.max(0, vy * vy - TARGET_VY * TARGET_VY) / (2 * NET_DECEL);
  if (!burning && alt <= stoppingDist * 1.15 + 3 && vy > TARGET_VY) { burning = true; }
  if ( burning && vy <= TARGET_VY) { burning = false; }
  falcon9.fireBoosterEngine = burning && Math.abs(falcon9.angle) < 0.3;
});
`,
    solution: `\
// Level 8 — Precision Burn (solution)
// canReignite = false: burn to a very low vy so residual fall velocity stays within budget.
const s_8 = game.scale;
const NET_DECEL_8 = (0.07 - 0.010) * s_8;
const TARGET_VY_8 = 0.1 * s_8;
let   burning_8   = false;

falcon9.registerController(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.rotateLeft  = angleError > 0.07;
  falcon9.rotateRight = angleError < -0.07;

  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_8 * TARGET_VY_8) / (2 * NET_DECEL_8);
  if (!burning_8 && alt <= stoppingDist * 1.15 + 3 * s_8 && vy > TARGET_VY_8) { burning_8 = true; }
  if ( burning_8 && vy <= TARGET_VY_8) { burning_8 = false; }
  falcon9.fireBoosterEngine = burning_8 && Math.abs(falcon9.angle) < 0.3;
});
`,
  },

  // ── Level 9 — "The Long Fall" ─────────────────────────────────────────────
  {
    config: {
      id: "The Long Fall",
      gravity: 0.010,
      fuel: 250,
      fuelConsumptionRate: 0.09,
      enginePower: 0.04,
      canReignite: false,          // still no second chances
      maxLandingVelocity: 0.6,
      landingPad: { width: 40 },
      minThrottle: 0.08,
      initialAngle: 0,
      initialSpin: 0.08,
      initialPosition: { yRatio: 0.067 },
      initialVelocity: { x: 0, yPerHeight: 0.00333 },
    },
    starter: `\
// Level 9 — The Long Fall
// canReignite = false again, but now vy = 2.0 and the engine fires at 0.08.
//
//   net_decel = 0.08 - 0.010 = 0.070
//
// maxLandingVelocity is now 0.6 — even tighter than Level 8.
// The Level 8 target velocity (0.1) barely keeps you within budget here
// because the longer fall after the burn adds more speed.
//
// You need to compute the EXACT right target velocity for this level's
// altitude and fall dynamics. Hint: think about how fast gravity accelerates
// you after the engine cuts, and how far you still fall.

const s_s9 = game.scale;
const NET_DECEL = (0.08 - 0.010) * s_s9;
let   burning   = false;

falcon9.registerController(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Kill spin with thrusters first
  const angleError = falcon9.angle + falcon9.rotationalMomentum * /* gain */ 0;
  falcon9.rotateLeft  = /* ??? */ false;
  falcon9.rotateRight = /* ??? */ false;

  // Then latch the burn
  const stoppingDist = /* ??? */;
  falcon9.fireBoosterEngine = /* ??? */;
});
`,
    solution: `\
// Level 9 — The Long Fall (solution)
// Use a tighter TARGET_VY to account for post-burn gravity acceleration.
const s_9 = game.scale;
const NET_DECEL_9 = (0.08 - 0.010) * s_9;
const TARGET_VY_9 = 0.05 * s_9;
let   burning_9   = false;

falcon9.registerController(() => {
  const vy   = falcon9.velocity.y;
  const alt  = falcon9.altitude;

  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.rotateLeft  = angleError > 0.06;
  falcon9.rotateRight = angleError < -0.06;

  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_9 * TARGET_VY_9) / (2 * NET_DECEL_9);
  if (!burning_9 && alt <= stoppingDist * 1.1 && vy > TARGET_VY_9) {
    burning_9 = true;
  }
  if (burning_9 && vy <= TARGET_VY_9) {
    burning_9 = false;
  }
  falcon9.fireBoosterEngine = burning_9 && Math.abs(angleError) < 0.3;
});
`,
  },

  // ── Level 10 — "Hoverslam" ────────────────────────────────────────────────
  {
    config: {
      id: "Hoverslam",
      gravity: 0.010,
      fuel: 200,
      fuelConsumptionRate: 0.10,
      enginePower: 0.10,
      canReignite: false,
      maxLandingVelocity: 0.5,
      // Stick the landing upright — tilt more than ~17° at touchdown snaps a leg.
      maxLandingAngle: 0.30,
      landingPad: { width: 80 },
      minThrottle: 0.10,
      initialAngle: 0.0,
      initialSpin: 0.2,
      // Spawn in the upper-right with a leftward lateral velocity. Both
      // scale proportionally so the parabolic arc shape is consistent.
      initialPosition: { xRatio: 0.65, yRatio: 0.083 },
      initialVelocity: { xPerWidth: -0.0008, yPerHeight: 0.0025 },
    },
    starter: `\
// Level 10 — Hoverslam
// The rocket launches from the upper-right, arcing left toward the pad.
// It's also spinning. You get ONE engine ignition — no re-ignition.
//
// NEW constraint: land UPRIGHT. Tilt more than ~8.6° (0.15 rad) snaps a leg.
//
// IMPORTANT: Grid fins lose authority at low airspeed. Once the engine cuts
// off and the rocket is coasting slowly, thrusters become very weak. You
// MUST straighten the rocket while the engine is still firing (TVC gives
// full steering authority regardless of airspeed).
//
// Strategy: pre-tilt with thrusters, burn to kill BOTH vx and vy, then
// KEEP BURNING until the rocket is nearly vertical. Only then cut the
// engine and coast to touchdown under gravity.
//
// Key insight: at tilt angle θ, the engine provides two components:
//   lateral decel = enginePower × sin(θ)   ← kills horizontal speed
//   vertical decel = enginePower × cos(θ) − gravity   ← arrests fall
//
// Gravity-corrected kill angle:
//   θ = −atan2(vx × 0.9, vy − TARGET_VY)        // 0.9 = (E − g) / E
//
// Physics:
//   enginePower = 0.10  |  gravity = 0.010
//   vertical decel during burn: 0.10 × cos(θ) − 0.010
//   stopping altitude: (vy² − TARGET_VY²) / (2 × decel)
//
// Tip: pick TARGET_VY slightly negative (say −0.20) so the burn briefly
// reverses the descent. Then keep the engine on a bit longer to straighten
// the rocket under TVC before cutting off.
//
// Monitor:
//   falcon9.altitude           — pixels to ground
//   falcon9.velocity.y         — downward speed
//   falcon9.velocity.x         — lateral speed (negative = moving left)
//   falcon9.angle              — tilt in radians (+ = right)
//   falcon9.rotationalMomentum — spin rate (residual tumble)

const s_s10     = game.scale;
const ENGINE    = 0.10 * s_s10;
const GRAVITY   = 0.010 * s_s10;
const TARGET_VY = /* try -0.20 * s_s10 */ 0;
let   burning   = false;
let   burnDone  = false;

falcon9.registerController(() => {
  const vx  = falcon9.velocity.x;
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // During the burn: steer toward the gravity-corrected kill angle.
  // The burn straightens the rocket via TVC as vx is killed.
  // After engine cutoff, grid fins are weak at low airspeed — the rocket
  // should already be upright by the time the burn ends.
  const burnAngle = burnDone ? 0 : Math.max(-0.50, Math.min(0.50,
    -Math.atan2(vx * /* ratio */ 0, Math.max(vy - TARGET_VY, /* floor */ 0))));
  const angleError = falcon9.angle - burnAngle + falcon9.rotationalMomentum * /* gain */ 0;
  // Proportional thruster control (0–1) gives smoother TVC steering than
  // boolean on/off. Scale thrust with angle error, disable after cutoff.
  const thrust = burnDone ? 0 : Math.min(1, Math.abs(angleError) * /* Kp */ 0);
  falcon9.rotateLeft  = angleError > 0 ? thrust : 0;
  falcon9.rotateRight = angleError < 0 ? thrust : 0;

  // Ignite once at the kinematic stopping altitude.
  // Average decel between tilted start and upright end of burn for accuracy.
  const aNetStart = Math.max(0.005, ENGINE * Math.cos(burnAngle) - GRAVITY);
  const aNet      = (aNetStart + (ENGINE - GRAVITY)) / 2;
  const stopAlt = Math.max(0, vy * vy - TARGET_VY * TARGET_VY) / (2 * aNet);
  if (!burning && !burnDone && alt <= stopAlt * /* margin */ 1.0 && vy > TARGET_VY) burning = true;
  if ( burning && vy <= TARGET_VY) { burning = false; burnDone = true; }
  falcon9.fireBoosterEngine = burning;
});
`,
    solution: `\
// Level 10 — Hoverslam (solution)
// Arc in from the upper-right, vector the single burn to kill vx and vy
// together. Grid fins lose authority at low airspeed, so the rocket must
// be nearly vertical by the time the engine cuts off — TVC during the
// burn handles straightening. The 2.5 denominator floor in the burn-angle
// formula keeps the tilt modest as vy shrinks, so the rocket is already
// close to vertical when vy reaches TARGET.
//
// Proportional thruster control (0–1) gives smoother TVC steering than
// bang-bang, reducing angular oscillation during the critical burn phase.
const s_10         = game.scale;
const ENGINE_10    = 0.10 * s_10;
const GRAVITY_10   = 0.010 * s_10;
const TARGET_VY_10 = -0.20 * s_10;
let   burning_10   = false;
let   burnDone_10  = false;

falcon9.registerController(() => {
  const vx  = falcon9.velocity.x;
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  const burnAngle = burnDone_10 ? 0 : Math.max(-0.50, Math.min(0.50,
    -Math.atan2(vx * 0.9, Math.max(vy - TARGET_VY_10, 2.5 * s_10))));
  const angleError = falcon9.angle - burnAngle + falcon9.rotationalMomentum * 1.2;
  const thrust = burnDone_10 ? 0 : Math.min(1, Math.abs(angleError) * 50);
  falcon9.rotateLeft  = angleError > 0 ? thrust : 0;
  falcon9.rotateRight = angleError < 0 ? thrust : 0;

  const aNetStart = Math.max(0.005 * s_10, ENGINE_10 * Math.cos(burnAngle) - GRAVITY_10);
  const aNetEnd   = ENGINE_10 - GRAVITY_10;
  const aNet      = (aNetStart + aNetEnd) / 2;
  const stopAlt = Math.max(0, vy * vy - TARGET_VY_10 * TARGET_VY_10) / (2 * aNet);
  if (!burning_10 && !burnDone_10 && alt <= stopAlt * 1.06 && vy > TARGET_VY_10) burning_10 = true;
  if ( burning_10 && vy <= TARGET_VY_10) { burning_10 = false; burnDone_10 = true; }

  falcon9.fireBoosterEngine = burning_10;
});
`,
  },
];
