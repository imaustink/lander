export interface LevelConfig {
  /** Optional display name shown in overlays */
  id?: string;
  /** Downward gravitational acceleration per ms (e.g. 0.01) */
  gravity: number;
  /** Starting fuel units. Use Infinity for unlimited. */
  fuel: number;
  /** Fuel units consumed per ms per active thruster */
  fuelConsumptionRate: number;
  /** Thrust force coefficient (maps to thrustCoefficient on the rocket) */
  enginePower: number;
  /** Whether the booster can be re-ignited once cut */
  canReignite: boolean;
  /** Maximum combined landing velocity for a successful landing */
  maxLandingVelocity: number;
  /** Maximum absolute tilt (radians) at touchdown. Omit to skip the angle check. */
  maxLandingAngle?: number;
  /** Optional landing pad. Rocket must land within [centerX - width/2, centerX + width/2]. centerX defaults to canvas center. */
  landingPad?: { width: number; centerX?: number };
  /** Minimum booster thrust when fired — engine fires at this power level or not at all. Overrides enginePower for thrust calculation. */
  minThrottle?: number;
  /** Optional spawn overrides — undefined fields default to random */
  initialAngle?: number;
  initialSpin?: number;
  /**
   * Spawn velocity. `x`/`y` are absolute pixel-per-frame values; `xPerWidth`
   * and `yPerHeight` scale the velocity to canvas dimensions and take
   * precedence over their absolute counterparts. Use the per-width form for
   * lateral drifts that should look the same regardless of viewport size.
   */
  initialVelocity?: { x?: number; y?: number; xPerWidth?: number; xPerHeight?: number; yPerHeight?: number };
  /**
   * Spawn position. `x`/`y` are absolute pixel values; `xRatio`/`yRatio` are
   * canvas-relative fractions (0 = left/top, 1 = right/bottom) and take
   * precedence over their absolute counterparts when supplied. Use ratios
   * for spawns that should scale with viewport width (e.g. arcs starting
   * at a screen edge). `xPerHeight` sets x = canvasHeight × value, useful
   * when horizontal distance must stay proportional to physics (which scales
   * with height); it takes precedence over `xRatio` and `x`.
   */
  initialPosition?: { x?: number; y?: number; xRatio?: number; yRatio?: number; xPerHeight?: number };
}

export class LevelManager {
  private _levels: LevelConfig[] = [];
  private _index = 0;

  get current(): LevelConfig {
    if (this._levels.length === 0) {
      throw new Error("No levels defined. Call LevelManager.define() first.");
    }
    return this._levels[this._index];
  }

  get index(): number {
    return this._index;
  }

  get total(): number {
    return this._levels.length;
  }

  get hasNext(): boolean {
    return this._index < this._levels.length - 1;
  }

  /** Fluent — chain calls to register multiple levels in order */
  define(config: LevelConfig): this {
    this._levels.push(config);
    return this;
  }

  load(index: number): LevelConfig {
    if (index < 0 || index >= this._levels.length) {
      throw new RangeError(`Level index ${index} is out of bounds (0–${this._levels.length - 1}).`);
    }
    this._index = index;
    return this._levels[index];
  }

  /** Advances to the next level and returns it, or null if already on the last. */
  next(): LevelConfig | null {
    if (!this.hasNext) return null;
    this._index += 1;
    return this._levels[this._index];
  }
}
