export class Vector2 {
  constructor(public x: number, public y: number) {}

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  scale(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor);
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}
