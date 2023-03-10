import { GameEngine } from "./modules/game-engine.js";
import { Falcon9 } from "./modules/falcon-9.js"

const game = new GameEngine("game");
const falcon9 = new Falcon9(game);

game.start();


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
