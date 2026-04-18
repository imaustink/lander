import type { Entity } from "./entity.js";
import type { LevelConfig } from "./level.js";
import { LevelManager } from "./level.js";
import { InputManager } from "./input-manager.js";

const MAX_DT = 100; // ms — prevents physics spiral after tab-switch

export class GameEngine {
  readonly canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private _entities: Entity[] = [];
  private _rafId: number | null = null;
  private _lastTimestamp: number | null = null;
  private _resizeObserver: ResizeObserver;
  private _frameCallback: (() => void) | undefined;

  readonly levels = new LevelManager();
  readonly input: InputManager;

  /** Current horizontal scroll offset (world units). Increases as camera pans right. */
  cameraX: number = 0;
  /** Entity whose position drives the horizontal camera scroll. */
  cameraTarget: { position: { x: number } } | null = null;
  /** Y coordinate of the ground plane (world units). Defaults to canvas.height; surface entities may raise it. */
  groundY: number = 0;

  onLevelLoad?: (level: LevelConfig, index: number) => void;
  onEnd?: (won: boolean, details: { velocity: number; max: number; levelIndex: number; onPad: boolean }) => void;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`Canvas element #${canvasId} not found.`);
    this.canvas = canvas;
    this._ctx = canvas.getContext("2d")!;
    this.input = new InputManager(document);

    // Size canvas to its container initially and on resize
    this._syncCanvasSize();
    this._resizeObserver = new ResizeObserver(() => this._syncCanvasSize());
    this._resizeObserver.observe(canvas.parentElement ?? document.body);
  }

  private _syncCanvasSize(): void {
    const parent = this.canvas.parentElement ?? document.body;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.groundY = this.canvas.height;
  }

  // ── Loop control ──────────────────────────────────────────────────────────

  start(): void {
    if (this._rafId !== null) return; // already running
    this._lastTimestamp = null;
    this._tick(performance.now());
  }

  pause(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  resume(): void {
    if (this._rafId !== null) return;
    this._lastTimestamp = null;
    this._tick(performance.now());
  }

  /** Register a callback to be called once per frame, before physics is stepped. */
  onFrame(fn: () => void): void {
    this._frameCallback = fn;
  }

  stop(): void {
    this.pause();
    this._entities.forEach((e) => e.destroy?.());
    this._entities = [];
    this.input.destroy();
  }

  private _tick(timestamp: number): void {
    const dt = this._lastTimestamp !== null
      ? Math.min(timestamp - this._lastTimestamp, MAX_DT)
      : 0;
    this._lastTimestamp = timestamp;

    // ── Horizontal camera scroll (dead zone) ─────────────────────────────────
    if (this.cameraTarget !== null) {
      const screenX = this.cameraTarget.position.x - this.cameraX;
      const deadLeft  = this.canvas.width * 0.3;
      const deadRight = this.canvas.width * 0.7;
      if (screenX < deadLeft)  this.cameraX = this.cameraTarget.position.x - deadLeft;
      if (screenX > deadRight) this.cameraX = this.cameraTarget.position.x - deadRight;
    }

    this._frameCallback?.();

    this._ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const entity of this._entities) {
      entity.update(dt, this);
    }

    // Apply camera transform for all world-space rendering
    this._ctx.save();
    this._ctx.translate(-this.cameraX, 0);
    for (const entity of this._entities) {
      entity.render(this._ctx, this);
    }
    this._ctx.restore();

    this._rafId = requestAnimationFrame((ts) => this._tick(ts));
  }

  // ── Entity management ────────────────────────────────────────────────────

  addEntity(entity: Entity): void {
    this._entities.push(entity);
  }

  removeEntity(entity: Entity): void {
    const idx = this._entities.indexOf(entity);
    if (idx !== -1) this._entities.splice(idx, 1);
  }

  clearEntities(): void {
    this._entities.forEach((e) => e.destroy?.());
    this._entities = [];
  }

  // ── Level management ─────────────────────────────────────────────────────

  loadLevel(index: number): void {
    this.pause();
    this.clearEntities();
    this.cameraX = 0;
    this.cameraTarget = null;
    const level = this.levels.load(index);
    this.onLevelLoad?.(level, index);
  }
}
