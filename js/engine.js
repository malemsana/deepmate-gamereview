import { state } from './state.js';
import { 
  calculateAccuracies, 
  getPieceValue, 
  countPieces, 
  generateCoachComment,
  formatBestMoveNotation
} from './classifier.js';

export let engineWorker = null;
export let engineReady = false;
export let isAnalyzing = false;

let analysisProgressCallback = null;
let analysisCompleteCallback = null;
let currentDepth = 10;

// Initialize Stockfish WASM Web Worker
export function initEngineWorker(onReady, onMessage) {
  try {
    engineWorker = new Worker('js/stockfish/stockfish-nnue-16-single.js');
    
    engineWorker.onmessage = function(e) {
      const line = e.data;
      parseEngineLine(line);
      if (onMessage) onMessage(line);
    };
    
    engineWorker.postMessage('uci');
    engineWorker.postMessage('setoption name Hash value 32');
    engineWorker.postMessage('isready');
  } catch (err) {
    console.warn("Stockfish worker failed. Falling back to heuristic reviews.", err);
    engineReady = false;
  }
}

// Start Stockfish Batch Analysis
export function startEngineAnalysis(depth, onProgress, onComplete) {
  isAnalyzing = true;
  currentDepth = depth;
  analysisProgressCallback = onProgress;
  analysisCompleteCallback = onComplete;
  state.queueIdx = 0;
  analyzeNextQueueItem();
}

// Queue runner
export function analyzeNextQueueItem() {
  if (state.queueIdx >= state.analysisQueue.length) {
    isAnalyzing = false;
    compileWorkerAnalysisResults();
    if (analysisCompleteCallback) analysisCompleteCallback();
    return;
  }
  
  if (analysisProgressCallback) {
    analysisProgressCallback(state.queueIdx, state.analysisQueue.length);
  }
  
  const item = state.analysisQueue[state.queueIdx];
  engineWorker.postMessage(`position fen ${item.fen}`);
  engineWorker.postMessage(`go depth ${currentDepth}`);
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
      scoreText = (evalVal > 0 ? '+' : '') + evalVal.toFixed(2);
    } else if (scoreType === 'mate') {
      evalVal = scoreVal > 0 ? 99.0 : -99.0;
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
    
    // Get evaluation text from event/dom or fallback
    const scoreEl = document.getElementById('engine-eval-score');
    const txt = scoreEl ? scoreEl.innerText : '0.00';
    let finalScore = 0.0;
    if (txt.includes('M')) {
      finalScore = txt.startsWith('-') ? -99.0 : 99.0;
    } else {
      finalScore = parseFloat(txt) || 0.0;
    }
    
    if (!state.isSelfAnalysis) {
      if (state.analysisQueue && state.analysisQueue[state.queueIdx]) {
        state.analysisQueue[state.queueIdx].evalScore = finalScore;
        state.analysisQueue[state.queueIdx].bestMove = bestMove;
      }
      state.queueIdx++;
      analyzeNextQueueItem();
    } else {
      isAnalyzing = false;
      if (state.selfAnalysisHistory.length > 0 && state.selfAnalysisMoveIdx >= 0) {
        state.selfAnalysisHistory[state.selfAnalysisMoveIdx].evalScore = finalScore;
        state.selfAnalysisHistory[state.selfAnalysisMoveIdx].bestMove = bestMove;
      }
    }
  }
}

// Compile Stockfish Results
function compileWorkerAnalysisResults() {
  state.reviewData.evals = [];
  state.reviewData.classifications = {};
  state.reviewData.comments = {};
  
  state.reviewData.evals = state.analysisQueue.map(item => item.evalScore);
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const playerColor = move.color;
    
    const prevEval = state.reviewData.evals[i];
    const currEval = state.reviewData.evals[i + 1];
    const queueItem = state.analysisQueue[i]; 
    
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
            const prevMoveType = state.reviewData.classifications[i - 1];
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
            const prevMoveType = state.reviewData.classifications[i - 1];
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
    
    state.reviewData.classifications[i] = type;
    state.reviewData.comments[i] = generateCoachComment(move, type, bestMoveStr, i);
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
      detail: { depth: '12', scoreText: state.chess.turn() === 'w' ? '+0.40' : '-0.40', nps: 0, pv: '' }
    });
    window.dispatchEvent(event);
    return;
  }
  
  isAnalyzing = true;
  engineWorker.postMessage(`position fen ${state.chess.fen()}`);
  engineWorker.postMessage('go depth 12');
}
