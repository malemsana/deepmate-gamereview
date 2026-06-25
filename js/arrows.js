import { state } from './state.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Get coordinate center of a square on a 100x100 viewBox
function getSquareCenter(square) {
  const file = square[0];
  const rank = parseInt(square[1]);
  
  const fileIdx = FILES.indexOf(file);
  const rankIdx = 8 - rank; // top is 0, bottom is 7
  
  const squareSize = 12.5; // 100 / 8
  
  return {
    x: (fileIdx + 0.5) * squareSize,
    y: (rankIdx + 0.5) * squareSize
  };
}

// Detect if a move is a Knight move
function isKnightMove(from, to) {
  const dx = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const dy = Math.abs(from.charCodeAt(1) - to.charCodeAt(1));
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

// Renders a suggestion arrow on the board
export function drawMoveArrow(fromSquare, toSquare, isManual = false) {
  const svg = document.getElementById('board-arrows');
  if (!svg) return;
  
  const start = getSquareCenter(fromSquare);
  const end = getSquareCenter(toSquare);
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const offset = 2.5; // Offset to terminate arrowhead slightly before piece center
  
  let d = "";
  if (isKnightMove(fromSquare, toSquare)) {
    const dx = Math.abs(fromSquare.charCodeAt(0) - toSquare.charCodeAt(0));
    const dy = Math.abs(fromSquare.charCodeAt(1) - toSquare.charCodeAt(1));
    
    let cornerX, cornerY;
    let endX = end.x;
    let endY = end.y;
    
    if (dx > dy) {
      // Go horizontally first, then vertically
      cornerX = end.x;
      cornerY = start.y;
      if (end.y > start.y) {
        endY = end.y - offset;
      } else {
        endY = end.y + offset;
      }
    } else {
      // Go vertically first, then horizontally
      cornerX = start.x;
      cornerY = end.y;
      if (end.x > start.x) {
        endX = end.x - offset;
      } else {
        endX = end.x + offset;
      }
    }
    d = `M ${start.x} ${start.y} L ${cornerX} ${cornerY} L ${endX} ${endY}`;
  } else {
    // Straight line path
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    let endX = end.x;
    let endY = end.y;
    if (len > 0) {
      endX = end.x - (dx / len) * offset;
      endY = end.y - (dy / len) * offset;
    }
    d = `M ${start.x} ${start.y} L ${endX} ${endY}`;
  }
  
  const strokeColor = isManual ? 'rgba(240, 160, 50, 0.72)' : 'rgba(118, 179, 93, 0.72)';
  const markerId = isManual ? 'arrowhead-orange' : 'arrowhead-green';
  
  path.setAttribute('d', d);
  path.setAttribute('stroke', strokeColor);
  path.setAttribute('stroke-width', '1.8'); // Sleeker proportional width (1.8% of viewBox)
  path.setAttribute('fill', 'none');
  path.setAttribute('marker-end', `url(#${markerId})`);
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('class', 'board-suggestion-arrow');
  
  svg.appendChild(path);
}

// Clears suggestion arrows
export function clearArrows() {
  const svg = document.getElementById('board-arrows');
  if (!svg) return;
  const paths = svg.querySelectorAll('.board-suggestion-arrow');
  paths.forEach(p => p.remove());
}
