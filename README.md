# PathFinder AI — Search, Visualized

A responsive, premium-styled pathfinding visualizer built with vanilla HTML, CSS, and JavaScript. It implements A*, Dijkstra's algorithm, and BFS without a backend or API key.

## Features

- Interactive 30 × 20 grid with wall, eraser, start, and goal tools
- Animated frontier, explored nodes, and final route
- A*, Dijkstra, and BFS search implementations
- Orthogonal and diagonal movement (diagonal corner-cutting is prevented)
- Adjustable animation speed, pause/resume, and single-step mode
- Random obstacle generation, heuristic overlay, and algorithm comparison table
- Metrics: path length, explored nodes, execution time, and path cost
- Keyboard shortcuts and responsive layout
- Unit tests for heap ordering, shortest paths, obstacles, diagonal movement, unreachable goals, and validation

## Requirements

- Node.js 18+ (for the built-in test runner)
- A modern browser
- Internet is only needed for the optional Google Fonts and for `npx serve` on first use. The app itself uses no API, database, or external runtime library.

## Run locally

1. Extract this folder.
2. Open a terminal inside `pathfinder-ai`.
3. Run `npm install` (there are no runtime dependencies; this creates/updates npm metadata if needed).
4. Start a local static server:

   ```bash
   npm start
   ```

5. Open the local URL printed in the terminal.

### No-install / offline option

If you do not want to use npm, open `index.html` in a modern browser. ES modules are sometimes restricted when opened via `file://`; if that happens, use a local server. If you have Python installed, run `python -m http.server 8000` in the project directory and visit `http://localhost:8000`. For fully offline use, remove the Google Fonts `<link>` elements from `index.html`; system fallbacks are included.

## Run tests

```bash
npm test
```

The tests use Node's built-in `node:test` and require no test framework install.

## Project structure

```text
pathfinder-ai/
├── index.html          # App shell and UI layout
├── package.json        # Start and test scripts
├── README.md           # Setup, controls, and algorithm notes
├── src/
│   ├── app.js          # DOM, interactions, animation, stats
│   ├── astar.js        # Min-heap, heuristics, A*, Dijkstra, BFS
│   └── styles.css      # Responsive premium dark UI and animations
└── tests/
    └── astar.test.js   # Algorithm unit tests
```

## Controls

- **Wall / Eraser:** select a tool, then click or drag on cells.
- **Start / Goal:** select the tool and click a free cell.
- **Find shortest path:** animate the selected algorithm.
- **Step:** run or advance the visualization one event at a time.
- **Pause / Resume:** pause or continue the animation.
- **Generate random maze:** create a new random obstacle field.
- **Run comparison:** compute all three algorithms against the same grid.
- **Keyboard:** `W` wall, `E` eraser, `S` start, `G` goal, `Space` run/pause, `R` reset.

## Algorithm details

A* minimizes `f(n) = g(n) + h(n)`. With orthogonal movement, `h` is Manhattan distance. With diagonal movement, it uses the octile heuristic and movement costs of `1` and `sqrt(2)`. Diagonal movement cannot pass between two blocked orthogonal neighbors.

Dijkstra uses `h(n) = 0`, so it expands by accumulated path cost. BFS uses a FIFO-equivalent priority ordering and treats every move as unit cost; it is optimal for number of moves, but with diagonal movement enabled it does not minimize geometric path cost. The comparison UI intentionally shows this distinction.

The visualized `execution time` is algorithm computation time, not the time spent animating events. The implementation computes the search result first and then animates its recorded events.

## Testing checklist

1. Run `npm test`; all tests should pass.
2. Click **Find shortest path** on the default map; a route should animate from S to G.
3. Draw a wall and rerun; the route should change.
4. Surround the goal with walls; the app should report no route.
5. Enable diagonal movement; A* should use diagonal steps where beneficial.
6. Click **Step**, then continue clicking Step; events should advance one at a time.
7. Pause and resume a running search.
8. Run comparison and confirm rows for A*, Dijkstra, and BFS appear.
9. Resize to mobile width and verify controls and stats reflow without horizontal page overflow.
