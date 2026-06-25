import { state } from './state.js';
import { 
  calculateAccuracies, 
  getPieceValue, 
  countPieces, 
  generateCoachComment,
  formatBestMoveNotation,
  classifyMove
} from './classifier.js';
import { extractFeatures, normalizeEval } from './features.js';

export let engineWorker = null;
export let engineReady = false;
export let isAnalyzing = false;

export let isMultiThreaded = false;

// Tier 3 (Depth 20) configuration flag
export const ENABLE_TIER_3 = false;

let latestEvalScore = 0.0;
let analysisProgressCallback = null;
let analysisCompleteCallback = null;
let currentDepth = 20;

// Diagnostics tracking
let analysisStartTime = 0;
let itemStartTime = 0;
let phase1Times = [];
let phase2Times = [];
let phase3Times = [];

// Helper to create and setup a worker instance
function createWorker(workerFile, onReadyCallback, onMessageCallback) {
  try {
    const worker = new Worker(workerFile);
    
    worker.onmessage = function(e) {
      const line = e.data;
      parseEngineLine(line);
      
      if (line === 'readyok') {
        if (onReadyCallback) onReadyCallback();
      }
      
      if (onMessageCallback) onMessageCallback(line);
    };
    
    worker.postMessage('uci');
    worker.postMessage('setoption name Hash value 32');
    
    // Set multi-threaded option if loading the multi-threaded worker file
    if (workerFile.includes('stockfish-18-lite.js') && !workerFile.includes('single')) {
      const threadsCount = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
      worker.postMessage(`setoption name Threads value ${threadsCount}`);
      console.log(`Setting multi-threaded Stockfish Threads value to: ${threadsCount}`);
    }
    
    worker.postMessage('isready');
    
    return worker;
  } catch (err) {
    console.error(`Failed to instantiate worker (${workerFile}):`, err);
    return null;
  }
}

// Initialize Stockfish WASM Web Worker
export function initEngineWorker(onReady, onMessage) {
  const supportsThreads = typeof SharedArrayBuffer === 'function' && window.crossOriginIsolated === true;
  
  if (supportsThreads) {
    console.log("Environment supports SharedArrayBuffer & cross-origin isolation. Attempting multi-threaded Stockfish...");
    let failed = false;
    let timeoutId = null;
    
    const worker = createWorker(
      'js/stockfish/stockfish-18-lite.js',
      () => {
        if (failed) return;
        console.log("Multi-threaded Stockfish successfully loaded and ready.");
        clearTimeout(timeoutId);
        isMultiThreaded = true;
        engineWorker = worker;
        engineReady = true;
        if (onReady) onReady();
      },
      (line) => {
        if (failed) return;
        if (onMessage) onMessage(line);
      }
    );
    
    if (worker) {
      worker.onerror = function(err) {
        if (failed) return;
        console.warn("Multi-threaded Stockfish worker failed on startup. Falling back to single-threaded:", err);
        failed = true;
        clearTimeout(timeoutId);
        try { worker.terminate(); } catch(e) {}
        fallbackToSingleThread(onReady, onMessage);
      };
      
      timeoutId = setTimeout(() => {
        if (failed) return;
        console.warn("Multi-threaded Stockfish startup timed out (1.5s). Falling back to single-threaded.");
        failed = true;
        try { worker.terminate(); } catch(e) {}
        fallbackToSingleThread(onReady, onMessage);
      }, 1500);
    } else {
      fallbackToSingleThread(onReady, onMessage);
    }
  } else {
    console.log("Environment does not support multi-threaded WASM. Using single-threaded Stockfish...");
    fallbackToSingleThread(onReady, onMessage);
  }
}

function fallbackToSingleThread(onReady, onMessage) {
  isMultiThreaded = false;
  engineReady = false;
  const worker = createWorker(
    'js/stockfish/stockfish-18-lite-single.js',
    () => {
      console.log("Fallback single-threaded Stockfish ready.");
      engineWorker = worker;
      engineReady = true;
      if (onReady) onReady();
    },
    onMessage
  );
  
  if (worker) {
    engineWorker = worker;
  } else {
    console.error("Failed to initialize fallback single-threaded Stockfish worker.");
    engineReady = false;
  }
}

let analysisPhase = 1; // 1: Depth 8, 2: Depth 15, 3: Depth 20
let phaseQueue = [];   // Array of indices from state.analysisQueue to analyze
let phaseQueueIdx = 0;
let phaseOnProgress = null;
let phaseOnComplete = null;

// Start Stockfish Batch Analysis
export function startEngineAnalysis(depth, onProgress, onComplete) {
  isAnalyzing = true;
  phaseOnProgress = onProgress;
  phaseOnComplete = onComplete;
  
  console.log(`[Engine] Starting analysis run. Mode: ${isMultiThreaded ? 'MULTI-THREADED' : 'SINGLE-THREADED'}`);
  analysisStartTime = performance.now();
  phase1Times = [];
  phase2Times = [];
  phase3Times = [];
  
  // Phase 1 Setup: Depth 8 baseline scan for all positions
  analysisPhase = 1;
  phaseQueue = state.analysisQueue.map((_, idx) => idx);
  phaseQueueIdx = 0;
  
  // Reset all phase evaluation data on the queue
  state.analysisQueue.forEach(item => {
    item.eval8 = undefined;
    item.bestMove8 = undefined;
    item.eval15 = undefined;
    item.bestMove15 = undefined;
    item.eval20 = undefined;
    item.bestMove20 = undefined;
    item.evalScore = undefined;
    item.bestMove = undefined;
  });
  
  analyzeNextPhaseItem();
}

// Queue runner
export function analyzeNextPhaseItem() {
  if (phaseQueueIdx >= phaseQueue.length) {
    transitionToNextPhase();
    return;
  }
  
  const queueIdx = phaseQueue[phaseQueueIdx];
  const item = state.analysisQueue[queueIdx];
  
  let targetDepth = 8;
  if (analysisPhase === 2) targetDepth = 15;
  if (analysisPhase === 3) targetDepth = 20;
  
  if (phaseOnProgress) {
    phaseOnProgress(analysisPhase, phaseQueueIdx, phaseQueue.length, queueIdx);
  }
  
  latestEvalScore = 0.0;
  itemStartTime = performance.now();
  engineWorker.postMessage(`position fen ${item.fen}`);
  engineWorker.postMessage(`go depth ${targetDepth}`);
}

// Phase state machine transitioner
function transitionToNextPhase() {
  if (analysisPhase === 1) {
    preparePhase2Queue();
    if (phaseQueue.length > 0) {
      analysisPhase = 2;
      phaseQueueIdx = 0;
      analyzeNextPhaseItem();
    } else {
      analysisPhase = 2;
      transitionToNextPhase();
    }
  } else if (analysisPhase === 2) {
    if (ENABLE_TIER_3) {
      preparePhase3Queue();
      if (phaseQueue.length > 0) {
        analysisPhase = 3;
        phaseQueueIdx = 0;
        analyzeNextPhaseItem();
      } else {
        analysisPhase = 3;
        transitionToNextPhase();
      }
    } else {
      analysisPhase = 3;
      transitionToNextPhase();
    }
  } else if (analysisPhase === 3) {
    isAnalyzing = false;
    compileFinalAnalysisResults();
    printAnalysisDiagnostics();
    if (phaseOnComplete) phaseOnComplete();
  }
}

function printAnalysisDiagnostics() {
  const totalRuntime = performance.now() - analysisStartTime;
  
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const avg = arr => arr.length > 0 ? (sum(arr) / arr.length).toFixed(1) : '0.0';
  
  console.log("=== ENGINE ANALYSIS DIAGNOSTICS ===");
  console.log(`Currently running: ${isMultiThreaded ? 'MULTI-THREADED' : 'SINGLE-THREADED'}`);
  console.log(`Total Runtime: ${(totalRuntime / 1000).toFixed(2)} seconds`);
  console.log(`Tier 1 (Depth 8)  - Moves Analyzed: ${phase1Times.length}, Avg Time: ${avg(phase1Times)} ms, Total Time: ${sum(phase1Times).toFixed(0)} ms`);
  console.log(`Tier 2 (Depth 15) - Moves Analyzed: ${phase2Times.length}, Avg Time: ${avg(phase2Times)} ms, Total Time: ${sum(phase2Times).toFixed(0)} ms`);
  console.log(`Tier 3 (Depth 20) - Moves Analyzed: ${phase3Times.length}, Avg Time: ${avg(phase3Times)} ms, Total Time: ${sum(phase3Times).toFixed(0)} ms`);
  console.log("====================================");
}

// Phase 2 Filtering: Moderate scan (Depth 15) for interesting/critical moves
function preparePhase2Queue() {
  const flaggedIndices = new Set();
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const idxBefore = i;
    const idxAfter = i + 1;
    
    const itemBefore = state.analysisQueue[idxBefore];
    const itemAfter = state.analysisQueue[idxAfter];
    
    const evalBefore = itemBefore.eval8 !== undefined ? itemBefore.eval8 : 0.0;
    const evalAfter = itemAfter.eval8 !== undefined ? itemAfter.eval8 : 0.0;
    
    // Calculate centipawn loss from the player's perspective at depth 8
    let centipawnLoss = 0.0;
    if (move.color === 'w') {
      centipawnLoss = evalBefore - evalAfter;
    } else {
      centipawnLoss = evalAfter - evalBefore;
    }
    
    const isMateBefore = Math.abs(evalBefore) === 99.0;
    const isMateAfter = Math.abs(evalAfter) === 99.0;
    
    const isCapture = move.san.includes('x');
    const isCheck = move.san.includes('+') || move.san.includes('#');
    const isPromotion = move.san.includes('=');
    const isCastle = move.san.includes('O-O');
    
    // Interesting moves have centipawn loss > 50cp, mates, checks, promotions, or captures
    const isInteresting = centipawnLoss > 0.50 || isMateBefore || isMateAfter || isCapture || isCheck || isPromotion || isCastle;
    
    if (isInteresting) {
      flaggedIndices.add(idxBefore);
      flaggedIndices.add(idxAfter);
    }
  }
  
  phaseQueue = Array.from(flaggedIndices).sort((a, b) => a - b);
}

// Phase 3 Filtering: Deep scan (Depth 20) for complex, disagreement, or brilliant moves
function preparePhase3Queue() {
  const flaggedIndices = new Set();
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const idxBefore = i;
    const idxAfter = i + 1;
    
    const itemBefore = state.analysisQueue[idxBefore];
    const itemAfter = state.analysisQueue[idxAfter];
    
    // We only perform deep checks if both positions were evaluated in Phase 2
    if (itemBefore.eval15 !== undefined && itemAfter.eval15 !== undefined) {
      // Swing check
      const swingBefore = Math.abs(itemBefore.eval8 - itemBefore.eval15) > 3.00;
      const swingAfter = Math.abs(itemAfter.eval8 - itemAfter.eval15) > 3.00;
      
      // Potential brilliant sacrifice check
      const evalBefore15 = itemBefore.eval15;
      const evalAfter15 = itemAfter.eval15;
      
      let centipawnLoss15 = 0.0;
      if (move.color === 'w') {
        centipawnLoss15 = evalBefore15 - evalAfter15;
      } else {
        centipawnLoss15 = evalAfter15 - evalBefore15;
      }
      
      const isCapture = move.san.includes('x');
      const isSacrificeCandidate = isCapture && (centipawnLoss15 < 0.20);
      
      if (swingBefore || swingAfter || isSacrificeCandidate) {
        flaggedIndices.add(idxBefore);
        flaggedIndices.add(idxAfter);
      }
    }
  }
  
  phaseQueue = Array.from(flaggedIndices).sort((a, b) => a - b);
}

// UCI stdout parser
function parseEngineLine(line) {
  if (line === 'readyok') {
    engineReady = true;
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
      latestEvalScore = evalVal;
      scoreText = (evalVal > 0 ? '+' : '') + evalVal.toFixed(2);
    } else if (scoreType === 'mate') {
      evalVal = scoreVal > 0 ? 99.0 : -99.0;
      latestEvalScore = evalVal;
      scoreText = 'M' + Math.abs(scoreVal);
      if (scoreVal < 0) scoreText = '-M' + Math.abs(scoreVal);
    }
    
    // Dispatch real-time engine status update events so UI can listen
    const event = new CustomEvent('engine-info', {
      detail: { depth, scoreText, nps, pv: pvMatch ? pvMatch[1] : '' }
    });
    window.dispatchEvent(event);
  }
  
  if (line.startsWith('bestmove') && isAnalyzing) {
    const parts = line.split(' ');
    const bestMove = parts[1];
    const finalScore = latestEvalScore;
    
    if (!state.isSelfAnalysis) {
      const queueIdx = phaseQueue[phaseQueueIdx];
      const item = state.analysisQueue[queueIdx];
      
      const duration = performance.now() - itemStartTime;
      if (analysisPhase === 1) phase1Times.push(duration);
      else if (analysisPhase === 2) phase2Times.push(duration);
      else if (analysisPhase === 3) phase3Times.push(duration);
      
      if (item) {
        if (analysisPhase === 1) {
          item.eval8 = finalScore;
          item.bestMove8 = bestMove;
        } else if (analysisPhase === 2) {
          item.eval15 = finalScore;
          item.bestMove15 = bestMove;
        } else if (analysisPhase === 3) {
          item.eval20 = finalScore;
          item.bestMove20 = bestMove;
        }
      }
      
      phaseQueueIdx++;
      analyzeNextPhaseItem();
    } else {
      isAnalyzing = false;
      if (state.selfAnalysisHistory.length > 0 && state.selfAnalysisMoveIdx >= 0) {
        state.selfAnalysisHistory[state.selfAnalysisMoveIdx].evalScore = finalScore;
        state.selfAnalysisHistory[state.selfAnalysisMoveIdx].bestMove = bestMove;
        analyzeSelfAnalysisMove();
      }
    }
  }
}

// Compile final hybrid results
function compileFinalAnalysisResults() {
  state.reviewData.evals = [];
  state.reviewData.classifications = {};
  state.reviewData.comments = {};
  state.reviewData.features = {};
  
  // Hierarchical merge
  state.analysisQueue.forEach(item => {
    if (item.eval20 !== undefined) {
      item.evalScore = item.eval20;
      item.bestMove = item.bestMove20;
    } else if (item.eval15 !== undefined) {
      item.evalScore = item.eval15;
      item.bestMove = item.bestMove15;
    } else {
      item.evalScore = item.eval8 !== undefined ? item.eval8 : 0.3;
      item.bestMove = item.bestMove8 || "";
    }
  });
  
  state.reviewData.evals = state.analysisQueue.map(item => {
    try {
      const tempChess = new Chess(item.fen);
      const scoreVal = item.evalScore !== undefined ? item.evalScore : 0.3;
      return normalizeEval(scoreVal, tempChess.turn());
    } catch (e) {
      return item.evalScore !== undefined ? item.evalScore : 0.3;
    }
  });
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const queueItem = state.analysisQueue[i]; 
    const nextQueueItem = state.analysisQueue[i + 1];
    
    const prevFen = queueItem.fen;
    const positionChess = new Chess(prevFen);
    const nextChess = new Chess(nextQueueItem.fen);
    
    const headers = (state.chess && typeof state.chess.header === 'function') ? state.chess.header() : {};
    const features = extractFeatures(
      positionChess,
      nextChess,
      move,
      queueItem,
      nextQueueItem,
      i,
      headers
    );
    state.reviewData.features[i] = features;
    
    const type = classifyMove(features);
    state.reviewData.classifications[i] = type;
    const bestMoveStr = queueItem.bestMove;
    state.reviewData.comments[i] = generateCoachComment(move, type, bestMoveStr, i, features, positionChess);
  }
  
  calculateAccuracies();
}

// Simulated heuristic review runner
export function runSimulatedAnalysis(onProgress, onComplete) {
  let progress = 0;
  const timer = setInterval(() => {
    progress += 25;
    if (onProgress) onProgress(progress);
    
    if (progress >= 100) {
      clearInterval(timer);
      
      state.reviewData.evals = [0.15];
      state.reviewData.classifications = {};
      state.reviewData.comments = {};
      
      let currentEval = 0.15;
      
      for (let i = 0; i < state.gameHistory.length; i++) {
        const move = state.gameHistory[i];
        const playerColor = move.color;
        let change = 0.0;
        
        let type = "best";
        
        if (i < 6) {
          type = "book";
          change = (Math.random() - 0.5) * 0.1;
        } else {
          const tempChess = new Chess();
          for (let k = 0; k < i; k++) {
            tempChess.move(state.gameHistory[k].san);
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
        
        state.reviewData.evals.push(currentEval);
        state.reviewData.classifications[i] = type;
        
        const dummyBestMove = "e2e4";
        state.reviewData.comments[i] = generateCoachComment(move, type, dummyBestMove, i);
      }
      
      calculateAccuracies();
      if (onComplete) onComplete();
    }
  }, 120);
}

export function runRealtimeEngineAnalysis() {
  if (!engineReady || !engineWorker) {
    const event = new CustomEvent('engine-info', {
      detail: { depth: '20', scoreText: state.chess.turn() === 'w' ? '+0.40' : '-0.40', nps: 0, pv: '' }
    });
    window.dispatchEvent(event);
    return;
  }
  
  isAnalyzing = true;
  latestEvalScore = 0.0;
  engineWorker.postMessage(`position fen ${state.chess.fen()}`);
  engineWorker.postMessage('go depth 20');
}

export function analyzeSelfAnalysisMove() {
  if (state.selfAnalysisHistory.length === 0 || state.selfAnalysisMoveIdx < 0) return;
  
  const moveIdx = state.selfAnalysisMoveIdx;
  const move = state.selfAnalysisHistory[moveIdx];
  
  const chessAfter = new Chess(state.chess.fen());
  const chessBefore = new Chess(state.chess.fen());
  chessBefore.undo();
  
  let evalBefore = 0.15;
  let bestMoveBefore = "";
  
  if (moveIdx === 0) {
    if (state.currentMoveIdx === -1) {
      evalBefore = 0.15;
      bestMoveBefore = "";
    } else {
      evalBefore = state.reviewData.evals[state.currentMoveIdx + 1] !== undefined 
        ? state.reviewData.evals[state.currentMoveIdx + 1] 
        : 0.15;
      bestMoveBefore = (state.analysisQueue && state.analysisQueue[state.currentMoveIdx])
        ? state.analysisQueue[state.currentMoveIdx].bestMove 
        : "";
    }
  } else {
    const prevMove = state.selfAnalysisHistory[moveIdx - 1];
    evalBefore = prevMove.evalScore !== undefined ? prevMove.evalScore : 0.15;
    bestMoveBefore = prevMove.bestMove || "";
  }
  
  const engineInfoBefore = {
    evalScore: evalBefore,
    bestMove: bestMoveBefore
  };
  
  const engineInfoAfter = {
    evalScore: move.evalScore !== undefined ? move.evalScore : 0.15,
    bestMove: move.bestMove || ""
  };
  
  const headers = {};
  const features = extractFeatures(
    chessBefore,
    chessAfter,
    move,
    engineInfoBefore,
    engineInfoAfter,
    moveIdx + 100, // Offset to bypass book move threshold
    headers
  );
  
  const classification = classifyMove(features);
  move.classification = classification;
  
  const comment = generateCoachComment(move, classification, bestMoveBefore, moveIdx, features, chessBefore);
  move.comment = comment;
  
  const event = new CustomEvent('self-analysis-compiled', {
    detail: { move, classification, comment, evalScore: move.evalScore }
  });
  window.dispatchEvent(event);
}
