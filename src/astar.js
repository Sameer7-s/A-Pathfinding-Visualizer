/** Pathfinding algorithms for a rectangular grid. No UI dependencies. */
export class MinHeap {
  constructor(compare = (a, b) => a.priority - b.priority) { this.items = []; this.compare = compare; }
  get size() { return this.items.length; }
  push(value) {
    const a = this.items; a.push(value); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (this.compare(a[p], value) <= 0) break; a[i] = a[p]; i = p; }
    a[i] = value;
  }
  pop() {
    const a = this.items; if (!a.length) return undefined;
    const root = a[0], last = a.pop();
    if (a.length) { let i = 0; while (true) { let c = i * 2 + 1; if (c >= a.length) break; if (c + 1 < a.length && this.compare(a[c + 1], a[c]) < 0) c++; if (this.compare(last, a[c]) <= 0) break; a[i] = a[c]; i = c; } a[i] = last; }
    return root;
  }
}

const keyOf = ({ x, y }) => `${x},${y}`;
const same = (a, b) => a.x === b.x && a.y === b.y;
export function heuristic(a, b, diagonal = false) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return diagonal ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) : dx + dy;
}
function neighbors(node, width, height, walls, diagonal) {
  const dirs = diagonal
    ? [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[-1,-1,Math.SQRT2]]
    : [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]];
  const out = [];
  for (const [dx, dy, cost] of dirs) {
    const x = node.x + dx, y = node.y + dy;
    if (x < 0 || x >= width || y < 0 || y >= height || walls.has(`${x},${y}`)) continue;
    // Prevent diagonal corner-cutting through blocked orthogonal cells.
    if (dx && dy && (walls.has(`${node.x + dx},${node.y}`) || walls.has(`${node.x},${node.y + dy}`))) continue;
    out.push({ x, y, cost });
  }
  return out;
}

/**
 * Produces deterministic animation events and metrics.
 * algorithm: 'astar' | 'dijkstra' | 'bfs'
 * All coordinates are {x, y}; walls is a Set of "x,y" strings.
 */
export function searchPath({ width, height, start, goal, walls = new Set(), algorithm = 'astar', diagonal = false }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('Grid dimensions must be positive integers.');
  if (!start || !goal || start.x < 0 || start.x >= width || start.y < 0 || start.y >= height || goal.x < 0 || goal.x >= width || goal.y < 0 || goal.y >= height) throw new Error('Start and goal must be inside the grid.');
  if (walls.has(keyOf(start)) || walls.has(keyOf(goal))) throw new Error('Start and goal cannot be walls.');
  if (!['astar', 'dijkstra', 'bfs'].includes(algorithm)) throw new Error(`Unknown algorithm: ${algorithm}`);

  const t0 = performance.now();
  const events = [], startKey = keyOf(start), goalKey = keyOf(goal);
  const gScore = new Map([[startKey, 0]]), cameFrom = new Map(), closed = new Set(), discovered = new Set([startKey]);
  const coords = new Map([[startKey, start]]);
  const heuristicFn = p => algorithm === 'astar' ? heuristic(p, goal, diagonal) : 0;
  const frontier = new MinHeap((a, b) => a.priority - b.priority || a.order - b.order);
  let order = 0, found = false, explored = 0;
  frontier.push({ key: startKey, point: start, priority: algorithm === 'bfs' ? 0 : heuristicFn(start), order: order++ });
  events.push({ type: 'frontier', key: startKey, point: start, g: 0, h: heuristicFn(start) });

  while (frontier.size) {
    const current = frontier.pop();
    if (closed.has(current.key)) continue; // Ignore stale heap entries.
    if (current.key === goalKey) { found = true; break; }
    closed.add(current.key); explored++;
    events.push({ type: 'explore', key: current.key, point: current.point, g: gScore.get(current.key), h: heuristicFn(current.point) });
    for (const next of neighbors(current.point, width, height, walls, diagonal)) {
      const nextKey = keyOf(next), tentative = gScore.get(current.key) + (algorithm === 'bfs' ? 1 : next.cost);
      coords.set(nextKey, { x: next.x, y: next.y });
      if (closed.has(nextKey)) continue;
      if (algorithm === 'bfs') {
        if (discovered.has(nextKey)) continue;
        discovered.add(nextKey); gScore.set(nextKey, tentative); cameFrom.set(nextKey, current.key);
        frontier.push({ key: nextKey, point: { x: next.x, y: next.y }, priority: tentative, order: order++ });
        events.push({ type: 'frontier', key: nextKey, point: { x: next.x, y: next.y }, g: tentative, h: heuristicFn(next) });
      } else if (tentative < (gScore.get(nextKey) ?? Infinity)) {
        cameFrom.set(nextKey, current.key); gScore.set(nextKey, tentative);
        frontier.push({ key: nextKey, point: { x: next.x, y: next.y }, priority: tentative + heuristicFn(next), order: order++ });
        if (!discovered.has(nextKey)) events.push({ type: 'frontier', key: nextKey, point: { x: next.x, y: next.y }, g: tentative, h: heuristicFn(next) });
        discovered.add(nextKey);
      }
    }
  }

  let path = [];
  if (found) {
    let cursor = goalKey; path.push(coords.get(cursor) || goal);
    while (cursor !== startKey) { cursor = cameFrom.get(cursor); if (!cursor) { path = []; found = false; break; } path.push(coords.get(cursor)); }
    path.reverse();
    for (const point of path) events.push({ type: 'path', key: keyOf(point), point });
  }
  const cost = found ? gScore.get(goalKey) : Infinity;
  return { algorithm, found, path, pathLength: found ? Math.max(0, path.length - 1) : null, pathCost: cost, explored, events, durationMs: performance.now() - t0, discovered: discovered.size };
}
