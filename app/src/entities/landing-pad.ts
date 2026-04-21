import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";

export class LandingPad implements Entity {
  constructor(game: GameEngine) {
    game.addEntity(this);
  }

  update(_dt: number, _game: GameEngine): void {
    // stateless — nothing to update
  }

  render(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const pad = game.levels.current.landingPad;
    if (pad === undefined) return;

    const s = game.scale;
    const centerX = pad.centerX ?? game.canvas.width / 2;
    const padW = pad.width * s;
    const halfW = padW / 2;
    const padY = game.groundY;
    const padH = 4;

    ctx.save();
    ctx.shadowColor = "#58a6ff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#58a6ff";
    ctx.fillRect(centerX - halfW, padY - padH, padW, padH);
    // Edge marker poles
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(centerX - halfW, padY - 12, 3, 12);
    ctx.fillRect(centerX + halfW - 3, padY - 12, 3, 12);
    ctx.restore();
  }
}
