const keyboardControlExample = `// Use game.input to bind controls — no raw DOM events needed.
game.input.onPress('ArrowLeft',  () => falcon9.fireLeftThruster = true);
game.input.onPress('ArrowRight', () => falcon9.fireRightThruster = true);
game.input.onPress('ArrowUp',    () => falcon9.fireBoosterEngine = true);

game.input.onRelease('ArrowLeft',  () => falcon9.fireLeftThruster = false);
game.input.onRelease('ArrowRight', () => falcon9.fireRightThruster = false);
game.input.onRelease('ArrowUp',    () => falcon9.fireBoosterEngine = false);`;

const gameContainer = document.getElementById("game-container") as HTMLElement;
const gamePlaceholder = document.getElementById("game-placeholder") as HTMLElement;
const gameDot = document.getElementById("game-dot") as HTMLElement;
const run = document.getElementById("run") as HTMLButtonElement;

// Monaco is loaded via its own AMD loader — keep require.config as-is
declare const require: {
  config(opts: object): void;
  (deps: string[], factory: (...args: unknown[]) => void): void;
};
declare const monaco: {
  editor: {
    create(el: HTMLElement | null, opts: object): { getValue(): string };
  };
};

require.config({ paths: { vs: "/vs" } });

require(["vs/editor/editor.main"], function () {
  const editor = monaco.editor.create(document.getElementById("editor"), {
    value: window.localStorage.getItem("code") ?? keyboardControlExample,
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

  run.addEventListener("click", () => {
    const code = editor.getValue();
    window.localStorage.setItem("code", code);

    // Remove any previous game iframe
    Array.from(gameContainer.children).forEach((child) => {
      if ((child as HTMLElement).tagName === "IFRAME") child.remove();
    });

    const iframe = document.createElement("iframe");
    iframe.src = "./frames/game.html";
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.display = "block";

    const script = document.createElement("script");
    script.textContent = code;

    iframe.onload = () => {
      iframe.contentDocument!.head.appendChild(script);
      (iframe.contentWindow as Window & { game: { start(): void } }).game.start();
      iframe.contentWindow!.focus();
      gamePlaceholder.style.opacity = "0";
      gameDot.classList.add("active");
    };

    gameContainer.appendChild(iframe);
  });
});
