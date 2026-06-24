import { state } from './state.js';

export function getPieceValue(code) {
  if (!code) return 0;
  const c = code.toLowerCase();
  if (c === 'p') return 1;
  if (c === 'n' || c === 'b') return 3;
  if (c === 'r') return 5;
  if (c === 'q') return 9;
  return 0;
}

export function countPieces(chessObj) {
  let count = 0;
  chessObj.board().forEach(row => {
    row.forEach(square => {
      if (square) count++;
    });
  });
  return count;
}

export function classifyMove(features) {
  const {
    evaluationBeforeMove,
    evaluationAfterMove,
    centipawnLoss,
    engineRankOfPlayedMove,
    onlyMove,
    bookMove,
    sacrifice,
    temporarySacrifice,
    permanentSacrifice,
    createdFork,
    createdPin,
    createdSkewer,
    createdBattery,
    createdDiscoveredAttack,
    hangingPiece,
    createdHangingPiece,
    savedHangingPiece,
    forcedMove,
    forcedMate,
    mateThreat,
    mateScoreBeforeMove,
    mateScoreAfterMove,
    playerColor,
    criticalMove
  } = features;

  // 1. Book Moves
  if (bookMove) {
    return 'book';
  }

  // 2. Forced Moves
  if (forcedMove) {
    return 'forced';
  }

  // Helper flags
  const isPlayerWhite = (playerColor === 'w');
  
  // Winning threshold
  const wasWinning = isPlayerWhite ? (evaluationBeforeMove >= 2.5) : (evaluationBeforeMove <= -2.5);
  const isStillWinning = isPlayerWhite ? (evaluationAfterMove >= 1.0) : (evaluationAfterMove <= -1.0);
  
  // Drawing/Equal threshold
  const wasEqual = isPlayerWhite ? (evaluationBeforeMove > -1.0 && evaluationBeforeMove < 2.5) : (evaluationBeforeMove < 1.0 && evaluationBeforeMove > -2.5);
  const isLost = isPlayerWhite ? (evaluationAfterMove < -1.8) : (evaluationAfterMove > 1.8);

  // 3. Missed Win: The player was winning, but played a move that dropped the win, and they did not play the best move.
  if (wasWinning && !isStillWinning && centipawnLoss >= 1.0 && engineRankOfPlayedMove > 1) {
    return 'missed_win';
  }

  // 4. Missed Draw: The player was equal, but played a move that leads to a lost position, missing the draw.
  if (wasEqual && isLost && centipawnLoss >= 1.2 && engineRankOfPlayedMove > 1) {
    return 'missed_draw';
  }

  // 5. Brilliant Sacrifice: Played best move (rank 1), and played a successful sacrifice.
  if (engineRankOfPlayedMove === 1 && sacrifice && temporarySacrifice) {
    return 'brilliant';
  }

  // 6. Great Move: Played best move (rank 1), and was a critical choice or created a major threat/pin/fork.
  if (engineRankOfPlayedMove === 1) {
    const createdMotif = createdFork || createdPin || createdSkewer || createdBattery || createdDiscoveredAttack;
    if (criticalMove || onlyMove || createdMotif) {
      return 'great';
    }
  }

  // 7. Miss: The opponent blundered or had a hanging piece, and we failed to punish/capture it, or missed a forced mate.
  if (centipawnLoss >= 0.8 && engineRankOfPlayedMove > 1) {
    if (hangingPiece || mateThreat || forcedMate) {
      return 'miss';
    }
  }

  // 8. Default engine-based classifications based on centipawn loss:
  if (engineRankOfPlayedMove === 1 || centipawnLoss <= 0.05) {
    return 'best';
  }
  if (centipawnLoss <= 0.15) {
    return 'excellent';
  }
  if (centipawnLoss <= 0.40) {
    return 'good';
  }
  if (centipawnLoss <= 0.90) {
    return 'inaccuracy';
  }
  if (centipawnLoss <= 2.00) {
    return 'mistake';
  }
  return 'blunder';
}

export function formatBestMoveNotation(coordStr, moveIdx, chessBefore) {
  if (!coordStr || coordStr.length < 4) return 'another line';
  try {
    const fen = chessBefore ? chessBefore.fen() : (state.analysisQueue && state.analysisQueue[moveIdx] ? state.analysisQueue[moveIdx].fen : null);
    if (!fen) return coordStr;
    const tempChess = new Chess(fen);
    const from = coordStr.slice(0, 2);
    const to = coordStr.slice(2, 4);
    const promo = coordStr.length > 4 ? coordStr[4] : undefined;
    const moveObj = tempChess.move({ from, to, promotion: promo });
    return moveObj ? moveObj.san : coordStr;
  } catch (e) {
    return coordStr;
  }
}

export function calculateAccuracies() {
  let whiteSum = 0, whiteCount = 0;
  let blackSum = 0, blackCount = 0;
  
  const classWeights = {
    brilliant: 100, great: 100, best: 100, excellent: 95, good: 85, book: 100,
    forced: 100, inaccuracy: 60, mistake: 30, blunder: 0, miss: 20, missed_win: 10, missed_draw: 30
  };
  
  for (let i = 0; i < state.gameHistory.length; i++) {
    const move = state.gameHistory[i];
    const type = state.reviewData.classifications[i];
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
  
  state.reviewData.accuracies.white = whiteCount > 0 ? Math.round(whiteSum / whiteCount) : 100;
  state.reviewData.accuracies.black = blackCount > 0 ? Math.round(blackSum / blackCount) : 100;
}

function getRandomTemplate(templates) {
  if (!templates || templates.length === 0) return "";
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx];
}

export function generateCoachComment(move, type, bestMoveStr, moveIdx, features, chessBefore) {
  const san = move.san;
  const bestSan = formatBestMoveNotation(bestMoveStr, moveIdx, chessBefore);
  
  // 1. If features is missing (e.g. simulated or fallback), use basic template variations
  if (!features) {
    const fallbackTemplates = {
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
        `That was a mistake. You gave away some of your advantage. Better was ${bestSan}.`,
        `${san} is a mistake! It weakens your position and allows the opponent back in. Better was ${bestSan}.`
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
        `Missed win! You let a winning advantage slip away. Better was ${bestSan}.`,
        `You let a winning advantage slip away with ${san}. Better was ${bestSan}.`
      ],
      missed_draw: [
        `Missed draw! You could have secured a draw with ${bestSan}, but ${san} leaves you lost.`,
        `A tragic miss! ${san} throws away a drawing resource. Better was ${bestSan}.`
      ]
    };
    const list = fallbackTemplates[type] || [`${san} was played.`];
    return getRandomTemplate(list);
  }

  // 2. Synthesize narrative using rich template variations
  const introTemplates = {
    brilliant: [
      features.sacrifice 
        ? "Brilliant! You sacrificed material to gain a decisive advantage." 
        : "Brilliant! An exceptional move that turns the tide of the game.",
      features.sacrifice
        ? "Spectacular move! This sacrifice completely changes the dynamics of the game."
        : "Amazing! You found a brilliant path that completely turns the game around."
    ],
    great: [
      "Great move! This was a very precise choice that keeps the pressure on.",
      "Very precise! You found a great path to maintain your advantage.",
      "Great move! A very strong choice that keeps the opponent on their toes."
    ],
    best: [
      "This is the best move. You found the top engine recommendation here.",
      "Excellent find! You matched the top Stockfish choice.",
      "Perfect! This is the most accurate move in this position."
    ],
    excellent: [
      "Excellent move. You played a very strong move that maintains your position.",
      "Really good play. You kept the game well in your favor.",
      "Excellent find! This maintains a very comfortable position."
    ],
    good: [
      "This is a good, solid move that keeps the game stable.",
      "A decent move, maintaining a stable layout.",
      "Good choice. This piece is now better positioned."
    ],
    book: [
      "This is standard opening theory, following established master games.",
      "A well-known book line, establishing early control.",
      "This move follows standard opening book theory."
    ],
    forced: [
      "This was a forced move. You had no other legal options.",
      "This was the only move you could make in this position.",
      "Forced! You had only one legal move available."
    ],
    inaccuracy: [
      "This is an inaccuracy. You gave up some of your edge.",
      "Slightly off. You had a more precise way to proceed.",
      "An inaccuracy. You let some of your advantage slip away."
    ],
    mistake: [
      "That's a mistake. Your position becomes weaker after this move.",
      "A mistake! This weakens your position and allows the opponent back in.",
      "This is a mistake, giving away some of your advantage."
    ],
    blunder: [
      "Oh no! That is a blunder. You completely gave away the position.",
      "A critical blunder! You left yourself in a losing position.",
      "Oh no, a major blunder! This completely throws away the game."
    ],
    miss: [
      "You missed a great tactical opportunity here.",
      "Missed chance! You could have punished your opponent's play.",
      "A missed opportunity. You had a much stronger option available."
    ],
    missed_win: [
      "Missed win! You let a winning advantage slip away.",
      "You had a clear winning sequence but missed it.",
      "A missed opportunity to seal the victory."
    ],
    missed_draw: [
      "Missed draw! You missed a crucial saving resource that could have held the draw.",
      "A tragic miss! You threw away a drawing resource.",
      "You had a drawing line here but missed it."
    ]
  };

  const intro = getRandomTemplate(introTemplates[type] || ["Move played."]);

  let facts = [];
  
  if (features.checkmate) {
    facts.push(getRandomTemplate([
      "It results in checkmate.",
      "Delivering checkmate and winning the game!",
      "A beautiful checkmate finish."
    ]));
  } else if (features.check) {
    facts.push(getRandomTemplate([
      "This puts the opponent's king in check.",
      "Checking the enemy king.",
      "This move attacks the enemy king directly."
    ]));
  }
  
  if (features.createdFork) {
    facts.push(getRandomTemplate([
      "This forks the opponent's pieces.",
      "This move forks multiple targets.",
      "Your piece creates a double attack (fork) on the enemy."
    ]));
  }
  if (features.createdPin) {
    facts.push(getRandomTemplate([
      "This pins an opponent's piece, restricting its movement.",
      "Creating a pin to restrict their piece's mobility.",
      "This pins a defender, making it difficult for your opponent to coordinate."
    ]));
  }
  if (features.createdSkewer) {
    facts.push(getRandomTemplate([
      "This skewers the opponent's pieces.",
      "A nice skewer, forcing their high-value piece away.",
      "This skewers their defense, winning material."
    ]));
  }
  if (features.createdBattery) {
    facts.push(getRandomTemplate([
      "This forms a battery targeting key squares.",
      "You've lined up a battery to double your pressure.",
      "Setting up a powerful battery on the line."
    ]));
  }
  if (features.createdDiscoveredAttack) {
    facts.push(getRandomTemplate([
      "This unleashes a discovered attack.",
      "Your move opens up a discovered attack.",
      "This activates a discovered threat against their position."
    ]));
  }
  if (features.createdPassedPawn) {
    facts.push(getRandomTemplate([
      "You've created a passed pawn.",
      "A passed pawn is born, which could be dangerous later.",
      "This successfully creates a passed pawn."
    ]));
  }
  if (features.knightOutpost) {
    facts.push(getRandomTemplate([
      "Your knight finds a strong outpost square.",
      "Placing the knight on a dominant outpost square.",
      "This establishes a powerful outpost for your knight."
    ]));
  }
  if (features.rookOnSeventhRank) {
    facts.push(getRandomTemplate([
      "This activates your rook on the seventh rank.",
      "Your rook invades the seventh rank, putting pressure on the enemy camp.",
      "Getting the rook on the seventh rank is a classic attacking idea."
    ]));
  } else if (features.rookOnOpenFile) {
    facts.push(getRandomTemplate([
      "This places your rook on an open file.",
      "Activating the rook along the open file.",
      "Your rook takes control of the open file."
    ]));
  } else if (features.rookOnHalfOpenFile) {
    facts.push(getRandomTemplate([
      "This places your rook on a half-open file.",
      "Getting the rook onto a half-open file.",
      "Placing the rook on a semi-open file."
    ]));
  }
  
  if (features.winsQueen) {
    facts.push(getRandomTemplate([
      "You win the opponent's queen!",
      "You win their queen!",
      "Winning the enemy queen!"
    ]));
  } else if (features.winsRook) {
    facts.push(getRandomTemplate([
      "You win a rook.",
      "Winning a rook.",
      "This wins a rook for you."
    ]));
  } else if (features.winsMinorPiece) {
    facts.push(getRandomTemplate([
      "You win a minor piece.",
      "Winning a minor piece.",
      "You walk away with a minor piece."
    ]));
  } else if (features.winsExchange) {
    facts.push(getRandomTemplate([
      "You win the exchange.",
      "Winning the exchange.",
      "This wins the exchange."
    ]));
  } else if (features.winsPawn) {
    facts.push(getRandomTemplate([
      "You win a pawn.",
      "Winning a pawn.",
      "You grab a pawn."
    ]));
  }
  
  if (features.threatensMate) {
    facts.push(getRandomTemplate([
      "This creates a checkmate threat.",
      "Threatening a direct checkmate.",
      "This move sets up a mate threat."
    ]));
  }
  if (features.threatensQueen) {
    facts.push(getRandomTemplate([
      "This threatens the opponent's queen.",
      "Targeting their queen with this move.",
      "This threatens the enemy queen."
    ]));
  }
  
  if (features.savedHangingPiece) {
    facts.push(getRandomTemplate([
      "This defends your hanging piece.",
      "Saving your hanging piece from capture.",
      "You successfully protect your loose piece."
    ]));
  }
  if (features.createdHangingPiece) {
    facts.push(getRandomTemplate([
      "Be careful, this leaves a piece hanging.",
      "This leaves a piece hanging.",
      "Watch out, you left a piece undefended."
    ]));
  }
  
  if (features.createdLuft) {
    facts.push(getRandomTemplate([
      "This creates breathing room (luft) for your king.",
      "Creating luft for the king to prevent back-rank mates.",
      "This gives your king a flight square (luft)."
    ]));
  }
  if (features.reducedKingExposure) {
    facts.push(getRandomTemplate([
      "This improves your king safety.",
      "Your king is now safer.",
      "Improving your king's security."
    ]));
  } else if (features.increasedKingExposure) {
    facts.push(getRandomTemplate([
      "This leaves your king exposed.",
      "Your king becomes more vulnerable.",
      "This opens up lines around your king."
    ]));
  }
  
  if (features.castlingStatus === 'castled' && (move.san === 'O-O' || move.san === 'O-O-O')) {
    facts.push(getRandomTemplate([
      "This castles your king to safety.",
      "You castled your king to safety.",
      "Getting the king out of the center and to safety."
    ]));
  }

  if (features.insufficientMaterial) {
    facts.push("The game ends in a draw due to insufficient material.");
  } else if (features.stalemate) {
    facts.push("The game ends in a stalemate.");
  } else if (features.drawByRepetition) {
    facts.push("The game ends in a draw by threefold repetition.");
  }

  if (type === 'book' && features.openingName) {
    facts.push(`You are playing the ${features.openingName}${features.openingVariation ? ', ' + features.openingVariation : ''}.`);
  }

  let factText = "";
  if (facts.length > 0) {
    factText = " " + facts.slice(0, 2).join(" ");
  }

  // 3. Append alternative suggestion for suboptimal moves
  let alternative = "";
  if (features.engineRankOfPlayedMove > 1 && bestMoveStr) {
    alternative = " " + getRandomTemplate([
      `Better was ${bestSan}.`,
      `Instead, you should have played ${bestSan}.`,
      `You had a better line with ${bestSan}.`,
      `Finding ${bestSan} would have been a superior option.`
    ]);
  }

  return intro + factText + alternative;
}
