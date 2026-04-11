const keyboardControlExample = `document.addEventListener('keydown', event => {
  event.preventDefault();
  switch(event.key) {
    case "ArrowLeft":
      // Left Arrow key
      falcon9.fireLeftThruster = true;
      break;
    case "ArrowRight":
      // Right Arrow key
      falcon9.fireRightThruster = true;
      break;
    case "ArrowUp":
      // Up Arrow key
      falcon9.fireBoosterEngine = true;
      break;
  }
});
document.addEventListener('keyup', event => {
  event.preventDefault();
  switch(event.key) {
    case "ArrowLeft":
      // Left Arrow key
      falcon9.fireLeftThruster = false;
      break;
    case "ArrowRight":
      // Right Arrow key
      falcon9.fireRightThruster = false;
      break;
    case "ArrowUp":
      // Up Arrow key
      falcon9.fireBoosterEngine = false;
      break;
  }
});`;

const gameContainer = document.getElementById("game-container");
const gamePlaceholder = document.getElementById("game-placeholder");
const gameDot = document.getElementById("game-dot");
const run = document.getElementById("run");

require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });

require(['vs/editor/editor.main'], function () {
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: window.localStorage.getItem("code") || keyboardControlExample,
    language: 'javascript',
    theme: 'vs-dark',
    minimap: { enabled: false },
    automaticLayout: true,
    fontSize: 13,
    lineHeight: 21,
    padding: { top: 12 },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'gutter',
  });

  run.addEventListener("click", () => {
    const code = editor.getValue();
    window.localStorage.setItem("code", code);

    // Clear previous game iframe (keep placeholder in DOM)
    Array.from(gameContainer.children).forEach(child => {
      if (child.tagName === 'IFRAME') child.remove();
    });

    const iframe = document.createElement("iframe");
    iframe.src = "./frames/game.html";
    iframe.height = "100%";
    iframe.width = "100%";
    const script = document.createElement("script");
    script.innerHTML = code;
    iframe.onload = () => {
      iframe.contentDocument.head.appendChild(script);
      iframe.contentWindow.game.start();
      iframe.contentWindow.focus();
      gamePlaceholder.style.opacity = "0";
      gameDot.classList.add("active");
    };
    gameContainer.appendChild(iframe);
  });
});



