import { describe, expect, it } from "vitest";
import { analyzeGraph, connectedComponents, hasCycle, runKruskal, runPrim, validateGraph, weightedAdjacencyMatrix } from "./mst";
import { METRO_FIBRE, WORKED_EXAMPLE } from "./samples";
import type { NetworkGraph } from "./types";

describe("minimum spanning tree engine", () => {
  it("solves the fully worked example with cost 9", () => {
    const kruskal = runKruskal(WORKED_EXAMPLE);
    const prim = runPrim(WORKED_EXAMPLE, "A");
    expect(kruskal.totalCost).toBe(9);
    expect(prim.totalCost).toBe(9);
    expect(kruskal.edges).toHaveLength(WORKED_EXAMPLE.vertices.length - 1);
    expect(kruskal.edges.map((edge) => edge.id)).toEqual(["BC", "AB", "DE", "BD"]);
  });

  it("independently agrees for a larger graph with tied costs", () => {
    const result = analyzeGraph(METRO_FIBRE, "D");
    expect(result.agree).toBe(true);
    expect(result.kruskal?.valid).toBe(true);
    expect(result.prim?.valid).toBe(true);
    expect(result.kruskal?.totalCost).toBe(result.prim?.totalCost);
  });

  it("rejects cycles and records genuine reject steps", () => {
    const result = runKruskal(WORKED_EXAMPLE);
    expect(hasCycle(WORKED_EXAMPLE.vertices.map((v) => v.id), result.edges)).toBe(false);
    expect(result.steps.some((step) => step.action === "reject" && step.createsCycle)).toBe(true);
  });

  it("returns a minimum spanning forest for a disconnected graph", () => {
    const graph: NetworkGraph = {
      name: "Disconnected", description: "", unit: "₹ lakh",
      vertices: ["A", "B", "C", "D"].map((id) => ({ id, label: id })),
      edges: [{ id: "AB", source: "A", target: "B", cost: 1 }, { id: "CD", source: "C", target: "D", cost: 2 }],
    };
    const result = runKruskal(graph);
    expect(result.connected).toBe(false);
    expect(result.status).toBe("minimum spanning forest");
    expect(result.edges).toHaveLength(2);
    expect(result.components).toHaveLength(2);
    expect(runPrim(graph, "A").totalCost).toBe(3);
  });

  it("handles a single isolated vertex", () => {
    const graph: NetworkGraph = { name: "One", description: "", unit: "₹", vertices: [{ id: "A", label: "A" }], edges: [] };
    const result = runPrim(graph, "A");
    expect(result.totalCost).toBe(0);
    expect(result.edges).toHaveLength(0);
    expect(result.connected).toBe(true);
    expect(result.valid).toBe(true);
  });

  it("finds isolated vertices as separate components", () => {
    const graph: NetworkGraph = { name: "Isolated", description: "", unit: "₹", vertices: ["A", "B", "C"].map((id) => ({ id, label: id })), edges: [{ id: "AB", source: "A", target: "B", cost: 4 }] };
    expect(connectedComponents(graph)).toEqual([["A", "B"], ["C"]]);
  });

  it("rejects negative weights, self-loops, missing endpoints and duplicates", () => {
    const graph: NetworkGraph = {
      name: "Invalid", description: "", unit: "₹", vertices: [{ id: "A", label: "A" }, { id: "B", label: "B" }],
      edges: [
        { id: "negative", source: "A", target: "B", cost: -1 },
        { id: "duplicate", source: "B", target: "A", cost: 2 },
        { id: "loop", source: "A", target: "A", cost: 1 },
        { id: "missing", source: "A", target: "C", cost: 1 },
      ],
    };
    const validation = validateGraph(graph);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toMatch(/nonnegative|Self-loop|Duplicate|missing location/);
  });

  it("builds a symmetric weighted adjacency matrix", () => {
    const matrix = weightedAdjacencyMatrix(WORKED_EXAMPLE);
    expect(matrix[0][0]).toBe(0);
    expect(matrix[0][1]).toBe(2);
    expect(matrix[1][0]).toBe(2);
    expect(matrix[0][4]).toBeNull();
  });

  it("keeps every trace running cost consistent with selected edge IDs", () => {
    for (const result of [runKruskal(WORKED_EXAMPLE), runPrim(WORKED_EXAMPLE, "A")]) {
      for (const step of result.steps) {
        const expected = result.edges.filter((edge) => step.selectedEdgeIds.includes(edge.id)).reduce((sum, edge) => sum + edge.cost, 0);
        expect(step.runningCost).toBe(expected);
      }
    }
  });
});
