import type { Falcon9 } from "./entities/falcon-9.js";
import { Vector2 } from "./engine/vector2.js";

const CONTROL_FLAGS = new Set(["fireBoosterEngine", "fireLeftThruster", "fireRightThruster"]);
const FROZEN_VECTOR_PROPS = new Set(["velocity", "position"]);

/** The user-facing Falcon 9 interface — the three control flags plus read-only telemetry. */
export type Falcon9UserProxy = Falcon9 & {
  /** Register the flight controller function. Called once per guidance cycle (every rendered frame). */
  registerController(fn: () => void): void;
};

/**
 * Wraps a Falcon9 instance in a Proxy that:
 *  - Allows writes only to the three boolean control flags
 *  - Returns frozen clones of Vector2 properties so nested mutation is blocked
 *  - Calls markCheater() on any other write attempt
 *  - Exposes registerController() for the player to install their guidance algorithm
 */
export function createFalcon9Proxy(
  instance: Falcon9,
  registerController: (fn: () => void) => void,
): Falcon9UserProxy {
  return new Proxy(instance, {
    set(_target, prop: string | symbol, value: unknown): boolean {
      if (typeof prop === "string" && CONTROL_FLAGS.has(prop)) {
        (instance as unknown as Record<string, unknown>)[prop] = value;
        return true;
      }
      // Any write to a non-control property is cheating — blow up the ship
      instance.markCheater();
      return true;
    },
    get(target, prop: string | symbol): unknown {
      if (prop === "registerController") return registerController;
      const value = (target as unknown as Record<string | symbol, unknown>)[prop];
      // Return a frozen clone so user code cannot mutate velocity.y / position.x
      if (typeof prop === "string" && FROZEN_VECTOR_PROPS.has(prop) && value instanceof Vector2) {
        return Object.freeze(value.clone());
      }
      if (typeof value === "function") {
        return (value as Function).bind(target);
      }
      return value;
    },
  }) as Falcon9UserProxy;
}
