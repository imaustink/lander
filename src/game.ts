import { GameEngine } from "./engine/game-engine.js";
import { Falcon9 } from "./entities/falcon-9.js";
import type { LevelConfig } from "./engine/level.js";

const game = new GameEngine("game");

// ── Level definitions ───────────────────────────────────────────────────────

game.levels
  // 1 — "Hello, Moon": nearly upright, barely moving; learn the three controls
  .define({
    id: "Hello, Moon",
    gravity: 0.004,
    fuel: Infinity,
    fuelConsumptionRate: 0,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 3.0,
    initialAngle: 0.08,
    initialVelocity: { x: 0.05, y: 0.1 },
  })
  // 2 — "Tilted": noticeable tilt; learn that thrusters control rotation
  .define({
    id: "Tilted",
    gravity: 0.008,
    fuel: Infinity,
    fuelConsumptionRate: 0,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 2.0,
    initialAngle: 0.4,
    initialVelocity: { x: 0.2, y: 0.2 },
  })
  // 3 — "Steady the Ship": random tilt + meaningful downward velocity
  .define({
    id: "Steady the Ship",
    gravity: 0.010,
    fuel: Infinity,
    fuelConsumptionRate: 0,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 1.5,
    initialVelocity: { y: 0.6 },
  })
  // 4 — "Lateral Drift": high horizontal velocity; learn angle-as-vector-control
  .define({
    id: "Lateral Drift",
    gravity: 0.010,
    fuel: Infinity,
    fuelConsumptionRate: 0,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 1.0,
    initialVelocity: { x: 1.0, y: 0.3 },
  })
  // 5 — "Bullseye": first landing pad; position management required
  .define({
    id: "Bullseye",
    gravity: 0.010,
    fuel: Infinity,
    fuelConsumptionRate: 0,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 1.0,
    landingPad: { width: 80 },
    initialVelocity: { x: 0.6, y: 0.3 },
  })
  // 6 — "On a Budget": fuel system introduced; encourage efficient control loops
  .define({
    id: "On a Budget",
    gravity: 0.010,
    fuel: 500,
    fuelConsumptionRate: 0.05,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 1.0,
    landingPad: { width: 80 },
  })
  // 7 — "Minimum Power": minThrottle = 1.5× normal; must pulse, can't feather
  .define({
    id: "Minimum Power",
    gravity: 0.010,
    fuel: 350,
    fuelConsumptionRate: 0.06,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 0.9,
    landingPad: { width: 60 },
    minThrottle: 0.06,
  })
  // 8 — "Precision Burn": narrow pad, scarce fuel, faster approach
  .define({
    id: "Precision Burn",
    gravity: 0.010,
    fuel: 250,
    fuelConsumptionRate: 0.07,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 0.8,
    landingPad: { width: 40 },
    minThrottle: 0.06,
    initialVelocity: { y: 1.2 },
  })
  // 9 — "The Long Fall": high-altitude drop, very scarce fuel; must plan burn windows
  .define({
    id: "The Long Fall",
    gravity: 0.010,
    fuel: 200,
    fuelConsumptionRate: 0.08,
    enginePower: 0.04,
    canReignite: true,
    maxLandingVelocity: 0.7,
    landingPad: { width: 40 },
    minThrottle: 0.08,
    initialPosition: { y: 40 },
    initialVelocity: { x: 0, y: 2.0 },
  })
  // 10 — "Hoverslam": full-power-only engine; one precisely timed suicide burn
  //   net decel while burning = minThrottle(0.10) − gravity(0.01) = 0.09 px/frame²
  //   stopping from v=3.0 takes ~33 frames and covers ~50px
  //   hint: monitor falcon9.altitude and falcon9.velocity.y to compute ignition point
  .define({
    id: "Hoverslam",
    gravity: 0.010,
    fuel: 120,
    fuelConsumptionRate: 0.10,
    enginePower: 0.10,
    canReignite: true,
    maxLandingVelocity: 0.5,
    landingPad: { width: 40 },
    minThrottle: 0.10,
    initialPosition: { y: 40 },
    initialVelocity: { x: 0, y: 3.0 },
  });

// ── Level load handler ──────────────────────────────────────────────────────

let falcon9: Falcon9;

game.onLevelLoad = (_level: LevelConfig, _index: number) => {
  falcon9 = new Falcon9(game);
  // Expose updated reference to user code
  (window as unknown as GameWindow).falcon9 = falcon9;
  game.start();
};

// ── End-of-level handler ────────────────────────────────────────────────────

game.onEnd = (won, { velocity, max, levelIndex, onPad }) => {
  game.pause();
  const levelName = game.levels.current.id ?? `Level ${levelIndex + 1}`;

  if (won) {
    if (game.levels.hasNext) {
      showOverlay(
        "success",
        `${levelName} complete!`,
        `Landing velocity: ${velocity.toFixed(2)} (max ${max.toFixed(2)})`,
        "Next Level",
        () => game.loadLevel(levelIndex + 1),
      );
    } else {
      showOverlay(
        "success",
        "Mission accomplished!",
        "All 10 levels complete. You nailed every landing.",
        "Play Again",
        () => game.loadLevel(0),
      );
    }
  } else {
    const detail = !onPad
      ? "Missed the landing pad."
      : `Landing velocity: ${velocity.toFixed(2)} — max allowed: ${max.toFixed(2)}`;
    showOverlay(
      "failure",
      `${levelName} failed`,
      detail,
      "Try Again",
      () => game.loadLevel(levelIndex),
    );
  }
};

// ── Overlay helper ──────────────────────────────────────────────────────────

type OverlayKind = "success" | "failure";

function showOverlay(
  kind: OverlayKind,
  heading: string,
  detail: string,
  buttonLabel: string,
  onAction: () => void,
): void {
  document.getElementById("__overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__overlay";
  overlay.style.cssText = `
    position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:12px;background:rgba(1,4,9,0.82);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    backdrop-filter:blur(4px);z-index:999;
  `;

  const accentColor = kind === "success" ? "#3fb950" : "#f85149";

  const h2 = document.createElement("h2");
  h2.textContent = heading;
  h2.style.cssText = `margin:0;font-size:22px;font-weight:700;color:${accentColor};letter-spacing:0.3px;`;

  const p = document.createElement("p");
  p.textContent = detail;
  p.style.cssText = "margin:0;font-size:13px;color:#8b949e;";

  const btn = document.createElement("button");
  btn.textContent = buttonLabel;
  btn.style.cssText = `
    margin-top:8px;padding:8px 24px;background:${accentColor};color:#fff;
    border:none;border-radius:6px;font-size:13px;font-weight:700;
    letter-spacing:0.5px;cursor:pointer;
  `;
  btn.addEventListener("click", () => {
    overlay.remove();
    onAction();
  });

  overlay.append(h2, p, btn);
  document.body.appendChild(overlay);
}

// ── Boot ────────────────────────────────────────────────────────────────────

interface GameWindow extends Window {
  game: GameEngine;
  falcon9: Falcon9;
}

(window as unknown as GameWindow).game = game;

// Kick off level 1; editor.ts calls game.start() after iframe load,
// but loadLevel triggers onLevelLoad which calls start() — so we delay
// the initial load until the editor signals readiness via game.start().
// We override start() once to intercept the first call from editor.ts
// and convert it into a loadLevel(0).
const _originalStart = game.start.bind(game);
game.start = () => {
  game.start = _originalStart; // restore immediately
  game.loadLevel(0);          // this calls onLevelLoad → new Falcon9 → _originalStart
};
