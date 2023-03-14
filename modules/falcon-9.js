export class Falcon9 {
  constructor(game, {
    color = "black",
    width = 14,
    height = 72,
    position = {
        x: game.canvas.width / 2,
        y: getRandomInt(0, game.canvas.height / 4)
    },
    angle = getRandomInt(-500, 500) / 1000,
    velocity = {
        x: getRandomInt(-1000, 1000) / 1000,
        y: getRandomInt(0, 1000) / 1000
    },
    rotationalMomentum = getRandomInt(-100, 100) / 1000,
    dragCoefficient = 0.05,
    thrustCoefficient = 0.04,
    fireBoosterEngine = false,
    fireLeftThruster = false,
    fireRightThruster = false,
    maxLandingVelocity = 1
  } = {}) {
    this.game = game;
    this.color = color;
    this.width = width;
    this.height = height;
    this.position = position;
    this.angle = angle;
    this.velocity = velocity;
    this.rotationalMomentum = rotationalMomentum;
    this.thrustCoefficient = thrustCoefficient;
    this.fireBoosterEngine = fireBoosterEngine;
    this.fireLeftThruster = fireLeftThruster;
    this.fireRightThruster = fireRightThruster
    this.maxLandingVelocity = maxLandingVelocity;
    this.dragCoefficient = dragCoefficient;

    game.registerEntity(this);
  }

  render () {
    this.game.context.save();
    this.updateAngle();
    this.updateVelocity();
    this.updatePosition();
    this.drawShipBody();
    this.drawEngineFlames();
    this.game.context.restore();
  }

  updateAngle() {
    // Increase rotational momentum when thrusters are fired
    if(this.fireRightThruster) {
      this.rotationalMomentum += 0.01;
    } else if(this.fireLeftThruster) {
      this.rotationalMomentum -= 0.01;
    }

    // Increase rotational momentum based on gravity using sine of the angle as the coefficient
    this.rotationalMomentum += 0.75 * (Math.sin(this.angle) * (this.game.gravity));

    // Reduce rotational momentum based on drag coefficient
    if (this.rotationalMomentum > 0) {
      this.rotationalMomentum -= (this.dragCoefficient * 0.01);
    } else {
      this.rotationalMomentum += (this.dragCoefficient * 0.01);
    }
    // Change angle based on rotational momentum
    this.angle += (Math.PI / 180) * this.rotationalMomentum;
  }

  updateVelocity () {
    // Calculate gravity
    this.velocity.y += this.game.gravity;

    // Calculate velocity based on sin of the angle and using thrust as a coefficient
    if(this.fireBoosterEngine) {
      this.velocity.x += this.thrustCoefficient * Math.sin(this.angle);
      this.velocity.y -= this.thrustCoefficient * Math.cos(this.angle);
    }
  }

  updatePosition () {
    // Calculate the distance from the center of the object to the bottom most corner
    const shipWidthSine = Math.abs((this.width / 2) * Math.sin(this.angle));
    // Calculate the distance from the center of the object to the right most corner
    const shipHeightCosine = Math.abs((this.height / 2) * Math.cos(this.angle));
    // Calculate the bottom edge
    const minHeight = this.game.canvas.height - (shipWidthSine + shipHeightCosine);
    
    // Update position
    this.position.x = this.position.x + this.velocity.x;
    this.position.y = Math.min(this.position.y + this.velocity.y, minHeight);

    // Calculate collisions with bottom of canvas
    const bottomCollision = this.position.y === minHeight;

    if(bottomCollision) {
      if (this.velocity.y || this.velocity.x) {
        const combinedVelocity = this.velocity.y + this.velocity.x;
        console.log("landing velocity", combinedVelocity);
        const won = combinedVelocity < this.maxLandingVelocity;
        const velocityMessage = ` Your landing velocity was ${combinedVelocity.toFixed(2)} and the max is ${this.maxLandingVelocity}.`
        this.game.gameOver(`You ${won ? "won" : "lost"}!${!won ? velocityMessage : ""}`);
      }

      this.velocity.y = 0;
      this.velocity.x = 0;
      this.rotationalMomentum = 0;
    }
  }

  drawShipBody () {
    const { context } = this.game;
    context.beginPath();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.angle);
    context.rect(this.width * -0.5, this.height * -0.5, this.width, this.height);
    context.fillStyle = this.color;
    context.fill();
    context.closePath();
  }

  drawEngineFlames() {
    const { context } = this.game;
    // Draw the flame if engine is on
    if(this.fireBoosterEngine) {
      context.beginPath();
      context.moveTo(this.width * -0.5, this.height * 0.5);
      context.lineTo(this.width * 0.5, this.height * 0.5);
      context.lineTo(0, this.height * 0.5 + Math.random() * 10);
      context.lineTo(this.width * -0.5, this.height * 0.5);
      context.closePath();
      context.fillStyle = "orange";
      context.fill();
    }
  }
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}