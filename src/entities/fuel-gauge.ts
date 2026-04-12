import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";

export interface FuelProvider {
  fuelRemaining: number;
}

export class FuelGauge implements Entity {
  private readonly _source: FuelProvider;

  constructor(game: GameEngine, source: FuelProvider) {
    this._source = source;
    game.addEntity(this);
  }

  update(_dt: number, _game: GameEngine): void {
    // stateless display — nothing to update
  }

  render(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const level = game.levels.current;
    if (!isFinite(level.fuel)) return;

    const ratio = Math.max(0, this._source.fuelRemaining / level.fuel);
    const barW = 120;
    const barH = 10;
    const x = 16;
    const y = 16;
    const r = barH / 2;

    ctx.save();
    // Reset to screen-space so HUD stays fixed regardless of camera offset
    ctx.resetTransform();

    // Label
    ctx.fillStyle = "#8b949e";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("FUEL", x, y - 4);

    // Background pill
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, r);
    ctx.fillStyle = "#21262d";
    ctx.fill();

    // Filled portion
    if (ratio > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, barW * ratio, barH, r);
      ctx.fillStyle = ratio > 0.3 ? "#3fb950" : ratio > 0.1 ? "#d29922" : "#f85149";
      ctx.fill();
    }

    ctx.restore();
  }
}
