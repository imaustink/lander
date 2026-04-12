(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&t(r)}).observe(document,{childList:!0,subtree:!0});function a(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(e){if(e.ep)return;e.ep=!0;const n=a(e);fetch(e.href,n)}})();(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const n of e.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function o(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function a(t){if(t.ep)return;t.ep=!0;const e=o(t);fetch(t.href,e)}})();const l=[{config:{id:"Hello, Moon",gravity:.004,fuel:1/0,fuelConsumptionRate:0,enginePower:.04,canReignite:!0,maxLandingVelocity:3,initialAngle:0,initialVelocity:{x:.05,y:1.5}},starter:`// Level 1 — Hello, Moon
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
`,solution:`// Level 1 — Hello, Moon (solution)
// Fire booster whenever descending too fast; correct tilt with side thrusters.
setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;

  // Dampen any rotation to keep the ship upright
  falcon9.fireLeftThruster  = angle > 0.05 || spin > 0.5;
  falcon9.fireRightThruster = angle < -0.05 || spin < -0.5;

  falcon9.fireBoosterEngine = falcon9.velocity.y > 1.0;
}, 16);
`},{config:{id:"Tilted",gravity:.008,fuel:1/0,fuelConsumptionRate:0,enginePower:.04,canReignite:!0,maxLandingVelocity:2,initialAngle:.4,initialVelocity:{x:.2,y:.2}},starter:`// Level 2 — Tilted
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
`,solution:`// Level 2 — Tilted (solution)
// PD controller: correct angle and damp spin, then manage descent
setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  const error = angle + spin * 5; // predict where angle is heading

  falcon9.fireLeftThruster  = error > 0.05;
  falcon9.fireRightThruster = error < -0.05;
  falcon9.fireBoosterEngine = Math.abs(angle) < 0.3 && falcon9.velocity.y > 0.8;
}, 16);
`},{config:{id:"Steady the Ship",gravity:.01,fuel:1/0,fuelConsumptionRate:0,enginePower:.04,canReignite:!0,maxLandingVelocity:1.5,initialAngle:0,initialSpin:.1,initialVelocity:{x:0,y:.4},initialPosition:{x:400,y:100}},starter:`// Level 3 — Steady the Ship
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
`,solution:`// Level 3 — Steady the Ship (solution)
setInterval(() => {
  const error = falcon9.angle + falcon9.rotationalMomentum * 8;

  falcon9.fireLeftThruster  = error > 0.04;
  falcon9.fireRightThruster = error < -0.04;
  // Only thrust when reasonably upright and falling faster than 0.5
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.4 && falcon9.velocity.y > 0.5;
}, 16);
`},{config:{id:"Lateral Drift",gravity:.01,fuel:1/0,fuelConsumptionRate:0,enginePower:.04,canReignite:!0,maxLandingVelocity:1,initialAngle:0,initialVelocity:{x:1,y:.3},initialPosition:{x:400,y:80}},starter:`// Level 4 — Lateral Drift
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
`,solution:`// Level 4 — Lateral Drift (solution)
// Cancel horizontal velocity by tilting into it, then upright and brake
setInterval(() => {
  const vx  = falcon9.velocity.x;
  const vy  = falcon9.velocity.y;

  // Tilt proportional to horizontal velocity to cancel drift
  const targetAngle = Math.max(-0.5, Math.min(0.5, -vx * 0.5));
  const error = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;

  falcon9.fireLeftThruster  = error > 0.05;
  falcon9.fireRightThruster = error < -0.05;
  // Brake whenever descending OR still drifting, no altitude limit (infinite fuel)
  falcon9.fireBoosterEngine = Math.abs(error) < 0.3
    && (vy > 0.5 || Math.abs(vx) > 0.2);
}, 16);
`},{config:{id:"Bullseye",gravity:.01,fuel:1/0,fuelConsumptionRate:0,enginePower:.04,canReignite:!0,maxLandingVelocity:1,landingPad:{width:80},initialAngle:.1,initialVelocity:{x:.2,y:.3},initialPosition:{x:350,y:450}},starter:`// Level 5 — Bullseye
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
`,solution:`// Level 5 — Bullseye (solution)
// Bang-bang lateral: tilt left/right to steer toward the pad, then upright to brake.
setInterval(() => {
  const padX     = game.canvas.width / 2;
  const padHalf  = 40;                          // half of pad width (80)
  const posX     = falcon9.position.x;
  const vx       = falcon9.velocity.x;
  const vy       = falcon9.velocity.y;

  // Desired vx: cancel drift toward pad; maintain small approach if far away
  const err = padX - posX;
  // Brake when approaching — start early enough to overcome response lag
  const needsBrake = (vx > 0 && posX > padX - 70)
                  || (vx < 0 && posX < padX + 70);

  let targetAngle = 0;
  if (needsBrake) {
    // Brake: tilt against velocity direction
    targetAngle = vx > 0 ? -0.4 : 0.4;
  } else if (Math.abs(err) > padHalf) {
    // Move toward pad gently
    targetAngle = err > 0 ? 0.15 : -0.15;
  }

  const angleError = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 5;
  falcon9.fireLeftThruster  = angleError > 0.05;
  falcon9.fireRightThruster = angleError < -0.05;

  // Brake vertical descent whenever falling fast enough
  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.45 && vy > 0.35;
}, 16);
`},{config:{id:"On a Budget",gravity:.01,fuel:500,fuelConsumptionRate:.05,enginePower:.04,canReignite:!0,maxLandingVelocity:1,landingPad:{width:80},initialAngle:.1,initialVelocity:{x:.2,y:.2},initialPosition:{x:350,y:450}},starter:`// Level 6 — On a Budget
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
`,solution:`// Level 6 — On a Budget (solution)
// Bang-bang lateral + wide dead-band to avoid wasting scarce fuel.
setInterval(() => {
  const padX     = game.canvas.width / 2;
  const padHalf  = 40;
  const posX     = falcon9.position.x;
  const vx       = falcon9.velocity.x;
  const vy       = falcon9.velocity.y;

  const err = padX - posX;
  const needsBrake = (vx > 0 && posX > padX - 70)
                  || (vx < 0 && posX < padX + 70);

  let targetAngle = 0;
  if (needsBrake) {
    targetAngle = vx > 0 ? -0.4 : 0.4;
  } else if (Math.abs(err) > padHalf) {
    targetAngle = err > 0 ? 0.15 : -0.15;
  }

  const angleError = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 6;
  // Wider dead-band to save fuel
  falcon9.fireLeftThruster  = angleError > 0.12;
  falcon9.fireRightThruster = angleError < -0.12;

  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.45 && vy > 0.4;
}, 16);
`},{config:{id:"Minimum Power",gravity:.01,fuel:350,fuelConsumptionRate:.06,enginePower:.04,canReignite:!0,maxLandingVelocity:.9,landingPad:{width:60},minThrottle:.06,initialAngle:.15,initialVelocity:{x:.2,y:.3},initialPosition:{x:355,y:450}},starter:`// Level 7 — Minimum Power
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
`,solution:`// Level 7 — Minimum Power (solution)
// Powerful engine + wide dead-band: let momentum carry between correction pulses.
setInterval(() => {
  const padX     = game.canvas.width / 2;
  const padHalf  = 30;                          // half of pad width (60)
  const posX     = falcon9.position.x;
  const vx       = falcon9.velocity.x;
  const vy       = falcon9.velocity.y;

  const err = padX - posX;
  const needsBrake = (vx > 0 && posX > padX - 65)
                  || (vx < 0 && posX < padX + 65);

  let targetAngle = 0;
  if (needsBrake) {
    targetAngle = vx > 0 ? -0.4 : 0.4;
  } else if (Math.abs(err) > padHalf) {
    targetAngle = err > 0 ? 0.15 : -0.15;
  }

  const angleError = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 8;
  falcon9.fireLeftThruster  = angleError > 0.15;
  falcon9.fireRightThruster = angleError < -0.15;

  falcon9.fireBoosterEngine = Math.abs(falcon9.angle) < 0.45 && vy > 0.5;
}, 16);
`},{config:{id:"Precision Burn",gravity:.01,fuel:250,fuelConsumptionRate:.07,enginePower:.04,canReignite:!0,maxLandingVelocity:.8,landingPad:{width:40},minThrottle:.06,initialAngle:.1,initialVelocity:{x:.2,y:1.2},initialPosition:{x:360,y:450}},starter:`// Level 8 — Precision Burn
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
`,solution:`// Level 8 — Precision Burn (solution)
// Tight pad (40px), scarce fuel: PD steering + stopping-distance burn trigger
const NET_DECEL_8 = 0.04 - 0.010;  // enginePower - gravity
const TARGET_VY_8 = 0.4;
let   burning_8   = false;

setInterval(() => {
  const padX = game.canvas.width / 2;
  const posX = falcon9.position.x;
  const vx   = falcon9.velocity.x;
  const vy   = falcon9.velocity.y;
  const alt  = falcon9.altitude;

  const err      = padX - posX;
  const latDecel = 0.04 * Math.sin(0.35);
  const tStop    = Math.abs(vx) / latDecel;
  const dStop    = 0.5 * Math.abs(vx) * tStop;
  const needsBrake = (vx > 0 && posX + dStop > padX)
                  || (vx < 0 && posX - dStop < padX);
  let targetAngle = 0;
  if (needsBrake) { targetAngle = vx > 0 ? -0.35 : 0.35; }
  else if (Math.abs(err) > 20) { targetAngle = err > 0 ? 0.12 : -0.12; }

  const angleError  = falcon9.angle - targetAngle + falcon9.rotationalMomentum * 8;
  falcon9.fireLeftThruster  = angleError > 0.08;
  falcon9.fireRightThruster = angleError < -0.08;

  // Latch burn when stopping distance matches remaining altitude
  const excessVy     = Math.max(0, vy - TARGET_VY_8);
  const stoppingDist = (excessVy * excessVy) / (2 * NET_DECEL_8);
  if (!burning_8 && alt <= stoppingDist * 1.2 + 5 && vy > TARGET_VY_8) { burning_8 = true; }
  if ( burning_8 && vy <= TARGET_VY_8) { burning_8 = false; }
  // Only fire when close to upright to keep horizontal thrust minimal
  falcon9.fireBoosterEngine = burning_8 && Math.abs(falcon9.angle) < 0.25;
}, 16);
`},{config:{id:"The Long Fall",gravity:.01,fuel:200,fuelConsumptionRate:.08,enginePower:.04,canReignite:!0,maxLandingVelocity:.7,landingPad:{width:40},minThrottle:.08,initialAngle:0,initialSpin:0,initialPosition:{x:400,y:40},initialVelocity:{x:0,y:2}},starter:`// Level 9 — The Long Fall
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
`,solution:`// Level 9 — The Long Fall (solution)
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
`},{config:{id:"Hoverslam",gravity:.01,fuel:200,fuelConsumptionRate:.1,enginePower:.1,canReignite:!0,maxLandingVelocity:.5,landingPad:{width:40},minThrottle:.1,initialAngle:0,initialSpin:.25,initialPosition:{y:40},initialVelocity:{x:.05,y:3}},starter:`// Level 10 — Hoverslam
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
`,solution:`// Level 10 — Hoverslam (solution)
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
`}];export{l};
