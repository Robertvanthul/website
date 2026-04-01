

(function () {
  let gameLoop = null;
  let snake, dir, nextDir, food, score, gameToken;

  const COLS = 20;
  const ROWS = 16;
  const CELL = 16;
  const API  = '/api/leaderboard';

  const overlay = document.createElement('div');
  overlay.id = 'egg-overlay';
  overlay.innerHTML = `
    <div id="egg-window">
      <div id="egg-titlebar">
        <span id="egg-title">ðŸ snake</span>
        <div id="egg-controls">
          <span id="egg-score">score: 0</span>
          <button id="egg-lb-btn" type="button" title="Leaderboard">ðŸ†</button>
          <button id="egg-close" type="button">âœ•</button>
        </div>
      </div>
      <div id="egg-canvas-wrap">
        <canvas id="egg-canvas" width="${COLS * CELL}" height="${ROWS * CELL}"></canvas>

        <div id="egg-leaderboard-panel" class="egg-panel">
          <p id="egg-lb-heading">ðŸ† top scores</p>
          <div id="egg-lb-list"></div>
          <button id="egg-lb-back-btn" type="button">play again</button>
        </div>

        <div id="egg-submit-panel" class="egg-panel">
          <p id="egg-submit-heading">game over!</p>
          <p id="egg-submit-score-text">score: <strong id="egg-submit-score-val">0</strong></p>
          <button id="egg-submit-btn" type="button">submit to leaderboard</button>
          <button id="egg-skip-btn" type="button">skip</button>
        </div>
      </div>
      <div id="egg-hint">arrow keys / wasd Â· r to start/restart Â· esc to close</div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #egg-overlay {
      position: fixed;
      bottom: -110%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99998;
      transition: bottom 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: 'Gaegu', cursive;
    }
    #egg-overlay.visible { bottom: 24px; }

    #egg-window {
      background: #fffbf0;
      border: 2.5px solid #2b2118;
      border-radius: 14px;
      box-shadow: 6px 6px 0 #2b2118;
      overflow: hidden;
      width: ${COLS * CELL + 2}px;
    }
    #egg-titlebar {
      background: #fbbf24;
      border-bottom: 2px solid #2b2118;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
    }
    #egg-title  { font-size: 1rem; font-weight: 700; color: #2b2118; }
    #egg-controls { display: flex; align-items: center; gap: 8px; }
    #egg-score  { font-size: 0.85rem; font-weight: 700; color: #2b2118; }

    #egg-lb-btn, #egg-close {
      border: 2px solid #2b2118;
      border-radius: 50%;
      width: 24px; height: 24px;
      font-size: 0.65rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 0; line-height: 1;
      transition: transform 0.15s;
    }
    #egg-lb-btn { background: #a3e635; }
    #egg-close  { background: #f87171; }
    #egg-lb-btn:hover, #egg-close:hover { transform: scale(1.15); }

    #egg-canvas-wrap { position: relative; display: block; line-height: 0; }
    #egg-canvas { display: block; background: #fdf6e3; }

    /* â”€â”€ panels â”€â”€ */
    .egg-panel {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(253,246,227,0.97);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 20px 24px;
      box-sizing: border-box;
    }
    .egg-panel.active { display: flex; }

    /* â”€â”€ leaderboard â”€â”€ */
    #egg-lb-heading {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2b2118;
      margin: 0 0 4px;
      line-height: 1.3;
    }
    #egg-lb-list {
      width: 100%;
      font-family: 'Nunito', sans-serif;
      font-size: 0.95rem;
      line-height: 1.4;
      color: #2b2118;
      max-height: 170px;
      overflow-y: auto;
    }
    .egg-lb-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
    }
    .egg-lb-row:nth-child(odd)  { background: rgba(251,191,36,0.18); }
    .egg-lb-row:nth-child(even) { background: rgba(74,222,128,0.15); }
    .egg-lb-row:first-child     { background: #fbbf24; font-weight: 700; font-size: 1rem; }
    .egg-lb-rank  { color: #7a6a58; }
    .egg-lb-score { font-weight: 700; }
    .egg-lb-empty { text-align: center; color: #7a6a58; padding: 16px 0; font-family: 'Nunito', sans-serif; }

    #egg-lb-back-btn {
      font-family: 'Gaegu', cursive;
      font-size: 1.05rem;
      font-weight: 700;
      border: 2.5px solid #2b2118;
      border-radius: 10px;
      padding: 8px 0;
      width: 86%;
      background: #fbbf24;
      cursor: pointer;
      margin-top: 4px;
      transition: transform 0.12s, box-shadow 0.12s;
      box-shadow: 3px 3px 0 #2b2118;
    }
    #egg-lb-back-btn:hover {
      transform: translate(-1px,-1px);
      box-shadow: 4px 4px 0 #2b2118;
    }

    /* â”€â”€ submit score panel â”€â”€ */
    #egg-submit-heading {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2b2118;
      margin: 0 0 2px;
      line-height: 1.3;
    }
    #egg-submit-score-text {
      font-family: 'Nunito', sans-serif;
      font-size: 0.95rem;
      color: #2b2118;
      margin: 0 0 4px;
    }
    #egg-submit-btn, #egg-skip-btn {
      font-family: 'Gaegu', cursive;
      font-size: 1.05rem;
      font-weight: 700;
      border: 2.5px solid #2b2118;
      border-radius: 10px;
      padding: 8px 0;
      width: 86%;
      cursor: pointer;
      transition: transform 0.12s, box-shadow 0.12s;
      box-shadow: 3px 3px 0 #2b2118;
    }
    #egg-submit-btn { background: #4ade80; }
    #egg-skip-btn   { background: #fbbf24; }
    #egg-submit-btn:hover, #egg-skip-btn:hover {
      transform: translate(-1px,-1px);
      box-shadow: 4px 4px 0 #2b2118;
    }

    #egg-hint {
      text-align: center;
      font-size: 0.72rem;
      color: #7a6a58;
      padding: 5px 0 7px;
      background: #fffbf0;
      font-family: 'Nunito', sans-serif;
    }

    /* â”€â”€ floating trigger button â”€â”€ */
    #bored-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99997;
      background: #fffbf0;
      border: 2.5px solid #2b2118;
      border-radius: 12px;
      padding: 8px 16px;
      font-family: 'Gaegu', cursive;
      font-size: 1rem;
      font-weight: 700;
      color: #2b2118;
      box-shadow: 4px 4px 0 #2b2118;
      cursor: pointer;
      transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
    }
    #bored-btn:hover {
      transform: translate(-2px,-2px);
      box-shadow: 6px 6px 0 #2b2118;
    }
    #bored-btn:active {
      transform: translate(1px,1px);
      box-shadow: 2px 2px 0 #2b2118;
    }
    #bored-btn.hidden {
      opacity: 0;
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  const canvas      = document.getElementById('egg-canvas');
  const ctx         = canvas.getContext('2d');
  const scoreEl     = document.getElementById('egg-score');
  const lbPanel     = document.getElementById('egg-leaderboard-panel');
  const submitPanel = document.getElementById('egg-submit-panel');

  function initGame() {
    snake   = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score   = 0;
    scoreEl.textContent = 'score: 0';
    placeFood();
    render();
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();

    const eatsFood = head.x === food.x && head.y === food.y;
    const checkAgainst = eatsFood ? snake : snake.slice(0, -1);
    if (checkAgainst.some(s => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);
    if (eatsFood) {
      score++;
      scoreEl.textContent = `score: ${score}`;
      placeFood();
      reportEat();
    } else {
      snake.pop();
    }
    render();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(43,33,24,0.06)';
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);

    ctx.fillStyle = '#f97316'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1.5;
    roundRect(ctx, food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 4);
    ctx.fill(); ctx.stroke();

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#2b2118' : '#4ade80';
      ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1.5;
      roundRect(ctx, seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 5 : 4);
      ctx.fill(); ctx.stroke();
    });
  }

  function showStartScreen() {
    render();
    ctx.fillStyle = 'rgba(253,246,227,0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2b2118';
    ctx.font = `bold 28px 'Gaegu', cursive`;
    ctx.fillText('ðŸ snake', canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = `16px 'Nunito', sans-serif`;
    ctx.fillStyle = '#7a6a58';
    ctx.fillText('press R to start', canvas.width / 2, canvas.height / 2 + 14);
  }

  function gameOver() {
    clearInterval(gameLoop);
    gameLoop = null;
    if (score > 0) {
      document.getElementById('egg-submit-score-val').textContent = score;
      submitPanel.classList.add('active');
    } else {
      ctx.fillStyle = 'rgba(253,246,227,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2b2118';
      ctx.font = `bold 26px 'Gaegu', cursive`;
      ctx.fillText('game over :(', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = `14px 'Nunito', sans-serif`;
      ctx.fillStyle = '#7a6a58';
      ctx.fillText(`score: ${score}  Â·  r to restart`, canvas.width / 2, canvas.height / 2 + 16);
    }
  }

  function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    lbPanel.classList.remove('active');
    submitPanel.classList.remove('active');
    gameToken = null;
    fetchGameToken();
    initGame();
    gameLoop = setInterval(tick, 120);
  }

  async function fetchLeaderboard() {
    const listEl = document.getElementById('egg-lb-list');
    listEl.innerHTML = '<div class="egg-lb-empty">loading...</div>';
    try {
      const res  = await fetch(API);
      if (!res.ok) throw new Error();
      const rows = await res.json();
      if (!rows.length) {
        listEl.innerHTML = '<div class="egg-lb-empty">no scores yet!</div>';
        return;
      }
      const medals = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];
      listEl.innerHTML = rows.map((r, i) => `
        <div class="egg-lb-row">
          <span class="egg-lb-rank">${medals[i] || (i + 1)}</span>
          <span class="egg-lb-score">${r.score}</span>
        </div>
      `).join('');
    } catch {
      listEl.innerHTML = '<div class="egg-lb-empty">could not load scores :(</div>';
    }
  }

  function showLeaderboard() {
    submitPanel.classList.remove('active');
    lbPanel.classList.add('active');
    fetchLeaderboard();
  }

  async function fetchGameToken() {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      if (res.ok) {
        const data = await res.json();
        gameToken = data.token ?? null;
      }
    } catch {
      gameToken = null;
    }
  }

  function reportEat() {
    if (!gameToken) return;
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'eat', token: gameToken }),
    }).catch(() => {});
  }

  async function submitScore() {
    if (!gameToken) return;
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', token: gameToken }),
      });
    } catch {
      // silently ignore network errors
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('visible')) return;
    if (lbPanel.classList.contains('active')) return;
    if (submitPanel.classList.contains('active')) return;

    const map = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown:  { x: 0, y:  1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y:  0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
      a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };
    if (map[e.key] && gameLoop) {
      const nd = map[e.key];
      if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
      e.preventDefault();
    }
    if (e.key === 'r' || e.key === 'R') startGame();
    if (e.key === 'Escape') closeEgg();
  });

  let touchStart = null;
  canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart || !gameLoop) return;
    const dx = e.changedTouches[0].clientX - touchStart.clientX;
    const dy = e.changedTouches[0].clientY - touchStart.clientY;
    if (Math.abs(dx) > Math.abs(dy))
      nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    else
      nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    touchStart = null;
  }, { passive: true });

  document.getElementById('egg-lb-back-btn').addEventListener('click', () => {
    lbPanel.classList.remove('active');
    startGame();
  });
  document.getElementById('egg-lb-btn').addEventListener('click', showLeaderboard);
  document.getElementById('egg-close').addEventListener('click', closeEgg);

  document.getElementById('egg-submit-btn').addEventListener('click', async () => {
    await submitScore();
    submitPanel.classList.remove('active');
    showLeaderboard();
  });

  document.getElementById('egg-skip-btn').addEventListener('click', () => {
    submitPanel.classList.remove('active');
    startGame();
  });

  function openEgg() {
    const btn = document.getElementById('bored-btn');
    if (btn) btn.classList.add('hidden');
    overlay.classList.add('visible');
    initGame();
    showStartScreen();
  }

  function closeEgg() {
    overlay.classList.remove('visible');
    clearInterval(gameLoop);
    gameLoop = null;
    lbPanel.classList.remove('active');
    submitPanel.classList.remove('active');
    const btn = document.getElementById('bored-btn');
    if (btn) btn.classList.remove('hidden');
  }

  function attachTrigger() {
    const btn = document.getElementById('bored-btn');
    if (btn) btn.addEventListener('click', openEgg);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachTrigger);
  } else {
    attachTrigger();
  }
})();

