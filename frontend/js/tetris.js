/* ============================================
   Tetris Game Engine
   ============================================ */

class TetrisGame {
  constructor() {
    this.COLS = 10;
    this.ROWS = 20;
    this.COLORS = {
      I: '#00f5ff', O: '#ffeb3b', T: '#9c27b0',
      S: '#4caf50', Z: '#f44336', J: '#2196f3', L: '#ff9800'
    };
    this.SHAPES = {
      I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
      O: [[1,1], [1,1]],
      T: [[0,1,0], [1,1,1], [0,0,0]],
      S: [[0,1,1], [1,1,0], [0,0,0]],
      Z: [[1,1,0], [0,1,1], [0,0,0]],
      J: [[1,0,0], [1,1,1], [0,0,0]],
      L: [[0,0,1], [1,1,1], [0,0,0]]
    };

    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.isPlaying = false;
    this.dropInterval = 1000;
    this.lastDrop = 0;
    this.animationId = null;

    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas?.getContext('2d');
    this.mNextCanvas = document.getElementById('m-next-canvas');
    this.mNextCtx = this.mNextCanvas?.getContext('2d');

    this.gameOverlay = document.getElementById('game-overlay');
    this.finalScoreDisplay = document.getElementById('final-score');

    this.init();
  }

  calculateBlockSize() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const isDesktop = vw >= 768;

    if (isDesktop) {
      // 桌面端: 屏幕高度 - header(56) - padding(48)
      const available = vh - 104;
      const blockSize = Math.floor(available / this.ROWS);
      return Math.max(18, Math.min(blockSize, 28));
    } else {
      // 移动端: 让 canvas 宽度占满屏幕（留 16px 边距）
      const availableW = vw - 16;
      const blockSize = Math.floor(availableW / this.COLS);
      return Math.max(16, Math.min(blockSize, 32));
    }
  }

  init() {
    if (!this.canvas || !this.ctx) return;

    const blockSize = this.calculateBlockSize();
    this.BLOCK_SIZE = blockSize;
    this.canvas.width = this.COLS * blockSize;
    this.canvas.height = this.ROWS * blockSize;

    if (this.nextCanvas && this.nextCtx) {
      this.nextCanvas.width = 4 * 22;
      this.nextCanvas.height = 4 * 22;
    }
    if (this.mNextCanvas && this.mNextCtx) {
      this.mNextCanvas.width = 40;
      this.mNextCanvas.height = 20;
    }

    this.resetBoard();
    this.bindEvents();
    this.draw();
  }

  resetBoard() {
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Desktop buttons
    const btnMap = {
      'btn-left': () => this.movePiece(-1, 0),
      'btn-right': () => this.movePiece(1, 0),
      'btn-down': () => this.movePiece(0, 1),
      'btn-rotate': () => this.rotatePiece(),
      'btn-drop': () => this.hardDrop()
    };
    Object.entries(btnMap).forEach(([id, fn]) => {
      document.getElementById(id)?.addEventListener('click', () => {
        if (this.isPlaying && !this.isPaused) fn();
      });
    });

    // Mobile buttons
    const mBtnMap = {
      'm-left': () => this.movePiece(-1, 0),
      'm-right': () => this.movePiece(1, 0),
      'm-down': () => this.movePiece(0, 1),
      'm-rotate': () => this.rotatePiece(),
      'm-drop': () => this.hardDrop()
    };
    Object.entries(mBtnMap).forEach(([id, fn]) => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        if (this.isPlaying && !this.isPaused) fn();
      });
      btn?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.isPlaying && !this.isPaused) fn();
      }, { passive: false });
    });

    // Start/Pause buttons - 使用 startOrRestart 处理两种情况
    document.getElementById('start-btn')?.addEventListener('click', () => this.startOrRestart());
    document.getElementById('m-start-btn')?.addEventListener('click', () => this.startOrRestart());
    document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restart());
    document.getElementById('home-btn')?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const newBlockSize = this.calculateBlockSize();
    if (newBlockSize !== this.BLOCK_SIZE) {
      this.BLOCK_SIZE = newBlockSize;
      this.canvas.width = this.COLS * newBlockSize;
      this.canvas.height = this.ROWS * newBlockSize;
      this.draw();
    }
  }

  handleKeyDown(e) {
    if (!this.isPlaying || this.isPaused) return;
    const actions = {
      'ArrowLeft': () => this.movePiece(-1, 0),
      'ArrowRight': () => this.movePiece(1, 0),
      'ArrowDown': () => this.movePiece(0, 1),
      'ArrowUp': () => this.rotatePiece(),
      ' ': () => this.hardDrop()
    };
    if (actions[e.key]) {
      e.preventDefault();
      actions[e.key]();
    }
    if (e.key === 'p' || e.key === 'P') this.togglePause();
  }

  startOrRestart() {
    if (this.isPlaying) {
      this.restart();
    } else {
      this.start();
    }
  }

  start() {
    this.isPlaying = true;
    this.gameOver = false;
    this.isPaused = false;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.dropInterval = 1000;

    this.resetBoard();
    this.spawnPiece();
    this.updateDisplay();
    this.hideOverlay();

    this.lastDrop = performance.now();
    this.gameLoop();

    // Update buttons
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const mStartBtn = document.getElementById('m-start-btn');
    if (startBtn) startBtn.textContent = 'RESTART';
    if (pauseBtn) pauseBtn.style.display = 'block';
    if (mStartBtn) mStartBtn.textContent = 'RESTART';
  }

  restart() {
    this.isPlaying = false;
    this.gameOver = false;
    cancelAnimationFrame(this.animationId);
    this.hideOverlay();
    this.start();
  }

  togglePause() {
    if (!this.isPlaying || this.gameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? 'RESUME' : 'PAUSE';
    if (!this.isPaused) {
      this.lastDrop = performance.now();
      this.gameLoop();
    }
  }

  gameLoop(timestamp = 0) {
    if (!this.isPlaying || this.isPaused || this.gameOver) return;
    if (timestamp - this.lastDrop > this.dropInterval) {
      this.movePiece(0, 1);
      this.lastDrop = timestamp;
    }
    this.draw();
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  spawnPiece() {
    const types = Object.keys(this.SHAPES);
    if (!this.nextPiece) {
      this.nextPiece = this.createPiece(types[Math.floor(Math.random() * types.length)]);
    }
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createPiece(types[Math.floor(Math.random() * types.length)]);
    this.currentPiece.x = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;

    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.endGame();
    }
    this.drawNextPiece();
  }

  createPiece(type) {
    return {
      type,
      shape: this.SHAPES[type].map(row => [...row]),
      color: this.COLORS[type],
      x: 0, y: 0
    };
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return;
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;
    if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
    } else if (dy > 0) {
      this.lockPiece();
      this.clearLines();
      this.spawnPiece();
    }
  }

  rotatePiece() {
    if (!this.currentPiece) return;
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
        this.currentPiece.shape = rotated;
        this.currentPiece.x += kick;
        return;
      }
    }
  }

  rotateMatrix(matrix) {
    const N = matrix.length;
    return matrix.map((row, i) => row.map((_, j) => matrix[N - 1 - j][i]));
  }

  hardDrop() {
    if (!this.currentPiece) return;
    while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
      this.currentPiece.y++;
      this.score += 2;
    }
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
    this.updateDisplay();
  }

  checkCollision(x, y, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = x + c, ny = y + r;
          if (nx < 0 || nx >= this.COLS || ny >= this.ROWS) return true;
          if (ny >= 0 && this.board[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  lockPiece() {
    if (!this.currentPiece) return;
    for (let r = 0; r < this.currentPiece.shape.length; r++) {
      for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
        if (this.currentPiece.shape[r][c]) {
          const by = this.currentPiece.y + r;
          const bx = this.currentPiece.x + c;
          if (by >= 0) this.board[by][bx] = this.currentPiece.color;
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(this.COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800];
      this.score += points[cleared] * this.level;
      this.lines += cleared;
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      }
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Desktop
    const scoreEl = document.getElementById('score-value');
    const levelEl = document.getElementById('level-value');
    const linesEl = document.getElementById('lines-value');
    if (scoreEl) scoreEl.textContent = fmt(this.score);
    if (levelEl) levelEl.textContent = this.level;
    if (linesEl) linesEl.textContent = this.lines;
    // Mobile
    const mScore = document.getElementById('m-score');
    const mLevel = document.getElementById('m-level');
    if (mScore) mScore.textContent = fmt(this.score);
    if (mLevel) mLevel.textContent = this.level;
  }

  draw() {
    if (!this.ctx) return;
    const bs = this.BLOCK_SIZE;
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x <= this.COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * bs, 0);
      this.ctx.lineTo(x * bs, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * bs);
      this.ctx.lineTo(this.canvas.width, y * bs);
      this.ctx.stroke();
    }

    // Board
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.board[r][c]) this.drawBlock(c, r, this.board[r][c]);
      }
    }

    // Ghost piece
    if (this.currentPiece) {
      let ghostY = this.currentPiece.y;
      while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) ghostY++;
      if (ghostY !== this.currentPiece.y) {
        this.ctx.globalAlpha = 0.3;
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
          for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
            if (this.currentPiece.shape[r][c]) {
              this.drawBlock(this.currentPiece.x + c, ghostY + r, this.currentPiece.color);
            }
          }
        }
        this.ctx.globalAlpha = 1;
      }
    }

    // Current piece
    if (this.currentPiece) {
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c]) {
            this.drawBlock(this.currentPiece.x + c, this.currentPiece.y + r, this.currentPiece.color);
          }
        }
      }
    }
  }

  drawBlock(x, y, color) {
    const bs = this.BLOCK_SIZE;
    const p = 2, size = bs - p * 2;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * bs + p, y * bs + p, size, size);
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fillRect(x * bs + p, y * bs + p, size, 3);
    this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
    this.ctx.fillRect(x * bs + p, y * bs + size - 1, size, 3);
  }

  drawNextPiece() {
    if (!this.nextPiece) return;
    // Desktop
    if (this.nextCtx && this.nextCanvas) {
      const bs = 22;
      this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
      const shape = this.nextPiece.shape;
      const ox = (4 - shape[0].length) / 2;
      const oy = (4 - shape.length) / 2;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const x = (ox + c) * bs, y = (oy + r) * bs;
            this.nextCtx.fillStyle = this.nextPiece.color;
            this.nextCtx.fillRect(x + 1, y + 1, bs - 2, bs - 2);
          }
        }
      }
    }
    // Mobile
    if (this.mNextCtx && this.mNextCanvas) {
      const bs = 10;
      this.mNextCtx.clearRect(0, 0, 40, 20);
      const shape = this.nextPiece.shape;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            this.mNextCtx.fillStyle = this.nextPiece.color;
            this.mNextCtx.fillRect(c * bs, r * bs, bs - 1, bs - 1);
          }
        }
      }
    }
  }

  endGame() {
    this.gameOver = true;
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    if (this.finalScoreDisplay) {
      this.finalScoreDisplay.textContent = this.score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    this.showOverlay();
  }

  showOverlay() {
    this.gameOverlay?.classList.add('active');
  }

  hideOverlay() {
    this.gameOverlay?.classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('game-canvas')) {
    window.tetrisGame = new TetrisGame();
  }
});
