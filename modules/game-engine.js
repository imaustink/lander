export class GameEngine {
  constructor (canvasId, {
    gravity = 0.01,
  } = {}) {
    this.gravity = gravity;
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.stopped) {
      this.stopped = false;
      return;
    };
    // Clear entire screen
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.entities.forEach(entity => {
      // this.context.save();
      entity.render();
      // this.context.restore();
    });

    requestAnimationFrame(() => this.start());
  }

  stop() {
    this.stopped = true;
  }

  gameOver(message) {
    alert(message);
    this.stop();
  }

  registerEntity(entity) {
    this.entities.push(entity);
  }

  entities = [];

  stopped = false;
}