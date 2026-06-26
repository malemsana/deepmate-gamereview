import { state } from './state.js';
import { jumpToMove } from './ui.js';

// Draw Board evaluation graph
export function drawEvaluationGraph() {
  const graphContainer = document.getElementById('graph-container');
  const graphLine = document.getElementById('graph-line');
  const graphFill = document.getElementById('graph-fill');
  
  if (!graphContainer || !graphLine || !graphFill) return;
  if (state.reviewData.evals.length === 0) return;
  
  // Remove existing graph dots
  const existingDots = graphContainer.querySelectorAll('.graph-dot');
  existingDots.forEach(d => d.remove());
  
  const width = graphContainer.clientWidth;
  const height = 45;
  const points = [];
  const totalMoves = state.reviewData.evals.length;
  
  const dotColors = {
    brilliant: 'var(--color-brilliant)',
    great: 'var(--color-great)',
    inaccuracy: 'var(--color-inaccuracy)',
    mistake: 'var(--color-mistake)',
    blunder: 'var(--color-blunder)',
    miss: 'var(--color-miss)',
    missed_win: 'var(--color-missed-win)'
  };
  
  for (let i = 0; i < totalMoves; i++) {
    const score = state.reviewData.evals[i];
    const x = (i / (totalMoves - 1)) * width;
    
    let percent = (score + 8.0) / 16.0;
    if (percent > 1.0) percent = 1.0;
    if (percent < 0.0) percent = 0.0;
    
    const y = height - (percent * (height - 10) + 5);
    points.push({ x, y, idx: i - 1 });
    
    // Add dot for key moves (skip starting position which is index 0 in evals)
    if (i > 0) {
      const moveIdx = i - 1;
      const classification = state.reviewData.classifications[moveIdx];
      if (classification && dotColors[classification]) {
        const dot = document.createElement('div');
        dot.className = 'graph-dot';
        dot.style.position = 'absolute';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        dot.style.width = '7px';
        dot.style.height = '7px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = dotColors[classification];
        dot.style.border = '1.5px solid #ffffff';
        dot.style.transform = 'translate(-50%, -50%)';
        dot.style.cursor = 'pointer';
        dot.style.zIndex = '10';
        dot.title = `Move ${Math.floor(moveIdx / 2) + 1}: ${classification.replace('_', ' ')}`;
        
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          jumpToMove(moveIdx);
        });
        
        graphContainer.appendChild(dot);
      }
    }
  }
  
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }
  
  graphLine.setAttribute('d', pathD);
  
  // Fill everything BELOW the curve with light color
  let fillD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    fillD += ` L ${points[i].x} ${points[i].y}`;
  }
  fillD += ` L ${width} ${height} L 0 ${height} Z`;
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
  if (totalMoves <= 1) return;
  
  const moveIdx = Math.round((hoverX / width) * (totalMoves - 1)) - 1;
  const clampedIdx = Math.max(-1, Math.min(state.gameHistory.length - 1, moveIdx));
  
  const cursorX = ((clampedIdx + 1) / (totalMoves - 1)) * width;
  graphHoverCursor.setAttribute('x1', cursorX);
  graphHoverCursor.setAttribute('x2', cursorX);
  graphHoverCursor.style.display = 'block';

  // Hover Tooltip logic
  const tooltip = document.getElementById('graph-tooltip');
  if (tooltip) {
    const parentRect = graphSvg.parentElement.getBoundingClientRect();
    const tooltipX = e.clientX - parentRect.left + 10;
    
    // Position tooltip checking limits
    tooltip.style.left = `${Math.min(tooltipX, parentRect.width - 130)}px`;
    tooltip.style.display = 'flex';
    
    const tooltipTitle = document.getElementById('tooltip-move-title');
    const tooltipBadge = document.getElementById('tooltip-move-badge');
    const tooltipEval = document.getElementById('tooltip-move-eval');
    
    if (clampedIdx === -1) {
      if (tooltipTitle) tooltipTitle.innerText = "Start";
      if (tooltipBadge) tooltipBadge.style.display = 'none';
      if (tooltipEval) tooltipEval.innerText = "0.0";
    } else {
      const move = state.gameHistory[clampedIdx];
      const classification = state.reviewData.classifications[clampedIdx] || 'best';
      const scoreVal = state.reviewData.evals[clampedIdx + 1];
      
      if (tooltipTitle) {
        tooltipTitle.innerText = `Move ${Math.floor(clampedIdx / 2) + 1}${clampedIdx % 2 === 0 ? 'w' : 'b'}: ${move.san}`;
      }
      if (tooltipBadge) {
        tooltipBadge.innerText = classification.replace('_', ' ').toUpperCase();
        tooltipBadge.style.display = 'inline-block';
        
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
        tooltipBadge.style.backgroundColor = badgeColors[classification] || 'var(--primary)';
        
        const darkTextBadges = ['brilliant', 'excellent', 'good', 'inaccuracy', 'mistake', 'miss', 'missed_draw'];
        tooltipBadge.style.color = darkTextBadges.includes(classification) ? '#0f1412' : '#ffffff';
      }
      
      if (tooltipEval) {
        let scoreText = scoreVal > 0 ? '+' : '';
        if (Math.abs(scoreVal) === 99.0) {
          scoreText = scoreVal > 0 ? 'M' : '-M';
        } else {
          scoreText += scoreVal.toFixed(2);
        }
        tooltipEval.innerText = scoreText;
      }
    }
  }
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
