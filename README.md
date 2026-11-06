<p align="center">
  <img src="public/network-design-studio-logo.png" width="420" alt="Network Design Studio logo" />
</p>

<h1 align="center">Network Design Studio</h1>

<p align="center"><strong>A mathematically verifiable minimum spanning tree laboratory for cost-effective network design.</strong></p>

<p align="center">
  <a href="https://network-design-studio-xi.vercel.app">Live application</a> ·
  <a href="https://github.com/DSGAMING98/network-design-studio">Source</a> ·
  <a href="docs/PROJECT_REPORT.md">Project report</a>
</p>

## Official problem statement

**Topic 4 — Minimum Spanning Tree for Cost-Effective Network Design**

> Build a minimum-cost connected network and provide a quantitative comparison of Kruskal's and Prim's algorithms.

The application directly demonstrates trees, spanning trees, weighted graphs, minimum spanning trees, Kruskal's algorithm, and Prim's algorithm. Every displayed result is derived from the current graph in the browser.

## Verified worked result

The default Campus Backbone graph contains five locations and eight candidate connections.

| Quantity | Verified result |
| --- | ---: |
| Candidate edges | AB₂, AC₃, BC₁, BD₄, CD₅, CE₆, DE₂, BE₇ |
| Cost of every candidate | ₹ 30 lakh |
| Kruskal MST | BC₁, AB₂, DE₂, BD₄ |
| Prim MST from A | AB₂, BC₁, BD₄, DE₂ |
| Minimum total cost | **₹ 9 lakh** |
| Cost avoided | **₹ 21 lakh (70%)** |
| Edge-count certificate | 4 = 5 − 1 |
| Kruskal/Prim agreement | **Yes — ₹ 9 lakh = ₹ 9 lakh** |

The different edge order is expected because the algorithms use different greedy views. The final edge set and cost agree for this example.

## Features

- Real-time dashboard with location count, candidate cost, MST cost, savings, components, and validity
- Location and weighted-connection editor
- CSV upload, validation, and downloadable example
- Three sample network scenarios
- Cytoscape.js visualization with MST highlighting, zoom, pan, drag, fit, reset, search, and PNG export
- Step-forward, step-backward, restart, play, and pause controls for both algorithms
- Kruskal trace with sorted edges, DSU cycle decisions, selected set, and running cost
- Prim trace with start vertex, visited set, priority frontier, selected edge, and running cost
- Quantitative algorithm comparison using the same input graph
- Fully worked, hand-verifiable example for both algorithms
- Adjacency list and weighted adjacency matrix
- CSV, JSON, PNG, and print-ready exports
- Polished navy-and-blue visual system based on the official project logo
- Light and dark themes with responsive desktop/mobile layout
- Explicit minimum spanning forest handling for disconnected graphs

## Mathematical engine

The graph is an undirected weighted graph `G = (V, E, w)` with nonnegative edge costs.

### Kruskal

1. Sort edges by `(cost, normalized endpoints, edge ID)`.
2. Maintain components using Disjoint Set Union.
3. Accept an edge only when its endpoints have different representatives.
4. Stop after selecting the number of edges required by the graph's components.

Complexity: `O(E log E)`. DSU uses path compression and union by size.

### Prim

1. Visit a chosen start vertex.
2. Push its incident edges into a binary min-priority queue.
3. Repeatedly extract the cheapest edge that reaches an unvisited vertex.
4. Add the new vertex and its outgoing frontier edges.

Complexity with adjacency lists and a binary heap: `O(E log V)`.

### Verification invariants

For a connected graph, the application verifies that the output:

- contains exactly `|V| − 1` edges;
- contains no cycle;
- connects every vertex;
- has equal total cost under independent Kruskal and Prim implementations.

For a disconnected graph, the interface explicitly reports that a spanning tree is impossible and returns a minimum spanning forest with `|V| − c` edges for `c` components.

## Architecture

```text
src/
├── app/                    Next.js App Router shell, metadata, styles
├── components/
│   ├── NetworkDesignStudio.tsx  Product workspace and simulators
│   └── NetworkCanvas.tsx        Cytoscape visualization and PNG export
└── lib/
    ├── mst.ts              DSU, heap, validation, Kruskal, Prim, traces
    ├── samples.ts          Three deterministic network scenarios
    ├── csv.ts              PapaParse import and example format
    ├── export.ts           CSV and JSON evidence export
    └── types.ts            Typed graph and algorithm contracts
```

No backend, account, database, paid API, or external AI service is used. Data remains in the browser.

## CSV format

Use a header row followed by one undirected connection per row:

```csv
source,target,cost
A,B,2
A,C,3
B,C,1
```

Costs must be finite and nonnegative. The validator rejects malformed rows, self-loops, duplicate undirected pairs, missing endpoints, and negative weights.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Verified on 6 November 2026:

- TypeScript: passed
- ESLint: passed with zero warnings
- Vitest: 13 tests passed
- Next.js production build: passed
- Production dependency audit: 0 vulnerabilities
- Browser QA: dashboard, visualizer, Kruskal controls, and comparison lab verified

Test coverage includes known MSTs, independent Kruskal and Prim results, equal optimal cost, cycles, tied weights, disconnected graphs, a single vertex, isolated vertices, invalid weights, duplicates, adjacency matrices, edge counts, costs, CSV parsing, and trace consistency.

## Technology

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Cytoscape.js · PapaParse · Vitest · Lucide icons · Vercel

## DMGT experiential-learning relevance

The project turns abstract greedy proofs into observable state changes. Students can inspect each safe edge, cycle rejection, cut frontier, component merge, and running sum. The worked example can be recalculated by hand and checked against two independently implemented algorithms.

## Limitations and future scope

- Costs are deterministic scalar values; uncertainty and multi-objective optimization are outside scope.
- The graph is undirected because MSTs are defined here for undirected networks.
- Browser layouts are intended for classroom-scale graphs rather than millions of edges.
- Future work could add sensitivity analysis, second-best MSTs, and formal cut visualizations.

## Academic documentation

The repository includes a formal [project report](docs/PROJECT_REPORT.md) documenting the problem statement, mathematical foundation, implementation, validation, results, limitations, and conclusion. This is an independent combinatorial-optimization application for the official DMGT Topic 4 outcome.

## License

Created for DMGT experiential learning and academic demonstration.
