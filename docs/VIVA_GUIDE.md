# Network Design Studio — Viva Guide

## 30-second introduction

Network Design Studio solves Topic 4: Minimum Spanning Tree for Cost-Effective Network Design. A user supplies locations and possible undirected connections with nonnegative costs. The application independently runs Kruskal's and Prim's algorithms, visualizes the selected MST, records every decision, verifies connectivity and acyclicity, and compares both minimum costs.

## Core definitions

- **Weighted graph:** `G = (V, E, w)`, where `w(e)` is a numerical edge cost.
- **Tree:** a connected acyclic undirected graph.
- **Spanning tree:** a tree containing every vertex of the original connected graph.
- **MST:** a spanning tree minimizing `Σ w(e)`.
- **Forest:** a disjoint collection of trees; returned when the graph is disconnected.

## Fully worked example

Vertices: `V = {A, B, C, D, E}`

Candidate edges:

| Edge | Cost (₹ lakh) |
| --- | ---: |
| BC | 1 |
| AB | 2 |
| DE | 2 |
| AC | 3 |
| BD | 4 |
| CD | 5 |
| CE | 6 |
| BE | 7 |

Candidate cost = `1 + 2 + 2 + 3 + 4 + 5 + 6 + 7 = 30`.

### Kruskal decisions

1. Accept BC(1): B and C are in different components. Cost = 1.
2. Accept AB(2): A joins component {B,C}. Cost = 3.
3. Accept DE(2): D and E are different. Cost = 5.
4. Reject AC(3): A and C are already connected; a cycle would form.
5. Accept BD(4): joins {A,B,C} to {D,E}. Cost = 9.

MST = `{BC, AB, DE, BD}`. It has four edges, exactly `|V| − 1 = 4`.

### Prim decisions from A

1. Start visited set `{A}`; frontier `{AB(2), AC(3)}`.
2. Accept AB(2); visited `{A,B}`; cost = 2.
3. Accept BC(1); visited `{A,B,C}`; cost = 3.
4. Skip AC(3) when extracted because both endpoints are visited.
5. Accept BD(4); visited `{A,B,C,D}`; cost = 7.
6. Accept DE(2); visited all vertices; cost = 9.

Both algorithms return the same minimum cost: `₹ 9 lakh`. Savings relative to all candidate edges are `₹ 30 lakh − ₹ 9 lakh = ₹ 21 lakh`, or `21/30 × 100 = 70%`.

## Likely viva questions

### Why is the result a tree?

It is acyclic because each accepted Kruskal edge joins different DSU components and each Prim edge adds a new vertex. It is connected and contains all vertices. A connected acyclic graph is a tree.

### Why exactly V−1 edges?

Every tree on `V` vertices has exactly `V−1` edges. Fewer cannot connect all vertices; more must introduce a cycle.

### Why is Kruskal greedy choice safe?

The cheapest edge joining two current components is a light edge across a cut. By the cut property, a light edge is contained in some MST.

### Why is Prim greedy choice safe?

The visited and unvisited vertices define a cut. Prim selects a minimum-weight edge crossing that cut, which is safe by the cut property.

### Can Kruskal and Prim select different edges?

Yes, when multiple equal-weight choices create multiple valid MSTs. Their edge sets can differ, but all MSTs have the same total cost.

### What data structure makes Kruskal efficient?

Disjoint Set Union with path compression and union by size. `find` identifies a component and `union` merges two components.

### What data structure makes Prim efficient?

A binary min-priority queue holding frontier edges, combined with an adjacency list.

### What happens for a disconnected graph?

A spanning tree cannot exist. The application says this explicitly and returns a minimum spanning forest, one minimum tree per component.

### Why prohibit negative costs?

The academic model defines nonnegative installation costs. MST algorithms can mathematically handle negative weights, but rejecting them enforces the stated real-world cost domain.

### Time complexities

- Kruskal: `O(E log E)` due to sorting.
- Prim with a binary heap: `O(E log V)`.
- Connectivity by BFS: `O(V + E)`.

## Code map

- `src/lib/mst.ts`: validation, DSU, heap, connectivity, Kruskal, Prim, traces.
- `src/lib/mst.test.ts`: mathematical verification cases.
- `src/components/NetworkCanvas.tsx`: Cytoscape weighted network.
- `src/components/NetworkDesignStudio.tsx`: editor, simulators, comparison, learning screens.

## Demonstration sequence

1. Open the Design Summary and state the official outcome.
2. Point to candidate cost ₹ 30 lakh and minimum cost ₹ 9 lakh.
3. Open the Network Visualizer and identify the bright-blue MST edges.
4. Advance Kruskal until AC is rejected as a cycle.
5. Advance Prim and describe the visited cut/frontier.
6. Open Algorithm Comparison and show `₹ 9 lakh = ₹ 9 lakh`.
7. Open DMGT Mathematics to show adjacency representations and correctness reasoning.
