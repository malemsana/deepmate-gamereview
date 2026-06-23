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

export function formatBestMoveNotation(coordStr, moveIdx) {
  if (!coordStr || coordStr.length < 4) return 'another line';
  try {
    const tempChess = new Chess(state.analysisQueue[moveIdx].fen);
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

export function generateCoachComment(move, type, bestMoveStr, moveIdx) {
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
      `That was a mistake. You gave away some of your advantage. ${bestSan} was superior.`,
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
