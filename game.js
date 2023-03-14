import { GameEngine } from "./modules/game-engine.js";
import { Falcon9 } from "./modules/falcon-9.js"

const game = new GameEngine("game");
const falcon9 = new Falcon9(game);

window.game = game;
window.falcon9 = falcon9;