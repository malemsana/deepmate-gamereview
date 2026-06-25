import { state } from './state.js';
import { DEMO_GAMES } from './config.js';
import { 
  initEngineWorker, 
  startEngineAnalysis, 
  runSimulatedAnalysis, 
  engineReady,
  engineWorker
} from './engine.js';
import { initBoard, updateBoardDisplay } from './board.js';
import { 
  drawEvaluationGraph, 
  handleGraphHover, 
  handleGraphClick, 
  updateGraphCursorPosition 
} from './graph.js';
import { drawMoveArrow, clearArrows } from './arrows.js';

let autoplayInterval = null;

// DOM Elements cache
let landingScreen, reviewWorkspace, pgnInput, startAnalysisBtn, headerLogo, navHomeBtn, sidebarBackHome;
let loadingOverlay, loadingStatusText, loadingProgressFill;
let btnFirst, btnPrev, btnPlay, btnNext, btnLast, btnNextKeyMove;
let tabReviewBtn, tabMovesBtn, tabEngineBtn, panelReview, panelMoves, panelEngine;
let whiteUsername, blackUsername, whiteRatingTag, blackRatingTag, whiteFlagImg, blackFlagImg, whiteAccText, blackAccText;
let coachBadgeIcon, coachBadgeText, coachEvalValue, coachExplanation, movesListContainer;
let engineEvalScore, engineDepth, engineNodes, engineStatusTag, evalBarFill, evalBarText;

// App Initializer
window.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  setupEventListeners();
  initBoard();
  
  // Start engine worker
  initEngineWorker(
    () => {
      engineStatusTag.innerText = "READY";
      engineStatusTag.className = "engine-indicator-badge";
    },
    (line) => {
      // Worker output hook if needed
    }
  );
  
  // Resize handler
  window.addEventListener('resize', resizeBoard);
});

// Cache DOM references
function cacheDOMElements() {
  landingScreen = document.getElementById('landing-screen');
  reviewWorkspace = document.getElementById('review-workspace');
  pgnInput = document.getElementById('pgn-input');
  startAnalysisBtn = document.getElementById('start-analysis-btn');
  headerLogo = document.getElementById('header-logo');
  navHomeBtn = document.getElementById('nav-home-btn');
  sidebarBackHome = document.getElementById('sidebar-back-home');
  loadingOverlay = document.getElementById('analysis-loading-overlay');
  loadingStatusText = document.getElementById('analysis-status-text');
  loadingProgressFill = document.getElementById('analysis-progress-fill');
  
  btnFirst = document.getElementById('btn-first');
  btnPrev = document.getElementById('btn-prev');
  btnPlay = document.getElementById('btn-play');
  btnNext = document.getElementById('btn-next');
  btnLast = document.getElementById('btn-last');
  btnNextKeyMove = document.getElementById('btn-next-key-move');
  
  tabReviewBtn = document.getElementById('tab-btn-review');
  tabMovesBtn = document.getElementById('tab-btn-moves');
  tabEngineBtn = document.getElementById('tab-btn-engine');
  panelReview = document.getElementById('panel-review');
  panelMoves = document.getElementById('panel-moves');
  panelEngine = document.getElementById('panel-engine');
  
  whiteUsername = document.getElementById('white-username');
  blackUsername = document.getElementById('black-username');
  whiteRatingTag = document.getElementById('white-rating-tag');
  blackRatingTag = document.getElementById('black-rating-tag');
  whiteFlagImg = document.getElementById('white-flag');
  blackFlagImg = document.getElementById('black-flag');
  whiteAccText = document.getElementById('accuracy-white-text');
  blackAccText = document.getElementById('accuracy-black-text');
  
  coachBadgeIcon = document.getElementById('coach-badge-icon');
  coachBadgeText = document.getElementById('coach-badge-text');
  coachEvalValue = document.getElementById('coach-eval-value');
  coachExplanation = document.getElementById('coach-explanation');
  movesListContainer = document.getElementById('moves-list-container');
  
  engineEvalScore = document.getElementById('engine-eval-score');
  engineDepth = document.getElementById('engine-depth');
  engineNodes = document.getElementById('engine-nodes');
  engineStatusTag = document.getElementById('engine-status-tag');
  evalBarFill = document.getElementById('eval-bar-fill');
  evalBarText = document.getElementById('eval-bar-text');
}

// Bind Events
function setupEventListeners() {
  startAnalysisBtn.addEventListener('click', handleStartAnalysis);
  headerLogo.addEventListener('click', showLanding);
  navHomeBtn.addEventListener('click', showLanding);
  sidebarBackHome.addEventListener('click', showLanding);
  
  btnFirst.addEventListener('click', () => jumpToMove(-1));
  btnPrev.addEventListener('click', () => stepMove(-1));
  btnNext.addEventListener('click', () => stepMove(1));
  btnLast.addEventListener('click', () => jumpToMove(state.gameHistory.length - 1));
  btnPlay.addEventListener('click', toggleAutoplay);
  
  btnNextKeyMove.addEventListener('click', () => {
    if (state.currentMoveIdx < state.gameHistory.length - 1) {
      stepMove(1);
    }
  });

  // Demo cards
  document.querySelectorAll('.demo-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-game-idx'));
      loadShowcaseGame(idx);
    });
  });
  
  // Tabs
  const tabs = [tabReviewBtn, tabMovesBtn, tabEngineBtn];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetId = tab.getAttribute('data-target');
      [panelReview, panelMoves, panelEngine].forEach(panel => {
        panel.classList.remove('active');
      });
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
  
  // Graph Events
  const graphWrap = document.getElementById('graph-container');
  if (graphWrap) {
    graphWrap.addEventListener('mousemove', handleGraphHover);
    graphWrap.addEventListener('mouseleave', () => {
      const hoverCursor = document.getElementById('graph-hover-cursor');
      if (hoverCursor) hoverCursor.style.display = 'none';
    });
    graphWrap.addEventListener('click', handleGraphClick);
  }
  
  // Listen for real-time Stockfish updates
  window.addEventListener('engine-info', (e) => {
    const { depth, scoreText, nps, pv } = e.detail;
    if (scoreText && engineEvalScore) engineEvalScore.innerText = scoreText;
    if (depth && engineDepth) engineDepth.innerText = `Depth: ${depth}`;
    if (nps && engineNodes) engineNodes.innerText = `Speed: ${(nps / 1000).toFixed(0)} k/s`;
    const pvText = document.getElementById('line-1-pv');
    if (pv && pvText) {
      const pvMoves = pv.split(' ').slice(0, 5).join(' ');
      pvText.innerText = pvMoves;
    }
  });
  
  window.addEventListener('self-analysis-compiled', (e) => {
    const { move, classification, comment, evalScore } = e.detail;
    
    const badgeColors = {
      brilliant: 'var(--color-brilliant)',
      great: 'var(--color-great)',
      best: 'var(--color-best)',
      excellent: 'var(--color-excellent)',
      good: 'var(--color-good)',
      book: 'var(--color-book)',
      forced: 'var(--color-forced)',
      inaccuracy: 'var(--color-inaccuracy)',
      mistake: 'var(--color-mistake)',
      blunder: 'var(--color-blunder)',
      miss: 'var(--color-miss)',
      missed_win: 'var(--color-missed-win)',
      missed_draw: 'var(--color-missed-draw)'
    };
    
    if (coachBadgeIcon) {
      coachBadgeIcon.innerHTML = `<img src="assets/moveIcons/icon_${classification.replace('_', '-')}.svg" style="width: 20px; height: 20px; display: block;" alt="${classification}"/>`;
    }
    if (coachBadgeText) {
      coachBadgeText.innerText = `${move.san} is a ${classification.replace('_', ' ')} move`;
      coachBadgeText.style.color = badgeColors[classification] || 'inherit';
    }
    
    if (coachEvalValue) {
      let scoreText = evalScore > 0 ? '+' : '';
      if (Math.abs(evalScore) === 99.0) {
        scoreText = evalScore > 0 ? 'M' : '-M';
      } else {
        scoreText += evalScore.toFixed(2);
      }
      coachEvalValue.innerText = scoreText;
    }
    
    if (coachExplanation) {
      coachExplanation.innerText = comment;
    }
    
    // Sync Vertical Eval Bar height
    let barVal = evalScore;
    if (Math.abs(evalScore) === 99.0) {
      barVal = evalScore > 0 ? 8.0 : -8.0;
    }
    let pct = ((barVal + 8.0) / 16.0) * 100;
    if (pct > 95) pct = 95;
    if (pct < 5) pct = 5;
    if (evalBarFill) evalBarFill.style.height = `${pct}%`;
    if (evalBarText) evalBarText.innerText = Math.abs(barVal).toFixed(1);
    
    // Re-draw board badges
    updateBoardDisplay();
    
    // Draw suggestion arrow for the best move in variations mode
    clearArrows();
    if (move.bestMove && move.bestMove.length >= 4) {
      const from = move.bestMove.slice(0, 2);
      const to = move.bestMove.slice(2, 4);
      drawMoveArrow(from, to);
    }
  });
}

// Exit Variations Mode
window.exitSelfAnalysis = function() {
  state.isSelfAnalysis = false;
  state.selfAnalysisHistory = [];
  state.selfAnalysisMoveIdx = -1;
  const ind = document.getElementById('self-analysis-indicator');
  if (ind) ind.remove();
  
  jumpToMove(state.currentMoveIdx);
};

// UI Sizing responsive loop
export function resizeBoard() {
  const isMobile = window.innerWidth <= 800;
  const boardContainer = document.querySelector('.chessboard-container');
  const boardFrame = document.querySelector('.board-frame-container');
  const evalBar = document.querySelector('.eval-bar-wrapper');
  const sidebar = document.querySelector('.workspace-sidebar');
  
  if (!boardContainer || !boardFrame) return;
  
  const headerHeight = 50;
  const bannerHeight = 60; // 30px * 2 (top and bottom player banners)
  const padding = 24;      // Padding gaps
  
  // Available screen height
  const availableHeight = window.innerHeight - headerHeight - bannerHeight - padding;
  
  // Available screen width
  let availableWidth = window.innerWidth;
  if (isMobile) {
    availableWidth = window.innerWidth - 20; // 10px margins
  } else {
    // Desktop: screen width minus sidebar width (380px), eval bar (18px) and grid gaps (60px)
    availableWidth = window.innerWidth - 380 - 18 - 60;
  }
  
  // Compute square board size fitting both height and width boundaries
  const boardSize = Math.max(260, Math.min(availableHeight, availableWidth, 600));
  
  // Force widths and heights
  boardContainer.style.width = `${boardSize}px`;
  boardContainer.style.height = `${boardSize}px`;
  boardFrame.style.width = `${boardSize}px`;
  
  if (evalBar) {
    if (isMobile) {
      evalBar.style.height = '10px';
      evalBar.style.width = '100%';
    } else {
      evalBar.style.height = `${boardSize}px`;
      evalBar.style.width = '18px';
    }
  }
  
  // Align sidebar height to board frame height on desktop
  if (sidebar) {
    if (isMobile) {
      sidebar.style.height = '480px';
    } else {
      sidebar.style.height = `${boardSize + bannerHeight + 8}px`; // Match total left height
    }
  }
  
  // Redraw Eval graph dimensions
  drawEvaluationGraph();
}

// Navigational Jump to Move index
export function jumpToMove(idx) {
  if (autoplayInterval) {
    toggleAutoplay();
  }
  
  if (state.isSelfAnalysis) {
    state.isSelfAnalysis = false;
    const ind = document.getElementById('self-analysis-indicator');
    if (ind) ind.remove();
  }
  
  state.currentMoveIdx = idx;
  
  state.chess.reset();
  for (let i = 0; i <= idx; i++) {
    state.chess.move(state.gameHistory[i].san);
  }
  
  updateBoardDisplay();
  updateGraphCursorPosition();
  
  if (idx >= 0) {
    const move = state.gameHistory[idx];
    const isCheck = move && (move.san.includes('+') || move.san.includes('#'));
    playMoveSound(isCheck);
  }
  
  clearArrows();
  if (idx >= 0) {
    const type = state.reviewData.classifications[idx];
    const subOptimalTypes = ['inaccuracy', 'mistake', 'blunder', 'miss', 'missed_win', 'missed_draw'];
    if (type && subOptimalTypes.includes(type)) {
      const queueItem = state.analysisQueue[idx];
      if (queueItem && queueItem.bestMove && queueItem.bestMove.length >= 4) {
        const from = queueItem.bestMove.slice(0, 2);
        const to = queueItem.bestMove.slice(2, 4);
        drawMoveArrow(from, to);
      }
    }
  }
  
  document.querySelectorAll('.move-cell').forEach(c => {
    c.classList.remove('active-move');
    if (parseInt(c.getAttribute('data-move-idx')) === idx) {
      c.classList.add('active-move');
      c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
  
  // Re-sync coach speech elements
  if (idx === -1) {
    coachBadgeIcon.innerText = '♟';
    coachBadgeText.innerText = "Game start";
    coachBadgeIcon.style.color = 'inherit';
    coachBadgeText.style.color = 'inherit';
    coachEvalValue.innerText = "0.0";
    coachExplanation.innerText = "Starting position. White to play. Hit Next or Auto Play to review!";
    
    evalBarFill.style.height = "50%";
    evalBarText.innerText = "0.0";
  } else {
    const move = state.gameHistory[idx];
    const type = state.reviewData.classifications[idx];
    
    const badgeIcons = {
      brilliant: '★', great: '♦', best: '✔', excellent: '✔', good: '✔', book: '📖', forced: '🔒', inaccuracy: '?!', mistake: '?', blunder: '??', miss: '✗', missed_win: '🏆', missed_draw: '½'
    };
    
    const badgeColors = {
      brilliant: 'var(--color-brilliant)',
      great: 'var(--color-great)',
      best: 'var(--color-best)',
      excellent: 'var(--color-excellent)',
      good: 'var(--color-good)',
      book: 'var(--color-book)',
      forced: 'var(--color-forced)',
      inaccuracy: 'var(--color-inaccuracy)',
      mistake: 'var(--color-mistake)',
      blunder: 'var(--color-blunder)',
      miss: 'var(--color-miss)',
      missed_win: 'var(--color-missed-win)',
      missed_draw: 'var(--color-missed-draw)'
    };
    
    coachBadgeIcon.innerHTML = `<img src="assets/moveIcons/icon_${type.replace('_', '-')}.svg" style="width: 20px; height: 20px; display: block;" alt="${type}"/>`;
    coachBadgeText.innerText = `${move.san} is a ${type.replace('_', ' ')} move`;
    
    coachBadgeText.style.color = badgeColors[type] || 'inherit';
    
    const scoreVal = state.reviewData.evals[idx + 1];
    let scoreText = scoreVal > 0 ? '+' : '';
    if (Math.abs(scoreVal) === 99.0) {
      scoreText = scoreVal > 0 ? 'M' : '-M';
    } else {
      scoreText += scoreVal.toFixed(2);
    }
    coachEvalValue.innerText = scoreText;
    coachExplanation.innerText = state.reviewData.comments[idx] || `${move.san} played.`;
    
    // Sync Vertical Eval Bar height
    let barVal = scoreVal;
    if (Math.abs(scoreVal) === 99.0) {
      barVal = scoreVal > 0 ? 8.0 : -8.0;
    }
    let pct = ((barVal + 8.0) / 16.0) * 100;
    if (pct > 95) pct = 95;
    if (pct < 5) pct = 5;
    evalBarFill.style.height = `${pct}%`;
    evalBarText.innerText = Math.abs(barVal).toFixed(1);
    
    // Sync engine tab metrics
    engineEvalScore.innerText = scoreText;
    engineDepth.innerText = "Depth: review";
    const pvText = document.getElementById('line-1-pv');
    if (pvText) {
      pvText.innerText = state.reviewData.comments[idx];
    }
  }
}

// Step move relative navigation
function stepMove(dir) {
  const target = state.currentMoveIdx + dir;
  if (target >= -1 && target < state.gameHistory.length) {
    jumpToMove(target);
  }
}

// Autoplay loop manager
function toggleAutoplay() {
  const btn = document.getElementById('btn-play');
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
    btn.setAttribute('data-playing', 'false');
  } else {
    if (state.currentMoveIdx >= state.gameHistory.length - 1) {
      jumpToMove(-1);
    }
    
    autoplayInterval = setInterval(() => {
      if (state.currentMoveIdx < state.gameHistory.length - 1) {
        stepMove(1);
      } else {
        toggleAutoplay();
      }
    }, 1500);
    
    btn.setAttribute('data-playing', 'true');
  }
}

// Go back to home layout
function showLanding() {
  if (autoplayInterval) {
    toggleAutoplay();
  }
  reviewWorkspace.style.display = 'none';
  navHomeBtn.style.display = 'none';
  landingScreen.style.display = 'flex';
}

// Load showcase database review
function loadShowcaseGame(idx) {
  const demo = DEMO_GAMES[idx];
  loadingOverlay.style.display = 'flex';
  loadingStatusText.innerText = "Loading showcase...";
  loadingProgressFill.style.width = "30%";
  
  setTimeout(() => {
    state.chess.load_pgn(demo.pgn);
    extractHistoryFromChess();
    
    state.parsedMetadata = {
      white: demo.white,
      whiteRating: demo.whiteRating,
      whiteFlag: demo.whiteFlag,
      black: demo.black,
      blackRating: demo.blackRating,
      blackFlag: demo.blackFlag
    };
    
    state.reviewData.accuracies = { ...demo.accuracies };
    state.reviewData.evals = [ ...demo.evals ];
    state.reviewData.classifications = { ...demo.classifications };
    state.reviewData.comments = { ...demo.comments };
    
    for (let i = 0; i < state.gameHistory.length; i++) {
      if (!state.reviewData.classifications[i]) state.reviewData.classifications[i] = "best";
      if (!state.reviewData.comments[i]) state.reviewData.comments[i] = `${state.gameHistory[i].san} maintaining advantage.`;
    }
    
    loadingOverlay.style.display = 'none';
    renderAnalysisWorkspace();
  }, 350);
}

// Start analysis form triggers
function handleStartAnalysis() {
  const pgn = pgnInput.value.trim();
  if (!pgn) {
    alert("Please paste a valid chess PGN first.");
    return;
  }
  
  loadingOverlay.style.display = 'flex';
  loadingStatusText.innerText = "Parsing PGN game...";
  loadingProgressFill.style.width = "5%";
  
  setTimeout(() => {
    const success = state.chess.load_pgn(pgn);
    if (!success) {
      loadingOverlay.style.display = 'none';
      alert("Invalid PGN format!");
      return;
    }
    
    extractHistoryFromChess();
    
    const headers = state.chess.header();
    state.parsedMetadata = {
      white: headers.White || "White Player",
      whiteRating: headers.WhiteElo || "1500",
      whiteFlag: "un",
      black: headers.Black || "Black Player",
      blackRating: headers.BlackElo || "1500",
      blackFlag: "un"
    };
    
    state.analysisQueue = [];
    const tempChess = new Chess();
    state.analysisQueue.push({ fen: tempChess.fen(), movePlayed: null });
    
    for (let i = 0; i < state.gameHistory.length; i++) {
      tempChess.move(state.gameHistory[i].san);
      state.analysisQueue.push({
        fen: tempChess.fen(),
        movePlayed: state.gameHistory[i].san
      });
    }
    
    if (engineReady && engineWorker) {
      startEngineAnalysis(
        20,
        (phase, current, total, globalIdx) => {
          const progressPercent = Math.round((current / total) * 100);
          loadingProgressFill.style.width = `${progressPercent}%`;
          
          let phaseText = "";
          if (phase === 1) {
            phaseText = `Phase 1: Baseline Scan (Position ${current} of ${total - 1})`;
          } else if (phase === 2) {
            phaseText = `Phase 2: Analyzing Critical Positions (Move ${current + 1} of ${total})`;
          } else if (phase === 3) {
            phaseText = `Phase 3: Deep Resolution (Move ${current + 1} of ${total})`;
          }
          loadingStatusText.innerText = phaseText;
        },
        () => {
          loadingOverlay.style.display = 'none';
          renderAnalysisWorkspace();
        }
      );
    } else {
      runSimulatedAnalysis(
        (progress) => {
          loadingProgressFill.style.width = `${progress}%`;
          loadingStatusText.innerText = `Reviewing positions... ${progress}%`;
        },
        () => {
          loadingOverlay.style.display = 'none';
          renderAnalysisWorkspace();
        }
      );
    }
  }, 100);
}

// Convert chess.js structure
function extractHistoryFromChess() {
  const moves = state.chess.history({ verbose: true });
  state.gameHistory = [];
  moves.forEach(m => {
    state.gameHistory.push({
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color,
      piece: m.piece
    });
  });
}

// Render analysis panels layout
function renderAnalysisWorkspace() {
  landingScreen.style.display = 'none';
  reviewWorkspace.style.display = 'grid';
  navHomeBtn.style.display = 'inline-flex';
  
  whiteUsername.innerText = state.parsedMetadata.white;
  blackUsername.innerText = state.parsedMetadata.black;
  whiteRatingTag.innerText = `(${state.parsedMetadata.whiteRating})`;
  blackRatingTag.innerText = `(${state.parsedMetadata.blackRating})`;
  
  whiteFlagImg.src = `https://flagcdn.com/16x12/${state.parsedMetadata.whiteFlag}.png`;
  blackFlagImg.src = `https://flagcdn.com/16x12/${state.parsedMetadata.blackFlag}.png`;
  
  whiteAccText.innerText = `${state.reviewData.accuracies.white}%`;
  blackAccText.innerText = `${state.reviewData.accuracies.black}%`;
  
  renderMoveList();
  compileClassificationCounts();
  drawEvaluationGraph();
  
  resizeBoard();
  
  jumpToMove(-1);
}

// Count classification badges
function compileClassificationCounts() {
  const counts = {
    w: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, forced: 0, inaccuracy: 0, mistake: 0, miss: 0, missed_win: 0, missed_draw: 0, blunder: 0 },
    b: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, forced: 0, inaccuracy: 0, mistake: 0, miss: 0, missed_win: 0, missed_draw: 0, blunder: 0 }
  };
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const type = state.reviewData.classifications[i];
    if (type && counts[move.color][type] !== undefined) {
      counts[move.color][type]++;
    }
  }
  
  Object.keys(counts.w).forEach(key => {
    const wEl = document.getElementById(`stat-w-${key}`);
    const bEl = document.getElementById(`stat-b-${key}`);
    if (wEl) wEl.innerText = counts.w[key];
    if (bEl) bEl.innerText = counts.b[key];
  });
}

// Draw Move list logger
function renderMoveList() {
  movesListContainer.innerHTML = '';
  let rowEl = null;
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    
    if (i % 2 === 0) {
      rowEl = document.createElement('div');
      rowEl.className = 'move-row';
      
      const numEl = document.createElement('span');
      numEl.className = 'move-num';
      numEl.innerText = `${Math.floor(i / 2) + 1}.`;
      rowEl.appendChild(numEl);
      movesListContainer.appendChild(rowEl);
    }
    
    const moveCell = document.createElement('div');
    moveCell.className = 'move-cell';
    moveCell.setAttribute('data-move-idx', i);
    moveCell.addEventListener('click', () => jumpToMove(i));
    
    const sanSpan = document.createElement('span');
    sanSpan.innerText = move.san;
    moveCell.appendChild(sanSpan);
    
    const badgeType = state.reviewData.classifications[i];
    const hideBadges = ['best', 'excellent', 'good'];
    if (badgeType && !hideBadges.includes(badgeType)) {
      const badgeImg = document.createElement('img');
      badgeImg.src = `assets/moveIcons/icon_${badgeType.replace('_', '-')}.svg`;
      badgeImg.className = `move-badge-icon`;
      badgeImg.style.width = '18px';
      badgeImg.style.height = '18px';
      badgeImg.style.display = 'block';
      badgeImg.alt = badgeType;
      moveCell.appendChild(badgeImg);
    }
    
    rowEl.appendChild(moveCell);
  }
}

// Variations Mode indicator injection
export function insertSelfAnalysisIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'coach-panel';
  indicator.id = 'self-analysis-indicator';
  indicator.style.padding = '0.5rem';
  indicator.style.margin = '0.5rem 0';
  indicator.style.background = 'var(--bg-surface-2)';
  indicator.style.border = '1px solid var(--border-color)';
  indicator.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:0.2rem; width:100%; font-size:0.8rem;">
      <span style="font-weight:700; color:var(--primary);">Variations Mode</span>
      <button class="btn btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; width:fit-content;" onclick="exitSelfAnalysis()">Resume Review</button>
    </div>
  `;
  movesListContainer.insertBefore(indicator, movesListContainer.firstChild);
}

// Variations list renderer
export function renderSelfAnalysisMovesList() {
  document.querySelectorAll('.move-cell').forEach(c => c.classList.remove('active-move'));
  coachExplanation.innerHTML = `Exploring variation line: <strong style="color:var(--primary);">${state.selfAnalysisHistory.map(m=>m.san).join(' → ')}</strong>. Click Resume to return.`;
}

// Play move and check sound effects
export function playMoveSound(isCheck) {
  try {
    let audioPath;
    if (isCheck) {
      audioPath = 'assets/sfx/sfx_check.mp3';
    } else {
      const rand = Math.random() < 0.5 ? '1' : '2';
      audioPath = `assets/sfx/sfx_piecemove_${rand}.mp3`;
    }
    const audio = new Audio(audioPath);
    audio.play().catch(e => console.log("Audio play blocked/failed:", e));
  } catch (err) {
    console.warn("Failed to play move sound:", err);
  }
}
