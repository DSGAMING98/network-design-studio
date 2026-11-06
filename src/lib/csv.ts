import Papa from "papaparse";
import type { NetworkGraph } from "./types";

interface CsvRow { source?: string; target?: string; cost?: string; }

export const EXAMPLE_CSV = `source,target,cost\nA,B,2\nA,C,3\nB,C,1\nB,D,4\nC,D,5\nC,E,6\nD,E,2\nB,E,7\n`;

export function parseNetworkCsv(text: string, name = "Imported Network"): NetworkGraph {
  const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim().toLowerCase() });
  if (result.errors.length) throw new Error(result.errors[0].message);
  const vertices = new Map<string, { id: string; label: string }>();
  const edges = result.data.map((row, index) => {
    const source = String(row.source ?? "").trim();
    const target = String(row.target ?? "").trim();
    const cost = Number(row.cost);
    if (!source || !target || !Number.isFinite(cost)) throw new Error(`Row ${index + 2} must contain source, target, and a numeric cost.`);
    vertices.set(source, { id: source, label: source });
    vertices.set(target, { id: target, label: target });
    return { id: `csv-${index + 1}`, source, target, cost };
  });
  return { name, description: "Network imported from CSV.", unit: "₹ lakh", vertices: [...vertices.values()], edges };
}
