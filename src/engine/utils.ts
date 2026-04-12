export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
