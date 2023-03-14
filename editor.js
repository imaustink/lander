const keyboardControlExample = `
document.addEventListener('keydown', event => {
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
});
`;

const gameContainer = document.getElementById("game-container");
const editor = document.getElementById("editor");
const run = document.getElementById("run");

editor.value = window.localStorage.getItem("code") || keyboardControlExample;

run.addEventListener("click", () => {
  window.localStorage.setItem("code", editor.value);
  gameContainer.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = "./game.html";
  iframe.height = "100%";
  iframe.width = "100%";
  const script = document.createElement("script");
  script.innerHTML = editor.value;
  iframe.onload = () => {
    iframe.contentDocument.head.appendChild(script);
    iframe.contentWindow.game.start();
    iframe.contentWindow.focus();
  }
  gameContainer.appendChild(iframe);
});

