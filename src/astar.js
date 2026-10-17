/**
 * ============================================================================
 *  PATHFINDING ALGORITHMS — A*, Dijkstra, and BFS
 * ============================================================================
 *
 *  This file contains everything needed to find the shortest path on a
 *  rectangular grid.  It has NO dependency on the UI — the app.js file
 *  imports and calls these functions to drive the visualiser.
 *
 *  KEY CONCEPTS (explain these first in the classroom):
 *
 *    g(n) — the actual cost we've spent to reach node n from the start.
 *    h(n) — an *estimate* (heuristic) of how far n is from the goal.
 *    f(n) = g(n) + h(n) — the total estimated cost of the cheapest
 *           path that goes *through* n.
 *
 *    A*       uses f(n) = g(n) + h(n)  → smart, explores fewer nodes
 *    Dijkstra uses f(n) = g(n)          → guaranteed shortest, no heuristic
 *    BFS      uses f(n) = depth         → layer-by-layer, equal-cost moves
 *
 * ============================================================================
 */


// ─────────────────────────────────────────────────────────────────────────────
// 1. MIN-HEAP  (Priority Queue)
// ─────────────────────────────────────────────────────────────────────────────
//
//  WHY DO WE NEED THIS?
//    A* always picks the node with the *lowest* f(n) value.
//    A min-heap lets us do that in O(log n) time instead of scanning the
//    whole list every time (which would be O(n)).
//
//  HOW A HEAP WORKS (tree stored in an array):
//
//         index:    0   1   2   3   4   5   6
//         array: [ 2,  4,  3,  7,  5,  9,  6 ]
//
//    Parent of i  →  Math.floor((i - 1) / 2)
//    Left child   →  2*i + 1
//    Right child  →  2*i + 2
//
//    Rule: every parent must be ≤ its children  (min-heap property).
//
// ─────────────────────────────────────────────────────────────────────────────

export class MinHeap {

  /**
   * Create a new MinHeap.
   *
   * @param {Function} compare — a comparator function.
   *   Returns negative if a should come before b,
   *   positive if b should come before a,
   *   zero if they are equal.
   *
   *   Default: compare by a `.priority` property (lower = better).
   */
  constructor(compare = (a, b) => a.priority - b.priority) {
    this.items = [];        // The array that stores the heap elements
    this.compare = compare; // The comparator function
  }

  /**
   * How many elements are in the heap right now?
   * We use a getter so we can write `heap.size` like a property.
   */
  get size() {
    return this.items.length;
  }

  /**
   * INSERT a new value into the heap — O(log n).
   *
   * Steps:
   *   1. Put the new value at the END of the array.
   *   2. "Bubble up": repeatedly swap it with its parent if the parent
   *      is larger.  Stop when the parent is smaller or we reach the root.
   */
  push(value) {
    const a = this.items;

    // Step 1 — add at the end
    a.push(value);

    // Step 2 — bubble up
    let i = a.length - 1;                     // index of the newly added item
    while (i > 0) {
      const parentIndex = (i - 1) >> 1;       // same as Math.floor((i-1)/2)
      if (this.compare(a[parentIndex], value) <= 0) {
        break;   // parent is already smaller — heap property satisfied
      }
      a[i] = a[parentIndex];                  // move parent down
      i = parentIndex;                         // move cursor up
    }
    a[i] = value;  // place the new value in its final spot
  }

  /**
   * REMOVE and RETURN the smallest element — O(log n).
   *
   * Steps:
   *   1. Save the root (index 0) — that's our answer.
   *   2. Move the LAST element to the root position.
   *   3. "Sink down": repeatedly swap it with its smaller child
   *      until the heap property is restored.
   */
  pop() {
    const a = this.items;
    if (!a.length) return undefined;  // empty heap — nothing to pop

    // Step 1 — save the root (smallest element)
    const root = a[0];

    // Step 2 — move last element to the top
    const last = a.pop();  // removes the last element from the array

    // Step 3 — sink down (only if array is not empty)
    if (a.length) {
      let i = 0;

      while (true) {
        let childIndex = i * 2 + 1;  // left child

        // If left child doesn't exist, we've reached the bottom
        if (childIndex >= a.length) break;

        // Pick the SMALLER of the two children
        if (
          childIndex + 1 < a.length &&
          this.compare(a[childIndex + 1], a[childIndex]) < 0
        ) {
          childIndex++;  // right child is smaller, use it instead
        }

        // If `last` is already ≤ the smaller child, we're done
        if (this.compare(last, a[childIndex]) <= 0) break;

        // Otherwise, move the child up and continue sinking
        a[i] = a[childIndex];
        i = childIndex;
      }

      a[i] = last;  // place `last` in its final spot
    }

    return root;  // return the smallest element we saved earlier
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a coordinate {x, y} into a unique string key like "3,7".
 *
 * WHY?  JavaScript Maps and Sets need a way to uniquely identify each cell.
 *       Objects can't be used as Map keys by value, so we convert to a string.
 */
const keyOf = ({ x, y }) => `${x},${y}`;

/**
 * Check if two coordinate objects refer to the same cell.
 */
const same = (a, b) => a.x === b.x && a.y === b.y;


// ─────────────────────────────────────────────────────────────────────────────
// 3. HEURISTIC FUNCTION  — estimating distance to the goal
// ─────────────────────────────────────────────────────────────────────────────
//
//  The heuristic is the "brain" of A*.  It guesses how far away the goal is,
//  WITHOUT actually walking there.
//
//  Rules for a GOOD heuristic:
//    • It must NEVER overestimate (this is called "admissible").
//    • A closer estimate → A* explores fewer nodes → faster.
//
//  We use two standard heuristics:
//
//    MANHATTAN DISTANCE  (no diagonal movement):
//      h = |dx| + |dy|
//      ┌──┬──┬──┬──┐
//      │  │  │  │ G│   dx=3, dy=2 → h = 3+2 = 5
//      ├──┼──┼──┼──┤
//      │  │  │  │  │
//      ├──┼──┼──┼──┤
//      │ S│  │  │  │
//      └──┴──┴──┴──┘
//
//    OCTILE DISTANCE  (with diagonal movement):
//      h = max(dx,dy) + (√2 - 1) × min(dx,dy)
//      Accounts for the fact that diagonal steps cost √2 ≈ 1.414.
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the estimated distance (heuristic) between two points.
 *
 * @param {Object} a  — current point {x, y}
 * @param {Object} b  — goal point   {x, y}
 * @param {boolean} diagonal — are diagonal moves allowed?
 * @returns {number} — the heuristic value h(n)
 */
export function heuristic(a, b, diagonal = false) {
  // How far apart are we in each axis?
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);

  if (diagonal) {
    // Octile distance: take as many diagonal steps as possible (they cost √2),
    // then finish with straight steps (cost 1).
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  } else {
    // Manhattan distance: can only move up/down/left/right
    return dx + dy;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. NEIGHBOR GENERATION — which cells can we move to?
// ─────────────────────────────────────────────────────────────────────────────
//
//  From any cell, we can move to the 4 (or 8) adjacent cells, as long as:
//    • The neighbor is inside the grid boundaries
//    • The neighbor is NOT a wall
//    • (For diagonals) we don't "cut corners" through walls
//
//  Movement costs:
//    Straight (↑ ↓ ← →)  = 1
//    Diagonal (↗ ↘ ↙ ↖)  = √2 ≈ 1.414
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all valid neighbors of a given node.
 *
 * @param {Object}  node     — current cell {x, y}
 * @param {number}  width    — number of columns in the grid
 * @param {number}  height   — number of rows in the grid
 * @param {Set}     walls    — set of "x,y" strings representing blocked cells
 * @param {boolean} diagonal — whether diagonal movement is allowed
 * @returns {Array} — list of {x, y, cost} objects for each reachable neighbor
 */
function neighbors(node, width, height, walls, diagonal) {

  // Define movement directions as [deltaX, deltaY, movementCost]
  //
  // Without diagonals: 4 directions (up, down, left, right) — cost 1 each
  // With diagonals:    8 directions — straight costs 1, diagonal costs √2
  const dirs = diagonal
    ? [
        [ 1,  0, 1],          // right
        [-1,  0, 1],          // left
        [ 0,  1, 1],          // down
        [ 0, -1, 1],          // up
        [ 1,  1, Math.SQRT2], // down-right  (diagonal)
        [ 1, -1, Math.SQRT2], // up-right    (diagonal)
        [-1,  1, Math.SQRT2], // down-left   (diagonal)
        [-1, -1, Math.SQRT2], // up-left     (diagonal)
      ]
    : [
        [ 1,  0, 1],          // right
        [-1,  0, 1],          // left
        [ 0,  1, 1],          // down
        [ 0, -1, 1],          // up
      ];

  const out = [];  // the list of valid neighbors we'll return

  for (const [dx, dy, cost] of dirs) {
    // Calculate the neighbor's coordinates
    const x = node.x + dx;
    const y = node.y + dy;

    // CHECK 1: Is the neighbor inside the grid?
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    // CHECK 2: Is the neighbor a wall?
    if (walls.has(`${x},${y}`)) continue;

    // CHECK 3 (diagonals only): Prevent corner-cutting.
    //
    //   If we're moving diagonally, BOTH adjacent straight cells must
    //   be open.  Otherwise we'd be "squeezing" through a corner:
    //
    //     ┌──┬──┐           We want to go from A to B diagonally,
    //     │ A│██│           but the wall (██) blocks the corner.
    //     ├──┼──┤           This move should be ILLEGAL.
    //     │██│ B│
    //     └──┴──┘
    //
    if (dx && dy) {
      const sideA = walls.has(`${node.x + dx},${node.y}`);  // horizontal neighbor
      const sideB = walls.has(`${node.x},${node.y + dy}`);  // vertical neighbor
      if (sideA || sideB) continue;  // corner is blocked
    }

    // This neighbor is valid — add it to the list
    out.push({ x, y, cost });
  }

  return out;
}


// ─────────────────────────────────────────────────────────────────────────────
// 5. THE MAIN SEARCH FUNCTION — A*, Dijkstra, or BFS
// ─────────────────────────────────────────────────────────────────────────────
//
//  This is the heart of the pathfinding.  Here's the algorithm in plain
//  English:
//
//    1. Start with only the start node in the "frontier" (priority queue).
//    2. While the frontier is not empty:
//       a. Pop the node with the LOWEST f(n) from the frontier.
//       b. If it's the goal — we're done!  Reconstruct the path.
//       c. Otherwise, mark it as "explored" (closed set).
//       d. Look at each of its neighbors:
//          - If already explored, skip it.
//          - Calculate tentative g = (our g) + (cost to reach neighbor).
//          - If this g is better than any previously known route to that
//            neighbor, update it and add it to the frontier.
//    3. If the frontier is empty and we never reached the goal, there's
//       no path.
//
//  EVENTS:
//    The function records "events" (frontier / explore / path) so the UI
//    can animate the search step by step.
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a pathfinding search on the grid.
 *
 * @param {Object} options
 * @param {number}  options.width     — grid columns
 * @param {number}  options.height    — grid rows
 * @param {Object}  options.start     — {x, y} of the start cell
 * @param {Object}  options.goal      — {x, y} of the goal cell
 * @param {Set}     options.walls     — set of "x,y" wall strings
 * @param {string}  options.algorithm — 'astar', 'dijkstra', or 'bfs'
 * @param {boolean} options.diagonal  — allow diagonal movement?
 *
 * @returns {Object} result with: algorithm, found, path, pathLength,
 *                   pathCost, explored, events, durationMs, discovered
 */
export function searchPath({
  width,
  height,
  start,
  goal,
  walls = new Set(),
  algorithm = 'astar',
  diagonal = false,
}) {

  // ── INPUT VALIDATION ───────────────────────────────────────────────────
  //    Always validate inputs — makes debugging much easier!

  if (
    !Number.isInteger(width) || !Number.isInteger(height) ||
    width < 1 || height < 1
  ) {
    throw new Error('Grid dimensions must be positive integers.');
  }

  if (
    !start || !goal ||
    start.x < 0 || start.x >= width ||
    start.y < 0 || start.y >= height ||
    goal.x < 0 || goal.x >= width ||
    goal.y < 0 || goal.y >= height
  ) {
    throw new Error('Start and goal must be inside the grid.');
  }

  if (walls.has(keyOf(start)) || walls.has(keyOf(goal))) {
    throw new Error('Start and goal cannot be walls.');
  }

  if (!['astar', 'dijkstra', 'bfs'].includes(algorithm)) {
    throw new Error(`Unknown algorithm: ${algorithm}`);
  }


  // ── SETUP: Data structures ─────────────────────────────────────────────

  const t0 = performance.now();  // start timer (to measure speed later)

  const events = [];  // animation events for the UI

  const startKey = keyOf(start);  // e.g. "3,10"
  const goalKey  = keyOf(goal);   // e.g. "26,10"

  // gScore: maps "x,y" → the cheapest known cost to reach that cell.
  //         Start node has g = 0 (no cost to reach yourself).
  const gScore = new Map([[startKey, 0]]);

  // cameFrom: maps "x,y" → the "x,y" of the cell we came from.
  //           Used to reconstruct the final path by tracing backwards.
  const cameFrom = new Map();

  // closed: set of "x,y" strings for cells we've FULLY explored.
  //         Once a cell is here, we never revisit it.
  const closed = new Set();

  // discovered: set of "x,y" strings for cells that have been seen
  //             (added to frontier at least once).
  const discovered = new Set([startKey]);

  // coords: maps "x,y" string → {x, y} object.
  //         A convenience lookup to convert keys back to coordinates.
  const coords = new Map([[startKey, start]]);


  // ── HEURISTIC SELECTION ────────────────────────────────────────────────
  //
  //    A*       → uses the full heuristic
  //    Dijkstra → heuristic is always 0 (ignores the estimate)
  //    BFS      → heuristic is always 0 (uses depth instead of cost)

  const heuristicFn = (point) => {
    return algorithm === 'astar' ? heuristic(point, goal, diagonal) : 0;
  };


  // ── FRONTIER (Priority Queue) ─────────────────────────────────────────
  //
  //    The frontier holds all the cells we know about but haven't explored yet.
  //    We always pick the cell with the LOWEST priority next.
  //
  //    Priority tie-breaking:  if two cells have the same f(n), we break
  //    ties by insertion order (FIFO) — this gives nicer visual results.

  const frontier = new MinHeap(
    (a, b) => a.priority - b.priority || a.order - b.order
  );

  let order = 0;     // insertion counter for tie-breaking
  let found = false;  // did we reach the goal?
  let explored = 0;   // how many cells did we fully explore?

  // ── SEED THE FRONTIER with the start node ─────────────────────────────

  frontier.push({
    key:      startKey,
    point:    start,
    priority: algorithm === 'bfs' ? 0 : heuristicFn(start),  // f(start) = 0 + h(start)
    order:    order++,
  });

  // Record the first animation event: "start is on the frontier"
  events.push({
    type:  'frontier',
    key:   startKey,
    point: start,
    g:     0,
    h:     heuristicFn(start),
  });


  // ── MAIN LOOP ─────────────────────────────────────────────────────────
  //
  //    This is where the magic happens!
  //    We keep going until:
  //      • we find the goal, OR
  //      • the frontier is empty (no path exists)

  while (frontier.size) {

    // ────── Step A: Pop the best node from the frontier ──────
    //
    //   "Best" = lowest f(n) value.
    //   For BFS this is just the earliest-discovered node (FIFO behavior).

    const current = frontier.pop();

    // Skip stale entries.
    //
    // WHY?  We might add the same cell to the heap multiple times
    // (with improving g values).  Once it's been explored (closed),
    // any later heap entry for it is outdated — just skip it.
    if (closed.has(current.key)) continue;


    // ────── Step B: Is this the goal? ──────
    //
    //   If yes — we found the shortest path!  Break out of the loop.

    if (current.key === goalKey) {
      found = true;
      break;
    }


    // ────── Step C: Mark as explored ──────
    //
    //   Add this cell to the "closed" set.  We've now committed to the
    //   cheapest route to reach it, so we'll never need to revisit.

    closed.add(current.key);
    explored++;

    // Record animation event: "this cell was explored"
    events.push({
      type:  'explore',
      key:   current.key,
      point: current.point,
      g:     gScore.get(current.key),
      h:     heuristicFn(current.point),
    });


    // ────── Step D: Examine each neighbor ──────

    for (const next of neighbors(current.point, width, height, walls, diagonal)) {

      const nextKey = keyOf(next);

      // Store coordinates for later path reconstruction
      coords.set(nextKey, { x: next.x, y: next.y });

      // Already explored?  Skip — we've already committed to its best route.
      if (closed.has(nextKey)) continue;

      // Calculate tentative g(n):
      //   "How much would it cost to reach this neighbor through `current`?"
      //
      //   For BFS we use cost = 1 (every step costs the same),
      //   for A*/Dijkstra we use the actual movement cost (1 or √2).
      const tentative = gScore.get(current.key) + (algorithm === 'bfs' ? 1 : next.cost);


      // ── BFS BRANCH ─────────────────────────────────────────────
      //
      //   BFS is simpler: once a cell is discovered, it's never updated.
      //   (Because all edges have equal cost, the first time we see a cell
      //   is guaranteed to be via the shortest path.)

      if (algorithm === 'bfs') {

        // Already discovered?  Skip it.
        if (discovered.has(nextKey)) continue;

        // Mark as discovered and record its cost + parent
        discovered.add(nextKey);
        gScore.set(nextKey, tentative);
        cameFrom.set(nextKey, current.key);

        // Add to frontier with priority = tentative (acts like a queue)
        frontier.push({
          key:      nextKey,
          point:    { x: next.x, y: next.y },
          priority: tentative,
          order:    order++,
        });

        // Record animation event
        events.push({
          type:  'frontier',
          key:   nextKey,
          point: { x: next.x, y: next.y },
          g:     tentative,
          h:     heuristicFn(next),
        });

      }

      // ── A* / DIJKSTRA BRANCH ───────────────────────────────────
      //
      //   If this route to the neighbor is CHEAPER than any previously
      //   known route, update the neighbor's g-score and re-add it to
      //   the frontier with the improved priority.
      //
      //   Key insight: we compare tentative g vs. the best known g.
      //   If tentative < best known g → we found a shortcut!

      else if (tentative < (gScore.get(nextKey) ?? Infinity)) {

        // Update parent and cost
        cameFrom.set(nextKey, current.key);
        gScore.set(nextKey, tentative);

        // Add to frontier with priority = g(n) + h(n)
        //   • For A*:      priority = tentative + heuristic
        //   • For Dijkstra: priority = tentative + 0 = tentative
        frontier.push({
          key:      nextKey,
          point:    { x: next.x, y: next.y },
          priority: tentative + heuristicFn(next),
          order:    order++,
        });

        // Record animation event (only the FIRST time we see this cell)
        if (!discovered.has(nextKey)) {
          events.push({
            type:  'frontier',
            key:   nextKey,
            point: { x: next.x, y: next.y },
            g:     tentative,
            h:     heuristicFn(next),
          });
        }

        discovered.add(nextKey);
      }
    }
  }
  // ── End of main loop ──────────────────────────────────────────────────


  // ── PATH RECONSTRUCTION ───────────────────────────────────────────────
  //
  //  If we found the goal, trace backwards through `cameFrom` to build
  //  the path from start → goal.
  //
  //    goal ← parent(goal) ← parent(parent(goal)) ← ... ← start
  //
  //  Then reverse it so it reads start → goal.

  let path = [];

  if (found) {
    // Start from the goal and walk backwards
    let cursor = goalKey;
    path.push(coords.get(cursor) || goal);

    while (cursor !== startKey) {
      cursor = cameFrom.get(cursor);

      // Safety check: if the chain is broken, there's no valid path
      if (!cursor) {
        path = [];
        found = false;
        break;
      }

      path.push(coords.get(cursor));
    }

    // Reverse so the path goes start → goal
    path.reverse();

    // Record path animation events (the UI draws the golden path)
    for (const point of path) {
      events.push({ type: 'path', key: keyOf(point), point });
    }
  }


  // ── RETURN RESULTS ────────────────────────────────────────────────────
  //
  //  Package up everything the UI needs:
  //    • algorithm   — which algorithm was used
  //    • found       — was a path found?
  //    • path        — array of {x,y} from start to goal
  //    • pathLength  — number of steps (edges) in the path
  //    • pathCost    — total weighted cost (straight=1, diagonal=√2)
  //    • explored    — how many cells we fully examined
  //    • events      — animation timeline for the visualiser
  //    • durationMs  — how long the algorithm took (milliseconds)
  //    • discovered  — total cells that entered the frontier

  const cost = found ? gScore.get(goalKey) : Infinity;

  return {
    algorithm,
    found,
    path,
    pathLength: found ? Math.max(0, path.length - 1) : null,
    pathCost:   cost,
    explored,
    events,
    durationMs: performance.now() - t0,
    discovered: discovered.size,
  };
}
