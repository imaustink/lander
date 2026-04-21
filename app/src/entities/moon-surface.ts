import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";

interface Crater {
  x: number;
  y: number;
  rx: number; // horizontal radius
  ry: number; // vertical radius (flatter than rx)
}

interface Rock {
  x: number;
  y: number;
  rx: number;
  ry: number;
  angle: number;
}

export const SURFACE_HEIGHT = 50;
const WORLD_LEFT = -3000;
const WORLD_RIGHT = 13000;
const WORLD_SPAN = WORLD_RIGHT - WORLD_LEFT;

export class MoonSurface implements Entity {
  private _craters: Crater[] = [];
  private _rocks: Rock[] = [];
  constructor(game: GameEngine) {
    this._generate();
    game.groundY = game.canvas.height - SURFACE_HEIGHT;
    game.addEntity(this);
  }

  private _generate(): void {
    // ── Craters ────────────────────────────────────────────────────────────
    const craterCount = 70;
    for (let i = 0; i < craterCount; i++) {
      const rx = 4 + Math.random() * 26;
      const ry = rx * (0.25 + Math.random() * 0.2); // flat, elliptical
      const x = WORLD_LEFT + Math.random() * WORLD_SPAN;
      // y is stored as offset from surface top, so it stays correct after resize
      const y = ry + Math.random() * (SURFACE_HEIGHT - ry * 2);
      this._craters.push({ x, y, rx, ry });
    }

    // ── Rocks ─────────────────────────────────────────────────────────────
    const rockCount = 50;
    for (let i = 0; i < rockCount; i++) {
      const rx = 2 + Math.random() * 7;
      const ry = rx * (0.5 + Math.random() * 0.6);
      const x = WORLD_LEFT + Math.random() * WORLD_SPAN;
      const y = ry; // offset from surface top; ry keeps the rock sitting on the surface
      this._rocks.push({ x, y, rx, ry, angle: Math.random() * Math.PI });
    }
  }

  update(_dt: number, game: GameEngine): void {
    game.groundY = game.canvas.height - SURFACE_HEIGHT;
  }

  render(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const ch = game.canvas.height;
    const cw = game.canvas.width;
    const camX = game.cameraX;
    const surfaceTop = ch - SURFACE_HEIGHT;

    // ── Base surface fill ──────────────────────────────────────────────────
    // Extend a bit beyond the visible viewport on both sides
    const fillLeft  = camX - 200;
    const fillWidth = cw + 400;

    ctx.fillStyle = "#9a9a9a";
    ctx.fillRect(fillLeft, surfaceTop, fillWidth, SURFACE_HEIGHT);

    // Slightly lighter sub-layer for depth
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(fillLeft, surfaceTop, fillWidth, 6);

    // Horizon edge — darker line at top of surface
    ctx.fillStyle = "#707070";
    ctx.fillRect(fillLeft, surfaceTop, fillWidth, 2);

    // ── Craters ────────────────────────────────────────────────────────────
    const viewLeft  = camX - 100;
    const viewRight = camX + cw + 100;

    for (const c of this._craters) {
      if (c.x + c.rx < viewLeft || c.x - c.rx > viewRight) continue;
      const cy = surfaceTop + c.y;

      // Dark interior
      ctx.beginPath();
      ctx.ellipse(c.x, cy, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#6e6e6e";
      ctx.fill();

      // Lighter crescent rim at the top
      ctx.beginPath();
      ctx.ellipse(c.x, cy - c.ry * 0.25, c.rx * 0.9, c.ry * 0.45, 0, Math.PI, 0);
      ctx.fillStyle = "rgba(200, 200, 200, 0.55)";
      ctx.fill();

      // Subtle outer shadow ring
      ctx.beginPath();
      ctx.ellipse(c.x, cy, c.rx + 1.5, c.ry + 1, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(80, 80, 80, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Rocks ──────────────────────────────────────────────────────────────
    for (const r of this._rocks) {
      if (r.x + r.rx < viewLeft || r.x - r.rx > viewRight) continue;

      ctx.save();
      ctx.translate(r.x, surfaceTop + r.y);
      ctx.rotate(r.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, r.rx, r.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#888";
      ctx.fill();
      // Highlight facet
      ctx.beginPath();
      ctx.ellipse(-r.rx * 0.2, -r.ry * 0.3, r.rx * 0.4, r.ry * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(180,180,180,0.5)";
      ctx.fill();
      ctx.restore();
    }
  }
}
