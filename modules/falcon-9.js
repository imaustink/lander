export class Falcon9 {
  constructor(game, {
    color = "black",
    width = 14,
    height = 72,
    position = {
        x: game.canvas.width / 2,
        y: getRandomInt(0, game.canvas.height / 4)
    },
    angle = getRandomInt(-1000, 1000) / 1000,
    velocity = {
        x: getRandomInt(-1000, 1000) / 1000,
        y: getRandomInt(0, 1000) / 1000
    },
    rotationSpeed = getRandomInt(-100, 100) / 1000,
    dragCoefficient = 0.05,
    thrust = 0.04,
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
    this.rotationSpeed = rotationSpeed;
    this.thrust = thrust;
    this.fireBoosterEngine = fireBoosterEngine;
    this.fireLeftThruster = fireLeftThruster;
    this.fireRightThruster = fireRightThruster
    this.maxLandingVelocity = maxLandingVelocity;
    this.dragCoefficient = dragCoefficient;

    game.registerEntity(this);
  }

  render () {
    this.game.context.save();
    this.updatePosition();
    this.drawShipBody();
    this.drawEngineFlames();
    this.game.context.restore();
  }

  updatePosition () {
    const absoluteAngle = Math.abs(this.angle % (Math.PI * 2)) + (Math.PI / 2);

    const minHeightSin = (this.width / 2) * Math.sin(this.angle < 0 && absoluteAngle < (Math.PI * 1.5) ? this.angle : -this.angle);
    const minHeightCos = (this.height / 2) * Math.cos(this.angle);
    const minHeight = absoluteAngle < Math.PI || absoluteAngle > (Math.PI * 2) ?
      this.game.canvas.height - minHeightCos + minHeightSin:
      this.game.canvas.height + minHeightCos + minHeightSin;
    const positionX = this.position.x + this.velocity.x;
    const positionY = Math.min(this.position.y + this.velocity.y, minHeight);
    const bottom = positionY === minHeight;
    
    if(this.fireRightThruster) {
      this.rotationSpeed += 0.01;
    } else if(this.fireLeftThruster) {
      this.rotationSpeed -= 0.01;
    }

    if (this.rotationSpeed > 0) {
      this.rotationSpeed -= (this.dragCoefficient * 0.01);
    } else {
      this.rotationSpeed += (this.dragCoefficient * 0.01);
    }

    this.rotationSpeed += Math.sin(this.angle) * (this.game.gravity);

    this.angle += (Math.PI / 180) * this.rotationSpeed;

    if(bottom) {
      if (this.velocity.y || this.velocity.x) {
        const combinedVelocity = this.velocity.y + this.velocity.x;
        console.log("landing velocity", combinedVelocity);
        console.log("landing angle", absoluteAngle);
        const won = combinedVelocity < this.maxLandingVelocity;
        const velocityMessage = ` Your landing velocity was ${combinedVelocity.toFixed(2)} and the max is ${this.maxLandingVelocity}.`
        this.game.gameOver(`You ${won ? "won" : "lost"}!${!won ? velocityMessage : ""}`);
      }

      this.velocity.y = 0;
      this.velocity.x = 0;
      this.rotationSpeed = 0;
    } else {
      this.velocity.y += this.game.gravity;
    }
    if(this.fireBoosterEngine) {
      this.velocity.x -= this.thrust * Math.sin(-this.angle);
      this.velocity.y -= this.thrust * Math.cos(this.angle);
    }
    this.position.x = positionX;
    this.position.y = positionY;
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