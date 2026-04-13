export class InputManager {
  private _held = new Set<string>();
  private _pressHandlers = new Map<string, Set<() => void>>();
  private _releaseHandlers = new Map<string, Set<() => void>>();

  private _onKeyDown = (e: KeyboardEvent): void => {
    e.preventDefault();
    if (this._held.has(e.key)) return; // ignore key repeat
    this._held.add(e.key);
    this._pressHandlers.get(e.key)?.forEach((fn) => fn());
  };

  private _onKeyUp = (e: KeyboardEvent): void => {
    e.preventDefault();
    this._held.delete(e.key);
    this._releaseHandlers.get(e.key)?.forEach((fn) => fn());
  };

  constructor(target: Document) {
    target.addEventListener("keydown", this._onKeyDown);
    target.addEventListener("keyup", this._onKeyUp);
  }

  isPressed(key: string): boolean {
    return this._held.has(key);
  }

  onPress(key: string, handler: () => void): void {
    if (!this._pressHandlers.has(key)) {
      this._pressHandlers.set(key, new Set());
    }
    this._pressHandlers.get(key)!.add(handler);
  }

  onRelease(key: string, handler: () => void): void {
    if (!this._releaseHandlers.has(key)) {
      this._releaseHandlers.set(key, new Set());
    }
    this._releaseHandlers.get(key)!.add(handler);
  }

  destroy(): void {
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    this._held.clear();
    this._pressHandlers.clear();
    this._releaseHandlers.clear();
  }
}
