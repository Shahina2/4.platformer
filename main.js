import { Game } from './Game.js';
import { bindTouchControls } from './input.js';

const canvas = document.getElementById('game');
const ui = {
  score: document.getElementById('score'),
  best: document.getElementById('best'),
  overlay: document.getElementById('overlay'),
  overlayText: document.getElementById('overlayText'),
  btnStart: document.getElementById('btnStart'),
  btnPause: document.getElementById('btnPause'),
  btnRestart: document.getElementById('btnRestart'),
};

bindTouchControls();
new Game(canvas, ui);