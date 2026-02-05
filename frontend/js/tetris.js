/* ============================================
   Tetris Game Engine
   Mobile-First, Touch-Optimized
   ============================================ */

class TetrisGame {
  constructor() {
    // Game configuration
    this.COLS = 10;
    this.ROWS = 20;
    this.BLOCK_SIZE = this.calculateBlockSize();
    this.COLORS = {
      I: '#00f5ff',
      O: '#ffeb3b',
      T: '#9c27b0',
      S: '#4caf50',
      Z: '#f44336',
      J: '#2196f3',
      L: '#ff9800'
    };
    
    // Tetromino shapes
    this.SHAPES = {
      I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
      O: [[1,1], [1,1]],
      T: [[0,1,0], [1,1,1], [0,0,0]],
      S: [[0,1,1], [1,1,0], [0,0,0]],
      Z: [[1,1,0], [0,1,1], [0,0,0]],
      J: [[1,0,0], [1,1,1], [0,0,0]],
      L: [[0,0,1], [1,1,1], [0,0,0]]
    };
    
    // Game state
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
    
    // Canvas elements
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas ? this.nextCanvas.getContext('2d') : null;
    // Desktop next canvas
    this.nextCanvasDesktop = document.getElementById('next-canvas-desktop');
    this.nextCtxDesktop = this.nextCanvasDesktop ? this.nextCanvasDesktop.getContext('2d') : null;
    
    // UI elements
    this.scoreDisplay = document.getElementById('score-value');
    this.levelDisplay = document.getElementById('level-value');
    this.linesDisplay = document.getElementById('lines-value');
    this.gameOverlay = document.querySelector('.game-overlay');
    this.finalScoreDisplay = document.getElementById('final-score');
    
    // Touch handling
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.minSwipeDistance = 30;
    
    this.init();
  }
  
  // Calculate optimal block size based on screen
  calculateBlockSize() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // Desktop (768px+)
    if (vw >= 768) {
      if (vh >= 800) return 28;
      if (vh >= 600) return 24;
      return 20;
    }
    
    // Mobile: Calculate based on available space
    // Header: ~44px, Controls: ~130px, Padding: ~20px
    const reservedHeight = 194;
    const availableHeight = vh - reservedHeight;
    const maxBlockByHeight = Math.floor(availableHeight / this.ROWS);
    
    // Width: Canvas + Side panel (~75px) + gaps (~20px)
    const availableWidth = vw - 95;
    const maxBlockByWidth = Math.floor(availableWidth / this.COLS);
    
    // Use smaller of the two, with min/max bounds
    const blockSize = Math.min(maxBlockByHeight, maxBlockByWidth);
    return Math.max(14, Math.min(blockSize, 22));
  }
  
  init() {
    if (!this.canvas || !this.ctx) {
      console.error('Game canvas not found!');
      return;
    }
    
    // Set canvas size
    this.canvas.width = this.COLS * this.BLOCK_SIZE;
    this.canvas.height = this.ROWS * this.BLOCK_SIZE;
    
    if (this.nextCanvas && this.nextCtx) {
      // Mobile next piece - smaller blocks
      const nextBlockSize = Math.max(10, Math.min(this.BLOCK_SIZE - 2, 16));
      this.nextCanvas.width = 4 * nextBlockSize;
      this.nextCanvas.height = 4 * nextBlockSize;
      this.nextBlockSize = nextBlockSize;
    }
    
    // Desktop next canvas
    if (this.nextCanvasDesktop && this.nextCtxDesktop) {
      const desktopNextBlockSize = 22;
      this.nextCanvasDesktop.width = 4 * desktopNextBlockSize;
      this.nextCanvasDesktop.height = 4 * desktopNextBlockSize;
      this.desktopNextBlockSize = desktopNextBlockSize;
    }
    
    // Initialize board
    this.resetBoard();
    
    // Bind event listeners
    this.bindEvents();
    
    // Draw initial state
    this.draw();
    
    console.log('🎮 Tetris game initialized!');
  }
  
  resetBoard() {
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
  }
  
  bindEvents() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Touch controls
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }
    
    // Button controls
    this.bindButtonControls();
    
    // Action buttons
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const homeBtn = document.getElementById('home-btn');
    
    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
    if (restartBtn) restartBtn.addEventListener('click', () => this.restart());
    if (homeBtn) homeBtn.addEventListener('click', () => window.location.href = 'index.html');
  }
  
  bindButtonControls() {
    const controls = {
      'btn-left': () => this.movePiece(-1, 0),
      'btn-right': () => this.movePiece(1, 0),
      'btn-down': () => this.movePiece(0, 1),
      'btn-rotate': () => this.rotatePiece(),
      'btn-drop': () => this.hardDrop()
    };
    
    Object.entries(controls).forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Touch events for mobile
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (this.isPlaying && !this.isPaused) action();
        });
        
        // Click events for desktop
        btn.addEventListener('click', () => {
          if (this.isPlaying && !this.isPaused) action();
        });
      }
    });
  }
  
  handleKeyDown(e) {
    if (!this.isPlaying || this.isPaused) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.movePiece(-1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.movePiece(1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.movePiece(0, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.rotatePiece();
        break;
      case ' ':
        e.preventDefault();
        this.hardDrop();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  }
  
  handleTouchStart(e) {
    if (!this.isPlaying || this.isPaused) return;
    
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }
  
  handleTouchMove(e) {
    e.preventDefault();
  }
  
  handleTouchEnd(e) {
    if (!this.isPlaying || this.isPaused) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    
    // Tap detection (quick touch with minimal movement)
    if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.rotatePiece();
      return;
    }
    
    // Swipe detection
    if (Math.abs(deltaX) > this.minSwipeDistance || Math.abs(deltaY) > this.minSwipeDistance) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.movePiece(1, 0);
        } else {
          this.movePiece(-1, 0);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          if (deltaY > 100) {
            this.hardDrop();
          } else {
            this.movePiece(0, 1);
          }
        }
      }
    }
  }
  
  start() {
    if (this.isPlaying) return;
    
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
    
    // Update button states
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (startBtn) startBtn.textContent = 'Restart';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
  }
  
  restart() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    this.start();
  }
  
  togglePause() {
    if (!this.isPlaying || this.gameOver) return;
    
    this.isPaused = !this.isPaused;
    
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
      pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
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
    
    // Center the piece
    this.currentPiece.x = Math.floor((this.COLS - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;
    
    // Check for game over
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.endGame();
    }
    
    this.drawNextPiece();
  }
  
  createPiece(type) {
    return {
      type: type,
      shape: this.SHAPES[type].map(row => [...row]),
      color: this.COLORS[type],
      x: 0,
      y: 0
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
      // Piece has landed
      this.lockPiece();
      this.clearLines();
      this.spawnPiece();
    }
  }
  
  rotatePiece() {
    if (!this.currentPiece) return;
    
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    
    // Try rotation with wall kicks
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.checkCollision(this.currentPiece.x + kick, this.currentPiece.y, rotated)) {
        this.currentPiece.shape = rotated;
        this.currentPiece.x += kick;
        return;
      }
    }
  }
  
  rotateMatrix(matrix) {
    const N = matrix.length;
    const rotated = matrix.map((row, i) => 
      row.map((_, j) => matrix[N - 1 - j][i])
    );
    return rotated;
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
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          
          if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
            return true;
          }
          
          if (newY >= 0 && this.board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  lockPiece() {
    if (!this.currentPiece) return;
    
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPiece.y + row;
          const boardX = this.currentPiece.x + col;
          
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }
  }
  
  clearLines() {
    let linesCleared = 0;
    
    for (let row = this.ROWS - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.COLS).fill(0));
        linesCleared++;
        row++;
      }
    }
    
    if (linesCleared > 0) {
      // Scoring system
      const points = [0, 100, 300, 500, 800];
      this.score += points[linesCleared] * this.level;
      this.lines += linesCleared;
      
      // Level up every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      }
      
      this.updateDisplay();
    }
  }
  
  updateDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = this.formatNumber(this.score);
      this.scoreDisplay.classList.add('updated');
      setTimeout(() => this.scoreDisplay.classList.remove('updated'), 300);
    }
    if (this.levelDisplay) this.levelDisplay.textContent = this.level;
    if (this.linesDisplay) this.linesDisplay.textContent = this.lines;
    
    // Update mobile displays
    const mobileScore = document.getElementById('mobile-score');
    const mobileLevel = document.getElementById('mobile-level');
    const mobileLines = document.getElementById('mobile-lines');
    if (mobileScore) mobileScore.textContent = this.formatNumber(this.score);
    if (mobileLevel) mobileLevel.textContent = this.level;
    if (mobileLines) mobileLines.textContent = this.lines;
  }
  
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  draw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw locked pieces
    this.drawBoard();
    
    // Draw current piece
    this.drawPiece();
    
    // Draw ghost piece
    this.drawGhostPiece();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x <= this.COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
      this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.BLOCK_SIZE);
      this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
      this.ctx.stroke();
    }
  }
  
  drawBoard() {
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (this.board[row][col]) {
          this.drawBlock(col, row, this.board[row][col]);
        }
      }
    }
  }
  
  drawPiece() {
    if (!this.currentPiece) return;
    
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          this.drawBlock(
            this.currentPiece.x + col,
            this.currentPiece.y + row,
            this.currentPiece.color
          );
        }
      }
    }
  }
  
  drawGhostPiece() {
    if (!this.currentPiece) return;
    
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
      ghostY++;
    }
    
    if (ghostY !== this.currentPiece.y) {
      this.ctx.globalAlpha = 0.3;
      for (let row = 0; row < this.currentPiece.shape.length; row++) {
        for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
          if (this.currentPiece.shape[row][col]) {
            this.drawBlock(
              this.currentPiece.x + col,
              ghostY + row,
              this.currentPiece.color
            );
          }
        }
      }
      this.ctx.globalAlpha = 1;
    }
  }
  
  drawBlock(x, y, color) {
    const padding = 2;
    const size = this.BLOCK_SIZE - padding * 2;
    
    // Main block
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.BLOCK_SIZE + padding,
      y * this.BLOCK_SIZE + padding,
      size,
      size
    );
    
    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(
      x * this.BLOCK_SIZE + padding,
      y * this.BLOCK_SIZE + padding,
      size,
      4
    );
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(
      x * this.BLOCK_SIZE + padding,
      y * this.BLOCK_SIZE + size - 2,
      size,
      4
    );
  }
  
  drawNextPiece() {
    if (!this.nextPiece) return;
    
    // Draw on mobile canvas
    if (this.nextCtx && this.nextCanvas) {
      this.drawNextOnCanvas(this.nextCtx, this.nextCanvas, this.nextBlockSize || this.BLOCK_SIZE);
    }
    
    // Draw on desktop canvas
    if (this.nextCtxDesktop && this.nextCanvasDesktop) {
      this.drawNextOnCanvas(this.nextCtxDesktop, this.nextCanvasDesktop, this.desktopNextBlockSize || 24);
    }
  }
  
  drawNextOnCanvas(ctx, canvas, blockSize) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const shape = this.nextPiece.shape;
    const color = this.nextPiece.color;
    
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (offsetX + col) * blockSize;
          const y = (offsetY + row) * blockSize;
          const padding = 1;
          const size = blockSize - padding * 2;
          
          ctx.fillStyle = color;
          ctx.fillRect(x + padding, y + padding, size, size);
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(x + padding, y + padding, size, 3);
        }
      }
    }
  }
  
  endGame() {
    this.gameOver = true;
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    
    if (this.finalScoreDisplay) {
      this.finalScoreDisplay.textContent = this.formatNumber(this.score);
    }
    
    this.showOverlay();
  }
  
  showOverlay() {
    if (this.gameOverlay) {
      this.gameOverlay.classList.add('active');
    }
  }
  
  hideOverlay() {
    if (this.gameOverlay) {
      this.gameOverlay.classList.remove('active');
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if we're on the game page
  if (document.getElementById('game-canvas')) {
    window.tetrisGame = new TetrisGame();
  }
});
