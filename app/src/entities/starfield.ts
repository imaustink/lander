import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";

interface Star {
  /** Normalised x in [0, 1) — fraction of canvas width at spawn time */
  nx: number;
  /** Normalised y in [0, 1) — fraction of canvas height at spawn time */
  ny: number;
  /** Radius in pixels */
  radius: number;
  /** Parallax depth: 0 = fixed, 1 = scrolls with world */
  depth: number;
  /** Pre-computed opacity */
  opacity: number;
}

const STAR_COUNT = 200;

export class Starfield implements Entity {
  private _stars: Star[] = [];

  constructor(game: GameEngine) {
    this._generateStars(game.canvas.width, game.canvas.height);
    game.addEntity(this);
  }

  private _generateStars(w: number, h: number): void {
    this._stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      this._stars.push({
        nx:      Math.random(),
        ny:      Math.random(),
        radius:  Math.random() < 0.15 ? 1.5 : Math.random() < 0.5 ? 1 : 0.5,
        depth:   Math.random() * 0.25, // very subtle parallax (0–25% of cameraX)
        opacity: 0.4 + Math.random() * 0.6,
      });
    }
  }

  // Stars don't need physics updates
  update(_dt: number, _game: GameEngine): void {}

  render(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const w = game.canvas.width;
    const h = game.canvas.height;

    // Draw in screen-space so stars are always visible
    ctx.save();
    ctx.resetTransform();

    for (const star of this._stars) {
      // Base screen position from normalised coords
      const baseX = star.nx * w;
      // Shift slightly with cameraX for parallax depth
      const screenX = ((baseX - game.cameraX * star.depth) % w + w) % w;
      const screenY = star.ny * h;

      ctx.beginPath();
      ctx.arc(screenX, screenY, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    }

    ctx.restore();
  }
}
