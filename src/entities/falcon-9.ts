import type { Entity } from "../engine/entity.js";
import type { GameEngine } from "../engine/game-engine.js";
import { Vector2 } from "../engine/vector2.js";
import { getRandomInt } from "../engine/utils.js";
import {
  distanceToBottom,
  resolveBoosterSealed,
  consumeFuel,
  stepAngle,
  stepVelocity,
  stepPosition,
} from "../engine/physics.js";

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
  private _cheater = false;
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
    if (level.initialSpin  !== undefined) this.rotationalMomentum = level.initialSpin;
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
    game.cameraTarget = this;
  }

  destroy(): void {
    if (this._game.cameraTarget === this) {
      this._game.cameraTarget = null;
    }
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────

  // The nozzle bell extends 7px below the ship body (hh → hh+7).
  // Adding 14 to height makes distanceToBottom() reach the nozzle tip.
  private get _effectiveHeight(): number {
    return this.height + 14;
  }

  private get _distanceToBottom(): number {
    return distanceToBottom(this.angle, this.width, this._effectiveHeight);
  }

  private _minHeight(groundY: number): number {
    return groundY - this._distanceToBottom;
  }

  get altitude(): number {
    return this._minHeight(this._game.groundY) - this.position.y;
  }

  markCheater(): void {
    if (this._cheater) return;
    this._cheater = true;
    // Kill thrust, fling ship downward at clearly lethal speed
    this.fireBoosterEngine = false;
    this.fireLeftThruster = false;
    this.fireRightThruster = false;
    this.fuelRemaining = 0;
    this.velocity.x = (Math.random() - 0.5) * 8;
    this.velocity.y = 20;
    this.rotationalMomentum = (Math.random() - 0.5) * 0.4;
  }

  // ── Entity lifecycle ─────────────────────────────────────────────────────

  update(dt: number, game: GameEngine): void {
    if (this.landed) return;

    const t = dt / 16.67; // normalize to 60fps-equivalent step
    const level = game.levels.current;
    const hasFuel = this.fuelRemaining > 0;

    // Resolve booster sealed state
    this._boosterSealed = resolveBoosterSealed(
      this.canReignite,
      this._boosterEverFired,
      this.fireBoosterEngine,
      this._boosterSealed,
    );

    const boosterActive = this.fireBoosterEngine && hasFuel && !this._boosterSealed;
    const leftActive = this.fireLeftThruster && hasFuel;
    const rightActive = this.fireRightThruster && hasFuel;

    if (boosterActive) this._boosterEverFired = true;

    // Consume fuel — thrusters (grid fins / thrust vectoring) are free;
    // only the main booster engine burns propellant.
    if (hasFuel) {
      const activeThrusterCount = boosterActive ? 1 : 0;
      this.fuelRemaining = consumeFuel(
        this.fuelRemaining, this._fuelConsumptionRate, activeThrusterCount, dt,
      );
    }

    this._updateAngle(t, leftActive, rightActive, level.gravity);
    this._updateVelocity(t, boosterActive, level.gravity, level.minThrottle ?? this.enginePower);
    this._updatePosition(t, game);
  }

  private _updateAngle(t: number, leftActive: boolean, rightActive: boolean, gravity: number): void {
    ({ angle: this.angle, rotMomentum: this.rotationalMomentum } = stepAngle(
      this.angle, this.rotationalMomentum, t, leftActive, rightActive, gravity, this.dragCoefficient,
    ));
  }

  private _updateVelocity(t: number, boosterActive: boolean, gravity: number, thrustPower: number): void {
    ({ velX: this.velocity.x, velY: this.velocity.y } = stepVelocity(
      this.velocity.x, this.velocity.y, this.angle, t, boosterActive, gravity, thrustPower,
    ));
  }

  private _updatePosition(t: number, game: GameEngine): void {
    const pos = stepPosition(
      this.position.x, this.position.y,
      this.velocity.x, this.velocity.y,
      this.angle, t, game.groundY, this.width, this._effectiveHeight,
    );
    this.position.x = pos.posX;
    this.position.y = pos.posY;

    if (pos.landed) {
      this.landed = true;
      this.landingVelocity = pos.landingVelocity;
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

      const won = this.landingVelocity! < this.maxLandingVelocity && onPad;
      game.onEnd?.(won, {
        velocity: this.landingVelocity!,
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
    if (this._cheater) {
      this._drawCheaterOverlay(ctx, game);
    }
  }

  private _drawShipBody(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const hw = w / 2;  // half-width
    const hh = h / 2; // half-height (top = -hh, bottom = +hh)

    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // ── Nose cone ────────────────────────────────────────────────────────────
    // Pointed tip at top, fans out to stage-2 width
    const s2Half = hw * 0.52; // stage-2 half-width
    const noseBase = -hh + h * 0.12; // y where nose meets stage 2
    ctx.beginPath();
    ctx.moveTo(0, -hh);           // tip
    ctx.lineTo(s2Half, noseBase);
    ctx.lineTo(-s2Half, noseBase);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // ── Stage 2 ───────────────────────────────────────────────────────────────
    const s2Top = noseBase;
    const s2Bot = -hh + h * 0.32;
    ctx.fillStyle = this.color;
    ctx.fillRect(-s2Half, s2Top, s2Half * 2, s2Bot - s2Top);

    // ── Interstage band ───────────────────────────────────────────────────────
    const bandH = 4;
    const bandTop = s2Bot;
    ctx.fillStyle = "#555";
    ctx.fillRect(-hw, bandTop, w, bandH);

    // ── Stage 1 body ─────────────────────────────────────────────────────────
    const s1Top = bandTop + bandH;
    const octawebH = 5;
    const s1Bot = hh - octawebH;
    ctx.fillStyle = this.color;
    ctx.fillRect(-hw, s1Top, w, s1Bot - s1Top);

    // SPACEX text on stage 1
    const labelY = s1Top + (s1Bot - s1Top) * 0.45;
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = `bold ${Math.max(4, w * 0.45)}px 'Arial Narrow', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPACEX", -labelY, 0);
    ctx.restore();

    // ── Grid fins (just below interstage, top of stage 1) ───────────────────
    const finW = w * 0.6;
    const finH = 3.5;
    const finY = s1Top + 3;
    ctx.fillStyle = "#888";
    // Left fin
    ctx.fillRect(-hw - finW + 1, finY, finW, finH);
    // Right fin
    ctx.fillRect(hw - 1, finY, finW, finH);
    // Thin strut connecting fin to body
    ctx.fillStyle = "#666";
    ctx.fillRect(-hw - 1, finY, 2, finH);
    ctx.fillRect(hw - 1, finY, 2, finH);

    // ── Octaweb base (engine section) ────────────────────────────────────────
    ctx.fillStyle = "#444";
    ctx.fillRect(-hw - 1.5, s1Bot, w + 3, octawebH);

    // ── Landing legs ─────────────────────────────────────────────────────────
    const legTopY = s1Bot - h * 0.18; // attach point on stage 1
    const legBotY = hh + 2;           // foot lands slightly below body bottom
    const legSpreadX = hw * 3.2;      // how far out the foot extends
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 1.2;
    // Main strut
    ctx.beginPath();
    ctx.moveTo(-hw * 0.7, legTopY);
    ctx.lineTo(-legSpreadX, legBotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw * 0.7, legTopY);
    ctx.lineTo(legSpreadX, legBotY);
    ctx.stroke();
    // Diagonal brace
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(-hw, legTopY + h * 0.06);
    ctx.lineTo(-legSpreadX, legBotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw, legTopY + h * 0.06);
    ctx.lineTo(legSpreadX, legBotY);
    ctx.stroke();

    // ── Engine nozzle bell ───────────────────────────────────────────────────
    const nozzleTopW = hw * 0.55;
    const nozzleBotW = hw * 0.85;
    const nozzleTop = hh;
    const nozzleBot = hh + 7;
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(-nozzleTopW, nozzleTop);
    ctx.lineTo(nozzleTopW, nozzleTop);
    ctx.lineTo(nozzleBotW, nozzleBot);
    ctx.lineTo(-nozzleBotW, nozzleBot);
    ctx.closePath();
    ctx.fill();
    // nozzle inner highlight
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(-nozzleTopW * 0.6, nozzleTop);
    ctx.lineTo(nozzleTopW * 0.6, nozzleTop);
    ctx.lineTo(nozzleBotW * 0.6, nozzleBot);
    ctx.lineTo(-nozzleBotW * 0.6, nozzleBot);
    ctx.closePath();
    ctx.fill();
  }

  private _drawEngineFlames(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    if (!this.fireBoosterEngine || this._boosterSealed || this.fuelRemaining <= 0) return;
    const thrustPower = game.levels.current.minThrottle ?? this.enginePower;
    const scale = thrustPower / 0.04;
    // Flame origin: base of nozzle bell
    const nozzleBotW = (this.width / 2) * 0.85;
    const flameOriginY = this.height / 2 + 7;
    const flameLen = 14 + Math.random() * 20 * scale;
    const flickerX = (Math.random() - 0.5) * 4;

    // Outer plume (orange)
    ctx.beginPath();
    ctx.moveTo(-nozzleBotW, flameOriginY);
    ctx.lineTo(nozzleBotW, flameOriginY);
    ctx.quadraticCurveTo(
      flickerX + (Math.random() - 0.5) * 6,
      flameOriginY + flameLen * 0.7,
      flickerX,
      flameOriginY + flameLen,
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 140, 0, 0.9)";
    ctx.fill();

    // Mid plume (yellow)
    const midW = nozzleBotW * 0.55;
    const midLen = flameLen * 0.72;
    ctx.beginPath();
    ctx.moveTo(-midW, flameOriginY);
    ctx.lineTo(midW, flameOriginY);
    ctx.quadraticCurveTo(
      flickerX * 0.5,
      flameOriginY + midLen * 0.6,
      flickerX * 0.5,
      flameOriginY + midLen,
    );
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 230, 80, 0.95)";
    ctx.fill();

    // Inner core (bright white)
    const coreW = nozzleBotW * 0.28;
    const coreLen = flameLen * 0.42;
    ctx.beginPath();
    ctx.moveTo(-coreW, flameOriginY);
    ctx.lineTo(coreW, flameOriginY);
    ctx.lineTo(0, flameOriginY + coreLen);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 240, 1)";
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

  private _drawCheaterOverlay(ctx: CanvasRenderingContext2D, game: GameEngine): void {
    ctx.save();
    ctx.resetTransform();
    const cw = game.canvas.width;
    const ch = game.canvas.height;

    // Dark vignette
    ctx.fillStyle = "rgba(139,0,0,0.35)";
    ctx.fillRect(0, 0, cw, ch);

    const text = "CHEATER";
    const fontSize = Math.min(cw * 0.2, 160);
    ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Shadow
    ctx.shadowColor = "#f85149";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#f85149";
    ctx.fillText(text, cw / 2, ch / 2);

    // Bright core
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff6b6b";
    ctx.fillText(text, cw / 2, ch / 2);

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
