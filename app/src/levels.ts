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
      initialVelocity: { x: 0, y: 0.8 },
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
// When you're ready to automate the landing, move on to Level 1.
// Hit "Show Solution" to see a simple automatic controller!

// Track which keys are currently held down
const keys = new Set();
document.addEventListener("keydown", (e) => { keys.add(e.code); e.preventDefault(); });
document.addEventListener("keyup",   (e) => keys.delete(e.code));

setInterval(() => {
  falcon9.fireBoosterEngine = keys.has("ArrowUp") || keys.has("Space");
  falcon9.fireLeftThruster  = keys.has("ArrowLeft");
  falcon9.fireRightThruster = keys.has("ArrowRight");
}, 16);
`,
    solution: `\
// Level 0 — Tutorial (auto-pilot)
// Here's what a simple automatic controller looks like.
// It keeps the ship upright and slows the descent — no keyboard needed!
setInterval(() => {
  // Keep the ship upright using a PD controller
  const error = falcon9.angle + falcon9.rotationalMomentum * 5;
  falcon9.fireLeftThruster  = error > 0.05;
  falcon9.fireRightThruster = error < -0.05;

  // Fire the booster to slow descent when roughly upright
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.3 && falcon9.velocity.y > 1.0;
}, 16);
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
      initialVelocity: { x: 0.05, y: 1.5 },
    },
    starter: `\
// Level 1 — Hello, Moon
// The ship starts nearly upright and falling at moderate speed.
// Your goal: slow down before you hit the surface.
// Try firing the booster engine to control your descent.
//
// Available controls:
//   falcon9.fireBoosterEngine = true/false  (main engine)
//   falcon9.fireLeftThruster  = true/false  (rotate right)
//   falcon9.fireRightThruster = true/false  (rotate left)
//
// Useful readings:
//   falcon9.velocity.y   — downward speed (positive = falling)
//   falcon9.angle        — tilt in radians (0 = straight up)

// Fire the booster whenever we're falling too fast.
// Try adjusting the threshold — what value keeps you from crashing?
setInterval(() => {
  falcon9.fireBoosterEngine = falcon9.velocity.y > /* ??? */ 1.5;
}, 16);
`,
    solution: `\
// Level 1 — Hello, Moon (solution)
// Fire booster whenever descending too fast; correct tilt with side thrusters.
setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;

  // Dampen any rotation to keep the ship upright
  falcon9.fireLeftThruster  = angle > 0.05 || spin > 0.5;
  falcon9.fireRightThruster = angle < -0.05 || spin < -0.5;

  falcon9.fireBoosterEngine = falcon9.velocity.y > 1.0;
}, 16);
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
      initialVelocity: { x: 0.2, y: 0.2 },
    },
    starter: `\
// Level 2 — Tilted
// The ship spawns with a noticeable tilt.
// Firing the booster while tilted pushes you sideways — fix the angle first!
//
// Side thrusters adjust rotational momentum:
//   fireLeftThruster  → rotates counter-clockwise (reduces positive angle)
//   fireRightThruster → rotates clockwise (increases angle)
//
// Useful readings:
//   falcon9.angle              — current tilt (radians, 0 = upright)
//   falcon9.rotationalMomentum — how fast it's spinning

setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;

  // TODO: correct the angle before landing
  falcon9.fireLeftThruster  = /* ??? */ false;
  falcon9.fireRightThruster = /* ??? */ false;
  falcon9.fireBoosterEngine = /* ??? */ false;
}, 16);
`,
    solution: `\
// Level 2 — Tilted (solution)
// PD controller: correct angle and damp spin, then manage descent
setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  const error = angle + spin * 5; // predict where angle is heading

  falcon9.fireLeftThruster  = error > 0.05;
  falcon9.fireRightThruster = error < -0.05;
  falcon9.fireBoosterEngine = Math.abs(angle) < 0.3 && falcon9.velocity.y > 0.8;
}, 16);
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
      initialVelocity: { x: 0, y: 0.4 },
      initialPosition: { x: 400, y: 100 },
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

setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  const vy    = falcon9.velocity.y;

  // TODO: stabilise angle, then slow descent
  falcon9.fireLeftThruster  = false;
  falcon9.fireRightThruster = false;
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 3 — Steady the Ship (solution)
setInterval(() => {
  const error = falcon9.angle + falcon9.rotationalMomentum * 8;

  falcon9.fireLeftThruster  = error > 0.04;
  falcon9.fireRightThruster = error < -0.04;
  // Only thrust when reasonably upright and falling faster than 0.5
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.4 && falcon9.velocity.y > 0.5;
}, 16);
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
      initialVelocity: { x: 1.0, y: 0.3 },
      initialPosition: { x: 400, y: 80 },
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

setInterval(() => {
  const vx = falcon9.velocity.x;
  const vy = falcon9.velocity.y;

  // TODO: cancel horizontal drift
  falcon9.fireLeftThruster  = false;
  falcon9.fireRightThruster = false;
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 4 — Lateral Drift (solution)
// Cancel horizontal velocity by tilting into it; the tilted engine reduces
// both vx and vy simultaneously.
setInterval(() => {
  const vx = falcon9.velocity.x;
  const vy = falcon9.velocity.y;

  // Drive angle proportional to lateral drift: negative angle thrusts left.
  const targetAngle = Math.max(-0.5, Math.min(0.5, -vx * 0.5));
  const error = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;

  falcon9.fireLeftThruster  = error > 0.05;
  falcon9.fireRightThruster = error < -0.05;

  // Budget the landing velocity: |vx| + |vy| must be < 1.0.
  // Brake earlier when lateral drift is still significant so the combined
  // speed is within budget regardless of remaining horizontal component.
  const vyThreshold = Math.max(0.3, 0.85 - Math.abs(vx));
  falcon9.fireBoosterEngine = Math.abs(error) < 0.4 && vy > vyThreshold;
}, 16);
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
      initialVelocity: { x: 0.2, y: 0.3 },
      initialPosition: { y: 300 },   // x defaults to canvas centre (= pad centre)
    },
    starter: `\
// Level 5 — Bullseye
// A landing pad appears in the centre of the screen. You must land ON it
// AND at safe speed. The pad is 80px wide.
//
// Useful readings:
//   falcon9.position.x  — current horizontal position
//   game.canvas.width   — total canvas width
// The pad centre is at canvas.width / 2.

setInterval(() => {
  const padX = game.canvas.width / 2;
  const dx   = falcon9.position.x - padX; // positive = right of pad

  // TODO: steer toward the pad while managing velocity
  falcon9.fireLeftThruster  = false;
  falcon9.fireRightThruster = false;
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 5 — Bullseye (solution)
// The ship spawns directly above the pad but with a rightward drift.
// A PD controller maps position error and lateral velocity directly onto a
// target tilt angle — no inner velocity loop needed.
setInterval(() => {
  const padX = game.canvas.width / 2;   // pad is always at canvas centre
  const err  = padX - falcon9.position.x;  // +ve = pad is right of ship
  const vx   = falcon9.velocity.x;
  const vy   = falcon9.velocity.y;

  // Positive angle → sin(angle) > 0 → engine thrusts rightward.
  // kp drives toward the pad; kd damps lateral velocity to prevent overshoot.
  const targetAngle = Math.max(-0.4, Math.min(0.4,
    err * 0.004 - vx * 2.0
  ));

  const angleError = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;
  falcon9.fireLeftThruster  = angleError > 0.05;
  falcon9.fireRightThruster = angleError < -0.05;

  // Brake vertical descent whenever the rocket is nearly upright
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.45 && vy > 0.35;
}, 16);
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
      initialVelocity: { x: 0, y: 0.2 },
      initialPosition: { y: 300 },   // x defaults to canvas centre (= pad centre)
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

setInterval(() => {
  const padX = game.canvas.width / 2;
  const dx   = falcon9.position.x - padX;

  // TODO: efficient controller with fuel awareness
  falcon9.fireLeftThruster  = false;
  falcon9.fireRightThruster = false;
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 6 — On a Budget (solution)
// Stopping-distance latch: let the ship free-fall, fire ONE braking window.
// This minimises fuel use compared to a continuous hover controller.
const NET_DECEL_6 = 0.04 - 0.010; // enginePower - gravity
const TARGET_VY_6 = 0.55;
let   burning_6   = false;

setInterval(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Keep upright — no lateral drift to manage.
  const angleError = falcon9.angle + falcon9.rotationalMomentum * 6;
  falcon9.fireLeftThruster  = angleError > 0.12;
  falcon9.fireRightThruster = angleError < -0.12;

  // Latch burn once stopping distance reaches remaining altitude.
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_6 * TARGET_VY_6) / (2 * NET_DECEL_6);
  if (!burning_6 && alt <= stoppingDist * 1.2 + 5 && vy > TARGET_VY_6) { burning_6 = true; }
  if ( burning_6 && vy <= TARGET_VY_6) { burning_6 = false; }
  falcon9.fireBoosterEngine = burning_6 && Math.abs(falcon9.angle) < 0.45;
}, 16);
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
      initialVelocity: { x: 0, y: 0.3 },
      initialPosition: { y: 300 },   // x defaults to canvas centre (= pad centre)
    },
    starter: `\
// Level 7 — Minimum Power
// The engine now fires at 1.5× normal thrust or not at all (minThrottle).
// You cannot feather the engine — only short pulses are effective.
// Over-correcting is now the main enemy.
//
// Strategy: use short timed burns; let momentum carry you between pulses.

setInterval(() => {
  const padX = game.canvas.width / 2;
  const dx   = falcon9.position.x - padX;
  const vy   = falcon9.velocity.y;

  // TODO: pulse-based control to avoid over-correction
  falcon9.fireLeftThruster  = false;
  falcon9.fireRightThruster = false;
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 7 — Minimum Power (solution)
// Stopping-distance latch — let the ship fall freely, then fire ONE braking window.
// With minThrottle the engine fires full-power pulses; a single well-timed
// window uses far less fuel than continuous hovering.
const NET_DECEL_7 = 0.06 - 0.010; // minThrottle - gravity
const TARGET_VY_7 = 0.5;
let   burning_7   = false;

setInterval(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Null any residual tilt; wide dead-band avoids wasting powerful pulses.
  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.fireLeftThruster  = angleError > 0.15;
  falcon9.fireRightThruster = angleError < -0.15;

  // Latch: ignite once when stopping distance meets remaining altitude.
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_7 * TARGET_VY_7) / (2 * NET_DECEL_7);
  if (!burning_7 && alt <= stoppingDist * 1.15 + 5 && vy > TARGET_VY_7) { burning_7 = true; }
  if ( burning_7 && vy <= TARGET_VY_7) { burning_7 = false; }
  falcon9.fireBoosterEngine = burning_7 && Math.abs(falcon9.angle) < 0.4;
}, 16);
`,
  },

  // ── Level 8 — "Precision Burn" ────────────────────────────────────────────
  {
    config: {
      id: "Precision Burn",
      gravity: 0.010,
      fuel: 250,
      fuelConsumptionRate: 0.07,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 0.8,
      landingPad: { width: 40 },
      minThrottle: 0.06,
      initialAngle: 0,
      initialVelocity: { x: 0, y: 1.2 },
      initialPosition: { y: 200 },   // higher start gives PD time to settle before burn trigger
    },
    starter: `\
// Level 8 — Precision Burn
// Narrow 40px pad, faster initial approach, and scarce fuel.
// Reactive loops fail here — your script must reason about WHEN to burn,
// not just WHETHER to burn.
//
// Hint: compute how long a burn needs to last to achieve the desired delta-v,
// rather than running the engine continuously.

setInterval(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // TODO: predictive burn scheduling
  falcon9.fireBoosterEngine = false;
}, 16);
`,
    solution: `\
// Level 8 — Precision Burn (solution)
// No lateral drift — focus is on timing the stopping-distance vertical burn.
const NET_DECEL_8 = 0.06 - 0.010; // minThrottle - gravity
const TARGET_VY_8 = 0.4;
let   burning_8   = false;

setInterval(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  // Keep upright — no lateral component to manage.
  const angleError = falcon9.angle + falcon9.rotationalMomentum * 8;
  falcon9.fireLeftThruster  = angleError > 0.08;
  falcon9.fireRightThruster = angleError < -0.08;

  // Latch vertical burn when stopping distance meets remaining altitude.
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_8 * TARGET_VY_8) / (2 * NET_DECEL_8);
  if (!burning_8 && alt <= stoppingDist * 1.2 + 5 && vy > TARGET_VY_8) { burning_8 = true; }
  if ( burning_8 && vy <= TARGET_VY_8) { burning_8 = false; }
  falcon9.fireBoosterEngine = burning_8 && Math.abs(falcon9.angle) < 0.25;
}, 16);
`,
  },

  // ── Level 9 — "The Long Fall" ─────────────────────────────────────────────
  {
    config: {
      id: "The Long Fall",
      gravity: 0.010,
      fuel: 200,
      fuelConsumptionRate: 0.08,
      enginePower: 0.04,
      canReignite: true,
      maxLandingVelocity: 0.7,
      landingPad: { width: 40 },
      minThrottle: 0.08,
      initialAngle: 0,
      initialSpin: 0,
      initialPosition: { y: 40 },    // x defaults to canvas centre (= pad centre)
      initialVelocity: { x: 0, y: 2.0 },
    },
    starter: `\
// Level 9 — The Long Fall
// High-altitude drop, velocity.y = 2.0, fuel = 200.
// Every ill-timed burn wastes irreplaceable fuel.
// Manual / reactive control is nearly impossible — you need an algorithm
// that computes burn windows based on altitude and velocity.
//
// Key insight:
//   stopping_distance = vy² / (2 × net_decel)
//   net_decel = minThrottle - gravity
//
// Start the burn when altitude ≤ stopping_distance.

setInterval(() => {
  const vy  = falcon9.velocity.y;
  const alt = falcon9.altitude;

  const NET_DECEL = 0.08 - 0.010; // minThrottle - gravity
  const stoppingDist = /* ??? */;

  falcon9.fireBoosterEngine = /* ??? */;
}, 16);
`,
    solution: `\
// Level 9 — The Long Fall (solution)
// One-shot suicide burn: latch ignition when stopping distance ≥ altitude.
// A burn latch prevents oscillation from re-triggering the engine.
const NET_DECEL_9 = 0.08 - 0.010;
const TARGET_VY_9 = 0.35;
let   burning_9   = false;

setInterval(() => {
  const vy   = falcon9.velocity.y;
  const alt  = falcon9.altitude;

  const angleError = falcon9.angle + falcon9.rotationalMomentum * 6;
  falcon9.fireLeftThruster  = angleError > 0.06;
  falcon9.fireRightThruster = angleError < -0.06;

  // Latch: ignite once when stopping distance exceeds remaining altitude
  const stoppingDist = Math.max(0, vy * vy - TARGET_VY_9 * TARGET_VY_9) / (2 * NET_DECEL_9);
  if (!burning_9 && alt <= stoppingDist * 1.1 && vy > TARGET_VY_9) {
    burning_9 = true;
  }
  if (burning_9 && vy <= TARGET_VY_9) {
    burning_9 = false;
  }
  falcon9.fireBoosterEngine = burning_9 && Math.abs(angleError) < 0.3;
}, 16);
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
      canReignite: true,
      maxLandingVelocity: 0.5,
      landingPad: { width: 40 },
      minThrottle: 0.10,
      initialAngle: 0.0,
      initialSpin: 0.25,
      initialPosition: { y: 40 },
      initialVelocity: { x: 0.05, y: 3.0 },
    },
    starter: `\
// Level 10 — Hoverslam
// The rocket is spinning and drifting sideways. Three problems to solve:
//   1. Kill the spin and get upright (left/right thrusters)
//   2. Steer slightly toward the pad (tilt into the drift, use engine for lateral force)
//   3. Fire the main engine at the exact right altitude to arrest your fall
//
// Physics:
//   enginePower = 0.10  |  gravity = 0.010  |  net decel = 0.09
//   Stopping distance: (vy² - targetVy²) / (2 × 0.09)
//   Landing velocity = |vx| + |vy| — lateral speed counts against your budget!
//
// Tip: tilt SLIGHTLY against your lateral drift so the engine nudges you toward pad center.
//   targetAngle ≈ -dx * kP - vx * kD   (try kP = 0.001, kD = 0.2)
//
// Monitor:
//   falcon9.altitude           — pixels to ground
//   falcon9.velocity.y         — downward speed
//   falcon9.velocity.x         — lateral speed
//   falcon9.position.x         — horizontal position
//   falcon9.angle              — tilt (radians, + = right)
//   falcon9.rotationalMomentum — spin rate

const NET_DECEL = 0.10 - 0.010;
const TARGET_VY = 0.3;
let   burning   = false;

setInterval(() => {
  const padX = game.canvas.width / 2;
  const dx   = falcon9.position.x - padX;
  const vx   = falcon9.velocity.x;
  const vy   = falcon9.velocity.y;
  const alt  = falcon9.altitude;

  // 1. PD angle control — null spin, lean against lateral drift
  const targetAngle = Math.max(-0.05, Math.min(0.05, -dx * /* kP */ 0 - vx * /* kD */ 0));
  const angleError  = falcon9.angle - targetAngle + falcon9.rotationalMomentum * /* gain */ 0;
  falcon9.fireLeftThruster  = angleError > 0.03;
  falcon9.fireRightThruster = angleError < -0.03;

  // 2. Hoverslam — compute ignition altitude and latch the burn
  const ignitionAlt = Math.max(0, vy * vy - TARGET_VY * TARGET_VY) / (2 * NET_DECEL);
  if (!burning && alt <= ignitionAlt * 1.08 && vy > TARGET_VY) burning = true;
  if (burning  && vy <= TARGET_VY)                              burning = false;
  falcon9.fireBoosterEngine = burning;
}, 16);
`,
    solution: `\
// Level 10 — Hoverslam (solution)
// PD control kills spin and steers toward pad; hoverslam handles vertical.
const NET_DECEL_10 = 0.10 - 0.010;
const TARGET_VY_10 = 0.3;
let   burning_10   = false;

setInterval(() => {
  const padX = game.canvas.width / 2;
  const dx   = falcon9.position.x - padX;
  const vx   = falcon9.velocity.x;
  const vy   = falcon9.velocity.y;
  const alt  = falcon9.altitude;

  // Lean slightly against drift so the engine nudges the ship pad-ward during the burn
  const targetAngle = Math.max(-0.05, Math.min(0.05, -dx * 0.001 - vx * 0.5));
  const angleError  = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 2;
  falcon9.fireLeftThruster  = angleError > 0.03;
  falcon9.fireRightThruster = angleError < -0.03;

  // Correct kinematic ignition altitude: (vy²-targetVy²)/(2*a)
  const ignitionAlt = Math.max(0, vy * vy - TARGET_VY_10 * TARGET_VY_10) / (2 * NET_DECEL_10);
  if (!burning_10 && alt <= ignitionAlt * 1.08 && vy > TARGET_VY_10) burning_10 = true;
  if (burning_10  && vy <= TARGET_VY_10)                               burning_10 = false;

  falcon9.fireBoosterEngine = burning_10;
}, 16);
`,
  },
];
