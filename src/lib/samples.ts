import type { NetworkGraph } from "./types";

const edge = (id: string, source: string, target: string, cost: number) => ({ id, source, target, cost });
const vertex = (id: string, label = id) => ({ id, label });

export const WORKED_EXAMPLE: NetworkGraph = {
  name: "Campus Backbone — Worked Example",
  description: "Five campus buildings and eight candidate fibre links. Designed for hand verification.",
  unit: "₹ lakh",
  vertices: [vertex("A", "Admin"), vertex("B", "Library"), vertex("C", "Labs"), vertex("D", "Hostel"), vertex("E", "Sports")],
  edges: [
    edge("AB", "A", "B", 2), edge("AC", "A", "C", 3), edge("BC", "B", "C", 1), edge("BD", "B", "D", 4),
    edge("CD", "C", "D", 5), edge("CE", "C", "E", 6), edge("DE", "D", "E", 2), edge("BE", "B", "E", 7),
  ],
};

export const METRO_FIBRE: NetworkGraph = {
  name: "Metro Fibre Ring",
  description: "Eight city zones with tied costs and alternative optimal links.",
  unit: "₹ lakh",
  vertices: "ABCDEFGH".split("").map((id) => vertex(id, `Zone ${id}`)),
  edges: [
    edge("AB", "A", "B", 4), edge("AC", "A", "C", 3), edge("BC", "B", "C", 2), edge("BD", "B", "D", 5),
    edge("CD", "C", "D", 4), edge("CE", "C", "E", 6), edge("DE", "D", "E", 1), edge("DF", "D", "F", 7),
    edge("EF", "E", "F", 3), edge("EG", "E", "G", 5), edge("FG", "F", "G", 2), edge("FH", "F", "H", 6),
    edge("GH", "G", "H", 3), edge("AH", "A", "H", 9), edge("CH", "C", "H", 8),
  ],
};

export const RURAL_GRID: NetworkGraph = {
  name: "Rural Power Grid",
  description: "Six villages connected through a sparse set of feasible power lines.",
  unit: "₹ lakh",
  vertices: [vertex("P", "Pipalgaon"), vertex("Q", "Qasba"), vertex("R", "Rampur"), vertex("S", "Sitapur"), vertex("T", "Tilakpur"), vertex("U", "Udaipur")],
  edges: [edge("PQ", "P", "Q", 8), edge("PR", "P", "R", 5), edge("QR", "Q", "R", 6), edge("QS", "Q", "S", 7), edge("RS", "R", "S", 4), edge("RT", "R", "T", 9), edge("ST", "S", "T", 3), edge("SU", "S", "U", 8), edge("TU", "T", "U", 2)],
};

export const SAMPLE_NETWORKS = [WORKED_EXAMPLE, METRO_FIBRE, RURAL_GRID];

export function cloneNetwork(graph: NetworkGraph): NetworkGraph {
  return { ...graph, vertices: graph.vertices.map((v) => ({ ...v })), edges: graph.edges.map((e) => ({ ...e })) };
}
