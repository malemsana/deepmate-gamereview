/**
 * DeepMate Feature Extraction Engine
 * Stage 1 of the Chess Commentary and Classification Pipeline.
 * 
 * Only extracts objective facts and features from the board states and engine outputs.
 * Never grades moves or generates commentary.
 */

// Helper to get piece values
export function getPieceValue(code) {
  if (!code) return 0;
  const c = code.toLowerCase();
  if (c === 'p') return 1;
  if (c === 'n' || c === 'b') return 3;
  if (c === 'r') return 5;
  if (c === 'q') return 9;
  return 0;
}

/**
 * Normalizes evaluations to White's perspective.
 * Positive values favor White, negative values favor Black.
 */
export function normalizeEval(rawScore, turn) {
  if (rawScore === 99.0 || rawScore === -99.0) {
    return rawScore;
  }
  return turn === 'b' ? -rawScore : rawScore;
}

/**
 * Normalizes mate scores to White's perspective.
 */
export function normalizeMateScore(mateScore, turn) {
  if (mateScore === null || mateScore === undefined) return null;
  return turn === 'b' ? -mateScore : mateScore;
}

/**
 * Heuristically determines the current game phase.
 */
export function getGamePhase(chess) {
  let queens = 0;
  let minorOrMajorPieces = 0;
  
  chess.board().forEach(row => {
    row.forEach(square => {
      if (square) {
        const type = square.type;
        if (type === 'q') queens++;
        if (type !== 'p' && type !== 'k') minorOrMajorPieces++;
      }
    });
  });
  
  const history = chess.history();
  if (history.length < 16 && minorOrMajorPieces >= 12) {
    return 'opening';
  }
  if (queens === 0 || (queens <= 2 && minorOrMajorPieces <= 4)) {
    return 'endgame';
  }
  return 'middlegame';
}

/**
 * Calculates total material value on the board for a given color.
 */
export function getBoardMaterial(chess, color) {
  let total = 0;
  chess.board().forEach(row => {
    row.forEach(square => {
      if (square && square.color === color) {
        total += getPieceValue(square.type);
      }
    });
  });
  return total;
}

/**
 * Returns list of squares attacked by the piece on the specified square.
 */
export function getPieceAttacks(chess, square) {
  const piece = chess.get(square);
  if (!piece) return [];
  
  const attacks = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const rankIdx = parseInt(square[1]) - 1;
  
  const directions = {
    r: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    k: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  };
  
  const type = piece.type;
  const color = piece.color;
  
  if (type === 'n') {
    const knightMoves = [
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [1, -2], [-1, 2], [-1, -2]
    ];
    knightMoves.forEach(([df, dr]) => {
      const f = fileIdx + df;
      const r = rankIdx + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        attacks.push(files[f] + (r + 1));
      }
    });
  } else if (type === 'p') {
    const dir = color === 'w' ? 1 : -1;
    const pawnCaptures = [[-1, dir], [1, dir]];
    pawnCaptures.forEach(([df, dr]) => {
      const f = fileIdx + df;
      const r = rankIdx + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        attacks.push(files[f] + (r + 1));
      }
    });
  } else if (directions[type]) {
    const isSlider = (type === 'r' || type === 'b' || type === 'q');
    const dirs = directions[type];
    dirs.forEach(([df, dr]) => {
      let f = fileIdx + df;
      let r = rankIdx + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const sqName = files[f] + (r + 1);
        const targetPiece = chess.get(sqName);
        attacks.push(sqName);
        if (targetPiece) break; // slider blocked
        if (!isSlider) break; // king only moves 1 square
        f += df;
        r += dr;
      }
    });
  }
  return attacks;
}

/**
 * Checks if a square is attacked by any piece of the specified color.
 */
export function isSquareAttackedBy(chess, square, attackerColor) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sqName = files[f] + (r + 1);
      const piece = chess.get(sqName);
      if (piece && piece.color === attackerColor) {
        const attacks = getPieceAttacks(chess, sqName);
        if (attacks.includes(square)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Detects if the piece on targetSq attacks 2 or more pieces of value >= 3 or King.
 */
export function detectFork(chess, targetSq) {
  const piece = chess.get(targetSq);
  if (!piece) return false;
  
  const attacks = getPieceAttacks(chess, targetSq);
  let highValueTargets = 0;
  
  attacks.forEach(sq => {
    const targetPiece = chess.get(sq);
    if (targetPiece && targetPiece.color !== piece.color) {
      const val = getPieceValue(targetPiece.type);
      if (targetPiece.type === 'k') {
        highValueTargets++;
      } else if (val >= 3) {
        highValueTargets++;
      } else if (val === 1) {
        // Attack on an undefended pawn can be part of a fork
        const isDefended = isSquareAttackedBy(chess, sq, targetPiece.color);
        if (!isDefended) {
          highValueTargets++;
        }
      }
    }
  });
  return highValueTargets >= 2;
}

/**
 * Detects if a slider creates a pin.
 */
export function detectPin(chess, sliderSq) {
  const piece = chess.get(sliderSq);
  if (!piece || !['b', 'r', 'q'].includes(piece.type)) return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(sliderSq[0]);
  const rankIdx = parseInt(sliderSq[1]) - 1;
  
  const directions = {
    r: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  };
  
  const dirs = directions[piece.type];
  for (const [df, dr] of dirs) {
    let f = fileIdx + df;
    let r = rankIdx + dr;
    let firstOpponentPiece = null;
    
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sqName = files[f] + (r + 1);
      const p = chess.get(sqName);
      if (p) {
        if (p.color === piece.color) {
          break; // Blocked by own piece
        } else {
          if (!firstOpponentPiece) {
            firstOpponentPiece = p;
          } else {
            // Second opponent piece on the ray
            const val1 = getPieceValue(firstOpponentPiece.type);
            const val2 = p.type === 'k' ? 100 : getPieceValue(p.type);
            if (val2 > val1) {
              return true; // Pinned!
            }
            break;
          }
        }
      }
      f += df;
      r += dr;
    }
  }
  return false;
}

/**
 * Detects if a slider creates a skewer.
 */
export function detectSkewer(chess, sliderSq) {
  const piece = chess.get(sliderSq);
  if (!piece || !['b', 'r', 'q'].includes(piece.type)) return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(sliderSq[0]);
  const rankIdx = parseInt(sliderSq[1]) - 1;
  
  const directions = {
    r: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  };
  
  const dirs = directions[piece.type];
  for (const [df, dr] of dirs) {
    let f = fileIdx + df;
    let r = rankIdx + dr;
    let firstOpponentPiece = null;
    
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sqName = files[f] + (r + 1);
      const p = chess.get(sqName);
      if (p) {
        if (p.color === piece.color) {
          break; // Blocked by own piece
        } else {
          if (!firstOpponentPiece) {
            firstOpponentPiece = p;
          } else {
            // Second opponent piece on the ray
            const val1 = firstOpponentPiece.type === 'k' ? 100 : getPieceValue(firstOpponentPiece.type);
            const val2 = getPieceValue(p.type);
            if (val1 > val2 && val1 >= 5) {
              return true; // Skewered!
            }
            break;
          }
        }
      }
      f += df;
      r += dr;
    }
  }
  return false;
}

/**
 * Detects if a slider is lined up with another slider of the same color.
 */
export function detectBattery(chess, sliderSq) {
  const piece = chess.get(sliderSq);
  if (!piece || !['b', 'r', 'q'].includes(piece.type)) return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(sliderSq[0]);
  const rankIdx = parseInt(sliderSq[1]) - 1;
  
  const directions = {
    r: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  };
  
  const dirs = directions[piece.type];
  for (const [df, dr] of dirs) {
    let f = fileIdx + df;
    let r = rankIdx + dr;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sqName = files[f] + (r + 1);
      const p = chess.get(sqName);
      if (p) {
        if (p.color === piece.color && ['b', 'r', 'q'].includes(p.type)) {
          const isDiagonalDir = (df !== 0 && dr !== 0);
          const currentCanDiagonal = ['b', 'q'].includes(piece.type);
          const foundCanDiagonal = ['b', 'q'].includes(p.type);
          const currentCanOrthogonal = ['r', 'q'].includes(piece.type);
          const foundCanOrthogonal = ['r', 'q'].includes(p.type);
          
          if (isDiagonalDir && currentCanDiagonal && foundCanDiagonal) return true;
          if (!isDiagonalDir && currentCanOrthogonal && foundCanOrthogonal) return true;
        }
        break;
      }
      f += df;
      r += dr;
    }
  }
  return false;
}

/**
 * Detects if moving a piece opened a line of attack for another slider of the same color.
 */
export function detectDiscoveredAttack(chessBefore, chessAfter, playedMove) {
  const playerColor = chessBefore.turn();
  const opponentColor = playerColor === 'w' ? 'b' : 'w';
  const origin = playedMove.from;
  
  const tempChess = new Chess(chessBefore.fen());
  tempChess.remove(origin);
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = files[f] + (r + 1);
      const piece = tempChess.get(sq);
      if (piece && piece.color === playerColor && ['b', 'r', 'q'].includes(piece.type)) {
        const attacksBefore = getPieceAttacks(chessBefore, sq);
        const attacksTemp = getPieceAttacks(tempChess, sq);
        const newAttacks = attacksTemp.filter(a => !attacksBefore.includes(a));
        
        for (const attackSq of newAttacks) {
          const target = chessAfter.get(attackSq);
          if (target && target.color === opponentColor && (getPieceValue(target.type) >= 3 || target.type === 'k')) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Returns list of squares with hanging pieces of a given color.
 */
export function getHangingPieces(chess, color) {
  const opponentColor = color === 'w' ? 'b' : 'w';
  const hanging = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = files[f] + (r + 1);
      const piece = chess.get(sq);
      if (piece && piece.color === color) {
        const isAttacked = isSquareAttackedBy(chess, sq, opponentColor);
        if (isAttacked) {
          const isDefended = isSquareAttackedBy(chess, sq, color);
          if (!isDefended) {
            hanging.push(sq);
          } else {
            let minAttackerValue = 99;
            for (let f2 = 0; f2 < 8; f2++) {
              for (let r2 = 0; r2 < 8; r2++) {
                const sq2 = files[f2] + (r2 + 1);
                const p2 = chess.get(sq2);
                if (p2 && p2.color === opponentColor) {
                  const attacks = getPieceAttacks(chess, sq2);
                  if (attacks.includes(sq)) {
                    minAttackerValue = Math.min(minAttackerValue, getPieceValue(p2.type));
                  }
                }
              }
            }
            if (minAttackerValue < getPieceValue(piece.type)) {
              hanging.push(sq);
            }
          }
        }
      }
    }
  }
  return hanging;
}

// --- Category 5: King Safety Helpers ---
export function getCastlingStatus(chess, color) {
  const fenParts = chess.fen().split(' ');
  const rights = fenParts[2];
  const hasRights = color === 'w' 
    ? (rights.includes('K') || rights.includes('Q'))
    : (rights.includes('k') || rights.includes('q'));
  
  let kingSq = '';
  chess.board().forEach((row, r) => {
    row.forEach((sq, f) => {
      if (sq && sq.type === 'k' && sq.color === color) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        kingSq = files[f] + (8 - r);
      }
    });
  });
  
  const castledSquares = color === 'w' ? ['g1', 'c1'] : ['g8', 'c8'];
  if (castledSquares.includes(kingSq)) {
    return 'castled';
  }
  return hasRights ? 'canCastle' : 'cannotCastle';
}

export function isKingFileOpen(chess, color) {
  let kingSq = '';
  chess.board().forEach((row, r) => {
    row.forEach((sq, f) => {
      if (sq && sq.type === 'k' && sq.color === color) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        kingSq = files[f] + (8 - r);
      }
    });
  });
  if (!kingSq) return false;
  
  const fileChar = kingSq[0];
  let hasPawn = false;
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(fileChar + r);
    if (p && p.type === 'p') {
      hasPawn = true;
      break;
    }
  }
  return !hasPawn;
}

export function getKingSafetyMetrics(chess, color) {
  let kingSq = '';
  chess.board().forEach((row, r) => {
    row.forEach((sq, f) => {
      if (sq && sq.type === 'k' && sq.color === color) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        kingSq = files[f] + (8 - r);
      }
    });
  });
  if (!kingSq) return { attackers: 0, defenders: 0, safetyScore: 100 };
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(kingSq[0]);
  const rankIdx = parseInt(kingSq[1]) - 1;
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  const surroundingSquares = [];
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      const f = fileIdx + df;
      const r = rankIdx + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        surroundingSquares.push(files[f] + (r + 1));
      }
    }
  }
  
  const attackingPieces = new Set();
  const defendingPieces = new Set();
  
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = files[f] + (r + 1);
      const piece = chess.get(sq);
      if (piece) {
        const attacks = getPieceAttacks(chess, sq);
        const overlaps = attacks.some(a => surroundingSquares.includes(a));
        
        if (overlaps) {
          if (piece.color === opponentColor && piece.type !== 'k') {
            attackingPieces.add(sq);
          } else if (piece.color === color && piece.type !== 'k') {
            defendingPieces.add(sq);
          }
        }
      }
    }
  }
  
  const attackersCount = attackingPieces.size;
  const defendersCount = defendingPieces.size;
  
  let safetyScore = 100 - (attackersCount * 15) + (defendingPieces.size * 5);
  safetyScore = Math.max(10, Math.min(100, safetyScore));
  
  return {
    attackers: attackersCount,
    defenders: defendersCount,
    safetyScore
  };
}

// --- Category 6: Pawn Structure Helpers ---
export function isPassedPawn(chess, square, color) {
  const piece = chess.get(square);
  if (!piece || piece.type !== 'p') return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const rank = parseInt(square[1]);
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  const filesToCheck = [fileIdx - 1, fileIdx, fileIdx + 1].filter(f => f >= 0 && f < 8);
  for (const f of filesToCheck) {
    const fileChar = files[f];
    if (color === 'w') {
      for (let r = rank + 1; r <= 8; r++) {
        const p = chess.get(fileChar + r);
        if (p && p.type === 'p' && p.color === opponentColor) {
          return false;
        }
      }
    } else {
      for (let r = rank - 1; r >= 1; r--) {
        const p = chess.get(fileChar + r);
        if (p && p.type === 'p' && p.color === opponentColor) {
          return false;
        }
      }
    }
  }
  return true;
}

export function isIsolatedPawn(chess, square, color) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const adjacentFiles = [fileIdx - 1, fileIdx + 1].filter(f => f >= 0 && f < 8);
  
  for (const f of adjacentFiles) {
    const fileChar = files[f];
    for (let r = 1; r <= 8; r++) {
      const p = chess.get(fileChar + r);
      if (p && p.type === 'p' && p.color === color) {
        return false;
      }
    }
  }
  return true;
}

export function hasDoubledPawns(chess, fileChar, color) {
  let count = 0;
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(fileChar + r);
    if (p && p.type === 'p' && p.color === color) {
      count++;
    }
  }
  return count >= 2;
}

export function isBackwardPawn(chess, square, color) {
  const piece = chess.get(square);
  if (!piece || piece.type !== 'p') return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const rank = parseInt(square[1]);
  const dir = color === 'w' ? 1 : -1;
  const adjacentFiles = [fileIdx - 1, fileIdx + 1].filter(f => f >= 0 && f < 8);
  
  let hasAdvancedFriendlyAdjacent = false;
  for (const f of adjacentFiles) {
    const fileChar = files[f];
    for (let r = 1; r <= 8; r++) {
      const p = chess.get(fileChar + r);
      if (p && p.type === 'p' && p.color === color) {
        if ((color === 'w' && r > rank) || (color === 'b' && r < rank)) {
          hasAdvancedFriendlyAdjacent = true;
        }
      }
    }
  }
  if (!hasAdvancedFriendlyAdjacent) return false;
  
  const isDefendedByPawn = isSquareAttackedBy(chess, square, color);
  if (isDefendedByPawn) return false;
  
  const advanceSq = square[0] + (rank + dir);
  const opponentColor = color === 'w' ? 'b' : 'w';
  const isControlledByOpponent = isSquareAttackedBy(chess, advanceSq, opponentColor);
  const isControlledByUs = isSquareAttackedBy(chess, advanceSq, color);
  
  return isControlledByOpponent && !isControlledByUs;
}

// --- Category 7: Piece Activity Helpers ---
export function getRookFileStatus(chess, rookSq, color) {
  const fileChar = rookSq[0];
  let friendlyPawns = 0;
  let opponentPawns = 0;
  const opponentColor = color === 'w' ? 'b' : 'w';
  
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(fileChar + r);
    if (p && p.type === 'p') {
      if (p.color === color) friendlyPawns++;
      else opponentPawns++;
    }
  }
  return {
    isOpen: (friendlyPawns === 0 && opponentPawns === 0),
    isHalfOpen: (friendlyPawns === 0 && opponentPawns > 0)
  };
}

export function isKnightOutpost(chess, square, color) {
  const piece = chess.get(square);
  if (!piece || piece.type !== 'n') return false;
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const rank = parseInt(square[1]);
  
  if (color === 'w' && (rank < 4 || rank > 6)) return false;
  if (color === 'b' && (rank > 5 || rank < 3)) return false;
  
  let isDefendedByPawn = false;
  const adjacentFiles = [fileIdx - 1, fileIdx + 1].filter(f => f >= 0 && f < 8);
  const pawnSourceRank = color === 'w' ? rank - 1 : rank + 1;
  
  for (const f of adjacentFiles) {
    const fileChar = files[f];
    const p = chess.get(fileChar + pawnSourceRank);
    if (p && p.type === 'p' && p.color === color) {
      isDefendedByPawn = true;
      break;
    }
  }
  if (!isDefendedByPawn) return false;
  
  const opponentColor = color === 'w' ? 'b' : 'w';
  for (const f of adjacentFiles) {
    const fileChar = files[f];
    if (color === 'w') {
      for (let r = rank; r >= 1; r--) {
        const p = chess.get(fileChar + r);
        if (p && p.type === 'p' && p.color === opponentColor) {
          return false;
        }
      }
    } else {
      for (let r = rank; r <= 8; r++) {
        const p = chess.get(fileChar + r);
        if (p && p.type === 'p' && p.color === opponentColor) {
          return false;
        }
      }
    }
  }
  return true;
}

export function hasBishopPair(chess, color) {
  let bishops = 0;
  chess.board().forEach(row => {
    row.forEach(square => {
      if (square && square.type === 'b' && square.color === color) {
        bishops++;
      }
    });
  });
  return bishops >= 2;
}

export function areRooksConnected(chess, color) {
  const rookSquares = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = files[f] + (r + 1);
      const p = chess.get(sq);
      if (p && p.type === 'r' && p.color === color) {
        rookSquares.push(sq);
      }
    }
  }
  if (rookSquares.length < 2) return false;
  const attacks = getPieceAttacks(chess, rookSquares[0]);
  return attacks.includes(rookSquares[1]);
}

// --- Category 8: Positional Helpers ---
export function getCenterControlCount(chess, color) {
  let count = 0;
  const center = ['d4', 'd5', 'e4', 'e5'];
  center.forEach(sq => {
    if (isSquareAttackedBy(chess, sq, color)) {
      count++;
    }
  });
  return count;
}

// --- Category 11: Endgame Helpers ---
export function getKingActivityDistance(chess, color) {
  let kingSq = '';
  chess.board().forEach((row, r) => {
    row.forEach((sq, f) => {
      if (sq && sq.type === 'k' && sq.color === color) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        kingSq = files[f] + (8 - r);
      }
    });
  });
  if (!kingSq) return 0;
  const rank = parseInt(kingSq[1]);
  return color === 'w' ? rank - 1 : 8 - rank;
}

// --- Category 12: Draw & Rule Helpers ---
export function getFiftyMoveCounter(chess) {
  const parts = chess.fen().split(' ');
  return parts[4] !== undefined ? parseInt(parts[4]) : 0;
}

/**
 * Extracts Category 1-12 features from the position.
 */
export function extractFeatures(
  chessBefore, 
  chessAfter, 
  playedMove, 
  engineInfoBefore, 
  engineInfoAfter, 
  moveIdx, 
  headers = {}
) {
  const turnBefore = chessBefore.turn();
  const turnAfter = chessAfter.turn();
  const opponentColor = turnBefore === 'w' ? 'b' : 'w';
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  // --- Category 1: Engine Analysis Features ---
  const evaluationBeforeMove = normalizeEval(
    engineInfoBefore.evalScore !== undefined ? engineInfoBefore.evalScore : 0.3, 
    turnBefore
  );
  const evaluationAfterMove = normalizeEval(
    engineInfoAfter.evalScore !== undefined ? engineInfoAfter.evalScore : 0.3, 
    turnAfter
  );
  
  let centipawnLoss = 0;
  if (turnBefore === 'w') {
    centipawnLoss = Math.max(0, evaluationBeforeMove - evaluationAfterMove);
  } else {
    centipawnLoss = Math.max(0, evaluationAfterMove - evaluationBeforeMove);
  }
  
  const mateScoreBeforeMove = normalizeMateScore(engineInfoBefore.mateScore, turnBefore);
  const mateScoreAfterMove = normalizeMateScore(engineInfoAfter.mateScore, turnAfter);
  
  const bestMove = engineInfoBefore.bestMove || '';
  let bestMoveSan = '';
  if (bestMove && bestMove.length >= 4) {
    try {
      const tempChess = new Chess(chessBefore.fen());
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promo = bestMove.length > 4 ? bestMove[4] : undefined;
      const mObj = tempChess.move({ from, to, promotion: promo });
      if (mObj) bestMoveSan = mObj.san;
    } catch (e) {
      bestMoveSan = bestMove;
    }
  }
  
  const playedMoveSan = playedMove.san || '';
  const bestMoveEvaluation = evaluationBeforeMove;
  const playedMoveUci = playedMove.from + playedMove.to + (playedMove.promotion || '');
  
  let engineRankOfPlayedMove = (playedMoveUci === bestMove) ? 1 : 2;
  const multiPvLines = engineInfoBefore.multiPvLines || [];
  if (multiPvLines.length > 0) {
    const foundIdx = multiPvLines.findIndex(line => line.move === playedMoveUci);
    if (foundIdx !== -1) {
      engineRankOfPlayedMove = foundIdx + 1;
    }
  }
  
  const principalVariation = engineInfoBefore.pv ? engineInfoBefore.pv.split(' ') : [];
  const searchDepth = engineInfoBefore.depth !== undefined ? parseInt(engineInfoBefore.depth) : 10;
  const nodesSearched = engineInfoBefore.nodes !== undefined ? parseInt(engineInfoBefore.nodes) : 0;
  
  const legalMoves = chessBefore.moves();
  const onlyMove = legalMoves.length === 1;
  const bookMove = moveIdx < 8;
  const openingName = headers.Opening || headers.opening || null;
  const openingVariation = headers.Variation || headers.variation || null;
  const gamePhase = getGamePhase(chessBefore);
  
  // --- Category 2: Move Information Features ---
  const pieceMoved = playedMove.piece || '';
  const originSquare = playedMove.from || '';
  const destinationSquare = playedMove.to || '';
  const flags = playedMove.flags || '';
  const enPassant = flags.includes('e');
  const capture = playedMove.captured !== undefined || flags.includes('c') || enPassant;
  const capturedPiece = playedMove.captured || null;
  const check = chessAfter.in_check() || playedMoveSan.includes('+');
  const checkmate = chessAfter.in_checkmate() || playedMoveSan.includes('#');
  const promotion = playedMove.promotion !== undefined || flags.includes('p');
  const promotionPiece = playedMove.promotion || null;
  const kingsideCastle = flags.includes('k') || playedMoveSan === 'O-O';
  const queensideCastle = flags.includes('q') || playedMoveSan === 'O-O-O';
  
  // --- Category 3: Material Heuristics ---
  const materialBeforeMove = getBoardMaterial(chessBefore, turnBefore);
  const materialAfterMove = getBoardMaterial(chessAfter, turnBefore);
  const opponentMaterialBefore = getBoardMaterial(chessBefore, opponentColor);
  const opponentMaterialAfter = getBoardMaterial(chessAfter, opponentColor);
  
  const balanceBefore = materialBeforeMove - opponentMaterialBefore;
  const balanceAfter = materialAfterMove - opponentMaterialAfter;
  const materialDifference = balanceAfter - balanceBefore;
  
  const winsPawn = capturedPiece === 'p';
  const winsMinorPiece = ['n', 'b'].includes(capturedPiece);
  const winsRook = capturedPiece === 'r';
  const winsQueen = capturedPiece === 'q';
  
  const winsExchange = capturedPiece === 'r' && ['n', 'b'].includes(pieceMoved);
  const losesPawn = materialAfterMove < materialBeforeMove && !winsPawn;
  const losesMinorPiece = false;
  const losesRook = false;
  const losesQueen = false;
  
  let equalTrade = false;
  let favorableTrade = false;
  let unfavorableTrade = false;
  
  const destination = playedMove.to;
  const opponentRecaptures = chessAfter.moves({ verbose: true }).filter(m => m.to === destination && (m.captured || m.flags.includes('c')));
  const isTraded = capture && opponentRecaptures.length > 0;
  
  if (isTraded) {
    const movedVal = getPieceValue(pieceMoved);
    const capturedVal = getPieceValue(capturedPiece);
    const diff = capturedVal - movedVal;
    
    if (diff === 0) equalTrade = true;
    else if (diff > 0) favorableTrade = true;
    else unfavorableTrade = true;
  }
  
  let sacrifice = false;
  const opponentBestMove = engineInfoAfter.bestMove;
  let opponentCapturedPiece = null;
  if (opponentBestMove && opponentBestMove.length >= 4) {
    const oppToSq = opponentBestMove.slice(2, 4);
    const oppPieceOnTo = chessAfter.get(oppToSq);
    if (oppPieceOnTo && oppPieceOnTo.color === turnBefore) {
      opponentCapturedPiece = oppPieceOnTo.type;
    }
  }
  
  if (capture && opponentCapturedPiece === pieceMoved) {
    const movedVal = getPieceValue(pieceMoved);
    const capturedVal = getPieceValue(capturedPiece);
    if (capturedVal < movedVal) {
      sacrifice = true;
    }
  } else if (!capture && opponentCapturedPiece === pieceMoved) {
    sacrifice = true;
  }
  
  let temporarySacrifice = false;
  let permanentSacrifice = false;
  if (sacrifice) {
    if (centipawnLoss <= 0.5) {
      temporarySacrifice = true;
    } else {
      permanentSacrifice = true;
    }
  }
  
  // --- Category 4: Tactical Motifs ---
  const createdFork = detectFork(chessAfter, playedMove.to);
  const createdPin = detectPin(chessAfter, playedMove.to);
  const createdSkewer = detectSkewer(chessAfter, playedMove.to);
  const createdBattery = detectBattery(chessAfter, playedMove.to);
  const createdDiscoveredAttack = detectDiscoveredAttack(chessBefore, chessAfter, playedMove);
  const createdDiscoveredCheck = check && createdDiscoveredAttack;
  
  const isDoubleCheck = check && playedMoveSan.includes('+') && playedMoveSan.includes('++');
  const createdDoubleCheck = isDoubleCheck || (check && createdDiscoveredAttack && isSquareAttackedBy(chessAfter, chessAfter.board().find(row => row.find(s => s && s.type === 'k' && s.color === opponentColor)) ? 'e1' : 'e8', turnBefore));
  
  let allowedFork = false;
  let allowedPin = false;
  let allowedSkewer = false;
  let allowedBattery = false;
  
  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = files[f] + (r + 1);
      const piece = chessAfter.get(sq);
      if (piece && piece.color === opponentColor) {
        if (detectFork(chessAfter, sq)) allowedFork = true;
        if (detectPin(chessAfter, sq)) allowedPin = true;
        if (detectSkewer(chessAfter, sq)) allowedSkewer = true;
        if (detectBattery(chessAfter, sq)) allowedBattery = true;
      }
    }
  }
  
  const opponentHangingBefore = getHangingPieces(chessBefore, opponentColor);
  const opponentHangingAfter = getHangingPieces(chessAfter, opponentColor);
  const myHangingBefore = getHangingPieces(chessBefore, turnBefore);
  const myHangingAfter = getHangingPieces(chessAfter, turnBefore);
  
  const hangingPiece = opponentHangingAfter.length > 0;
  const createdHangingPiece = myHangingAfter.some(sq => !myHangingBefore.includes(sq));
  const savedHangingPiece = myHangingBefore.length > 0 && myHangingAfter.length < myHangingBefore.length;
  
  const forcedMove = onlyMove;
  const forcedMate = mateScoreBeforeMove !== null && (turnBefore === 'w' ? mateScoreBeforeMove > 0 : mateScoreBeforeMove < 0);
  const mateThreat = mateScoreAfterMove !== null && (turnBefore === 'w' ? mateScoreAfterMove > 0 : mateScoreAfterMove < 0);
  const allowedMateThreat = mateScoreAfterMove !== null && (turnBefore === 'w' ? mateScoreAfterMove < 0 : mateScoreAfterMove > 0);
  
  // --- Category 5: King Safety ---
  const castlingStatus = getCastlingStatus(chessBefore, turnBefore);
  
  let createdLuft = false;
  if (pieceMoved === 'p') {
    if (turnBefore === 'w') {
      const isKingOnKingside = chessBefore.get('g1') && chessBefore.get('g1').type === 'k';
      if (isKingOnKingside && originSquare[0] === 'h' && destinationSquare === 'h3') createdLuft = true;
      if (isKingOnKingside && originSquare[0] === 'g' && destinationSquare === 'g3') createdLuft = true;
      if (isKingOnKingside && originSquare[0] === 'f' && destinationSquare === 'f3') createdLuft = true;
      
      const isKingOnQueenside = chessBefore.get('c1') && chessBefore.get('c1').type === 'k';
      if (isKingOnQueenside && originSquare[0] === 'a' && destinationSquare === 'a3') createdLuft = true;
      if (isKingOnQueenside && originSquare[0] === 'b' && destinationSquare === 'b3') createdLuft = true;
      if (isKingOnQueenside && originSquare[0] === 'd' && destinationSquare === 'd3') createdLuft = true;
    } else {
      const isKingOnKingside = chessBefore.get('g8') && chessBefore.get('g8').type === 'k';
      if (isKingOnKingside && originSquare[0] === 'h' && destinationSquare === 'h6') createdLuft = true;
      if (isKingOnKingside && originSquare[0] === 'g' && destinationSquare === 'g6') createdLuft = true;
      if (isKingOnKingside && originSquare[0] === 'f' && destinationSquare === 'f6') createdLuft = true;
      
      const isKingOnQueenside = chessBefore.get('c8') && chessBefore.get('c8').type === 'k';
      if (isKingOnQueenside && originSquare[0] === 'a' && destinationSquare === 'a6') createdLuft = true;
      if (isKingOnQueenside && originSquare[0] === 'b' && destinationSquare === 'b6') createdLuft = true;
      if (isKingOnQueenside && originSquare[0] === 'd' && destinationSquare === 'd6') createdLuft = true;
    }
  }
  
  const openedKingFile = !isKingFileOpen(chessBefore, turnBefore) && isKingFileOpen(chessAfter, turnBefore);
  
  let openedKingDiagonal = false;
  if (pieceMoved === 'p') {
    let kingSq = '';
    chessBefore.board().forEach((row, r) => {
      row.forEach((sq, f) => {
        if (sq && sq.type === 'k' && sq.color === turnBefore) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          kingSq = files[f] + (8 - r);
        }
      });
    });
    if (kingSq) {
      const kf = files.indexOf(kingSq[0]);
      const kr = parseInt(kingSq[1]) - 1;
      const pf = files.indexOf(originSquare[0]);
      const pr = parseInt(originSquare[1]) - 1;
      if (Math.abs(kf - pf) === Math.abs(kr - pr)) {
        openedKingDiagonal = true;
      }
    }
  }
  
  const beforeSafety = getKingSafetyMetrics(chessBefore, turnBefore);
  const afterSafety = getKingSafetyMetrics(chessAfter, turnBefore);
  const numberOfAttackersAroundKing = afterSafety.attackers;
  const numberOfDefendersAroundKing = afterSafety.defenders;
  const kingSafetyScore = afterSafety.safetyScore;
  const increasedKingExposure = afterSafety.safetyScore < beforeSafety.safetyScore;
  const reducedKingExposure = afterSafety.safetyScore > beforeSafety.safetyScore;
  
  // --- Category 6: Pawn Structure ---
  const createdPassedPawn = !isPassedPawn(chessBefore, originSquare, turnBefore) && isPassedPawn(chessAfter, destinationSquare, turnBefore);
  const isolatedPawn = isIsolatedPawn(chessAfter, destinationSquare, turnBefore);
  const doubledPawns = hasDoubledPawns(chessAfter, destinationSquare[0], turnBefore);
  const backwardPawn = isBackwardPawn(chessAfter, destinationSquare, turnBefore);
  const pawnChain = pieceMoved === 'p' && isSquareAttackedBy(chessAfter, destinationSquare, turnBefore);
  const pawnBreak = pieceMoved === 'p' && getPieceAttacks(chessAfter, destinationSquare).some(sq => {
    const p = chessAfter.get(sq);
    return p && p.type === 'p' && p.color === opponentColor;
  });
  
  // --- Category 7: Piece Activity ---
  let rookOnOpenFile = false;
  let rookOnHalfOpenFile = false;
  if (pieceMoved === 'r') {
    const status = getRookFileStatus(chessAfter, destinationSquare, turnBefore);
    rookOnOpenFile = status.isOpen;
    rookOnHalfOpenFile = status.isHalfOpen;
  }
  const rookOnSeventhRank = pieceMoved === 'r' && (
    (turnBefore === 'w' && destinationSquare[1] === '7') ||
    (turnBefore === 'b' && destinationSquare[1] === '2')
  );
  const knightOutpost = isKnightOutpost(chessAfter, destinationSquare, turnBefore);
  const bishopPair = hasBishopPair(chessAfter, turnBefore);
  const connectedRooks = areRooksConnected(chessAfter, turnBefore);
  const centralizedPiece = ['d4', 'd5', 'e4', 'e5'].includes(destinationSquare) && ['n', 'b', 'q'].includes(pieceMoved);
  
  // --- Category 8: Positional Features ---
  const beforeCenterControl = getCenterControlCount(chessBefore, turnBefore);
  const afterCenterControl = getCenterControlCount(chessAfter, turnBefore);
  const increasedCenterControl = afterCenterControl > beforeCenterControl;
  const lostCenterControl = afterCenterControl < beforeCenterControl;
  const simplifiedPosition = capture && getPieceValue(capturedPiece) >= 3;
  
  // --- Category 9: Threat Detection ---
  const threatensMate = mateThreat;
  let threatensQueen = false;
  let threatensRook = false;
  let threatensMinorPiece = false;
  let threatensPawn = false;
  
  const attackedAfter = getPieceAttacks(chessAfter, destinationSquare);
  attackedAfter.forEach(sq => {
    const p = chessAfter.get(sq);
    if (p && p.color === opponentColor) {
      const wasAttackedBefore = isSquareAttackedBy(chessBefore, sq, turnBefore);
      if (!wasAttackedBefore) {
        if (p.type === 'q') threatensQueen = true;
        else if (p.type === 'r') threatensRook = true;
        else if (p.type === 'n' || p.type === 'b') threatensMinorPiece = true;
        else if (p.type === 'p') threatensPawn = true;
      }
    }
  });
  
  const threatsCount = (threatensQueen ? 1 : 0) + (threatensRook ? 1 : 0) + (threatensMinorPiece ? 1 : 0) + (threatensPawn ? 1 : 0) + (createdFork ? 1 : 0);
  const multipleSimultaneousThreats = threatsCount >= 2 || createdFork;
  
  // --- Category 10: Move Difficulty ---
  const quietMove = !check && !capture && !threatensQueen && !threatensRook && !threatensMinorPiece;
  const forcingMove = check || capture || mateThreat;
  const criticalMove = (mateScoreBeforeMove !== null) || (evaluationBeforeMove >= 1.5 && centipawnLoss > 1.0);
  const evaluationSwing = Math.abs(evaluationAfterMove - evaluationBeforeMove);
  
  // --- Category 11: Endgame Features ---
  const endgameDetected = gamePhase === 'endgame';
  const kingActivity = getKingActivityDistance(chessAfter, turnBefore);
  
  // Zugzwang detection: when any move by the opponent would worsen their evaluation
  // Simple heuristic: opponent only has a few legal moves and their best move still drops evaluation
  const opponentLegalMoves = chessAfter.moves();
  const zugzwang = opponentLegalMoves.length <= 5 && (
    turnBefore === 'w' ? evaluationAfterMove < evaluationBeforeMove - 0.5 : evaluationAfterMove > evaluationBeforeMove + 0.5
  );
  
  // --- Category 12: Draw & Rule Features ---
  const stalemate = chessAfter.in_stalemate();
  const insufficientMaterial = chessAfter.insufficient_material();
  const threefoldRepetitionAvailable = chessAfter.in_threefold_repetition();
  const fiftyMoveRuleCounter = getFiftyMoveCounter(chessAfter);
  const drawByRepetition = threefoldRepetitionAvailable;
  
  return {
    // Category 1
    evaluationBeforeMove,
    evaluationAfterMove,
    centipawnLoss,
    mateScoreBeforeMove,
    mateScoreAfterMove,
    bestMove,
    bestMoveSan,
    playedMoveSan,
    engineRankOfPlayedMove,
    bestMoveEvaluation,
    principalVariation,
    multiPvLines,
    searchDepth,
    nodesSearched,
    onlyMove,
    bookMove,
    openingName,
    openingVariation,
    gamePhase,
    
    // Category 2
    pieceMoved,
    originSquare,
    destinationSquare,
    capture,
    capturedPiece,
    check,
    checkmate,
    promotion,
    promotionPiece,
    kingsideCastle,
    queensideCastle,
    enPassant,
    
    // Category 3
    materialBeforeMove,
    materialAfterMove,
    materialDifference,
    winsPawn,
    winsMinorPiece,
    winsRook,
    winsQueen,
    winsExchange,
    losesPawn,
    losesMinorPiece,
    losesRook,
    losesQueen,
    sacrifice,
    temporarySacrifice,
    permanentSacrifice,
    equalTrade,
    favorableTrade,
    unfavorableTrade,
    
    // Category 4
    createdFork,
    allowedFork,
    createdPin,
    allowedPin,
    createdSkewer,
    allowedSkewer,
    createdBattery,
    allowedBattery,
    createdDiscoveredAttack,
    createdDiscoveredCheck,
    createdDoubleCheck,
    hangingPiece,
    createdHangingPiece,
    savedHangingPiece,
    forcedMove,
    forcedMate,
    mateThreat,
    allowedMateThreat,
    
    // Category 5
    castlingStatus,
    createdLuft,
    openedKingFile,
    openedKingDiagonal,
    numberOfAttackersAroundKing,
    numberOfDefendersAroundKing,
    kingSafetyScore,
    increasedKingExposure,
    reducedKingExposure,
    
    // Category 6
    createdPassedPawn,
    isolatedPawn,
    doubledPawns,
    backwardPawn,
    pawnChain,
    pawnBreak,
    
    // Category 7
    rookOnOpenFile,
    rookOnHalfOpenFile,
    rookOnSeventhRank,
    knightOutpost,
    bishopPair,
    connectedRooks,
    centralizedPiece,
    
    // Category 8
    increasedCenterControl,
    lostCenterControl,
    simplifiedPosition,
    
    // Category 9
    threatensMate,
    threatensQueen,
    threatensRook,
    threatensMinorPiece,
    threatensPawn,
    multipleSimultaneousThreats,
    
    // Category 10
    quietMove,
    forcingMove,
    criticalMove,
    evaluationSwing,
    
    // Category 11
    endgameDetected,
    kingActivity,
    zugzwang,
    
    // Category 12
    stalemate,
    insufficientMaterial,
    threefoldRepetitionAvailable,
    fiftyMoveRuleCounter,
    drawByRepetition,
    
    // Custom context
    playerColor: turnBefore
  };
}
