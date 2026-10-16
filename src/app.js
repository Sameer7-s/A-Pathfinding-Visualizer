import { searchPath, heuristic } from './astar.js';

const $ = id => document.getElementById(id);
const W = 30, H = 20;
const state = { width: W, height: H, start: { x: 3, y: 10 }, goal: { x: 26, y: 10 }, walls: new Set(), tool: 'wall', diagonal: false, showHeuristic: false, cells: new Map(), running: false, paused: false, events: [], eventIndex: 0, timer: null, runStartedAt: 0, activeResult: null, lastSearch: null, mouseDown: false, comparison: false };
const grid = $('grid');
const algorithmNames = { astar: 'A* Search', dijkstra: "Dijkstra's Algorithm", bfs: 'Breadth-First Search' };
const descriptions = {
  astar: 'Balances distance travelled with estimated distance to goal.',
  dijkstra: 'Expands the lowest known path cost first; guarantees a least-cost path.',
  bfs: 'Explores evenly by layers; optimal when every move has equal cost.'
};
const speedDelays = { 1: 180, 2: 100, 3: 48, 4: 20, 5: 5 };
const key = (x, y) => `${x},${y}`;

function buildGrid() {
  grid.style.setProperty('--cols', W); grid.style.setProperty('--rows', H); grid.innerHTML = ''; state.cells.clear();
  const fragment = document.createDocumentFragment();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'cell'; cell.dataset.x = x; cell.dataset.y = y;
    cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-label', `Cell ${x + 1}, ${y + 1}`); cell.draggable = false;
    fragment.append(cell); state.cells.set(key(x, y), cell);
  }
  grid.append(fragment); renderBase();
}
function renderBase() {
  for (const [k, cell] of state.cells) {
    cell.className = 'cell'; cell.textContent = '';
    if (state.walls.has(k)) cell.classList.add('wall');
    if (k === key(state.start.x, state.start.y)) { cell.classList.add('start-cell'); cell.innerHTML = '<span class="endpoint-icon">S</span>'; }
    if (k === key(state.goal.x, state.goal.y)) { cell.classList.add('goal-cell'); cell.innerHTML = '<span class="endpoint-icon">G</span>'; }
  }
  if (state.showHeuristic) showHeuristics();
}
function showHeuristics() {
  for (const [k, cell] of state.cells) {
    if (state.walls.has(k) || k === key(state.start.x, state.start.y) || k === key(state.goal.x, state.goal.y)) continue;
    const [x, y] = k.split(',').map(Number); cell.textContent = Math.round(heuristic({ x, y }, state.goal, state.diagonal)); cell.classList.add('heuristic-cell');
  }
}
function clearVisuals() { stopTimer(); state.running = false; state.paused = false; state.events = []; state.eventIndex = 0; state.activeResult = null; renderBase(); $('pauseBtn').disabled = true; $('pauseBtn').innerHTML = 'Pause <span>Ⅱ</span>'; setStatus('READY'); }
function stopTimer() { if (state.timer) clearTimeout(state.timer); state.timer = null; }
function setStatus(label) { $('runStatus').innerHTML = `<span class="status-dot"></span> ${label}`; }
function setResult(title, message, tag = 'IDLE', type = '') { const banner = $('resultBanner'); banner.className = `result-banner ${type}`; banner.querySelector('strong').textContent = title; banner.querySelector('p').textContent = message; banner.querySelector('.result-tag').textContent = tag; }
function updateStats(result, elapsed = result?.durationMs) {
  $('pathLength').innerHTML = result?.found ? `${result.pathLength} <small>steps</small>` : result && !result.found ? '— <small>no path</small>' : '— <small>steps</small>';
  $('nodesExplored').textContent = result ? result.explored.toLocaleString() : '0';
  $('executionTime').innerHTML = result ? `${elapsed.toFixed(2)} <small>ms</small>` : '— <small>ms</small>';
  $('pathCost').textContent = result?.found ? result.pathCost.toFixed(2).replace(/\.00$/, '') : result && !result.found ? 'N/A' : '—';
}
function applyEvent(event) {
  const cell = state.cells.get(event.key); if (!cell) return;
  if (event.type === 'frontier' && !cell.classList.contains('start-cell') && !cell.classList.contains('goal-cell')) cell.classList.add('frontier-cell');
  if (event.type === 'explore' && !cell.classList.contains('start-cell') && !cell.classList.contains('goal-cell')) { cell.classList.remove('frontier-cell'); cell.classList.add('explored-cell'); }
  if (event.type === 'path' && !cell.classList.contains('start-cell') && !cell.classList.contains('goal-cell')) { cell.classList.remove('frontier-cell', 'explored-cell'); cell.classList.add('path-cell'); }
  if (state.showHeuristic && event.type !== 'path' && !cell.classList.contains('start-cell') && !cell.classList.contains('goal-cell') && !state.walls.has(event.key)) cell.textContent = Math.round(event.h ?? 0);
}
function eventDelay() { return speedDelays[Number($('speedRange').value)] || 20; }
function tick() {
  if (!state.running || state.paused) return;
  const chunk = Number($('speedRange').value) === 5 ? 18 : Number($('speedRange').value) === 4 ? 5 : 1;
  for (let i = 0; i < chunk && state.eventIndex < state.events.length; i++) applyEvent(state.events[state.eventIndex++]);
  if (state.eventIndex >= state.events.length) { finishRun(); return; }
  state.timer = setTimeout(tick, eventDelay());
}
function finishRun() {
  stopTimer(); state.running = false; state.paused = false; $('pauseBtn').disabled = true; $('pauseBtn').innerHTML = 'Pause <span>Ⅱ</span>'; setStatus('COMPLETE');
  const result = state.activeResult; updateStats(result);
  if (result.found) setResult('Path found successfully', `${algorithmNames[result.algorithm]} reached the destination with a cost of ${result.pathCost.toFixed(2)}.`, 'FOUND', 'success');
  else setResult('No route available', 'The destination is blocked off. Remove walls and try again.', 'NO PATH', 'warning');
}
function runSearch({ singleStep = false } = {}) {
  clearVisuals();
  const algorithm = $('algorithmSelect').value;
  let result;
  try { result = searchPath({ width: W, height: H, start: state.start, goal: state.goal, walls: state.walls, algorithm, diagonal: state.diagonal }); }
  catch (error) { toast(error.message); return; }
  state.activeResult = result; state.lastSearch = result; state.events = result.events; state.eventIndex = 0; state.running = true; state.paused = false; state.runStartedAt = performance.now();
  updateStats({ ...result, explored: 0, durationMs: result.durationMs }); setStatus('SEARCHING'); $('pauseBtn').disabled = false;
  setResult('Search in progress', `Exploring nodes with ${algorithmNames[algorithm]}.`, 'RUNNING');
  if (singleStep) { state.paused = true; $('pauseBtn').innerHTML = 'Resume <span>▶</span>'; stepOnce(); return; }
  tick();
}
function stepOnce() {
  if (!state.activeResult) { runSearch({ singleStep: true }); return; }
  if (state.eventIndex < state.events.length) { applyEvent(state.events[state.eventIndex++]); }
  const partial = { ...state.activeResult, explored: Math.min(state.activeResult.explored, state.eventIndex) };
  $('nodesExplored').textContent = state.cells ? [...state.cells.values()].filter(c => c.classList.contains('explored-cell')).length : partial.explored;
  if (state.eventIndex >= state.events.length) finishRun();
}
function togglePause() {
  if (!state.activeResult) return;
  if (state.paused) { state.paused = false; state.running = true; $('pauseBtn').innerHTML = 'Pause <span>Ⅱ</span>'; setStatus('SEARCHING'); tick(); }
  else { state.paused = true; state.running = false; stopTimer(); $('pauseBtn').innerHTML = 'Resume <span>▶</span>'; setStatus('PAUSED'); }
}
function setTool(tool) { state.tool = tool; document.querySelectorAll('.tool-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool)); }
function editCell(cell) {
  if (!cell) return; const x = Number(cell.dataset.x), y = Number(cell.dataset.y), k = key(x, y);
  if (state.tool === 'start') { if (state.walls.has(k) || (x === state.goal.x && y === state.goal.y)) return; state.start = { x, y }; }
  else if (state.tool === 'goal') { if (state.walls.has(k) || (x === state.start.x && y === state.start.y)) return; state.goal = { x, y }; }
  else if (state.tool === 'wall') { if (k === key(state.start.x, state.start.y) || k === key(state.goal.x, state.goal.y)) return; state.walls.add(k); }
  else if (state.tool === 'erase') state.walls.delete(k);
  clearVisuals(); updateStats(null); setResult('Ready to explore', 'Your map has changed. Run a search to see the new route.');
}
function randomMaze() {
  clearVisuals(); state.walls.clear();
  // Random obstacle field with a guaranteed open corridor along the central row.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (Math.random() < 0.27 && y !== state.start.y && y !== state.goal.y && !(x === state.start.x && y === state.start.y) && !(x === state.goal.x && y === state.goal.y)) state.walls.add(key(x, y));
  }
  for (let x = Math.min(state.start.x, state.goal.x); x <= Math.max(state.start.x, state.goal.x); x++) state.walls.delete(key(x, state.start.y));
  renderBase(); updateStats(null); setResult('Maze generated', 'A new obstacle layout is ready. Find a route through it.', 'READY'); toast('Random maze generated');
}
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timeout); toast.timeout = setTimeout(() => el.classList.remove('visible'), 2600); }
function compareAlgorithms() {
  clearVisuals(); const rows = [];
  for (const algorithm of ['astar', 'dijkstra', 'bfs']) rows.push(searchPath({ width: W, height: H, start: state.start, goal: state.goal, walls: state.walls, algorithm, diagonal: state.diagonal }));
  $('comparisonBody').innerHTML = rows.map(r => `<tr><td><span class="algorithm-label ${r.algorithm}"><i></i>${algorithmNames[r.algorithm]}</span></td><td>${r.found ? r.pathCost.toFixed(2).replace(/\.00$/, '') : 'No path'}</td><td>${r.explored}</td><td>${r.durationMs.toFixed(2)} ms</td></tr>`).join('');
  const a = rows.find(r => r.algorithm === 'astar');
  if (a) { state.activeResult = a; state.lastSearch = a; state.events = a.events; state.eventIndex = 0; state.running = true; setStatus('SEARCHING'); $('pauseBtn').disabled = false; $('pauseBtn').innerHTML = 'Pause <span>Ⅱ</span>'; setResult('Comparison complete', 'Table updated. Animating A* on the canvas for a visual reference.', 'COMPARE'); tick(); }
}

grid.addEventListener('pointerdown', e => { const cell = e.target.closest('.cell'); if (!cell) return; state.mouseDown = true; editCell(cell); });
grid.addEventListener('pointerover', e => { if (!state.mouseDown || state.tool === 'start' || state.tool === 'goal') return; const cell = e.target.closest('.cell'); if (cell) editCell(cell); });
window.addEventListener('pointerup', () => { state.mouseDown = false; });
grid.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editCell(e.target.closest('.cell')); } });
document.querySelectorAll('.tool-button').forEach(btn => btn.addEventListener('click', () => setTool(btn.dataset.tool)));
$('algorithmSelect').addEventListener('change', e => { $('algorithmDescription').textContent = descriptions[e.target.value]; clearVisuals(); updateStats(null); });
$('speedRange').addEventListener('input', e => { $('speedValue').textContent = ['','Slow','Steady','Balanced','Fast','Instant'][e.target.value]; });
$('diagonalToggle').addEventListener('change', e => { state.diagonal = e.target.checked; clearVisuals(); renderBase(); updateStats(null); });
$('heuristicToggle').addEventListener('change', e => { state.showHeuristic = e.target.checked; renderBase(); });
$('startBtn').addEventListener('click', () => runSearch());
$('stepBtn').addEventListener('click', () => { if (!state.activeResult) runSearch({ singleStep: true }); else { if (!state.paused) togglePause(); stepOnce(); } });
$('pauseBtn').addEventListener('click', togglePause);
$('resetBtn').addEventListener('click', () => { clearVisuals(); updateStats(null); $('comparisonBody').innerHTML = '<tr><td colspan="4" class="empty-table">Run a comparison to populate metrics.</td></tr>'; setResult('Ready to explore', 'Map reset. Configure your grid and start a new search.'); });
$('mazeBtn').addEventListener('click', randomMaze);
$('compareBtn').addEventListener('click', compareAlgorithms);
$('helpBtn').addEventListener('click', () => $('helpDialog').showModal());
$('helpDialog').addEventListener('click', e => { if (e.target === $('helpDialog')) $('helpDialog').close(); });
window.addEventListener('keydown', e => {
  if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName) || $('helpDialog').open) return;
  if (e.code === 'Space') { e.preventDefault(); if (!state.activeResult) runSearch(); else togglePause(); }
  else if (e.key.toLowerCase() === 'r') { clearVisuals(); updateStats(null); renderBase(); setResult('Ready to explore', 'Map reset. Configure your grid and start a new search.'); }
  else if (e.key.toLowerCase() === 'w') setTool('wall'); else if (e.key.toLowerCase() === 'e') setTool('erase'); else if (e.key.toLowerCase() === 's') setTool('start'); else if (e.key.toLowerCase() === 'g') setTool('goal');
  else if (e.key.toLowerCase() === 't') toggleTheme();
});

/* ─── Theme Toggle ─── */
const sunIcon = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = $('themeIcon');
  if (icon) icon.innerHTML = theme === 'light' ? moonIcon : sunIcon;
  $('themeToggle')?.setAttribute('title', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('pathfinder-theme', next); } catch {}
  toast(`Switched to ${next} mode`);
}

// Initialise theme from saved preference or system
(function initTheme() {
  let saved;
  try { saved = localStorage.getItem('pathfinder-theme'); } catch {}
  if (saved === 'light' || saved === 'dark') { applyTheme(saved); }
  else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) { applyTheme('light'); }
  else { applyTheme('dark'); }
})();

$('themeToggle').addEventListener('click', toggleTheme);

buildGrid();
// A few tasteful starter walls make the first run visually interesting while preserving a route.
for (let y = 3; y < 9; y++) state.walls.add(key(12, y));
for (let y = 11; y < 17; y++) state.walls.add(key(18, y));
for (let x = 5; x < 11; x++) state.walls.add(key(x, 5));
renderBase(); $('speedValue').textContent = 'Fast'; updateStats(null);

