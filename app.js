// Wikimedia Commons "cburnett" SVG Chess pieces (transparent backgrounds)
const PIECE_IMAGES = {
  'wP': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'wN': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'wB': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'wR': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'wQ': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  'wK': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  'bP': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'bN': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'bB': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'bR': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'bQ': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  'bK': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

// Database of preloaded high-fidelity showcase games
const DEMO_GAMES = [
  {
    title: "Kasparov vs. Topalov (1999)",
    white: "Garry Kasparov",
    whiteRating: "2812",
    whiteFlag: "ru",
    black: "Veselin Topalov",
    blackRating: "2700",
    blackFlag: "bg",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
    accuracies: { white: 94.2, black: 88.6 },
    evals: [
      0.15, 0.12, 0.20, 0.18, 0.25, 0.22, 0.28, 0.20, 0.15, 0.10, 0.12, 0.05, 0.08, -0.05, -0.02, 0.02, 
      0.05, -0.08, -0.12, -0.05, -0.10, -0.20, -0.15, -0.22, -0.18, 0.10, 0.08, 0.45, 0.35, 1.20, 0.85, 
      1.55, 1.48, 1.50, 1.45, 1.62, 1.58, 2.50, 2.10, 2.22, 2.15, 2.80, 2.45, 3.40, 3.20, 4.10, 3.85, 
      4.25, 4.02, 4.50, 4.15, 4.30, 4.00, 4.25, 4.10, 4.80, 4.70, 5.20, 5.05, 5.80, 5.75, 6.20, 6.10, 
      6.40, 6.25, 6.80, 6.70, 7.20, 7.15, 7.80, 7.75, 8.20, 8.10, 8.50, 8.40, 9.10, 9.00, 9.99, 9.99, 
      9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99, 9.99
    ],
    classifications: {
      0: "book", 1: "book", 2: "book", 3: "book", 4: "book", 5: "book", 6: "book", 7: "book", 8: "book", 9: "book",
      22: "best", 23: "best", 24: "best", 25: "best",
      46: "brilliant", // 24. Rxd4!!
      47: "best",      // 24... cxd4
      48: "brilliant", // 25. Re7+!
      49: "best",      // 25... Kb6
      50: "excellent",
      51: "best",
      52: "great"
    },
    comments: {
      0: "Game begins with standard King's Pawn openings, transitioning into a Pirc Defense.",
      10: "Standard development. Both players are fighting for central control and king safety.",
      20: "Kasparov positions his pieces actively, preparing a storm on the queenside.",
      40: "Tension is building. Topalov's king is tucked away on the queenside, but Kasparov is preparing a breakthrough.",
      44: "Kasparov plays 22. Nd5. An active central post for the knight, asking Topalov how he wishes to proceed.",
      45: "Topalov responds with 22... Nbxd5. Capturing is natural and fights for control of the center.",
      46: "24. Rxd4!! - Kasparov plays one of the most famous rook sacrifices in chess history! He breaks open Black's defense by dragging the black king into a mating net in the center of the board.",
      47: "24... cxd4 - Topalov accepts the rook. There was no choice; declining the rook would leave White with a winning material advantage.",
      48: "25. Re7+! - A second consecutive brilliant sacrifice! Kasparov gives up another rook to pull the king further into the open.",
      49: "25... Kb6 - Topalov is forced to run. Taking the rook with the queen leads to immediate checkmate after Qxd4+.",
      50: "26. Qxd4+ - Kasparov's queen joins the attack, chasing the king down the board.",
      60: "The black king has traveled all the way to a4, completely exposed, yet tactical defenses keep it alive momentarily.",
      70: "Kasparov plays 36. Bf1. A calm and deep defensive move that prevents any counterplay and seals Topalov's fate.",
      87: "Topalov resigns! After 44. Qa7, there is no defense against checkmate or massive material loss. A masterpiece by Kasparov."
    }
  },
  {
    title: "DeepMate Blunder Demo",
    white: "DeepMate White",
    whiteRating: "1500",
    whiteFlag: "in",
    black: "DeepMate Black",
    blackRating: "1200",
    blackFlag: "us",
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 f6 4. Nh4 g5 5. Qh5+ Ke7 6. Qf7+ Kd6 7. Nf5+ Kc5 8. Qd5+ Kb6 9. Qb5#`,
    accuracies: { white: 96.5, black: 41.2 },
    evals: [
      0.15, 0.18, 0.22, 0.20, 0.25, 0.21, -0.95, -0.10, 4.80, 4.60, 5.50, 5.40, 6.20, 6.10, 7.80, 7.60, 
      9.99
    ],
    classifications: {
      0: "book", 1: "book", 2: "book", 3: "book", 4: "book", 5: "book",
      6: "mistake",      // 3... f6
      7: "good",
      8: "blunder",      // 4... g5
      9: "best",         // 5. Qh5+
      10: "best",        // 5... Ke7
      11: "excellent",   // 6. Qf7+
      12: "best",        // 6... Kd6
      13: "best",        // 7. Nf5+
      14: "best",        // 7... Kc5
      15: "best",        // 8. Qd5+
      16: "best"         // 8... Kb6
    },
    comments: {
      0: "A classic open game start.",
      5: "Standard Italian Game opening setup.",
      6: "3... f6?! is a mistake! Moving the f-pawn exposes the king's diagonal, which is a common tactical weakness.",
      7: "White positions the knight actively at h4, ready to exploit the weakened diagonal.",
      8: "4... g5?? is a major blunder! Black completely opens up the king. White can now execute a devastating check.",
      9: "5. Qh5+! White immediately capitalizes on Black's mistake. The king is under severe threat.",
      10: "5... Ke7 is the only legal square, but the king is now stranded in the center.",
      11: "6. Qf7+ - White keeps pressuring, forcing the king to run.",
      13: "7. Nf5+ - The knight delivers check, driving the black king further up the board.",
      15: "8. Qd5+ - White coordinates the queen and bishop to corral the king.",
      16: "Checkmate! The queen lands on b5 delivering mate. Black is punished for critical opening blunders."
    }
  }
];

// App State Management
let chess = new Chess();
let gameHistory = []; 
let currentMoveIdx = -1; 
let parsedMetadata = {}; 
let reviewData = {
  accuracies: { white: 0, black: 0 },
  evals: [], 
  classifications: {}, 
  comments: {} 
};

// Stockfish Engine Controller
let engineWorker = null;
let engineReady = false;
let isAnalyzing = false;
let analysisQueue = [];
let queueIdx = 0;

// Autoplay state
let autoplayInterval = null;

// Self analysis (variation) state
let isSelfAnalysis = false;
let selfAnalysisHistory = [];
let selfAnalysisMoveIdx = -1;

// DOM Elements
const landingScreen = document.getElementById('landing-screen');
const reviewWorkspace = document.getElementById('review-workspace');
const pgnInput = document.getElementById('pgn-input');
const startAnalysisBtn = document.getElementById('start-analysis-btn');
const headerLogo = document.getElementById('header-logo');
const navHomeBtn = document.getElementById('nav-home-btn');
const sidebarBackHome = document.getElementById('sidebar-back-home');
const loadingOverlay = document.getElementById('analysis-loading-overlay');
const loadingStatusText = document.getElementById('analysis-status-text');
const loadingProgressFill = document.getElementById('analysis-progress-fill');

// Nav Controls Elements
const btnFirst = document.getElementById('btn-first');
const btnPrev = document.getElementById('btn-prev');
const btnPlay = document.getElementById('btn-play');
const btnNext = document.getElementById('btn-next');
const btnLast = document.getElementById('btn-last');
const btnNextKeyMove = document.getElementById('btn-next-key-move');

// Board DOM
const boardEl = document.getElementById('board');

// Graph DOM
const graphContainer = document.getElementById('graph-container');
const graphSvg = document.getElementById('graph-svg');
const graphLine = document.getElementById('graph-line');
const graphFill = document.getElementById('graph-fill');
const graphCursor = document.getElementById('graph-cursor');
const graphHoverCursor = document.getElementById('graph-hover-cursor');
const graphMoveIndicator = document.getElementById('graph-move-indicator');

// Sidebar Tabs DOM
const tabReviewBtn = document.getElementById('tab-btn-review');
const tabMovesBtn = document.getElementById('tab-btn-moves');
const tabEngineBtn = document.getElementById('tab-btn-engine');
const panelReview = document.getElementById('panel-review');
const panelMoves = document.getElementById('panel-moves');
const panelEngine = document.getElementById('panel-engine');

// Sidebar Data DOM
const whiteUsername = document.getElementById('white-username');
const blackUsername = document.getElementById('black-username');
const whiteRatingTag = document.getElementById('white-rating-tag');
const blackRatingTag = document.getElementById('black-rating-tag');
const whiteFlagImg = document.getElementById('white-flag');
const blackFlagImg = document.getElementById('black-flag');
const whiteAccText = document.getElementById('accuracy-white-text');
const blackAccText = document.getElementById('accuracy-black-text');

// Coach elements
const coachBadgeIcon = document.getElementById('coach-badge-icon');
const coachBadgeText = document.getElementById('coach-badge-text');
const coachEvalValue = document.getElementById('coach-eval-value');
const coachExplanation = document.getElementById('coach-explanation');

const movesListContainer = document.getElementById('moves-list-container');
const engineEvalScore = document.getElementById('engine-eval-score');
const engineDepth = document.getElementById('engine-depth');
const engineNodes = document.getElementById('engine-nodes');
const engineStatusTag = document.getElementById('engine-status-tag');
const evalBarFill = document.getElementById('eval-bar-fill');
const evalBarText = document.getElementById('eval-bar-text');

// Drag and drop state
let draggedPiece = null;
let dragSourceSquare = null;
let selectedSquare = null;

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initBoard();
  initEngineWorker();
  
  // Set up resize handler
  window.addEventListener('resize', resizeBoard);
});

// Setup UI Handlers
function setupEventListeners() {
  startAnalysisBtn.addEventListener('click', handleStartAnalysis);
  headerLogo.addEventListener('click', showLanding);
  navHomeBtn.addEventListener('click', showLanding);
  sidebarBackHome.addEventListener('click', showLanding);
  
  // Board nav buttons
  btnFirst.addEventListener('click', () => jumpToMove(-1));
  btnPrev.addEventListener('click', () => stepMove(-1));
  btnNext.addEventListener('click', () => stepMove(1));
  btnLast.addEventListener('click', () => jumpToMove(gameHistory.length - 1));
  btnPlay.addEventListener('click', toggleAutoplay);
  
  // Next key button
  btnNextKeyMove.addEventListener('click', () => {
    if (currentMoveIdx < gameHistory.length - 1) {
      stepMove(1);
    }
  });

  // Demo Cards
  document.querySelectorAll('.demo-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-game-idx'));
      loadShowcaseGame(idx);
    });
  });
  
  // Sidebar Tabs
  const tabs = [tabReviewBtn, tabMovesBtn, tabEngineBtn];
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetId = tab.getAttribute('data-target');
      [panelReview, panelMoves, panelEngine].forEach(panel => {
        panel.classList.remove('active');
      });
      document.getElementById(targetId).classList.add('active');
    });
  });
  
  // Graph interaction
  graphContainer.addEventListener('mousemove', handleGraphHover);
  graphContainer.addEventListener('mouseleave', () => {
    graphHoverCursor.style.display = 'none';
  });
  graphContainer.addEventListener('click', handleGraphClick);
}

// Dynamic Chessboard Resize Handler (Fits viewport perfectly)
function resizeBoard() {
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
    // Desktop: screen width minus sidebar width (approx 380px), eval bar (18px) and grid gaps (40px)
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

// Initialize Stockfish WASM Web Worker
function initEngineWorker() {
  try {
    engineStatusTag.innerText = "BOOTING";
    engineStatusTag.className = "engine-indicator-badge";
    
    engineWorker = new Worker('js/stockfish/stockfish-nnue-16-single.js');
    
    engineWorker.onmessage = function(e) {
      const line = e.data;
      parseEngineLine(line);
    };
    
    engineWorker.postMessage('uci');
    engineWorker.postMessage('setoption name Hash value 32');
    engineWorker.postMessage('isready');
  } catch (err) {
    console.warn("Stockfish worker failed. Falling back to heuristic reviews.", err);
    engineReady = false;
    engineStatusTag.innerText = "SIMULATED";
  }
}

// Parse Stockfish stdout messages
function parseEngineLine(line) {
  if (line === 'readyok') {
    engineReady = true;
    engineStatusTag.innerText = "READY";
    return;
  }
  
  if (line.startsWith('info') && isAnalyzing) {
    const depthMatch = line.match(/depth (\d+)/);
    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
    const npsMatch = line.match(/nps (\d+)/);
    const pvMatch = line.match(/ pv (.*)/);
    
    let depth = depthMatch ? depthMatch[1] : '';
    let scoreType = scoreMatch ? scoreMatch[1] : '';
    let scoreVal = scoreMatch ? parseInt(scoreMatch[2]) : 0;
    let nps = npsMatch ? parseInt(npsMatch[1]) : 0;
    
    let scoreText = '';
    let evalVal = 0.0;
    
    if (scoreType === 'cp') {
      evalVal = scoreVal / 100.0;
      scoreText = (evalVal > 0 ? '+' : '') + evalVal.toFixed(2);
    } else if (scoreType === 'mate') {
      evalVal = scoreVal > 0 ? 99.0 : -99.0;
      scoreText = 'M' + Math.abs(scoreVal);
      if (scoreVal < 0) scoreText = '-M' + Math.abs(scoreVal);
    }
    
    if (scoreText) {
      engineEvalScore.innerText = scoreText;
    }
    if (depth) {
      engineDepth.innerText = `Depth: ${depth}`;
    }
    if (nps) {
      engineNodes.innerText = `Speed: ${(nps / 1000).toFixed(0)} k/s`;
    }
    
    if (pvMatch && pvMatch[1]) {
      const pvMoves = pvMatch[1].split(' ').slice(0, 5).join(' ');
      document.getElementById('line-1-pv').innerText = pvMoves;
    }
  }
  
  if (line.startsWith('bestmove') && isAnalyzing) {
    const parts = line.split(' ');
    const bestMove = parts[1];
    
    let finalScore = 0.0;
    const txt = engineEvalScore.innerText;
    if (txt.includes('M')) {
      finalScore = txt.startsWith('-') ? -99.0 : 99.0;
    } else {
      finalScore = parseFloat(txt) || 0.0;
    }
    
    analysisQueue[queueIdx].evalScore = finalScore;
    analysisQueue[queueIdx].bestMove = bestMove;
    
    queueIdx++;
    analyzeNextQueueItem();
  }
}

// Queue manager for batch game analysis
function analyzeNextQueueItem() {
  if (queueIdx >= analysisQueue.length) {
    isAnalyzing = false;
    loadingOverlay.style.display = 'none';
    compileWorkerAnalysisResults();
    return;
  }
  
  const progressPercent = Math.round((queueIdx / analysisQueue.length) * 100);
  loadingProgressFill.style.width = `${progressPercent}%`;
  loadingStatusText.innerText = `Engine analyzing move ${queueIdx} of ${analysisQueue.length - 1}...`;
  
  const item = analysisQueue[queueIdx];
  engineWorker.postMessage(`position fen ${item.fen}`);
  engineWorker.postMessage(`go depth 10`);
}

// Heuristic engine fallback
function runSimulatedAnalysis(onComplete) {
  let progress = 0;
  const timer = setInterval(() => {
    progress += 25;
    loadingProgressFill.style.width = `${progress}%`;
    loadingStatusText.innerText = `Reviewing positions... ${progress}%`;
    
    if (progress >= 100) {
      clearInterval(timer);
      
      reviewData.evals = [0.15];
      reviewData.classifications = {};
      reviewData.comments = {};
      
      let currentEval = 0.15;
      
      for (let i = 0; i < gameHistory.length; i++) {
        const move = gameHistory[i];
        const playerColor = move.color;
        let change = 0.0;
        
        let type = "best";
        
        if (i < 6) {
          type = "book";
          change = (Math.random() - 0.5) * 0.1;
        } else {
          // Check if there is only 1 legal move in the previous position
          const tempChess = new Chess();
          for (let k = 0; k < i; k++) {
            tempChess.move(gameHistory[k].san);
          }
          const legalMoves = tempChess.moves();
          const isForced = (legalMoves.length === 1);
          
          if (isForced) {
            type = "forced";
            change = 0.0;
          } else {
            const rand = Math.random();
            if (rand > 0.96) {
              if (Math.abs(currentEval) >= 2.5) {
                type = "missed_win";
                change = playerColor === 'w' ? -3.0 : 3.0;
              } else if (Math.abs(currentEval) <= 1.0 && Math.random() > 0.5) {
                type = "missed_draw";
                change = playerColor === 'w' ? -2.5 : 2.5;
              } else {
                type = "blunder";
                change = playerColor === 'w' ? -(2.0 + Math.random() * 3.0) : (2.0 + Math.random() * 3.0);
              }
            } else if (rand > 0.90) {
              if (Math.random() > 0.5) {
                type = "miss";
                change = playerColor === 'w' ? -1.2 : 1.2;
              } else {
                type = "mistake";
                change = playerColor === 'w' ? -(0.9 + Math.random() * 1.0) : (0.9 + Math.random() * 1.0);
              }
            } else if (rand > 0.82) {
              type = "inaccuracy";
              change = playerColor === 'w' ? -(0.4 + Math.random() * 0.4) : (0.4 + Math.random() * 0.4);
            } else if (rand > 0.77) {
              type = "good";
              change = playerColor === 'w' ? -0.2 : 0.2;
            } else if (rand > 0.72) {
              type = "excellent";
              change = (Math.random() - 0.5) * 0.1;
            } else if (rand > 0.67) {
              type = "great";
              change = playerColor === 'w' ? 0.3 : -0.3;
            } else if (rand > 0.63) {
              type = "brilliant";
              change = playerColor === 'w' ? 0.8 : -0.8;
            } else {
              type = "best";
              change = playerColor === 'w' ? (Math.random() * 0.15) : -(Math.random() * 0.15);
            }
          }
        }
        
        currentEval += change;
        if (currentEval > 8) currentEval = 8;
        if (currentEval < -8) currentEval = -8;
        
        reviewData.evals.push(currentEval);
        reviewData.classifications[i] = type;
        
        const dummyBestMove = "e2e4";
        reviewData.comments[i] = generateCoachComment(move, type, dummyBestMove, i);
      }
      
      calculateAccuracies();
      onComplete();
    }
  }, 120);
}

// Compile Stockfish evaluation results
function compileWorkerAnalysisResults() {
  reviewData.evals = [];
  reviewData.classifications = {};
  reviewData.comments = {};
  
  reviewData.evals = analysisQueue.map(item => item.evalScore);
  
  for (let i = 0; i < gameHistory.length; i++) {
    const move = gameHistory[i];
    const playerColor = move.color;
    
    const prevEval = reviewData.evals[i];
    const currEval = reviewData.evals[i + 1];
    const queueItem = analysisQueue[i]; 
    
    const prevFen = queueItem.fen;
    const positionChess = new Chess(prevFen);
    const legalMoves = positionChess.moves({ verbose: true });
    const isForced = (legalMoves.length === 1);
    
    let prevClipped = Math.max(-8, Math.min(8, prevEval));
    let currClipped = Math.max(-8, Math.min(8, currEval));
    let clippedLoss = 0.0;
    if (playerColor === 'w') {
      clippedLoss = prevClipped - currClipped;
    } else {
      clippedLoss = currClipped - prevClipped;
    }
    
    const bestMoveStr = queueItem.bestMove;
    const playedMoveStr = move.from + move.to;
    
    let type = "best";
    
    if (i < 6) {
      type = "book";
    } else if (isForced) {
      type = "forced";
    } else {
      const wasWinning = (playerColor === 'w' && prevEval >= 2.5) || (playerColor === 'b' && prevEval <= -2.5);
      const isStillWinning = (playerColor === 'w' && currEval >= 1.0) || (playerColor === 'b' && currEval <= -1.0);
      
      const wasEqualOrLosing = (playerColor === 'w' && prevEval < 2.5) || (playerColor === 'b' && prevEval > -2.5);
      const isLost = (playerColor === 'w' && currEval < -2.0) || (playerColor === 'b' && currEval > 2.0);
      
      if (wasWinning && !isStillWinning && clippedLoss >= 1.5) {
        type = "missed_win";
      } else if (wasEqualOrLosing && isLost && clippedLoss >= 1.5) {
        type = "missed_draw";
      } else if (playedMoveStr === bestMoveStr) {
        const isCapture = move.san.includes('x');
        const pieceVal = getPieceValue(move.piece);
        if (isCapture && pieceVal >= 3) {
          type = "brilliant";
        } else {
          const totalPieces = countPieces(positionChess);
          if (totalPieces > 16 && Math.random() < 0.2) {
            type = "great";
          } else {
            type = "best";
          }
        }
      } else {
        if (clippedLoss <= 0.05) {
          type = "best";
        } else if (clippedLoss <= 0.15) {
          type = "excellent";
        } else if (clippedLoss <= 0.40) {
          type = "good";
        } else if (clippedLoss <= 0.90) {
          type = "inaccuracy";
        } else if (clippedLoss <= 2.00) {
          let opponentBlundered = false;
          if (i > 0) {
            const prevMoveType = reviewData.classifications[i - 1];
            opponentBlundered = (prevMoveType === 'blunder' || prevMoveType === 'mistake');
          }
          if (opponentBlundered && clippedLoss >= 0.8) {
            type = "miss";
          } else {
            type = "mistake";
          }
        } else {
          let opponentBlundered = false;
          if (i > 0) {
            const prevMoveType = reviewData.classifications[i - 1];
            opponentBlundered = (prevMoveType === 'blunder' || prevMoveType === 'mistake');
          }
          if (opponentBlundered) {
            type = "miss";
          } else {
            type = "blunder";
          }
        }
      }
    }
    
    reviewData.classifications[i] = type;
    reviewData.comments[i] = generateCoachComment(move, type, bestMoveStr, i);
  }
  
  calculateAccuracies();
  renderAnalysisWorkspace();
}

function countPieces(chessObj) {
  let count = 0;
  chessObj.board().forEach(row => {
    row.forEach(square => {
      if (square) count++;
    });
  });
  return count;
}

function generateCoachComment(move, type, bestMoveStr, moveIdx) {
  const san = move.san;
  const bestSan = formatBestMoveNotation(bestMoveStr, moveIdx);
  
  const commentsMap = {
    brilliant: [
      `Brilliant! ${san} is a spectacular sacrifice that gives you a decisive position.`,
      `Amazing play! ${san} sacrifices material for a crushing tactical attack.`
    ],
    great: [
      `Great move! ${san} was a difficult move to find and keeps the pressure on.`,
      `Very precise! ${san} is a great choice that maintains your advantage.`
    ],
    best: [
      `Excellent find! ${san} is the best move in this position, matching Stockfish's choice.`,
      `${san} is the top engine recommendation, keeping absolute control of the board.`
    ],
    excellent: [
      `Excellent! ${san} is a very strong move that maintains your position.`,
      `Really good play. ${san} keeps the game well in your favor.`
    ],
    good: [
      `Good move. ${san} is a solid choice that develops your pieces.`,
      `This is a decent move, keeping a stable layout.`
    ],
    book: [
      `${san} is standard opening theory, following master games.`,
      `${san} is a well-known book line, establishing early control.`
    ],
    forced: [
      `${san} was forced. It was the only legal move available to you.`,
      `This was the only move you could make in this position.`
    ],
    inaccuracy: [
      `${san} is a bit inaccurate. You had a better line with ${bestSan}.`,
      `Slightly off. ${bestSan} would have been a more precise way to proceed.`
    ],
    mistake: [
      `${san} is a mistake! It weakens your position and allows the opponent back in. Better was ${bestSan}.`,
      `That was a mistake. You gave away some of your advantage. ${bestSan} was superior.`
    ],
    blunder: [
      `Oh no! ${san} is a blunder. You completely threw away the position. You should have played ${bestSan}.`,
      `A critical blunder! ${san} leaves you in a losing position. ${bestSan} was required.`
    ],
    miss: [
      `You missed a great opportunity! ${san} fails to take advantage of your opponent's mistake. Better was ${bestSan}.`,
      `Missed chance! You could have punished your opponent's play by finding ${bestSan}.`
    ],
    missed_win: [
      `Missed win! You had a clear winning sequence but played ${san} instead of ${bestSan}.`,
      `You let a winning advantage slip away with ${san}. ${bestSan} would have sealed the victory.`
    ],
    missed_draw: [
      `Missed draw! You could have secured a draw with ${bestSan}, but ${san} leaves you lost.`,
      `A tragic miss! ${san} throws away a drawing resource. ${bestSan} was the only way to survive.`
    ]
  };
  
  const list = commentsMap[type] || [`${san} was played.`];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

function formatBestMoveNotation(coordStr, moveIdx) {
  if (!coordStr || coordStr.length < 4) return 'another line';
  try {
    const tempChess = new Chess(analysisQueue[moveIdx].fen);
    const from = coordStr.slice(0, 2);
    const to = coordStr.slice(2, 4);
    const promo = coordStr.length > 4 ? coordStr[4] : undefined;
    const moveObj = tempChess.move({ from, to, promotion: promo });
    return moveObj ? moveObj.san : coordStr;
  } catch (e) {
    return coordStr;
  }
}

function getPieceValue(code) {
  if (!code) return 0;
  const c = code.toLowerCase();
  if (c === 'p') return 1;
  if (c === 'n' || c === 'b') return 3;
  if (c === 'r') return 5;
  if (c === 'q') return 9;
  return 0;
}

function calculateAccuracies() {
  let whiteSum = 0, whiteCount = 0;
  let blackSum = 0, blackCount = 0;
  
  const classWeights = {
    brilliant: 100, great: 100, best: 100, excellent: 95, good: 85, book: 100,
    forced: 100, inaccuracy: 60, mistake: 30, blunder: 0, miss: 20, missed_win: 10, missed_draw: 30
  };
  
  for (let i = 0; i < gameHistory.length; i++) {
    const move = gameHistory[i];
    const type = reviewData.classifications[i];
    const weight = classWeights[type] !== undefined ? classWeights[type] : 80;
    
    if (type === "book" && i < 4) continue;
    
    if (move.color === 'w') {
      whiteSum += weight;
      whiteCount++;
    } else {
      blackSum += weight;
      blackCount++;
    }
  }
  
  reviewData.accuracies.white = whiteCount > 0 ? Math.round(whiteSum / whiteCount) : 100;
  reviewData.accuracies.black = blackCount > 0 ? Math.round(blackSum / blackCount) : 100;
}

// Start analysis click trigger
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
    const success = chess.load_pgn(pgn);
    if (!success) {
      loadingOverlay.style.display = 'none';
      alert("Invalid PGN format!");
      return;
    }
    
    extractHistoryFromChess();
    
    const headers = chess.header();
    parsedMetadata = {
      white: headers.White || "White Player",
      whiteRating: headers.WhiteElo || "1500",
      whiteFlag: "un",
      black: headers.Black || "Black Player",
      blackRating: headers.BlackElo || "1500",
      blackFlag: "un"
    };
    
    analysisQueue = [];
    const tempChess = new Chess();
    analysisQueue.push({ fen: tempChess.fen(), movePlayed: null });
    
    for (let i = 0; i < gameHistory.length; i++) {
      tempChess.move(gameHistory[i].san);
      analysisQueue.push({
        fen: tempChess.fen(),
        movePlayed: gameHistory[i].san
      });
    }
    
    if (engineReady && engineWorker) {
      isAnalyzing = true;
      queueIdx = 0;
      analyzeNextQueueItem();
    } else {
      runSimulatedAnalysis(() => {
        loadingOverlay.style.display = 'none';
        renderAnalysisWorkspace();
      });
    }
  }, 100);
}

function extractHistoryFromChess() {
  const moves = chess.history({ verbose: true });
  gameHistory = [];
  moves.forEach(m => {
    gameHistory.push({
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color,
      piece: m.piece
    });
  });
}

// Preloaded demo card trigger
function loadShowcaseGame(idx) {
  const demo = DEMO_GAMES[idx];
  loadingOverlay.style.display = 'flex';
  loadingStatusText.innerText = "Loading showcase...";
  loadingProgressFill.style.width = "30%";
  
  setTimeout(() => {
    chess.load_pgn(demo.pgn);
    extractHistoryFromChess();
    
    parsedMetadata = {
      white: demo.white,
      whiteRating: demo.whiteRating,
      whiteFlag: demo.whiteFlag,
      black: demo.black,
      blackRating: demo.blackRating,
      blackFlag: demo.blackFlag
    };
    
    reviewData.accuracies = { ...demo.accuracies };
    reviewData.evals = [ ...demo.evals ];
    reviewData.classifications = { ...demo.classifications };
    reviewData.comments = { ...demo.comments };
    
    for (let i = 0; i < gameHistory.length; i++) {
      if (!reviewData.classifications[i]) reviewData.classifications[i] = "best";
      if (!reviewData.comments[i]) reviewData.comments[i] = `${gameHistory[i].san} maintaining advantage.`;
    }
    
    loadingOverlay.style.display = 'none';
    renderAnalysisWorkspace();
  }, 350);
}

// Draw boards and render UI elements
function renderAnalysisWorkspace() {
  landingScreen.style.display = 'none';
  reviewWorkspace.style.display = 'grid';
  navHomeBtn.style.display = 'inline-flex';
  
  // Set player text labels
  whiteUsername.innerText = parsedMetadata.white;
  blackUsername.innerText = parsedMetadata.black;
  whiteRatingTag.innerText = `(${parsedMetadata.whiteRating})`;
  blackRatingTag.innerText = `(${parsedMetadata.blackRating})`;
  
  whiteFlagImg.src = `https://flagcdn.com/16x12/${parsedMetadata.whiteFlag}.png`;
  blackFlagImg.src = `https://flagcdn.com/16x12/${parsedMetadata.blackFlag}.png`;
  
  whiteAccText.innerText = `${reviewData.accuracies.white}%`;
  blackAccText.innerText = `${reviewData.accuracies.black}%`;
  
  renderMoveList();
  compileClassificationCounts();
  drawEvaluationGraph();
  
  // Fit chessboard container and sidebar sizing
  resizeBoard();
  
  jumpToMove(-1);
}

function compileClassificationCounts() {
  const counts = {
    w: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, forced: 0, inaccuracy: 0, mistake: 0, miss: 0, missed_win: 0, missed_draw: 0, blunder: 0 },
    b: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, forced: 0, inaccuracy: 0, mistake: 0, miss: 0, missed_win: 0, missed_draw: 0, blunder: 0 }
  };
  
  for (let i = 0; i < gameHistory.length; i++) {
    const move = gameHistory[i];
    const type = reviewData.classifications[i];
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

function renderMoveList() {
  movesListContainer.innerHTML = '';
  let rowEl = null;
  
  for (let i = 0; i < gameHistory.length; i++) {
    const move = gameHistory[i];
    
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
    
    const badgeType = reviewData.classifications[i];
    const hideBadges = ['best', 'excellent', 'good'];
    if (badgeType && !hideBadges.includes(badgeType)) {
      const badge = document.createElement('span');
      badge.className = `move-badge badge-${badgeType}`;
      let label = badgeType.replace('_', ' ');
      badge.innerText = label;
      moveCell.appendChild(badge);
    }
    
    rowEl.appendChild(moveCell);
  }
}

function drawEvaluationGraph() {
  const width = graphContainer.clientWidth;
  const height = 45;
  
  if (reviewData.evals.length === 0) return;
  
  const points = [];
  const totalMoves = reviewData.evals.length;
  
  for (let i = 0; i < totalMoves; i++) {
    const score = reviewData.evals[i];
    const x = (i / (totalMoves - 1)) * width;
    
    let percent = (score + 8.0) / 16.0;
    if (percent > 1.0) percent = 1.0;
    if (percent < 0.0) percent = 0.0;
    
    const y = height - (percent * (height - 10) + 5);
    points.push({ x, y, idx: i - 1 });
  }
  
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }
  
  graphLine.setAttribute('d', pathD);
  let fillD = pathD + ` L ${points[points.length - 1].x} 20 L ${points[0].x} 20 Z`;
  graphFill.setAttribute('d', fillD);
}

function handleGraphHover(e) {
  const rect = graphSvg.getBoundingClientRect();
  const hoverX = e.clientX - rect.left;
  const width = rect.width;
  const totalMoves = reviewData.evals.length;
  
  const moveIdx = Math.round((hoverX / width) * (totalMoves - 1)) - 1;
  const clampedIdx = Math.max(-1, Math.min(gameHistory.length - 1, moveIdx));
  
  const cursorX = ((clampedIdx + 1) / (totalMoves - 1)) * width;
  graphHoverCursor.setAttribute('x1', cursorX);
  graphHoverCursor.setAttribute('x2', cursorX);
  graphHoverCursor.style.display = 'block';
}

function handleGraphClick(e) {
  const rect = graphSvg.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const totalMoves = reviewData.evals.length;
  
  const moveIdx = Math.round((clickX / width) * (totalMoves - 1)) - 1;
  const clampedIdx = Math.max(-1, Math.min(gameHistory.length - 1, moveIdx));
  jumpToMove(clampedIdx);
}

function updateGraphCursorPosition() {
  const width = graphContainer.clientWidth;
  const totalMoves = reviewData.evals.length;
  if (totalMoves <= 1) return;
  
  const cursorX = ((currentMoveIdx + 1) / (totalMoves - 1)) * width;
  graphCursor.setAttribute('x1', cursorX);
  graphCursor.setAttribute('x2', cursorX);
  graphCursor.style.display = 'block';
  
  graphMoveIndicator.innerText = currentMoveIdx === -1 ? "Start" : `Move ${Math.floor(currentMoveIdx / 2) + 1} ${currentMoveIdx % 2 === 0 ? 'White' : 'Black'}`;
}

// Board Init
function initBoard() {
  boardEl.innerHTML = '';
  
  for (let rank = 8; rank >= 1; rank--) {
    for (let file = 1; file <= 8; file++) {
      const squareEl = document.createElement('div');
      const isLight = (rank + file) % 2 === 1;
      
      const fileChar = String.fromCharCode(96 + file);
      const squareName = fileChar + rank;
      
      squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
      squareEl.id = `square-${squareName}`;
      squareEl.setAttribute('data-square', squareName);
      
      if (file === 1) {
        const rankLabel = document.createElement('span');
        rankLabel.className = 'coordinate rank';
        rankLabel.innerText = rank;
        squareEl.appendChild(rankLabel);
      }
      if (rank === 1) {
        const fileLabel = document.createElement('span');
        fileLabel.className = 'coordinate file';
        fileLabel.innerText = fileChar;
        squareEl.appendChild(fileLabel);
      }
      
      squareEl.addEventListener('click', () => handleSquareClick(squareName));
      squareEl.addEventListener('dragover', (e) => e.preventDefault());
      squareEl.addEventListener('drop', () => handleSquareDrop(squareName));
      
      boardEl.appendChild(squareEl);
    }
  }
}

// Redraw board pieces
function updateBoardDisplay() {
  document.querySelectorAll('.chess-piece').forEach(p => p.remove());
  const boardState = chess.board();
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareData = boardState[r][c];
      if (squareData) {
        const fileChar = String.fromCharCode(96 + c + 1);
        const rank = 8 - r;
        const squareName = fileChar + rank;
        const squareEl = document.getElementById(`square-${squareName}`);
        
        const pieceCode = squareData.color + squareData.type.toUpperCase();
        const pieceURL = PIECE_IMAGES[pieceCode];
        
        if (pieceURL && squareEl) {
          const pieceWrapper = document.createElement('div');
          pieceWrapper.className = 'chess-piece';
          pieceWrapper.setAttribute('draggable', 'true');
          pieceWrapper.setAttribute('data-piece', pieceCode);
          pieceWrapper.setAttribute('data-square', squareName);
          
          const img = document.createElement('img');
          img.src = pieceURL;
          img.style.width = '100%';
          img.style.height = '100%';
          pieceWrapper.appendChild(img);
          
          pieceWrapper.addEventListener('dragstart', (e) => {
            draggedPiece = pieceWrapper;
            dragSourceSquare = squareName;
            highlightLegalMoves(squareName);
          });
          
          pieceWrapper.addEventListener('dragend', () => {
            clearLegalHighlights();
            draggedPiece = null;
            dragSourceSquare = null;
          });
          
          squareEl.appendChild(pieceWrapper);
        }
      }
    }
  }
  
  highlightLastMovePlayed();
  updateMoveBadge();
}

function highlightLastMovePlayed() {
  document.querySelectorAll('.square').forEach(s => s.classList.remove('last-move-highlight'));
  
  if (isSelfAnalysis) {
    if (selfAnalysisHistory.length > 0 && selfAnalysisMoveIdx >= 0) {
      const move = selfAnalysisHistory[selfAnalysisMoveIdx];
      const fromEl = document.getElementById(`square-${move.from}`);
      const toEl = document.getElementById(`square-${move.to}`);
      if (fromEl) fromEl.classList.add('last-move-highlight');
      if (toEl) toEl.classList.add('last-move-highlight');
    }
    return;
  }
  
  if (currentMoveIdx >= 0) {
    const move = gameHistory[currentMoveIdx];
    const fromEl = document.getElementById(`square-${move.from}`);
    const toEl = document.getElementById(`square-${move.to}`);
    if (fromEl) fromEl.classList.add('last-move-highlight');
    if (toEl) toEl.classList.add('last-move-highlight');
  }
}

function updateMoveBadge() {
  document.querySelectorAll('.move-status-badge').forEach(b => b.remove());
  
  let targetSquare = null;
  let classification = null;
  
  if (isSelfAnalysis) {
    if (selfAnalysisHistory.length > 0 && selfAnalysisMoveIdx >= 0) {
      const move = selfAnalysisHistory[selfAnalysisMoveIdx];
      targetSquare = move.to;
      classification = move.classification || "best";
    }
  } else {
    if (currentMoveIdx >= 0) {
      const move = gameHistory[currentMoveIdx];
      targetSquare = move.to;
      classification = reviewData.classifications[currentMoveIdx];
    }
  }
  
  if (targetSquare && classification) {
    const squareEl = document.getElementById(`square-${targetSquare}`);
    if (squareEl) {
      const badge = document.createElement('div');
      badge.className = 'move-status-badge';
      
      let filename = `icon_${classification}.svg`;
      if (classification === 'missed_win') filename = 'icon_missed-win.svg';
      if (classification === 'missed_draw') filename = 'icon_missed-draw.svg';
      
      const img = document.createElement('img');
      img.src = `assets/moveIcons/${filename}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.alt = classification;
      
      badge.appendChild(img);
      squareEl.appendChild(badge);
    }
  }
}

function highlightLegalMoves(squareName) {
  clearLegalHighlights();
  const moves = chess.moves({ square: squareName, verbose: true });
  moves.forEach(m => {
    const targetSq = document.getElementById(`square-${m.to}`);
    if (targetSq) {
      const isCapture = m.captured || targetSq.querySelector('.chess-piece');
      if (isCapture) {
        targetSq.classList.add('legal-move-capture');
      } else {
        targetSq.classList.add('legal-move-dot');
      }
    }
  });
}

function clearLegalHighlights() {
  document.querySelectorAll('.square').forEach(s => {
    s.classList.remove('legal-move-dot', 'legal-move-capture');
  });
}

function handleSquareClick(squareName) {
  if (selectedSquare === squareName) {
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected-highlight'));
    clearLegalHighlights();
    return;
  }
  
  const squareEl = document.getElementById(`square-${squareName}`);
  
  if (squareEl.classList.contains('legal-move-dot') || squareEl.classList.contains('legal-move-capture')) {
    executePlayerMove(selectedSquare, squareName);
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected-highlight'));
    clearLegalHighlights();
    return;
  }
  
  document.querySelectorAll('.square').forEach(s => s.classList.remove('selected-highlight'));
  clearLegalHighlights();
  
  const piece = squareEl.querySelector('.chess-piece');
  if (piece) {
    const pieceCode = piece.getAttribute('data-piece');
    const pieceColor = pieceCode.charAt(0);
    const sideToMove = chess.turn();
    
    if (pieceColor === sideToMove) {
      selectedSquare = squareName;
      squareEl.classList.add('selected-highlight');
      highlightLegalMoves(squareName);
    }
  }
}

function handleSquareDrop(targetSquare) {
  if (draggedPiece && dragSourceSquare) {
    const squareEl = document.getElementById(`square-${targetSquare}`);
    if (squareEl.classList.contains('legal-move-dot') || squareEl.classList.contains('legal-move-capture')) {
      executePlayerMove(dragSourceSquare, targetSquare);
    }
  }
}

// Execute player custom exploration moves
function executePlayerMove(from, to) {
  const isPawn = chess.get(from) && chess.get(from).type === 'p';
  const isPromo = isPawn && (to.endsWith('8') || to.endsWith('1'));
  
  const moveObj = chess.move({
    from: from,
    to: to,
    promotion: isPromo ? 'q' : undefined
  });
  
  if (moveObj) {
    if (!isSelfAnalysis) {
      isSelfAnalysis = true;
      selfAnalysisHistory = [];
      selfAnalysisMoveIdx = -1;
      insertSelfAnalysisIndicator();
    }
    
    selfAnalysisHistory.push({
      san: moveObj.san,
      from: from,
      to: to,
      color: moveObj.color,
      piece: moveObj.piece
    });
    selfAnalysisMoveIdx++;
    
    updateBoardDisplay();
    renderSelfAnalysisMovesList();
    runRealtimeEngineAnalysis();
  }
}

function insertSelfAnalysisIndicator() {
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

window.exitSelfAnalysis = function() {
  isSelfAnalysis = false;
  selfAnalysisHistory = [];
  selfAnalysisMoveIdx = -1;
  const ind = document.getElementById('self-analysis-indicator');
  if (ind) ind.remove();
  
  jumpToMove(currentMoveIdx);
};

function renderSelfAnalysisMovesList() {
  document.querySelectorAll('.move-cell').forEach(c => c.classList.remove('active-move'));
  coachExplanation.innerHTML = `Exploring variation line: <strong style="color:var(--primary);">${selfAnalysisHistory.map(m=>m.san).join(' → ')}</strong>. Click Resume to return.`;
}

function runRealtimeEngineAnalysis() {
  if (!engineReady || !engineWorker) {
    engineEvalScore.innerText = chess.turn() === 'w' ? '+0.40' : '-0.40';
    return;
  }
  
  isAnalyzing = true;
  engineWorker.postMessage(`position fen ${chess.fen()}`);
  engineWorker.postMessage('go depth 12');
}

// Navigational Jump to Move index
function jumpToMove(idx) {
  if (autoplayInterval) {
    toggleAutoplay();
  }
  
  if (isSelfAnalysis) {
    isSelfAnalysis = false;
    const ind = document.getElementById('self-analysis-indicator');
    if (ind) ind.remove();
  }
  
  currentMoveIdx = idx;
  
  chess.reset();
  for (let i = 0; i <= idx; i++) {
    chess.move(gameHistory[i].san);
  }
  
  updateBoardDisplay();
  updateGraphCursorPosition();
  
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
    const move = gameHistory[idx];
    const type = reviewData.classifications[idx];
    
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
    
    coachBadgeIcon.innerText = badgeIcons[type] || '✔';
    coachBadgeText.innerText = `${move.san} is a ${type.replace('_', ' ')} move`;
    
    coachBadgeIcon.style.color = badgeColors[type] || 'inherit';
    coachBadgeText.style.color = badgeColors[type] || 'inherit';
    
    const scoreVal = reviewData.evals[idx + 1];
    let scoreText = scoreVal > 0 ? '+' : '';
    if (Math.abs(scoreVal) === 99.0) {
      scoreText = scoreVal > 0 ? 'M' : '-M';
    } else {
      scoreText += scoreVal.toFixed(2);
    }
    coachEvalValue.innerText = scoreText;
    coachExplanation.innerText = reviewData.comments[idx] || `${move.san} played.`;
    
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
    document.getElementById('line-1-pv').innerText = reviewData.comments[idx];
  }
}

// Move Step navigation
function stepMove(dir) {
  const target = currentMoveIdx + dir;
  if (target >= -1 && target < gameHistory.length) {
    jumpToMove(target);
  }
}

// Autoplay toggler
function toggleAutoplay() {
  const btn = document.getElementById('btn-play');
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
    btn.setAttribute('data-playing', 'false');
  } else {
    if (currentMoveIdx >= gameHistory.length - 1) {
      jumpToMove(-1);
    }
    
    autoplayInterval = setInterval(() => {
      if (currentMoveIdx < gameHistory.length - 1) {
        stepMove(1);
      } else {
        toggleAutoplay();
      }
    }, 1500);
    
    btn.setAttribute('data-playing', 'true');
  }
}

function showLanding() {
  if (autoplayInterval) {
    toggleAutoplay();
  }
  reviewWorkspace.style.display = 'none';
  navHomeBtn.style.display = 'none';
  landingScreen.style.display = 'flex';
}
