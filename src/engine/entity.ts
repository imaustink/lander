import type { GameEngine } from "./game-engine.js";

export interface Entity {
  update(dt: number, game: GameEngine): void;
  render(ctx: CanvasRenderingContext2D, game: GameEngine): void;
  destroy?(): void;
}
