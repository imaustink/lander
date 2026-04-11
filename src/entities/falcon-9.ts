import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";
import { Vector2 } from "../engine/vector2.js";
import { getRandomInt } from "../engine/utils.js";

interface Falcon9Options {
  color?: string;
  width?: number;
  height?: number;
  position?: Partial<Vector2>;
  angle?: number;
  velocity?: Partial<Vector2>;
  rotationalMomentum?: number;
  dragCoefficient?: number;
}

export class Falcon9 implements Entity {
  readonly color: string;
  readonly width: number;
  readonly height: number;

  position: Vector2;
  velocity: Vector2;
  angle: number;
  rotationalMomentum: number;
  readonly dragCoefficient: number;

  // Level-sourced (can be overridden per-instance via options)
  fuelRemaining: number;
  readonly enginePower: number;
  readonly canReignite: boolean;
  readonly maxLandingVelocity: number;
  private _fuelConsumptionRate: number;

  // Control surface — set by user code or InputManager callbacks
  fireBoosterEngine = false;
  fireLeftThruster = false;
  fireRightThruster = false;

  // State
  landed = false;
  landingVelocity: number | null = null;
  private _boosterEverFired = false;
  private _boosterSealed = false;
  private _game!: GameEngine;

  constructor(game: GameEngine, options: Falcon9Options = {}) {
    this._game = game;
    const level = game.levels.current;
    const canvasW = game.canvas.width;
    const canvasH = game.canvas.height;

    this.color = options.color ?? "white";
    this.width = options.width ?? 14;
    this.height = options.height ?? 72;

    this.position = new Vector2(
      options.position?.x ?? canvasW / 2,
      options.position?.y ?? getRandomInt(0, canvasH / 4),
    );
    this.velocity = new Vector2(
      options.velocity?.x ?? getRandomInt(-1000, 1000) / 1000,
      options.velocity?.y ?? getRandomInt(0, 1000) / 1000,
    );
    this.angle = options.angle ?? getRandomInt(-500, 500) / 1000;
    this.rotationalMomentum = options.rotationalMomentum ?? getRandomInt(-100, 100) / 1000;
    this.dragCoefficient = options.dragCoefficient ?? 0.05;

    // Use level config as defaults
    this.fuelRemaining = level.fuel;
    this._fuelConsumptionRate = level.fuelConsumptionRate;
    this.enginePower = level.enginePower;
    this.canReignite = level.canReignite;
    this.maxLandingVelocity = level.maxLandingVelocity;

    // Apply optional level spawn overrides
    if (level.initialAngle !== undefined) this.angle = level.initialAngle;
    if (level.initialVelocity !== undefined) {
      this.velocity = new Vector2(
        level.initialVelocity.x ?? this.velocity.x,
        level.initialVelocity.y ?? this.velocity.y,
      );
    }
    if (level.initialPosition !== undefined) {
      this.position = new Vector2(
        level.initialPosition.x ?? this.position.x,
        level.initialPosition.y ?? this.position.y,
      );
    }

    game.addEntity(this);
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────

  private get _distanceToBottom(): number {
    const widthSine = Math.abs((this.width / 2) * Math.sin(this.angle));
    const heightCosine = Math.abs((this.height / 2) * Math.cos(this.angle));
    return widthSine + heightCosine;
  }

  private _minHeight(canvasHeight: number): number {
    return canvasHeight - this._distanceToBottom;
  }

  get altitude(): number {
    return this._minHeight(this._game.canvas.height) - this.position.y;
  }

  // ── Entity lifecycle ─────────────────────────────────────────────────────

  update(dt: number, game: GameEngine): void {
    if (this.landed) return;

    const t = dt / 16.67; // normalize to 60fps-equivalent step
    const level = game.levels.current;
    const hasFuel = this.fuelRemaining > 0;

    // Resolve booster sealed state
    if (!this.canReignite && this._boosterEverFired && !this.fireBoosterEngine) {
      this._boosterSealed = true;
    }

    const boosterActive = this.fireBoosterEngine && hasFuel && !this._boosterSealed;
    const leftActive = this.fireLeftThruster && hasFuel;
    const rightActive = this.fireRightThruster && hasFuel;

    if (boosterActive) this._boosterEverFired = true;

    // Consume fuel
    if (hasFuel) {
      let activeThrusterCount = 0;
      if (boosterActive) activeThrusterCount++;
      if (leftActive) activeThrusterCount++;
      if (rightActive) activeThrusterCount++;
      if (activeThrusterCount > 0) {
        this.fuelRemaining = Math.max(
          0,
          this.fuelRemaining - this._fuelConsumptionRate * activeThrusterCount * dt,
        );
      }
    }

    this._updateAngle(t, leftActive, rightActive, level.gravity);
    this._updateVelocity(t, boosterActive, level.gravity, level.minThrottle ?? this.enginePower);
    this._updatePosition(t, game);
  }

  private _updateAngle(t: number, leftActive: boolean, rightActive: boolean, gravity: number): void {
    if (rightActive) {
      this.rotationalMomentum += 0.01 * t;
    } else if (leftActive) {
      this.rotationalMomentum -= 0.01 * t;
    }

    // Gravity torque (pendulum effect)
    this.rotationalMomentum += 0.75 * Math.sin(this.angle) * gravity * t;

    // Angular drag
    const drag = this.dragCoefficient * 0.01 * t;
    if (this.rotationalMomentum > 0) {
      this.rotationalMomentum -= drag;
    } else {
      this.rotationalMomentum += drag;
    }

    this.angle += (Math.PI / 180) * this.rotationalMomentum;
  }

  private _updateVelocity(t: number, boosterActive: boolean, gravity: number, thrustPower: number): void {
    this.velocity.y += gravity * t;

    if (boosterActive) {
      this.velocity.x += thrustPower * Math.sin(this.angle) * t;
      this.velocity.y -= thrustPower * Math.cos(this.angle) * t;
    }
  }

  private _updatePosition(t: number, game: GameEngine): void {
    const minH = this._minHeight(game.canvas.height);
    this.position.x += this.velocity.x * t;
    this.position.y = Math.min(this.position.y + this.velocity.y * t, minH);

    if (this.position.y >= minH) {
      this.landed = true;
      this.landingVelocity = Math.abs(this.velocity.y) + Math.abs(this.velocity.x);
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.rotationalMomentum = 0;

      const level = game.levels.current;
      const onPad = level.landingPad === undefined
        ? true
        : (() => {
          const centerX = level.landingPad.centerX ?? game.canvas.width / 2;
          const half = level.landingPad.width / 2;
          return this.position.x >= centerX - half && this.position.x <= centerX + half;
        })();

      const won = this.landingVelocity < this.maxLandingVelocity && onPad;
      game.onEnd?.(won, {
        velocity: this.landingVelocity,
        max: this.maxLandingVelocity,
        levelIndex: game.levels.index,
        onPad,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const level = game.levels.current;
    if (level.landingPad !== undefined) {
      this._drawLandingPad(ctx, game);
    }
    ctx.save();
    this._drawShipBody(ctx);
    this._drawEngineFlames(ctx, game);
    ctx.restore();
    if (isFinite(level.fuel)) {
      this._drawFuelGauge(ctx, game);
    }
  }

  private _drawShipBody(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  private _drawEngineFlames(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    if (!this.fireBoosterEngine || this._boosterSealed || this.fuelRemaining <= 0) return;
    const thrustPower = game.levels.current.minThrottle ?? this.enginePower;
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.lineTo(0, this.height / 2 + Math.random() * 10 * (thrustPower / 0.04));
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fillStyle = "orange";
    ctx.fill();
  }

  private _drawLandingPad(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const pad = game.levels.current.landingPad!;
    const centerX = pad.centerX ?? game.canvas.width / 2;
    const halfW = pad.width / 2;
    const padY = game.canvas.height;
    const padH = 4;

    ctx.save();
    ctx.shadowColor = "#58a6ff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#58a6ff";
    ctx.fillRect(centerX - halfW, padY - padH, pad.width, padH);
    // Edge marker poles
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(centerX - halfW, padY - 12, 3, 12);
    ctx.fillRect(centerX + halfW - 3, padY - 12, 3, 12);
    ctx.restore();
  }

  private _drawFuelGauge(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    const level = game.levels.current;
    const ratio = Math.max(0, this.fuelRemaining / level.fuel);
    const barW = 120;
    const barH = 10;
    const x = 16;
    const y = 16;
    const r = barH / 2;

    ctx.save();

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
