import { GameEngine } from "./engine/game-engine.js";
import { Falcon9 } from "./entities/falcon-9.js";
import { Starfield } from "./entities/starfield.js";
import { MoonSurface } from "./entities/moon-surface.js";
import type { LevelConfig } from "./engine/level.js";
import { LEVELS } from "./levels.js";

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
  falcon9 = new Falcon9(game);
  // Expose updated reference to user code
  (window as unknown as GameWindow).falcon9 = falcon9;
  // Notify parent window so the level selector stays in sync
  window.parent.postMessage({ type: "levelLoaded", index: _index }, "*");
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
