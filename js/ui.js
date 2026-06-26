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
let soundEnabled = true;

// DOM Elements cache
let landingScreen, reviewWorkspace, pgnInput, startAnalysisBtn, headerLogo, navHomeBtn, sidebarBackHome;
let loadingOverlay, loadingStatusText, loadingProgressFill;
let btnFirst, btnPrev, btnPlay, btnNext, btnLast, btnNextKeyMove;
let panelReportCard, panelReviewMoves, btnReviewMoves, btnShowReport, navBtnReview, navBtnSound;
let engineStatsToggle, engineStatsDetails;
let whiteUsername, blackUsername, whiteRatingTag, blackRatingTag, whiteFlagImg, blackFlagImg, whiteAccText, blackAccText;
let coachBadgeIcon, coachBadgeText, coachEvalValue, coachExplanation, movesListContainer;
let engineEvalScore, engineDepth, engineNodes, engineStatusTag, evalBarFill, evalBarText;

// Chess.com and Upload variables
let chesscomUsernameInput, chesscomConnectBtn, chesscomDisconnectBtn;
let chesscomConnectCard, connectActionWrap, connectProfileWrap;
let chesscomProfileAvatar, chesscomProfileUsername, chesscomProfileTitle, chesscomProfileRealname;
let chesscomRecentPanel, featuredGameCard, recentGamesList;
let sidebarAvatarCircle, sidebarAvatarImg, sidebarProfileName, sidebarProfileStatus, sidebarDisconnectBtn;
let pgnDropZone, pgnFileInput;
let pgnImportModal, btnOpenImportModal, btnCloseImportModal;
let layoutDetailedBtn, layoutCompactBtn;

// App Initializer
window.addEventListener('DOMContentLoaded', () => {
  cacheDOMElements();
  setupEventListeners();
  initBoard();
  
  // Start engine worker
  initEngineWorker(
    () => {
      if (engineStatusTag) {
        engineStatusTag.innerText = "READY";
        engineStatusTag.className = "engine-indicator-badge";
      }
    },
    (line) => {
      // Worker output hook if needed
    }
  );
  
  // Load connected Chess.com account on startup
  const savedUsername = localStorage.getItem('chesscom_username');
  if (savedUsername) {
    loadChesscomProfileAndGames(savedUsername);
  }
  
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
  
  panelReportCard = document.getElementById('panel-report-card');
  panelReviewMoves = document.getElementById('panel-review-moves');
  btnReviewMoves = document.getElementById('btn-review-moves');
  btnShowReport = document.getElementById('btn-show-report');
  navBtnReview = document.getElementById('nav-btn-review');
  navBtnSound = document.getElementById('nav-btn-sound');
  engineStatsToggle = document.getElementById('engine-stats-toggle');
  engineStatsDetails = document.getElementById('engine-stats-details');
  
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

  // Chess.com links
  chesscomUsernameInput = document.getElementById('chesscom-username-input');
  chesscomConnectBtn = document.getElementById('chesscom-connect-btn');
  chesscomDisconnectBtn = document.getElementById('chesscom-disconnect-btn');
  chesscomConnectCard = document.getElementById('chesscom-connect-card');
  connectActionWrap = document.getElementById('connect-action-wrap');
  connectProfileWrap = document.getElementById('connect-profile-wrap');
  chesscomProfileAvatar = document.getElementById('chesscom-profile-avatar');
  chesscomProfileUsername = document.getElementById('chesscom-profile-username');
  chesscomProfileTitle = document.getElementById('chesscom-profile-title');
  chesscomProfileRealname = document.getElementById('chesscom-profile-realname');
  chesscomRecentPanel = document.getElementById('chesscom-recent-panel');
  featuredGameCard = document.getElementById('featured-game-card');
  recentGamesList = document.getElementById('recent-games-list');

  // Sidebar profile hooks
  sidebarAvatarCircle = document.getElementById('sidebar-avatar-circle');
  sidebarAvatarImg = document.getElementById('sidebar-avatar-img');
  sidebarProfileName = document.getElementById('sidebar-profile-name');
  sidebarProfileStatus = document.getElementById('sidebar-profile-status');
  sidebarDisconnectBtn = document.getElementById('sidebar-disconnect-btn');

  // Drag & drop file hooks
  pgnDropZone = document.getElementById('pgn-drop-zone');
  pgnFileInput = document.getElementById('pgn-file-input');

  // Modal and Layout switcher references
  pgnImportModal = document.getElementById('pgn-import-modal');
  btnOpenImportModal = document.getElementById('btn-open-import-modal');
  btnCloseImportModal = document.getElementById('btn-close-import-modal');
  layoutDetailedBtn = document.getElementById('layout-detailed-btn');
  layoutCompactBtn = document.getElementById('layout-compact-btn');
}

// Bind Events
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
  
  // Panel Toggling & Navigation
  btnReviewMoves.addEventListener('click', () => {
    panelReportCard.style.display = 'none';
    panelReviewMoves.style.display = 'block';
    btnShowReport.style.display = 'block';
    resizeBoard();
  });
  
  btnShowReport.addEventListener('click', () => {
    panelReportCard.style.display = 'block';
    panelReviewMoves.style.display = 'none';
    btnShowReport.style.display = 'none';
    resizeBoard();
  });
  
  navBtnReview.addEventListener('click', () => {
    if (!navBtnReview.disabled) {
      landingScreen.style.display = 'none';
      reviewWorkspace.style.display = 'grid';
      navHomeBtn.classList.remove('active');
      navBtnReview.classList.add('active');
      resizeBoard();
    }
  });
  
  navBtnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    if (soundEnabled) {
      if (soundIcon) soundIcon.innerText = "🔊";
      if (soundText) soundText.innerText = "Sound: On";
    } else {
      if (soundIcon) soundIcon.innerText = "🔇";
      if (soundText) soundText.innerText = "Sound: Off";
    }
  });

  const navBtnFlip = document.getElementById('nav-btn-flip');
  if (navBtnFlip) {
    navBtnFlip.addEventListener('click', () => {
      state.isFlipped = !state.isFlipped;
      updateBoardDisplay();
    });
  }

  // Chess.com links
  if (chesscomConnectBtn) {
    chesscomConnectBtn.addEventListener('click', handleConnectChesscom);
  }
  if (chesscomDisconnectBtn) {
    chesscomDisconnectBtn.addEventListener('click', handleDisconnectChesscom);
  }
  if (sidebarDisconnectBtn) {
    sidebarDisconnectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDisconnectChesscom();
    });
  }

  // Keyboard navigation shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'ArrowRight') {
      stepMove(1);
    } else if (e.key === 'ArrowLeft') {
      stepMove(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      jumpToMove(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      jumpToMove(state.gameHistory.length - 1);
    }
  });

  // Drag & drop files
  if (pgnDropZone && pgnFileInput) {
    pgnDropZone.addEventListener('click', () => pgnFileInput.click());
    pgnFileInput.addEventListener('change', handleFileSelect);
    
    pgnDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      pgnDropZone.classList.add('dragover');
    });
    pgnDropZone.addEventListener('dragleave', () => {
      pgnDropZone.classList.remove('dragover');
    });
    pgnDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      pgnDropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processUploadedFile(files[0]);
      }
    });
  }

  if (engineStatsToggle && engineStatsDetails) {
    engineStatsToggle.addEventListener('click', () => {
      if (engineStatsDetails.style.display === 'none') {
        engineStatsDetails.style.display = 'block';
      } else {
        engineStatsDetails.style.display = 'none';
      }
    });
  }

  // Breakdown Toggle Event
  const breakdownToggleBtn = document.getElementById('breakdown-toggle-btn');
  const breakdownToggleArrow = document.getElementById('breakdown-toggle-arrow');
  const breakdownToggleText = document.getElementById('breakdown-toggle-text');
  if (breakdownToggleBtn) {
    breakdownToggleBtn.addEventListener('click', () => {
      const collapsibleRows = document.querySelectorAll('.breakdown-row.collapsible-row');
      const isCollapsed = collapsibleRows[0].classList.contains('collapsed');
      
      collapsibleRows.forEach(row => {
        if (isCollapsed) {
          row.classList.remove('collapsed');
        } else {
          row.classList.add('collapsed');
        }
      });
      
      if (isCollapsed) {
        if (breakdownToggleArrow) breakdownToggleArrow.innerText = '^';
        if (breakdownToggleText) breakdownToggleText.innerText = 'Show Less Classifications';
      } else {
        if (breakdownToggleArrow) breakdownToggleArrow.innerText = 'v';
        if (breakdownToggleText) breakdownToggleText.innerText = 'Show More Classifications';
      }
    });
  }
  
  // Graph Events
  const graphWrap = document.getElementById('graph-container');
  if (graphWrap) {
    graphWrap.addEventListener('mousemove', handleGraphHover);
    graphWrap.addEventListener('mouseleave', () => {
      const hoverCursor = document.getElementById('graph-hover-cursor');
      if (hoverCursor) hoverCursor.style.display = 'none';
      const tooltip = document.getElementById('graph-tooltip');
      if (tooltip) tooltip.style.display = 'none';
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

    // Trigger coach speak animation
    const coachContainer = document.querySelector('.coach-container');
    if (coachContainer) {
      coachContainer.classList.add('speaking');
      setTimeout(() => coachContainer.classList.remove('speaking'), 1200);
    }
  });

  // Modal open/close and backdrop click listeners
  if (btnOpenImportModal) {
    btnOpenImportModal.addEventListener('click', () => {
      if (pgnImportModal) pgnImportModal.style.display = 'flex';
    });
  }
  if (btnCloseImportModal) {
    btnCloseImportModal.addEventListener('click', () => {
      if (pgnImportModal) pgnImportModal.style.display = 'none';
    });
  }
  if (pgnImportModal) {
    pgnImportModal.addEventListener('click', (e) => {
      if (e.target === pgnImportModal) {
        pgnImportModal.style.display = 'none';
      }
    });
  }

  // Layout switcher buttons listeners
  if (layoutDetailedBtn) {
    layoutDetailedBtn.addEventListener('click', () => {
      if (recentGamesList) recentGamesList.classList.remove('compact-view');
      if (chesscomRecentPanel) chesscomRecentPanel.classList.remove('compact-view');
      layoutDetailedBtn.classList.add('active');
      if (layoutCompactBtn) layoutCompactBtn.classList.remove('active');
    });
  }
  if (layoutCompactBtn) {
    layoutCompactBtn.addEventListener('click', () => {
      if (recentGamesList) recentGamesList.classList.add('compact-view');
      if (chesscomRecentPanel) chesscomRecentPanel.classList.add('compact-view');
      layoutCompactBtn.classList.add('active');
      if (layoutDetailedBtn) layoutDetailedBtn.classList.remove('active');
    });
  }
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
export function jumpToMove(idx, isInitial = false) {
  if (autoplayInterval) {
    toggleAutoplay();
  }
  
  if (state.isSelfAnalysis) {
    state.isSelfAnalysis = false;
    const ind = document.getElementById('self-analysis-indicator');
    if (ind) ind.remove();
  }
  
  // Auto toggle to moves list panel if on Report Card panel during navigation
  if (panelReportCard && panelReportCard.style.display !== 'none' && !isInitial) {
    panelReportCard.style.display = 'none';
    panelReviewMoves.style.display = 'block';
    btnShowReport.style.display = 'block';
    resizeBoard();
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

  // Trigger coach speak animation on move change
  const coachContainer = document.querySelector('.coach-container');
  if (coachContainer) {
    coachContainer.classList.add('speaking');
    setTimeout(() => coachContainer.classList.remove('speaking'), 1200);
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
  landingScreen.style.display = 'flex';
  
  navHomeBtn.classList.add('active');
  navBtnReview.classList.remove('active');
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
  
  // Hide modal on successful start of analysis
  if (pgnImportModal) pgnImportModal.style.display = 'none';
  
  loadingOverlay.style.display = 'flex';
  loadingStatusText.innerText = "Parsing PGN game...";
  loadingProgressFill.style.width = "5%";

  // Reset loading checklist items
  document.querySelectorAll('.checklist-item').forEach(li => {
    li.className = 'checklist-item';
    const icon = li.querySelector('.chk-icon');
    if (icon) icon.innerText = '⏳';
  });
  
  updateChecklistState('chk-engine', 'done');
  updateChecklistState('chk-book', 'active');
  
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
            updateChecklistState('chk-book', 'done');
            updateChecklistState('chk-centipawn', 'active');
          } else if (phase === 2) {
            phaseText = `Phase 2: Analyzing Critical Positions (Move ${current + 1} of ${total})`;
            updateChecklistState('chk-centipawn', 'done');
            updateChecklistState('chk-tactics', 'active');
          } else if (phase === 3) {
            phaseText = `Phase 3: Deep Resolution (Move ${current + 1} of ${total})`;
            updateChecklistState('chk-tactics', 'done');
            updateChecklistState('chk-coach', 'active');
          }
          loadingStatusText.innerText = phaseText;
        },
        () => {
          updateChecklistState('chk-coach', 'done');
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
            renderAnalysisWorkspace();
          }, 300);
        }
      );
    } else {
      runSimulatedAnalysis(
        (progress) => {
          loadingProgressFill.style.width = `${progress}%`;
          loadingStatusText.innerText = `Reviewing positions... ${progress}%`;

          if (progress > 15) updateChecklistState('chk-book', 'done');
          if (progress > 15 && progress <= 50) updateChecklistState('chk-centipawn', 'active');
          if (progress > 50) updateChecklistState('chk-centipawn', 'done');
          if (progress > 50 && progress <= 80) updateChecklistState('chk-tactics', 'active');
          if (progress > 80) updateChecklistState('chk-tactics', 'done');
          if (progress > 80 && progress < 100) updateChecklistState('chk-coach', 'active');
        },
        () => {
          updateChecklistState('chk-coach', 'done');
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
            renderAnalysisWorkspace();
          }, 300);
        }
      );
    }
  }, 100);
}

function updateChecklistState(id, chkState) {
  const el = document.getElementById(id);
  if (!el) return;
  const icon = el.querySelector('.chk-icon');
  if (chkState === 'active') {
    el.className = 'checklist-item active';
    if (icon) icon.innerText = '⏳';
  } else if (chkState === 'done') {
    el.className = 'checklist-item done';
    if (icon) icon.innerText = '✔';
  }
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
  
  navHomeBtn.classList.remove('active');
  navBtnReview.classList.add('active');
  navBtnReview.disabled = false;
  
  if (panelReportCard) panelReportCard.style.display = 'block';
  if (panelReviewMoves) panelReviewMoves.style.display = 'none';
  if (btnShowReport) btnShowReport.style.display = 'none';
  
  whiteUsername.innerText = state.parsedMetadata.white;
  blackUsername.innerText = state.parsedMetadata.black;
  whiteRatingTag.innerText = `(${state.parsedMetadata.whiteRating})`;
  blackRatingTag.innerText = `(${state.parsedMetadata.blackRating})`;
  
  whiteFlagImg.src = `https://flagcdn.com/16x12/${state.parsedMetadata.whiteFlag}.png`;
  blackFlagImg.src = `https://flagcdn.com/16x12/${state.parsedMetadata.blackFlag}.png`;
  
  const wAcc = state.reviewData.accuracies.white;
  const bAcc = state.reviewData.accuracies.black;

  animateTextCounter(whiteAccText, 0, wAcc, 1000);
  animateTextCounter(blackAccText, 0, bAcc, 1000);

  const wCircle = document.getElementById('accuracy-white-circle');
  const bCircle = document.getElementById('accuracy-black-circle');
  if (wCircle) {
    wCircle.style.strokeDashoffset = 264 - (264 * wAcc) / 100;
  }
  if (bCircle) {
    bCircle.style.strokeDashoffset = 264 - (264 * bAcc) / 100;
  }
  
  renderMoveList();
  compileClassificationCounts();
  drawEvaluationGraph();
  
  resizeBoard();
  
  jumpToMove(-1, true);
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
  if (!soundEnabled) return;
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

// Load connected Chess.com account profile & games list
async function loadChesscomProfileAndGames(username) {
  try {
    // 1. Fetch Profile Info
    const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);
    if (!profileRes.ok) throw new Error("Chess.com profile not found");
    const profile = await profileRes.json();
    
    // Save to localStorage
    localStorage.setItem('chesscom_username', username);
    
    // Hide connection card completely on dashboard once connected
    chesscomConnectCard.style.display = 'none';
    
    chesscomProfileUsername.innerText = profile.username;
    chesscomProfileRealname.innerText = profile.name || "Chess.com Player";
    if (profile.title) {
      chesscomProfileTitle.innerText = profile.title;
      chesscomProfileTitle.style.display = 'inline-block';
    } else {
      chesscomProfileTitle.style.display = 'none';
    }
    
    const avatarUrl = profile.avatar || "https://www.chess.com/bundles/web/images/noavatar_l.gif";
    chesscomProfileAvatar.src = avatarUrl;
    
    // Update left nav sidebar profile
    if (sidebarAvatarCircle) sidebarAvatarCircle.style.display = 'none';
    if (sidebarAvatarImg) {
      sidebarAvatarImg.src = avatarUrl;
      sidebarAvatarImg.style.display = 'block';
    }
    if (sidebarProfileName) sidebarProfileName.innerText = profile.username;
    if (sidebarProfileStatus) sidebarProfileStatus.innerText = profile.title || "Premium Member";
    if (sidebarDisconnectBtn) sidebarDisconnectBtn.style.display = 'inline-block';

    // 2. Fetch Recent Games
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!archivesRes.ok) throw new Error("Could not load player game archives");
    const archives = await archivesRes.json();
    
    if (archives.archives && archives.archives.length > 0) {
      const latestMonthUrl = archives.archives[archives.archives.length - 1];
      const gamesRes = await fetch(latestMonthUrl);
      if (!gamesRes.ok) throw new Error("Could not load latest month games");
      const gamesData = await gamesRes.json();
      
      const gamesList = gamesData.games || [];
      if (gamesList.length > 0) {
        // Sort games descending (newest first)
        gamesList.reverse();
        renderChesscomGames(gamesList, username);
      } else {
        showNoGamesState();
      }
    } else {
      showNoGamesState();
    }
  } catch (err) {
    console.error("Chess.com API Integration Error:", err);
    alert("Could not load Chess.com profile: " + err.message);
    handleDisconnectChesscom(); // Reset connected state on failure
  }
}

function showNoGamesState() {
  chesscomRecentPanel.style.display = 'block';
  featuredGameCard.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-secondary);">No games found in the current archive.</div>`;
  recentGamesList.innerHTML = '';
}

function renderChesscomGames(games, username) {
  chesscomRecentPanel.style.display = 'block';
  featuredGameCard.innerHTML = '';
  recentGamesList.innerHTML = '';
  
  // Take top 6 games
  const displayGames = games.slice(0, 6);
  if (displayGames.length === 0) return;
  
  // 1. Render Featured Game (latest)
  const latest = displayGames[0];
  const latestOutcome = getGameOutcome(latest, username);
  const latestOpponent = getOpponentName(latest, username);
  const latestOpponentRating = getOpponentRating(latest, username);
  const latestPlayerRating = getPlayerRating(latest, username);
  const latestDate = new Date(latest.end_time * 1000).toLocaleDateString();
  const latestTimeClass = latest.time_class || "game";
  const latestTimeIcon = latestTimeClass === 'blitz' ? '⚡' : latestTimeClass === 'bullet' ? '🚀' : latestTimeClass === 'rapid' ? '⏱' : '♟';
  const latestTimeFormatted = latestTimeClass.charAt(0).toUpperCase() + latestTimeClass.slice(1);
  const latestIsWhite = latest.white.username.toLowerCase() === username.toLowerCase();
  
  // Parse opening and moves count
  let latestOpening = "Custom Game";
  let latestMovesCount = 0;
  try {
    const tempChess = new Chess();
    tempChess.load_pgn(latest.pgn);
    const headers = tempChess.header();
    latestOpening = headers.Opening || headers.ECO || "Unknown Opening";
    latestMovesCount = tempChess.history().length;
  } catch (e) {
    console.warn("Failed to parse featured PGN", e);
  }
  
  const latestTermination = getTerminationReason(latest, username);
  
  featuredGameCard.innerHTML = `
    <div class="featured-game-layout">
      <div class="featured-board-container" id="featured-mini-board"></div>
      <div class="featured-info-container">
        <div class="featured-header-row">
          <span class="featured-time-tag">${latestTimeIcon} ${latestTimeFormatted}</span>
          <span class="featured-date-tag">${latestDate}</span>
        </div>
        <div class="featured-players-wrap">
          <div class="featured-player-row">
            <span class="player-color-indicator ${latestIsWhite ? 'white' : 'black'}"></span>
            <span class="featured-player-name">You (${latestPlayerRating})</span>
          </div>
          <div class="featured-player-row">
            <span class="player-color-indicator ${latestIsWhite ? 'black' : 'white'}"></span>
            <span class="featured-player-name">${latestOpponent} (${latestOpponentRating})</span>
          </div>
        </div>
        <div class="featured-meta-footer">
          <span class="game-opening-name" title="${latestOpening}">${latestOpening}</span>
          <span class="game-termination-desc">• ${latestTermination}</span>
          <span class="game-moves-count">• ${latestMovesCount} moves</span>
        </div>
        <div class="featured-action-row">
          <span class="outcome-indicator ${latestOutcome}">${latestOutcome.toUpperCase()}</span>
          <span class="featured-click-to-review">Click to Review →</span>
        </div>
      </div>
    </div>
  `;
  featuredGameCard.onclick = () => loadChesscomGame(latest);
  
  const featuredBoardContainer = document.getElementById('featured-mini-board');
  if (featuredBoardContainer && latest.fen) {
    renderMiniBoard(latest.fen, featuredBoardContainer, latestIsWhite);
  }
  
  // 2. Render remaining games in list
  displayGames.forEach((game, idx) => {
    const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
    const opponent = getOpponentName(game, username);
    const oppRating = getOpponentRating(game, username);
    const playerRating = getPlayerRating(game, username);
    const gameDate = new Date(game.end_time * 1000).toLocaleDateString();
    const outcome = getGameOutcome(game, username);
    const timeClass = game.time_class || "game";
    const timeIcon = timeClass === 'blitz' ? '⚡' : timeClass === 'bullet' ? '🚀' : timeClass === 'rapid' ? '⏱' : '♟';
    const timeFormatted = timeClass.charAt(0).toUpperCase() + timeClass.slice(1);
    
    // Parse opening and moves count
    let opening = "Custom Game";
    let movesCount = 0;
    try {
      const tempChess = new Chess();
      tempChess.load_pgn(game.pgn);
      const headers = tempChess.header();
      opening = headers.Opening || headers.ECO || "Unknown Opening";
      movesCount = tempChess.history().length;
    } catch (e) {
      console.warn("Failed to parse list game PGN", e);
    }
    
    const termination = getTerminationReason(game, username);
    
    const card = document.createElement('div');
    card.className = 'recent-game-card';
    card.onclick = () => loadChesscomGame(game);
    
    card.innerHTML = `
      <div class="mini-board-wrapper" id="mini-board-${idx}"></div>
      <div class="game-details-col">
        <div class="game-time-control">
          <span>${timeIcon} ${timeFormatted}</span>
          <span style="opacity: 0.6;">•</span>
          <span>${gameDate}</span>
        </div>
        <div class="game-players-info">
          <div class="game-player-row">
            <span class="player-color-indicator ${isWhite ? 'white' : 'black'}"></span>
            <span class="player-username">You</span>
            <span class="player-rating-val">(${playerRating})</span>
          </div>
          <div class="game-player-row">
            <span class="player-color-indicator ${isWhite ? 'black' : 'white'}"></span>
            <span class="player-username">${opponent}</span>
            <span class="player-rating-val">(${oppRating})</span>
          </div>
        </div>
        <div class="game-meta-footer">
          <span class="game-opening-name" title="${opening}">${opening}</span>
          <span class="game-termination-desc">• ${termination}</span>
          <span class="game-moves-count">• ${movesCount} moves</span>
        </div>
      </div>
      <div class="game-action-col">
        <span class="outcome-indicator ${outcome}">${outcome.toUpperCase()}</span>
        <button class="game-review-action-btn">Review</button>
      </div>
    `;
    
    recentGamesList.appendChild(card);
    
    // Render FEN mini-board
    const miniBoardContainer = document.getElementById(`mini-board-${idx}`);
    if (miniBoardContainer && game.fen) {
      renderMiniBoard(game.fen, miniBoardContainer, isWhite);
    }
  });
}

function getTerminationReason(game, username) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const player = isWhite ? game.white : game.black;
  const opponent = isWhite ? game.black : game.white;
  
  if (player.result === 'win') {
    return `Won by ${formatResultReason(opponent.result)}`;
  } else if (opponent.result === 'win') {
    return `Lost by ${formatResultReason(player.result)}`;
  } else {
    return `Draw by ${formatResultReason(player.result)}`;
  }
}

function formatResultReason(result) {
  switch (result) {
    case 'checkmated': return 'checkmate';
    case 'resigned': return 'resignation';
    case 'timeout': return 'timeout';
    case 'abandoned': return 'abandonment';
    case 'stalemate': return 'stalemate';
    case 'repetition': return 'repetition';
    case 'insufficient': return 'insufficient material';
    case 'agreed': return 'agreement';
    case '50moves': return '50-move rule';
    case 'timefortfeit': return 'time forfeit';
    default: return result || 'agreement';
  }
}

function renderMiniBoard(fen, container, playerIsWhite = true) {
  container.innerHTML = '';
  
  const miniBoardGrid = document.createElement('div');
  miniBoardGrid.className = 'mini-board-grid';
  
  const board = Array(8).fill(null).map(() => Array(8).fill(''));
  try {
    const boardPart = fen.split(' ')[0];
    const ranks = boardPart.split('/');
    for (let r = 0; r < 8; r++) {
      let col = 0;
      const rankStr = ranks[r];
      if (!rankStr) continue;
      for (let c = 0; c < rankStr.length; c++) {
        const char = rankStr[c];
        if (isNaN(char)) {
          board[r][col] = char;
          col++;
        } else {
          col += parseInt(char, 10);
        }
      }
    }
  } catch (err) {
    console.error("Error parsing mini-board FEN:", err);
    return;
  }
  
  if (playerIsWhite) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        const square = createMiniSquare(piece, r, c);
        miniBoardGrid.appendChild(square);
      }
    }
  } else {
    for (let r = 7; r >= 0; r--) {
      for (let c = 7; c >= 0; c--) {
        const piece = board[r][c];
        const square = createMiniSquare(piece, r, c);
        miniBoardGrid.appendChild(square);
      }
    }
  }
  
  container.appendChild(miniBoardGrid);
}

function createMiniSquare(piece, r, c) {
  const square = document.createElement('div');
  const isLight = (r + c) % 2 === 0;
  square.className = isLight ? 'mini-square light' : 'mini-square dark';
  
  if (piece) {
    const color = piece === piece.toUpperCase() ? 'w' : 'b';
    const type = piece.toUpperCase();
    const img = document.createElement('img');
    img.src = `assets/pieces/default/${color}${type}.svg`;
    img.className = 'mini-piece';
    img.alt = `${color === 'w' ? 'White' : 'Black'} ${type}`;
    square.appendChild(img);
  }
  return square;
}

function getGameOutcome(game, username) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const player = isWhite ? game.white : game.black;
  const opponent = isWhite ? game.black : game.white;
  
  if (player.result === 'win') {
    return 'win';
  } else if (opponent.result === 'win') {
    return 'loss';
  } else {
    return 'draw';
  }
}

function getOpponentName(game, username) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  return isWhite ? game.black.username : game.white.username;
}

function getOpponentRating(game, username) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  return isWhite ? game.black.rating : game.white.rating;
}

function getPlayerRating(game, username) {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  return isWhite ? game.white.rating : game.black.rating;
}

function loadChesscomGame(game) {
  if (!game.pgn) {
    alert("Could not load PGN for this game.");
    return;
  }
  // Feed PGN to the textarea
  pgnInput.value = game.pgn;
  // Trigger analysis click
  startAnalysisBtn.click();
}

async function handleConnectChesscom() {
  const username = chesscomUsernameInput.value.trim();
  if (!username) {
    alert("Please enter a username.");
    return;
  }
  chesscomConnectBtn.disabled = true;
  chesscomConnectBtn.innerText = "Connecting...";
  await loadChesscomProfileAndGames(username);
  chesscomConnectBtn.disabled = false;
  chesscomConnectBtn.innerText = "Connect Account";
}

function handleDisconnectChesscom() {
  localStorage.removeItem('chesscom_username');
  chesscomUsernameInput.value = '';
  connectActionWrap.style.display = 'flex';
  connectProfileWrap.style.display = 'none';
  chesscomConnectCard.style.display = 'flex'; // show connection card again on disconnect
  chesscomRecentPanel.style.display = 'none';
  
  // Restore left nav sidebar Guest profile
  if (sidebarAvatarCircle) sidebarAvatarCircle.style.display = 'flex';
  if (sidebarAvatarImg) sidebarAvatarImg.style.display = 'none';
  if (sidebarProfileName) sidebarProfileName.innerText = "Guest User";
  if (sidebarProfileStatus) sidebarProfileStatus.innerText = "Premium";
  if (sidebarDisconnectBtn) sidebarDisconnectBtn.style.display = 'none';
}

// Drag & drop file processing
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processUploadedFile(file);
  }
}

function processUploadedFile(file) {
  if (!file.name.endsWith('.pgn')) {
    alert("Please upload a valid .pgn file!");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result.trim();
    if (text) {
      pgnInput.value = text;
      startAnalysisBtn.click();
    } else {
      alert("PGN file is empty!");
    }
  };
  reader.readAsText(file);
}

// Text Count up animation helper
function animateTextCounter(element, start, end, duration) {
  if (!element) return;
  const range = end - start;
  let current = start;
  const increment = range / (duration / 16);
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      clearInterval(timer);
      element.innerText = `${Math.round(end)}%`;
    } else {
      element.innerText = `${Math.round(current)}%`;
    }
  }, 16);
}
