import type { AlgorithmStep, MstResult, NetworkEdge, NetworkGraph, ValidationResult } from "./types";
import { formatCost } from "./currency";

const edgeKey = (edge: NetworkEdge) => [Math.min(edge.cost, Number.MAX_VALUE), ...[edge.source, edge.target].sort(), edge.id] as const;

export function compareEdges(a: NetworkEdge, b: NetworkEdge): number {
  const ak = edgeKey(a);
  const bk = edgeKey(b);
  for (let i = 0; i < ak.length; i += 1) {
    if (ak[i] < bk[i]) return -1;
    if (ak[i] > bk[i]) return 1;
  }
  return 0;
}

export class DisjointSet {
  private readonly parent = new Map<string, string>();
  private readonly size = new Map<string, number>();

  constructor(vertices: string[]) {
    for (const vertex of vertices) {
      this.parent.set(vertex, vertex);
      this.size.set(vertex, 1);
    }
  }

  find(vertex: string): string {
    const parent = this.parent.get(vertex);
    if (parent === undefined) throw new Error(`Unknown vertex: ${vertex}`);
    if (parent !== vertex) this.parent.set(vertex, this.find(parent));
    return this.parent.get(vertex)!;
  }

  union(a: string, b: string): boolean {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return false;
    if ((this.size.get(rootA) ?? 0) < (this.size.get(rootB) ?? 0)) [rootA, rootB] = [rootB, rootA];
    this.parent.set(rootB, rootA);
    this.size.set(rootA, (this.size.get(rootA) ?? 0) + (this.size.get(rootB) ?? 0));
    return true;
  }
}

class MinPriorityQueue<T> {
  private heap: T[] = [];
  constructor(private readonly compare: (a: T, b: T) => number) {}
  get size(): number { return this.heap.length; }
  push(value: T): void {
    this.heap.push(value);
    let index = this.heap.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[parent], value) <= 0) break;
      this.heap[index] = this.heap[parent];
      index = parent;
    }
    this.heap[index] = value;
  }
  pop(): T | undefined {
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length && last !== undefined) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        if (left >= this.heap.length) break;
        let child = left;
        if (right < this.heap.length && this.compare(this.heap[right], this.heap[left]) < 0) child = right;
        if (this.compare(last, this.heap[child]) <= 0) break;
        this.heap[index] = this.heap[child];
        index = child;
      }
      this.heap[index] = last;
    }
    return root;
  }
}

export function validateGraph(graph: NetworkGraph): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const vertex of graph.vertices) {
    if (!vertex.id.trim() || !vertex.label.trim()) errors.push("Every location needs a non-empty ID and label.");
    if (ids.has(vertex.id)) errors.push(`Duplicate location ID: ${vertex.id}.`);
    ids.add(vertex.id);
  }
  const pairs = new Set<string>();
  for (const edge of graph.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) errors.push(`Connection ${edge.id} refers to a missing location.`);
    if (edge.source === edge.target) errors.push(`Self-loop ${edge.id} is not allowed.`);
    if (!Number.isFinite(edge.cost) || edge.cost < 0) errors.push(`Connection ${edge.id} must have a finite, nonnegative cost.`);
    const pair = [edge.source, edge.target].sort().join("::");
    if (pairs.has(pair)) errors.push(`Duplicate connection between ${edge.source} and ${edge.target}.`);
    pairs.add(pair);
  }
  if (graph.vertices.length === 0) errors.push("Add at least one location.");
  if (graph.vertices.length > 1 && graph.edges.length === 0) warnings.push("The locations are disconnected because no connections are available.");
  return { valid: errors.length === 0, errors, warnings };
}

export function buildAdjacencyList(graph: NetworkGraph): Map<string, NetworkEdge[]> {
  const adjacency = new Map(graph.vertices.map((vertex) => [vertex.id, [] as NetworkEdge[]]));
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge);
    adjacency.get(edge.target)?.push(edge);
  }
  for (const edges of adjacency.values()) edges.sort(compareEdges);
  return adjacency;
}

export function weightedAdjacencyMatrix(graph: NetworkGraph): (number | null)[][] {
  const index = new Map(graph.vertices.map((vertex, i) => [vertex.id, i]));
  const matrix: (number | null)[][] = graph.vertices.map((_, row) => graph.vertices.map((__, column): number | null => row === column ? 0 : null));
  for (const edge of graph.edges) {
    const a = index.get(edge.source);
    const b = index.get(edge.target);
    if (a !== undefined && b !== undefined) matrix[a][b] = matrix[b][a] = edge.cost;
  }
  return matrix;
}

export function connectedComponents(graph: NetworkGraph): string[][] {
  const adjacency = buildAdjacencyList(graph);
  const visited = new Set<string>();
  const components: string[][] = [];
  for (const vertex of graph.vertices.map((v) => v.id).sort()) {
    if (visited.has(vertex)) continue;
    const queue = [vertex];
    const component: string[] = [];
    visited.add(vertex);
    while (queue.length) {
      const current = queue.shift()!;
      component.push(current);
      for (const edge of adjacency.get(current) ?? []) {
        const next = edge.source === current ? edge.target : edge.source;
        if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
    }
    components.push(component.sort());
  }
  return components;
}

function finalizeResult(graph: NetworkGraph, algorithm: "Kruskal" | "Prim", selected: NetworkEdge[], processedEdges: number, steps: AlgorithmStep[]): MstResult {
  const components = connectedComponents(graph);
  const connected = components.length <= 1;
  const expectedEdges = Math.max(0, graph.vertices.length - components.length);
  const totalCost = selected.reduce((sum, edge) => sum + edge.cost, 0);
  const candidateCost = graph.edges.reduce((sum, edge) => sum + edge.cost, 0);
  const valid = selected.length === expectedEdges && !hasCycle(graph.vertices.map((v) => v.id), selected);
  steps.push({
    index: steps.length,
    action: "complete",
    title: connected ? "Minimum spanning tree complete" : "Minimum spanning forest complete",
    explanation: connected
      ? `${selected.length} = |V| − 1 edges connect every location with total cost ${formatCost(totalCost, graph.unit)}.`
      : `A single spanning tree is impossible: the graph has ${components.length} components. The forest contains ${selected.length} edges.`,
    selectedEdgeIds: selected.map((edge) => edge.id),
    runningCost: totalCost,
  });
  return { algorithm, edges: selected, totalCost, candidateCost, processedEdges, components, connected, valid, status: connected ? "minimum spanning tree" : "minimum spanning forest", steps };
}

export function hasCycle(vertices: string[], edges: NetworkEdge[]): boolean {
  const dsu = new DisjointSet(vertices);
  return edges.some((edge) => !dsu.union(edge.source, edge.target));
}

export function runKruskal(graph: NetworkGraph): MstResult {
  const validation = validateGraph(graph);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const dsu = new DisjointSet(graph.vertices.map((v) => v.id));
  const sorted = [...graph.edges].sort(compareEdges);
  const selected: NetworkEdge[] = [];
  const steps: AlgorithmStep[] = [{ index: 0, action: "start", title: "Sort all connections", explanation: `Order edges by nondecreasing cost: ${sorted.map((e) => `${e.source}–${e.target} (${e.cost})`).join(", ") || "none"}.`, selectedEdgeIds: [], runningCost: 0 }];
  let processed = 0;
  const target = Math.max(0, graph.vertices.length - connectedComponents(graph).length);
  for (const edge of sorted) {
    if (selected.length === target) break;
    processed += 1;
    const createsCycle = dsu.find(edge.source) === dsu.find(edge.target);
    steps.push({ index: steps.length, action: "inspect", title: `Inspect ${edge.source}–${edge.target}`, explanation: `This is the next lowest-cost remaining edge (cost ${formatCost(edge.cost, graph.unit)}).`, edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), createsCycle });
    if (createsCycle) {
      steps.push({ index: steps.length, action: "reject", title: "Reject: cycle detected", explanation: `${edge.source} and ${edge.target} are already connected, so adding this edge would create a cycle.`, edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), createsCycle: true });
    } else {
      dsu.union(edge.source, edge.target);
      selected.push(edge);
      steps.push({ index: steps.length, action: "accept", title: "Accept edge", explanation: `The edge joins two different components. Running cost becomes ${formatCost(selected.reduce((sum, e) => sum + e.cost, 0), graph.unit)}.`, edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), createsCycle: false });
    }
  }
  return finalizeResult(graph, "Kruskal", selected, processed, steps);
}

export function runPrim(graph: NetworkGraph, requestedStart?: string): MstResult {
  const validation = validateGraph(graph);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const adjacency = buildAdjacencyList(graph);
  const orderedVertices = graph.vertices.map((v) => v.id).sort();
  const starts = requestedStart && orderedVertices.includes(requestedStart)
    ? [requestedStart, ...orderedVertices.filter((id) => id !== requestedStart)]
    : orderedVertices;
  const visited = new Set<string>();
  const selected: NetworkEdge[] = [];
  const steps: AlgorithmStep[] = [];
  let processed = 0;
  for (const start of starts) {
    if (visited.has(start)) continue;
    visited.add(start);
    const queue = new MinPriorityQueue<NetworkEdge>(compareEdges);
    for (const edge of adjacency.get(start) ?? []) queue.push(edge);
    steps.push({ index: steps.length, action: "start", title: steps.length ? `Start next component at ${start}` : `Start at ${start}`, explanation: `Visit ${start} and place all incident edges in the minimum-priority frontier.`, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), visited: [...visited].sort(), frontierEdgeIds: (adjacency.get(start) ?? []).map((e) => e.id) });
    while (queue.size) {
      const edge = queue.pop()!;
      const sourceVisited = visited.has(edge.source);
      const targetVisited = visited.has(edge.target);
      processed += 1;
      const frontier = graph.edges.filter((candidate) => visited.has(candidate.source) !== visited.has(candidate.target)).sort(compareEdges);
      steps.push({ index: steps.length, action: "inspect", title: `Choose frontier minimum ${edge.source}–${edge.target}`, explanation: `The minimum queued edge costs ${formatCost(edge.cost, graph.unit)}.`, edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), visited: [...visited].sort(), frontierEdgeIds: frontier.map((e) => e.id), createsCycle: sourceVisited && targetVisited });
      if (sourceVisited && targetVisited) {
        steps.push({ index: steps.length, action: "reject", title: "Skip stale edge", explanation: "Both endpoints are already in the tree, so this edge would create a cycle.", edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), visited: [...visited].sort(), frontierEdgeIds: frontier.map((e) => e.id), createsCycle: true });
        continue;
      }
      const next = sourceVisited ? edge.target : edge.source;
      selected.push(edge);
      visited.add(next);
      for (const candidate of adjacency.get(next) ?? []) {
        const other = candidate.source === next ? candidate.target : candidate.source;
        if (!visited.has(other)) queue.push(candidate);
      }
      const nextFrontier = graph.edges.filter((candidate) => visited.has(candidate.source) !== visited.has(candidate.target)).sort(compareEdges);
      steps.push({ index: steps.length, action: "accept", title: `Add ${next} to the tree`, explanation: `Accept ${edge.source}–${edge.target}; running cost becomes ${formatCost(selected.reduce((sum, e) => sum + e.cost, 0), graph.unit)}.`, edge, selectedEdgeIds: selected.map((e) => e.id), runningCost: selected.reduce((sum, e) => sum + e.cost, 0), visited: [...visited].sort(), frontierEdgeIds: nextFrontier.map((e) => e.id), createsCycle: false });
    }
  }
  return finalizeResult(graph, "Prim", selected, processed, steps);
}

export function analyzeGraph(graph: NetworkGraph, start?: string) {
  const validation = validateGraph(graph);
  if (!validation.valid) return { validation, kruskal: null, prim: null, agree: false };
  const kruskal = runKruskal(graph);
  const prim = runPrim(graph, start);
  return { validation, kruskal, prim, agree: kruskal.totalCost === prim.totalCost };
}
