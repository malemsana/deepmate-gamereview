import { state } from './state.js';
import { PIECE_IMAGES } from './config.js';
import { runRealtimeEngineAnalysis } from './engine.js';
import { insertSelfAnalysisIndicator, renderSelfAnalysisMovesList, playMoveSound } from './ui.js';
import { clearArrows, drawMoveArrow } from './arrows.js';

let draggedPiece = null;
let dragSourceSquare = null;
let selectedSquare = null;
let rightClickStartSquare = null;

// Initialize Board Squares
export function initBoard() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  boardEl.innerHTML = '';
  
  // Prevent contextmenu on the entire board to allow custom right-clicks
  boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
  boardEl.addEventListener('mouseleave', () => {
    rightClickStartSquare = null;
  });
  boardEl.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      clearArrows();
    }
  });
  
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
      
      // Right-click drag event listeners for manual arrows
      squareEl.addEventListener('contextmenu', (e) => e.preventDefault());
      squareEl.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
          e.preventDefault();
          rightClickStartSquare = squareName;
        }
      });
      squareEl.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
          e.preventDefault();
          if (rightClickStartSquare && rightClickStartSquare !== squareName) {
            drawMoveArrow(rightClickStartSquare, squareName, true); // true = isManual
          }
          rightClickStartSquare = null;
        }
      });
      
      boardEl.appendChild(squareEl);
    }
  }
}

// Redraw board pieces
export function updateBoardDisplay() {
  document.querySelectorAll('.chess-piece').forEach(p => p.remove());
  const boardState = state.chess.board();
  
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
            clearArrows();
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

export function highlightLastMovePlayed() {
  document.querySelectorAll('.square').forEach(s => s.classList.remove('last-move-highlight'));
  
  if (state.isSelfAnalysis) {
    if (state.selfAnalysisHistory.length > 0 && state.selfAnalysisMoveIdx >= 0) {
      const move = state.selfAnalysisHistory[state.selfAnalysisMoveIdx];
      const fromEl = document.getElementById(`square-${move.from}`);
      const toEl = document.getElementById(`square-${move.to}`);
      if (fromEl) fromEl.classList.add('last-move-highlight');
      if (toEl) toEl.classList.add('last-move-highlight');
    }
    return;
  }
  
  if (state.currentMoveIdx >= 0) {
    const move = state.gameHistory[state.currentMoveIdx];
    const fromEl = document.getElementById(`square-${move.from}`);
    const toEl = document.getElementById(`square-${move.to}`);
    if (fromEl) fromEl.classList.add('last-move-highlight');
    if (toEl) toEl.classList.add('last-move-highlight');
  }
}

export function highlightLegalMoves(squareName) {
  clearLegalHighlights();
  const moves = state.chess.moves({ square: squareName, verbose: true });
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

export function clearLegalHighlights() {
  document.querySelectorAll('.square').forEach(s => {
    s.classList.remove('legal-move-dot', 'legal-move-capture');
  });
}

export function handleSquareClick(squareName) {
  if (selectedSquare === squareName) {
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected-highlight'));
    clearLegalHighlights();
    return;
  }
  
  const squareEl = document.getElementById(`square-${squareName}`);
  if (!squareEl) return;
  
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
    const sideToMove = state.chess.turn();
    
    if (pieceColor === sideToMove) {
      clearArrows();
      selectedSquare = squareName;
      squareEl.classList.add('selected-highlight');
      highlightLegalMoves(squareName);
    }
  }
}

export function handleSquareDrop(targetSquare) {
  if (draggedPiece && dragSourceSquare) {
    const squareEl = document.getElementById(`square-${targetSquare}`);
    if (squareEl && (squareEl.classList.contains('legal-move-dot') || squareEl.classList.contains('legal-move-capture'))) {
      executePlayerMove(dragSourceSquare, targetSquare);
    }
  }
}

export function executePlayerMove(from, to) {
  const isPawn = state.chess.get(from) && state.chess.get(from).type === 'p';
  const isPromo = isPawn && (to.endsWith('8') || to.endsWith('1'));
  
  const moveObj = state.chess.move({
    from: from,
    to: to,
    promotion: isPromo ? 'q' : undefined
  });
  
  if (moveObj) {
    if (!state.isSelfAnalysis) {
      state.isSelfAnalysis = true;
      state.selfAnalysisHistory = [];
      state.selfAnalysisMoveIdx = -1;
      insertSelfAnalysisIndicator();
    }
    
    state.selfAnalysisHistory.push({
      san: moveObj.san,
      from: from,
      to: to,
      color: moveObj.color,
      piece: moveObj.piece
    });
    state.selfAnalysisMoveIdx++;
    
    updateBoardDisplay();
    renderSelfAnalysisMovesList();
    runRealtimeEngineAnalysis();
    
    const isCheck = state.chess.in_check();
    playMoveSound(isCheck);
  }
}

export function updateMoveBadge() {
  document.querySelectorAll('.move-status-badge').forEach(b => b.remove());
  
  let targetSquare = null;
  let classification = null;
  
  if (state.isSelfAnalysis) {
    if (state.selfAnalysisHistory.length > 0 && state.selfAnalysisMoveIdx >= 0) {
      const move = state.selfAnalysisHistory[state.selfAnalysisMoveIdx];
      targetSquare = move.to;
      classification = move.classification || "best";
    }
  } else {
    if (state.currentMoveIdx >= 0) {
      const move = state.gameHistory[state.currentMoveIdx];
      targetSquare = move.to;
      classification = state.reviewData.classifications[state.currentMoveIdx];
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
