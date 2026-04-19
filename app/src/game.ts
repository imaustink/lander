import { GameEngine } from "./engine/game-engine.js";
import { Falcon9 } from "./entities/falcon-9.js";
import { Starfield } from "./entities/starfield.js";
import { MoonSurface } from "./entities/moon-surface.js";
import { LandingPad } from "./entities/landing-pad.js";
import { FuelGauge } from "./entities/fuel-gauge.js";
import type { LevelConfig } from "./engine/level.js";
import { LEVELS } from "./levels.js";
import { createFalcon9Proxy, type Falcon9UserProxy } from "./falcon9-proxy.js";

const game = new GameEngine("game");

// ── Level definitions ───────────────────────────────────────────────────────

for (const { config } of LEVELS) {
  game.levels.define(config);
}

// ── Level load handler ──────────────────────────────────────────────────────

let falcon9: Falcon9;

game.onLevelLoad = (_level: LevelConfig, _index: number) => {
  new Starfield(game);
  new MoonSurface(game);
  new LandingPad(game);
  falcon9 = new Falcon9(game);
  new FuelGauge(game, falcon9);
  // Expose a read-guarded proxy — user code can only write the three control flags
  // and register their guidance algorithm via falcon9.registerController()
  (window as unknown as GameWindow).falcon9 = createFalcon9Proxy(falcon9, (fn) => game.onFrame(fn));
  // Notify parent window so the level selector stays in sync
  window.parent.postMessage({ type: "levelLoaded", index: _index }, "*");
  game.start();
};

// ── End-of-level handler ────────────────────────────────────────────────────

// Ask the parent editor to fully re-run the user's code for the given level.
// This recreates the iframe so module-scoped state in the user's script
// (e.g. latch flags like `burning_10`) is reset on replay.
function requestRun(levelIndex: number): void {
  window.parent.postMessage({ type: "runLevel", index: levelIndex }, "*");
}

game.onEnd = (won, { velocity, max, levelIndex, onPad, angle, maxAngle }) => {
  game.pause();
  const levelName = game.levels.current.id ?? `Level ${levelIndex + 1}`;

  const replay = { label: "Replay", onAction: () => requestRun(levelIndex) };

  if (won) {
    if (game.levels.hasNext) {
      showOverlay(
        "success",
        `${levelName} complete!`,
        `Landing velocity: ${velocity.toFixed(2)} (max ${max.toFixed(2)})`,
        "Next Level",
        () => requestRun(levelIndex + 1),
        replay,
      );
    } else {
      showOverlay(
        "success",
        "Mission accomplished!",
        "All 10 levels complete. You nailed every landing.",
        "Play Again",
        () => requestRun(0),
        replay,
      );
    }
  } else {
    const tiltDeg = (angle * 180 / Math.PI).toFixed(1);
    const maxDeg  = maxAngle !== undefined ? (maxAngle * 180 / Math.PI).toFixed(1) : null;
    const detail = !onPad
      ? "Missed the landing pad."
      : (maxAngle !== undefined && Math.abs(angle) > maxAngle)
        ? `Landed at ${tiltDeg}° tilt — max allowed: ±${maxDeg}°`
        : `Landing velocity: ${velocity.toFixed(2)} — max allowed: ${max.toFixed(2)}`;
    showOverlay(
      "failure",
      `${levelName} failed`,
      detail,
      "Try Again",
      () => requestRun(levelIndex),
    );
  }
};

// ── Overlay helper ──────────────────────────────────────────────────────────

type OverlayKind = "success" | "failure";

interface OverlayAction {
  label: string;
  onAction: () => void;
}

function showOverlay(
  kind: OverlayKind,
  heading: string,
  detail: string,
  buttonLabel: string,
  onAction: () => void,
  secondary?: OverlayAction,
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

  const actions = document.createElement("div");
  actions.style.cssText = "margin-top:8px;display:flex;gap:10px;align-items:center;";

  const btn = document.createElement("button");
  btn.textContent = buttonLabel;
  btn.style.cssText = `
    padding:8px 24px;background:${accentColor};color:#fff;
    border:none;border-radius:6px;font-size:13px;font-weight:700;
    letter-spacing:0.5px;cursor:pointer;
  `;

  const cleanup = (): void => {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  const handleAction = (): void => {
    cleanup();
    onAction();
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Enter") handleAction();
  };

  btn.addEventListener("click", handleAction);
  document.addEventListener("keydown", onKeyDown);
  actions.appendChild(btn);

  if (secondary) {
    const secondaryBtn = document.createElement("button");
    secondaryBtn.textContent = secondary.label;
    secondaryBtn.style.cssText = `
      padding:8px 20px;background:transparent;color:#e6edf3;
      border:1px solid #30363d;border-radius:6px;font-size:13px;font-weight:600;
      letter-spacing:0.5px;cursor:pointer;transition:border-color 0.15s,color 0.15s;
    `;
    secondaryBtn.addEventListener("mouseenter", () => {
      secondaryBtn.style.borderColor = "#8b949e";
    });
    secondaryBtn.addEventListener("mouseleave", () => {
      secondaryBtn.style.borderColor = "#30363d";
    });
    secondaryBtn.addEventListener("click", () => {
      cleanup();
      secondary.onAction();
    });
    actions.appendChild(secondaryBtn);
  }

  overlay.append(h2, p, actions);
  document.body.appendChild(overlay);
  btn.focus();
}

// ── Boot ────────────────────────────────────────────────────────────────────

interface GameWindow extends Window {
  game: GameEngine;
  falcon9: Falcon9UserProxy;
  __startLevel?: number;
}

(window as unknown as GameWindow).game = game;

// Intercept the first game.start() from editor.ts and convert it into
// a loadLevel() targeting the level the editor injected via __startLevel.
const _originalStart = game.start.bind(game);
game.start = () => {
  game.start = _originalStart;
  const startIndex = (window as unknown as GameWindow).__startLevel ?? 0;
  game.loadLevel(startIndex);
};
