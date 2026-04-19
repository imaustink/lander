import { LEVELS } from './src/levels.js';
import { simulate } from './src/simulator.js';

const {config, solution} = LEVELS[4];
const intervals = [];
let _state;
const velocity = { get x(){return _state.velX}, get y(){return _state.velY} };
const position = { get x(){return _state.posX}, get y(){return _state.posY} };
const falcon9 = {
  get fireBoosterEngine(){return _state.fireBoosterEngine}, set fireBoosterEngine(v){_state.fireBoosterEngine=v},
  get rotateLeft(){return _state.rotateLeft}, set rotateLeft(v){_state.rotateLeft=v},
  get rotateRight(){return _state.rotateRight}, set rotateRight(v){_state.rotateRight=v},
  get velocity(){return velocity}, get position(){return position},
  get angle(){return _state.angle}, get rotationalMomentum(){return _state.rotMomentum},
};
const game = { canvas: {width:800, height:600}, levels:{current:config} };
let initialized = false;
const ctrl = (state) => {
  _state = state;
  if (!initialized) { initialized=true; new Function('falcon9','game','setInterval', solution)(falcon9, game, fn=>intervals.push(fn)); }
  for (const cb of intervals) cb();
};
const r = simulate(config, ctrl, {canvasWidth:800, canvasHeight:600});
console.log('frames:', r.frames, 'won:', r.won, 'reason:', r.reason);
