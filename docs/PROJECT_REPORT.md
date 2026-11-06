# Minimum Spanning Tree for Cost-Effective Network Design

## Abstract

This project implements an interactive web application that designs a minimum-cost connected network from a set of locations and candidate weighted connections. It independently implements Kruskal's and Prim's minimum spanning tree algorithms, records complete decision traces, visualizes the resulting network, and verifies equality of the optimal costs. The system is designed for the official DMGT Topic 4 expected outcome: a minimum-cost connected network with a quantitative comparison of the two algorithms.

## 1. Problem statement

Infrastructure planners may have multiple feasible links between locations, each with a known installation cost. Installing every link is unnecessarily expensive. The objective is to select a subset that connects all locations without cycles and minimizes total cost.

Given an undirected weighted graph `G = (V, E, w)`, find a spanning tree `T ⊆ E` minimizing:

`W(T) = Σ_{e∈T} w(e)`

## 2. Objectives

1. Represent candidate network designs as weighted undirected graphs.
2. Implement Kruskal's and Prim's algorithms independently.
3. Expose every algorithm decision for academic verification.
4. Quantitatively compare cost, processed edges, trace steps, and complexity.
5. Validate connectivity, acyclicity, and the `|V|−1` property.
6. Support user-defined and CSV-defined networks.
7. Produce evidence through CSV, JSON, PNG, and print exports.

## 3. Scope

The application supports finite, nonnegative scalar costs and undirected graphs. It runs locally in the browser and requires no backend. Disconnected graphs are reported as incapable of containing one spanning tree; a minimum spanning forest is shown instead.

## 4. Mathematical foundation

### 4.1 Graph and tree

A graph consists of vertices and edges. A tree is a connected graph without cycles. Every tree with `n` vertices has `n−1` edges.

### 4.2 Spanning tree and MST

A spanning tree contains every original vertex. An MST is a spanning tree whose edge-weight sum is no greater than any other spanning tree.

### 4.3 Cut property

For any partition of vertices into two sets, a lightest edge crossing the cut is safe: it belongs to at least one MST. Prim repeatedly uses this property.

### 4.4 Cycle property

An edge that closes a cycle need not be retained. Kruskal uses DSU to reject cycle-forming edges.

## 5. Algorithms

### 5.1 Kruskal

Edges are sorted deterministically by cost, normalized endpoints, and ID. DSU initially assigns every vertex to its own set. An edge is accepted exactly when its endpoints have different representatives. Path compression and union by size improve efficiency. Complexity is `O(E log E)`.

### 5.2 Prim

The algorithm starts from a selected vertex. A binary min-heap stores frontier edges. The cheapest edge leading to an unvisited vertex is accepted, and the new vertex's incident edges are added. Complexity is `O(E log V)` with adjacency lists and a binary heap.

## 6. Worked example

`V = {A, B, C, D, E}` and:

`E = {AB₂, AC₃, BC₁, BD₄, CD₅, CE₆, DE₂, BE₇}`

All-edge cost is `30 ₹ lakh`.

Kruskal sorts the edges and makes these decisions:

| Step | Edge | Decision | Running cost |
| ---: | --- | --- | ---: |
| 1 | BC(1) | Accept; distinct components | 1 |
| 2 | AB(2) | Accept; distinct components | 3 |
| 3 | DE(2) | Accept; distinct components | 5 |
| 4 | AC(3) | Reject; cycle | 5 |
| 5 | BD(4) | Accept; connects remaining components | 9 |

Prim from A accepts AB(2), BC(1), BD(4), and DE(2), reaching the same total 9. The network avoids `30−9=21 ₹ lakh`, a `70%` reduction. Four selected edges equal `5−1`, and the graph is connected and acyclic.

## 7. System design

The presentation layer uses Next.js, React, TypeScript, Tailwind CSS, and a custom responsive design system. Cytoscape.js renders the weighted graph. PapaParse handles CSV input. The mathematical layer is framework-independent TypeScript and contains validation, adjacency generation, BFS components, DSU, heap, Kruskal, Prim, and trace generation.

## 8. Functional modules

- Dashboard and validity certificate
- Network editor and sample scenarios
- CSV import and example download
- Interactive weighted graph visualizer
- Kruskal and Prim simulators
- Quantitative comparison lab
- DMGT concepts and representations
- Result and evidence exports

## 9. Validation strategy

Automated tests cover known MSTs, ties, cycles, disconnected graphs, isolated and single vertices, invalid inputs, duplicate edges, adjacency matrices, trace totals, and CSV parsing. TypeScript, ESLint, Vitest, the Next.js production compiler, and a production dependency audit are executed before deployment.

Verified result: 12 tests pass; type checking, linting, and production build pass; production dependency audit reports zero vulnerabilities.

## 10. Results

The default example demonstrates the expected outcome directly. Kruskal and Prim independently produce an MST cost of ₹9 lakh. The UI provides both decision sequences, highlights selected links, and quantifies savings against full installation.

## 11. Limitations

The project does not model directed networks, stochastic costs, capacity constraints, or multi-objective optimization. Visualization is intended for educational and small-to-medium planning graphs.

## 12. Future scope

Potential extensions include second-best MST computation, sensitivity analysis under cost changes, formal cut animation, capacity-aware design, and comparison against Borůvka's algorithm.

## 13. Conclusion

Network Design Studio converts an abstract DMGT topic into a reproducible optimization workflow. The project satisfies the official requirement through a minimum-cost connected design, two independently implemented algorithms, quantitative comparison, a complete worked example, and mechanically verifiable correctness conditions.
