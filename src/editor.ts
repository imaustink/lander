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
};
interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
}

// ── Populate level selector ───────────────────────────────────────────────────
LEVELS.forEach(({ config }, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = `${i + 1}. ${config.id ?? `Level ${i + 1}`}`;
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

require(["vs/editor/editor.main"], function () {
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
