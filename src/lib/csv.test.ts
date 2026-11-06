import { describe, expect, it } from "vitest";
import { EXAMPLE_CSV, parseNetworkCsv } from "./csv";
import { analyzeGraph } from "./mst";

describe("network CSV parser", () => {
  it("parses the downloadable example into a verifiable graph", () => {
    const graph = parseNetworkCsv(EXAMPLE_CSV);
    expect(graph.vertices).toHaveLength(5);
    expect(graph.edges).toHaveLength(8);
    expect(analyzeGraph(graph).kruskal?.totalCost).toBe(9);
  });

  it("rejects malformed rows", () => {
    expect(() => parseNetworkCsv("source,target,cost\nA,B,nope")).toThrow(/numeric cost/);
    expect(() => parseNetworkCsv("source,target,cost\nA,,2")).toThrow(/source, target/);
  });
});
