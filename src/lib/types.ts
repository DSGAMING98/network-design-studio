export interface NetworkVertex {
  id: string;
  label: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  cost: number;
}

export interface NetworkGraph {
  name: string;
  description: string;
  unit: string;
  vertices: NetworkVertex[];
  edges: NetworkEdge[];
}

export type AlgorithmName = "Kruskal" | "Prim";
export type StepAction = "start" | "inspect" | "accept" | "reject" | "complete";

export interface AlgorithmStep {
  index: number;
  action: StepAction;
  title: string;
  explanation: string;
  edge?: NetworkEdge;
  selectedEdgeIds: string[];
  runningCost: number;
  visited?: string[];
  frontierEdgeIds?: string[];
  createsCycle?: boolean;
}

export interface MstResult {
  algorithm: AlgorithmName;
  edges: NetworkEdge[];
  totalCost: number;
  candidateCost: number;
  processedEdges: number;
  components: string[][];
  connected: boolean;
  valid: boolean;
  status: "minimum spanning tree" | "minimum spanning forest";
  steps: AlgorithmStep[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
