import type { MstResult, NetworkGraph } from "./types";

function download(content: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportMstCsv(result: MstResult): void {
  const rows = ["source,target,cost", ...result.edges.map((edge) => `${edge.source},${edge.target},${edge.cost}`)];
  download(rows.join("\n"), "minimum-spanning-tree.csv", "text/csv");
}

export function exportAnalysisJson(graph: NetworkGraph, kruskal: MstResult, prim: MstResult): void {
  download(JSON.stringify({ generatedAt: new Date().toISOString(), graph, kruskal, prim, algorithmsAgree: kruskal.totalCost === prim.totalCost }, null, 2), "network-design-analysis.json", "application/json");
}
