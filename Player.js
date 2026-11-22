export class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.w = 28;
    this.h = 42;
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;      // для отрисовки
    this.coyote = 0;      // «койот-тайм» — окно после схода с платформы
    this.jumpHeld = false; // чтобы не «залипал» прыжок при удержании
  }

  update(dt, input, platforms) {
    const SPEED = 280;
    const JUMP = 640;
    const GRAVITY = 1700;
    const COYOTE = 0.1;   // 100 мс после схода с края можно прыгнуть

    // Горизонталь
    let dir = 0;
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
    if (dir !== 0) this.facing = dir;
    this.vx = dir * SPEED;

    // Прыжок: с земли ИЛИ в пределах coyote-тайма, и только по новому нажатию
    if (input.jump && !this.jumpHeld && (this.onGround || this.coyote > 0)) {
      this.vy = -JUMP;
      this.onGround = false;
      this.coyote = 0;
    }
    this.jumpHeld = input.jump; // фиксируем, что клавиша уже была зажата

    // Гравитация
    this.vy += GRAVITY * dt;

    const prevY = this.y;

    // Двигаем по X
    this.x += this.vx * dt;
    this._clampWorld();

    // Двигаем по Y
    this.y += this.vy * dt;

    const wasOnGround = this.onGround;
    this.onGround = false;

    for (const p of platforms) {
      const overlap = (
        this.x < p.x + p.w &&
        this.x + this.w > p.x &&
        this.y < p.y + p.h &&
        this.y + this.h > p.y
      );
      if (!overlap) continue;

      if (this.vy >= 0 && prevY + this.h <= p.y + 1) {
        // Приземление
        this.y = p.y - this.h;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0 && prevY >= p.y + p.h - 1) {
        // Удар головой
        this.y = p.y + p.h;
        this.vy = 0;
      } else if (this.vx > 0) {
        this.x = p.x - this.w;
      } else if (this.vx < 0) {
        this.x = p.x + p.w;
      }
    }

    // Обновляем coyote-таймер
    if (this.onGround) {
      this.coyote = COYOTE;
    } else if (wasOnGround) {
      this.coyote = COYOTE; // только что сошёл с платформы
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
    }
  }

  _clampWorld() {
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > 800) this.x = 800 - this.w;
  }

  draw(ctx) {
    const { x, y, w, h, facing } = this;
    const cx = x + w / 2;

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(cx, y + h + 3, w * 0.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ноги
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 5, y + h - 10, 7, 10);
    ctx.fillRect(x + w - 12, y + h - 10, 7, 10);

    // Тело-комбинезон
    const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
    bodyGrad.addColorStop(0, '#ffd166');
    bodyGrad.addColorStop(1, '#f4a261');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 10, w - 4, h - 16, 8);
    ctx.fill();

    // Голова
    ctx.fillStyle = '#ffcf6b';
    ctx.beginPath();
    ctx.arc(cx, y + 12, 11, 0, Math.PI * 2);
    ctx.fill();

    // Кепка
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(cx, y + 8, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(facing > 0 ? cx : cx - 12, y + 6, 12, 4);

    // Глаза (смотрят по направлению движения)
    ctx.fillStyle = '#1d1d1d';
    const eyeOffset = facing > 0 ? 2 : -2;
    ctx.beginPath();
    ctx.arc(cx - 4 + eyeOffset, y + 12, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 4 + eyeOffset, y + 12, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Рюкзак
    ctx.fillStyle = '#6a4c93';
    ctx.fillRect(facing > 0 ? x - 2 : x + w - 6, y + 16, 8, 14);
  }
}