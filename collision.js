import { GameEngine } from "./modules/game-engine.js";

const game = new GameEngine("game");

const { context, canvas } = game;

const SQUARE_SIZE = { height: 40, width: 20 };
const X_POS = (canvas.width / 2) - (SQUARE_SIZE.width / 2);
const Y_POS = canvas.height;
const ANGLE = ((Math.PI / 180) * (45 * 7)) % (Math.PI * 2);

function render () {
  let yPos = Y_POS;
  const minHeightSin = Math.abs((SQUARE_SIZE.width / 2) * Math.sin(ANGLE));
  const minHeightCos = Math.abs((SQUARE_SIZE.height / 2) * Math.cos(ANGLE));
  yPos -= minHeightSin + minHeightCos;

  context.beginPath();
  context.translate(X_POS, yPos);
  context.rotate(ANGLE);
  context.rect(
    SQUARE_SIZE.width * -0.5,
    SQUARE_SIZE.height * -0.5,
    SQUARE_SIZE.width,
    SQUARE_SIZE.height
  );
  context.fillStyle = "black";
  context.fill();
  context.closePath();
}

render();