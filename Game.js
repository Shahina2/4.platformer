import { Player } from './Player.js';
import { input, resetInput } from './input.js';
import { rectsOverlap } from './collision.js';

const W = 800;
const H = 450;

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;

    this.player = new Player(40, 300);

    // Уровень: 5 платформ + земля. Расстояния подобраны так,
    // чтобы прыжка (~120 px по высоте) хватало с запасом.
    this.platforms = [
      { x: 0,   y: 420, w: 800, h: 30 },   // земля
      { x: 120, y: 350, w: 110, h: 16 },   // 1
      { x: 300, y: 290, w: 110, h: 16 },   // 2
      { x: 480, y: 350, w: 110, h: 16 },   // 3
      { x: 640, y: 280, w: 110, h: 16 },   // 4
      { x: 400, y: 190, w: 120, h: 16 },   // 5 (высокая)
    ];

    // Шипы на земле — подальше от старта
    this.hazard = { x: 250, y: 400, w: 70, h: 20 };

    // Рыбки лежат НАД платформами, чтобы их точно можно было достать
    this.items = [
      { x: 160, y: 320, w: 22, h: 22, taken: false }, // над платформой 1
      { x: 340, y: 260, w: 22, h: 22, taken: false }, // над платформой 2
      { x: 445, y: 160, w: 22, h: 22, taken: false }, // над платформой 5
    ];

    // Финиш — кот справа на земле
    this.finish = { x: 720, y: 360, w: 44, h: 60 };

    this.score = 0;
    this.state = 'idle';
    this.lastTime = 0;
    this.rafId = null;
    this.loopRunning = false;

    this.best = this._loadBest();
    this.ui.best.textContent = this.best;

    this._bindButtons();
    this._bindVisibility();
    this._startLoop();
  }

  start() {
    this.restart();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      resetInput();
      this._showOverlay('⏸ Пауза');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = 0;
      this.ui.overlay.classList.add('hidden');
    }
  }

  restart() {
    this.player.reset();
    this.score = 0;
    this.items.forEach((it) => (it.taken = false));
    this.state = 'playing';
    this.lastTime = 0;
    resetInput();
    this.ui.score.textContent = '0';
    this.ui.overlay.classList.add('hidden');
    this.ui.btnPause.disabled = false;
  }

  _startLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;

    const loop = (time) => {
      this.rafId = requestAnimationFrame(loop);

      if (!this.lastTime) this.lastTime = time;
      let dt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      if (dt > 0.05) dt = 0.05;

      if (this.state === 'playing') this.update(dt);
      this.render();
    };

    this.rafId = requestAnimationFrame(loop);
  }

  update(dt) {
    this.player.update(dt, input, this.platforms);

    if (this.player.y > H + 100) return this._lose('😿 Герой упал');

    if (rectsOverlap(this.player, this.hazard)) {
      return this._lose('😿 Наступил на шипы');
    }

    for (const it of this.items) {
      if (!it.taken && rectsOverlap(this.player, it)) {
        it.taken = true;
        this.score++;
        this.ui.score.textContent = this.score;
      }
    }

    if (rectsOverlap(this.player, this.finish) && this.score === this.items.length) {
      this._win();
    }
  }

  _win() {
    this.state = 'won';
    this._saveBest();
    this._showOverlay('🎉 Победа!<br><span style="font-size:18px;opacity:.85">Кот спасён. Нажми «Заново»</span>');
    this.ui.btnPause.disabled = true;
  }

  _lose(reason) {
    this.state = 'lost';
    this._saveBest();
    this._showOverlay(`${reason}<br><span style="font-size:18px;opacity:.85">Нажми «Заново»</span>`);
    this.ui.btnPause.disabled = true;
  }

  _loadBest() {
    try { return Number(localStorage.getItem('catBest') || 0); }
    catch { return 0; }
  }

  _saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      this.ui.best.textContent = this.best;
      try { localStorage.setItem('catBest', String(this.best)); }
      catch { /* игнорируем */ }
    }
  }

  render() {
    const ctx = this.ctx;

    // ===== Небо с градиентом =====
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6ec6ff');
    sky.addColorStop(0.6, '#bfe7ff');
    sky.addColorStop(1, '#eaf7ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Солнце с лучами
    ctx.save();
    ctx.translate(700, 70);
    ctx.fillStyle = 'rgba(255, 230, 120, .35)';
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Дальние облака
    this._cloud(ctx, 120, 80, 1.1);
    this._cloud(ctx, 380, 55, 0.9);
    this._cloud(ctx, 560, 110, 1.3);

    // Дальние холмы
    ctx.fillStyle = '#a7d8a0';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, 360);
    ctx.quadraticCurveTo(150, 280, 300, 360);
    ctx.quadraticCurveTo(450, 300, 600, 360);
    ctx.quadraticCurveTo(720, 320, 800, 360);
    ctx.lineTo(800, H);
    ctx.closePath();
    ctx.fill();

    // ===== Платформы с травой =====
    for (const p of this.platforms) {
      // земля
      ctx.fillStyle = '#6a4b2a';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // верхний слой травы
      ctx.fillStyle = '#4e9e3f';
      ctx.fillRect(p.x, p.y, p.w, 6);
      // травинки
      ctx.fillStyle = '#3e8a32';
      for (let gx = p.x + 4; gx < p.x + p.w - 2; gx += 10) {
        ctx.fillRect(gx, p.y - 3, 2, 4);
      }
    }

    // ===== Шипы =====
    ctx.fillStyle = '#7a1e1e';
    ctx.fillRect(this.hazard.x, this.hazard.y, this.hazard.w, this.hazard.h);
    for (let i = 0; i < 5; i++) {
      const sx = this.hazard.x + i * 14 + 2;
      const grad = ctx.createLinearGradient(sx, this.hazard.y - 14, sx, this.hazard.y);
      grad.addColorStop(0, '#ff5e5e');
      grad.addColorStop(1, '#a81414');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx, this.hazard.y);
      ctx.lineTo(sx + 7, this.hazard.y - 14);
      ctx.lineTo(sx + 14, this.hazard.y);
      ctx.closePath();
      ctx.fill();
    }

    // ===== Рыбки (предметы) =====
    for (const it of this.items) {
      if (it.taken) continue;
      this._fish(ctx, it.x + 11, it.y + 11);
    }

    // ===== Финиш — кот =====
    this._cat(ctx, this.finish);

    // ===== Игрок =====
    this.player.draw(ctx);

    // ===== Подсказка =====
    if (this.state === 'playing' && this.score < this.items.length) {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.font = 'bold 15px system-ui';
      ctx.fillText(`🐟 Осталось: ${this.items.length - this.score}`, 16, 28);
    }

    // ===== Экран старта =====
    if (this.state === 'idle') {
      ctx.fillStyle = 'rgba(10,15,25,.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px system-ui';
      ctx.fillText('Спасение кота', W / 2, H / 2 - 20);
      ctx.font = '17px system-ui';
      ctx.fillText('Собери 3 рыбки и доберись до кота', W / 2, H / 2 + 14);
      ctx.fillText('← → / A D — идти · Space / W — прыжок', W / 2, H / 2 + 42);
      ctx.textAlign = 'start';
    }
  }

  // ---- вспомогательные рисовалки ----
  _cloud(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 22 * s, y - 8 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 46 * s, y, 18 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  _fish(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // тело
    const g = ctx.createLinearGradient(-10, 0, 10, 0);
    g.addColorStop(0, '#ffb347');
    g.addColorStop(1, '#ff7b00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // хвост
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-17, -6);
    ctx.lineTo(-17, 6);
    ctx.closePath();
    ctx.fill();
    // глаз
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(5, -2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(5.6, -2, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _cat(ctx, f) {
    // Тело
    ctx.fillStyle = '#8d6e4f';
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2, f.y + f.h - 16, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Голова
    ctx.beginPath();
    ctx.arc(f.x + f.w / 2, f.y + 8, 17, 0, Math.PI * 2);
    ctx.fill();
    // Уши
    ctx.beginPath();
    ctx.moveTo(f.x + 6, f.y + 2);
    ctx.lineTo(f.x + 10, f.y - 16);
    ctx.lineTo(f.x + 22, f.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(f.x + f.w - 6, f.y + 2);
    ctx.lineTo(f.x + f.w - 10, f.y - 16);
    ctx.lineTo(f.x + f.w - 22, f.y - 2);
    ctx.closePath();
    ctx.fill();
    // Глаза
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(f.x + 14, f.y + 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(f.x + 30, f.y + 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(f.x + 14, f.y + 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(f.x + 30, f.y + 6, 2, 0, Math.PI * 2); ctx.fill();
    // Нос
    ctx.fillStyle = '#e57';
    ctx.beginPath();
    ctx.moveTo(f.x + 22, f.y + 14);
    ctx.lineTo(f.x + 18, f.y + 18);
    ctx.lineTo(f.x + 26, f.y + 18);
    ctx.closePath();
    ctx.fill();
    // Усы
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(f.x + 14, f.y + 16); ctx.lineTo(f.x + 4, f.y + 14);
    ctx.moveTo(f.x + 14, f.y + 18); ctx.lineTo(f.x + 4, f.y + 20);
    ctx.moveTo(f.x + 30, f.y + 16); ctx.lineTo(f.x + 40, f.y + 14);
    ctx.moveTo(f.x + 30, f.y + 18); ctx.lineTo(f.x + 40, f.y + 20);
    ctx.stroke();
  }

  _bindButtons() {
    this.ui.btnStart.addEventListener('click', () => this.start());
    this.ui.btnPause.addEventListener('click', () => this.togglePause());
    this.ui.btnRestart.addEventListener('click', () => this.restart());
  }

  _bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.togglePause();
    });
  }

  _showOverlay(html) {
    this.ui.overlayText.innerHTML = html;
    this.ui.overlay.classList.remove('hidden');
  }
}