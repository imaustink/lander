/**
 * Unit tests — createFalcon9Proxy (src/falcon9-proxy.ts)
 *
 * The proxy is tested against a minimal mock that matches the shape of Falcon9
 * without requiring a DOM or canvas.
 */

import { describe, it, expect, vi } from "vitest";
import { createFalcon9Proxy } from "./falcon9-proxy.js";
import type { Falcon9 } from "./entities/falcon-9.js";
import { Vector2 } from "./engine/vector2.js";

function makeMock() {
  const markCheater = vi.fn();
  const mock = {
    fireBoosterEngine: false,
    rotateLeft: 0 as number | boolean,
    rotateRight: 0 as number | boolean,
    velocity: new Vector2(0.5, 1.2),
    position: new Vector2(400, 100),
    angle: 0.3,
    fuelRemaining: 500,
    rotationalMomentum: 0.02,
    landed: false,
    markCheater,
  } as unknown as Falcon9;

  return { mock, markCheater };
}

describe("Falcon9Proxy — control flags", () => {
  it("allows writes to fireBoosterEngine", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.fireBoosterEngine = true;
    expect(mock.fireBoosterEngine).toBe(true);
  });

  it("allows writes to rotateLeft", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.rotateLeft = true;
    expect(mock.rotateLeft).toBe(true);
  });

  it("allows writes to rotateRight", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.rotateRight = true;
    expect(mock.rotateRight).toBe(true);
  });

  it("does NOT call markCheater when writing a control flag", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.fireBoosterEngine = true;
    proxy.rotateLeft = true;
    proxy.rotateRight = false;
    expect(markCheater).not.toHaveBeenCalled();
  });

  it("allows numeric values for thruster control flags", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    (proxy as unknown as Record<string, unknown>).rotateLeft = 0.5;
    (proxy as unknown as Record<string, unknown>).rotateRight = 0.75;
    expect(mock.rotateLeft).toBe(0.5);
    expect(mock.rotateRight).toBe(0.75);
    expect(markCheater).not.toHaveBeenCalled();
  });
});

describe("Falcon9Proxy — cheat detection", () => {
  it("calls markCheater when writing to angle", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.angle = 0;
    expect(markCheater).toHaveBeenCalledOnce();
  });

  it("calls markCheater when writing to fuelRemaining", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.fuelRemaining = 99999;
    expect(markCheater).toHaveBeenCalledOnce();
  });

  it("calls markCheater when writing to velocity (object replacement)", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    (proxy as unknown as Record<string, unknown>).velocity = new Vector2(0, 0);
    expect(markCheater).toHaveBeenCalledOnce();
  });

  it("calls markCheater when writing to position (object replacement)", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    (proxy as unknown as Record<string, unknown>).position = new Vector2(0, 0);
    expect(markCheater).toHaveBeenCalledOnce();
  });

  it("calls markCheater when writing to landed", () => {
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    proxy.landed = true;
    expect(markCheater).toHaveBeenCalledOnce();
  });
});

describe("Falcon9Proxy — nested Vector2 mutation protection", () => {
  it("velocity returned by proxy is frozen", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    const v = proxy.velocity;
    expect(Object.isFrozen(v)).toBe(true);
  });

  it("position returned by proxy is frozen", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    const p = proxy.position;
    expect(Object.isFrozen(p)).toBe(true);
  });

  it("frozen velocity is a clone — mutating it does not affect the real state", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    const frozenV = proxy.velocity;
    expect(() => { (frozenV as Vector2).y = 999; }).toThrow();
    // Real velocity unchanged
    expect(mock.velocity.y).toBe(1.2);
  });

  it("frozen velocity reflects the current value at read time", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    mock.velocity.y = 3.7; // engine writes directly to the real instance
    expect(proxy.velocity.y).toBe(3.7);
  });

  it("does NOT call markCheater when attempting to write to frozen velocity", () => {
    // The TypeError is thrown by Object.freeze, not the proxy set trap
    const { mock, markCheater } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    const frozenV = proxy.velocity;
    try { (frozenV as Vector2).y = 0; } catch { /* expected */ }
    expect(markCheater).not.toHaveBeenCalled();
  });
});

describe("Falcon9Proxy — reads pass through correctly", () => {
  it("reads angle from the underlying instance", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    expect(proxy.angle).toBe(0.3);
  });

  it("reads fuelRemaining from the underlying instance", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    expect(proxy.fuelRemaining).toBe(500);
  });

  it("reads updated values when the engine modifies the instance directly", () => {
    const { mock } = makeMock();
    const proxy = createFalcon9Proxy(mock, () => {});
    mock.angle = 1.5;
    expect(proxy.angle).toBe(1.5);
  });
});
