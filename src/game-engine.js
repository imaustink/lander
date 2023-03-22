export class GameEngine {
  constructor (canvasId, {
    gravity = 0.01,
  } = {}) {
    this.gravity = gravity;
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");

    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;
  }

  start() {
    if (this.stopped) {
      this.stopped = false;
      return;
    };
    // Clear entire screen
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render entities
    this.entities.forEach(entity => {
      entity.render();
    });

    requestAnimationFrame(() => this.start());
  }

  stop() {
    this.stopped = true;
  }

  gameOver(landingVelocity, maxLandingVelocity) {
    const winner = landingVelocity < maxLandingVelocity;
    const message = winner ? "You won!" :
    `You lost! Your landing velocity was ${landingVelocity.toFixed(2)} and the max is ${maxLandingVelocity}.`;
    alert(message);
    this.stop();
  }

  registerEntity(entity) {
    this.entities.push(entity);
  }

  entities = [];

  stopped = false;
}