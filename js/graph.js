import { state } from './state.js';
import { jumpToMove } from './ui.js';

// Draw Board evaluation graph
export function drawEvaluationGraph() {
  const graphContainer = document.getElementById('graph-container');
  const graphLine = document.getElementById('graph-line');
  const graphFill = document.getElementById('graph-fill');
  
  if (!graphContainer || !graphLine || !graphFill) return;
  if (state.reviewData.evals.length === 0) return;
  
  const width = graphContainer.clientWidth;
  const height = 45;
  const points = [];
  const totalMoves = state.reviewData.evals.length;
  
  for (let i = 0; i < totalMoves; i++) {
    const score = state.reviewData.evals[i];
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

// Graph Mouse Hover Position
export function handleGraphHover(e) {
  const graphSvg = document.getElementById('graph-svg');
  const graphHoverCursor = document.getElementById('graph-hover-cursor');
  if (!graphSvg || !graphHoverCursor) return;
  
  const rect = graphSvg.getBoundingClientRect();
  const hoverX = e.clientX - rect.left;
  const width = rect.width;
  const totalMoves = state.reviewData.evals.length;
  
  const moveIdx = Math.round((hoverX / width) * (totalMoves - 1)) - 1;
  const clampedIdx = Math.max(-1, Math.min(state.gameHistory.length - 1, moveIdx));
  
  const cursorX = ((clampedIdx + 1) / (totalMoves - 1)) * width;
  graphHoverCursor.setAttribute('x1', cursorX);
  graphHoverCursor.setAttribute('x2', cursorX);
  graphHoverCursor.style.display = 'block';
}

// Graph Click Navigation
export function handleGraphClick(e) {
  const graphSvg = document.getElementById('graph-svg');
  if (!graphSvg) return;
  
  const rect = graphSvg.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const totalMoves = state.reviewData.evals.length;
  
  const moveIdx = Math.round((clickX / width) * (totalMoves - 1)) - 1;
  const clampedIdx = Math.max(-1, Math.min(state.gameHistory.length - 1, moveIdx));
  jumpToMove(clampedIdx);
}

// Update Active Cursor
export function updateGraphCursorPosition() {
  const graphContainer = document.getElementById('graph-container');
  const graphCursor = document.getElementById('graph-cursor');
  const graphMoveIndicator = document.getElementById('graph-move-indicator');
  
  if (!graphContainer || !graphCursor || !graphMoveIndicator) return;
  
  const width = graphContainer.clientWidth;
  const totalMoves = state.reviewData.evals.length;
  if (totalMoves <= 1) return;
  
  const cursorX = ((state.currentMoveIdx + 1) / (totalMoves - 1)) * width;
  graphCursor.setAttribute('x1', cursorX);
  graphCursor.setAttribute('x2', cursorX);
  graphCursor.style.display = 'block';
  
  graphMoveIndicator.innerText = state.currentMoveIdx === -1 ? "Start" : `Move ${Math.floor(state.currentMoveIdx / 2) + 1} ${state.currentMoveIdx % 2 === 0 ? 'White' : 'Black'}`;
}
