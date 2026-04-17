import { LEVELS } from "./levels.js";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const gameContainer   = document.getElementById("game-container")  as HTMLElement;
const gamePlaceholder = document.getElementById("game-placeholder") as HTMLElement;
const gameDot         = document.getElementById("game-dot")         as HTMLElement;
const run             = document.getElementById("run")              as HTMLButtonElement;
const levelSelect     = document.getElementById("level-select")     as HTMLSelectElement;
const showSolution    = document.getElementById("show-solution")    as HTMLButtonElement;
const confirmDialog   = document.getElementById("confirm-solution") as HTMLDialogElement;
const dialogCancel    = document.getElementById("dialog-cancel")    as HTMLButtonElement;
const dialogConfirm   = document.getElementById("dialog-confirm")   as HTMLButtonElement;

// Monaco AMD loader declarations
declare const require: {
  config(opts: object): void;
  (deps: string[], factory: (...args: unknown[]) => void): void;
};
declare const monaco: {
  editor: {
    create(el: HTMLElement | null, opts: object): MonacoEditor;
  };
  languages: {
    typescript: {
      javascriptDefaults: {
        addExtraLib(content: string, filePath?: string): void;
        setDiagnosticsOptions(opts: object): void;
      };
    };
  };
};
interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
}

// ── Populate level selector ───────────────────────────────────────────────────
LEVELS.forEach(({ config }, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = `${i}. ${config.id ?? `Level ${i}`}`;
  levelSelect.appendChild(opt);
});

// ── Persist per-level code in localStorage ───────────────────────────────────
function storageKey(index: number): string {
  return `lander:code:level${index}`;
}

function loadCode(index: number): string {
  return window.localStorage.getItem(storageKey(index)) ?? LEVELS[index].starter;
}

function saveCode(index: number, code: string): void {
  window.localStorage.setItem(storageKey(index), code);
}

// ── Current selected level index ─────────────────────────────────────────────
let currentLevel = 0;

// ── Monaco setup ─────────────────────────────────────────────────────────────
require.config({ paths: { vs: "/vs" } });

// ── Player API type definitions (IntelliSense) ──────────────────────────────
const LANDER_TYPES = `
declare const falcon9: {
  /** Main booster engine — thrust along the rocket axis. Set true to fire. */
  fireBoosterEngine: boolean;
  /** Left thruster — rotates the rocket counter-clockwise. Set true to fire. */
  fireLeftThruster: boolean;
  /** Right thruster — rotates the rocket clockwise. Set true to fire. */
  fireRightThruster: boolean;
  /** Current velocity (read-only). Positive y = falling downward. */
  readonly velocity: { readonly x: number; readonly y: number };
  /** Current position in world units (read-only). */
  readonly position: { readonly x: number; readonly y: number };
  /** Current tilt in radians. 0 = straight up. Positive = clockwise. */
  readonly angle: number;
  /** Current spin rate in radians/frame. Positive = spinning clockwise. */
  readonly rotationalMomentum: number;
  /** Remaining fuel. Infinity on levels with unlimited fuel. */
  readonly fuelRemaining: number;
  /** Distance from the bottom of the rocket to the ground surface. */
  readonly altitude: number;
};

declare const game: {
  /** Y coordinate of the ground surface in world units. */
  readonly groundY: number;
  readonly canvas: {
    /** Total canvas width in world units. */
    readonly width: number;
    /** Total canvas height in world units. */
    readonly height: number;
  };
};

declare function setInterval(handler: () => void, ms: number): number;
declare function clearInterval(id: number): void;
`;

require(["vs/editor/editor.main"], function () {
  monaco.languages.typescript.javascriptDefaults.addExtraLib(LANDER_TYPES, "ts:lander-api.d.ts");
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  const editor = monaco.editor.create(document.getElementById("editor"), {
    value: loadCode(currentLevel),
    language: "javascript",
    theme: "vs-dark",
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 13,
    lineHeight: 21,
    padding: { top: 12 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "gutter",
  });

  // Expose for E2E tests (Monaco textarea is virtualized, getValue() is reliable)
  (window as unknown as Record<string, unknown>).__editor = editor;

  // ── Level selector ──────────────────────────────────────────────────────
  levelSelect.addEventListener("change", () => {
    saveCode(currentLevel, editor.getValue());
    currentLevel = Number(levelSelect.value);
    editor.setValue(loadCode(currentLevel));
  });

  // Sync selector when the game advances levels inside the iframe
  window.addEventListener("message", (event) => {
    if (event.data?.type === "levelLoaded") {
      const idx = event.data.index as number;
      currentLevel = idx;
      levelSelect.value = String(idx);
    }
  });

  // ── Show Solution ───────────────────────────────────────────────────────
  showSolution.addEventListener("click", () => {
    confirmDialog.showModal();
  });

  dialogCancel.addEventListener("click", () => {
    confirmDialog.close();
  });

  dialogConfirm.addEventListener("click", () => {
    confirmDialog.close();
    saveCode(currentLevel, editor.getValue());
    editor.setValue(LEVELS[currentLevel].solution);
  });

  // ── Run button ──────────────────────────────────────────────────────────
  run.addEventListener("click", () => {
    const code = editor.getValue();
    saveCode(currentLevel, code);

    Array.from(gameContainer.children).forEach((child) => {
      if ((child as HTMLElement).tagName === "IFRAME") child.remove();
    });

    const iframe = document.createElement("iframe");
    iframe.src = "./frames/game.html";
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.display = "block";

    // Bootstrap script: tell the game which level to load, then run user code
    const bootstrap = document.createElement("script");
    bootstrap.textContent = `window.__startLevel = ${currentLevel};\n${code}`;

    iframe.onload = () => {
      iframe.contentDocument!.head.appendChild(bootstrap);
      (iframe.contentWindow as Window & { game: { start(): void } }).game.start();
      iframe.contentWindow!.focus();
      gamePlaceholder.style.opacity = "0";
      gameDot.classList.add("active");
    };

    gameContainer.appendChild(iframe);
  });
});
