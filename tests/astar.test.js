import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPath, heuristic, MinHeap } from '../src/astar.js';

test('min heap pops in priority order', () => {
  const h = new MinHeap(); [8, 3, 6, 1, 5].forEach(priority => h.push({ priority }));
  assert.deepEqual([h.pop().priority, h.pop().priority, h.pop().priority, h.pop().priority, h.pop().priority], [1, 3, 5, 6, 8]);
});
test('A* finds Manhattan shortest path on an empty grid', () => {
  const r = searchPath({ width: 5, height: 5, start: { x: 0, y: 0 }, goal: { x: 4, y: 4 } });
  assert.equal(r.found, true); assert.equal(r.pathLength, 8); assert.equal(r.pathCost, 8);
});
test('A* routes around a wall', () => {
  const walls = new Set(['1,0', '1,1', '1,2']);
  const r = searchPath({ width: 4, height: 4, start: { x: 0, y: 1 }, goal: { x: 3, y: 1 }, walls });
  assert.equal(r.found, true); assert.ok(r.pathCost > 3);
  assert.ok(r.path.every(p => !walls.has(`${p.x},${p.y}`)));
});
test('returns no path when goal is enclosed', () => {
  const walls = new Set(['1,0', '0,1', '2,1', '1,2']);
  const r = searchPath({ width: 3, height: 3, start: { x: 1, y: 1 }, goal: { x: 2, y: 2 }, walls });
  assert.equal(r.found, false); assert.equal(r.pathLength, null);
});
test('diagonal A* uses octile heuristic and diagonal movement cost', () => {
  assert.equal(heuristic({ x: 0, y: 0 }, { x: 3, y: 3 }, true), 3 * Math.SQRT2);
  const r = searchPath({ width: 4, height: 4, start: { x: 0, y: 0 }, goal: { x: 3, y: 3 }, diagonal: true });
  assert.equal(r.found, true); assert.equal(r.pathLength, 3); assert.ok(Math.abs(r.pathCost - 3 * Math.SQRT2) < 1e-8);
});
test('BFS and Dijkstra find shortest paths on uniform orthogonal grid', () => {
  const args = { width: 8, height: 6, start: { x: 0, y: 0 }, goal: { x: 7, y: 5 }, walls: new Set(['2,1', '2,2', '2,3', '4,3']) };
  const bfs = searchPath({ ...args, algorithm: 'bfs' }); const dijkstra = searchPath({ ...args, algorithm: 'dijkstra' });
  assert.equal(bfs.found, true); assert.equal(dijkstra.found, true); assert.equal(bfs.pathLength, dijkstra.pathLength);
});
test('rejects start on a wall', () => {
  assert.throws(() => searchPath({ width: 3, height: 3, start: { x: 0, y: 0 }, goal: { x: 2, y: 2 }, walls: new Set(['0,0']) }), /cannot be walls/);
});
