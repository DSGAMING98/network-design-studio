"use client";

import dynamic from "next/dynamic";
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleDollarSign,
  Download, FileJson, FileSpreadsheet, GitBranch, Grid3X3, Maximize2, Menu, Moon, Network, Pause, Pencil,
  Play, Plus, Printer, RefreshCw, RotateCcw, Search, ShieldCheck, Sun, Trash2, TreePine, Upload, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { NetworkCanvasHandle } from "./NetworkCanvas";
import { analyzeGraph, buildAdjacencyList, weightedAdjacencyMatrix } from "@/lib/mst";
import { EXAMPLE_CSV, parseNetworkCsv } from "@/lib/csv";
import { exportAnalysisJson, exportMstCsv } from "@/lib/export";
import { cloneNetwork, SAMPLE_NETWORKS, WORKED_EXAMPLE } from "@/lib/samples";
import type { MstResult, NetworkGraph } from "@/lib/types";

const NetworkCanvas = dynamic(() => import("./NetworkCanvas").then((module) => module.NetworkCanvas), { ssr: false, loading: () => <div className="canvas-loading">Preparing interactive network…</div> });

type Section = "dashboard" | "editor" | "network" | "kruskal" | "prim" | "compare" | "mathematics" | "results";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Network }[] = [
  { id: "dashboard", label: "Design summary", icon: Activity },
  { id: "editor", label: "Network editor", icon: Pencil },
  { id: "network", label: "Network visualizer", icon: Network },
  { id: "kruskal", label: "Kruskal simulator", icon: GitBranch },
  { id: "prim", label: "Prim simulator", icon: TreePine },
  { id: "compare", label: "Algorithm comparison", icon: Grid3X3 },
  { id: "mathematics", label: "DMGT mathematics", icon: BookOpen },
  { id: "results", label: "Results & export", icon: Download },
];

function formatCost(value: number, unit: string): string { return `${value.toLocaleString("en-IN")} ${unit}`; }

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="section-heading"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></header>;
}

function MetricCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

function EdgePill({ edge, unit }: { edge: { source: string; target: string; cost: number }; unit: string }) {
  return <span className="edge-pill"><b>{edge.source}—{edge.target}</b><small>{edge.cost} {unit}</small></span>;
}

function Simulator({ title, subtitle, result, index, setIndex, playing, setPlaying, unit }: { title: string; subtitle: string; result: MstResult; index: number; setIndex: (value: number | ((current: number) => number)) => void; playing: boolean; setPlaying: (value: boolean) => void; unit: string }) {
  const step = result.steps[Math.min(index, result.steps.length - 1)];
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setIndex((current) => {
      if (current >= result.steps.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 900);
    return () => window.clearInterval(timer);
  }, [playing, result.steps.length, setIndex, setPlaying]);

  return <div className="simulator-grid">
    <div className="simulator-stage">
      <div className="simulator-top"><div><span className="eyebrow">LIVE EXECUTION TRACE</span><h3>{title}</h3><p>{subtitle}</p></div><div className={`decision-badge ${step.action}`}>{step.action}</div></div>
      <div className="step-counter"><span>Step {index + 1} of {result.steps.length}</span><div><i style={{ width: `${((index + 1) / result.steps.length) * 100}%` }} /></div></div>
      <article className="current-decision">
        <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
        <div><h4>{step.title}</h4><p>{step.explanation}</p>{step.edge ? <EdgePill edge={step.edge} unit={unit} /> : null}</div>
      </article>
      <div className="sim-controls">
        <button className="icon-button" aria-label="Restart simulation" onClick={() => { setPlaying(false); setIndex(0); }}><RotateCcw size={17} /></button>
        <button className="icon-button" aria-label="Previous step" disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))}><ArrowLeft size={17} /></button>
        <button className="primary compact" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={17} /> : <Play size={17} />}{playing ? "Pause" : "Play trace"}</button>
        <button className="icon-button" aria-label="Next step" disabled={index >= result.steps.length - 1} onClick={() => setIndex(Math.min(result.steps.length - 1, index + 1))}><ArrowRight size={17} /></button>
      </div>
    </div>
    <aside className="trace-state">
      <span className="eyebrow">CURRENT STATE</span>
      <div className="state-value"><small>Running cost</small><strong>{formatCost(step.runningCost, unit)}</strong></div>
      <div><small>Selected edges</small><div className="pill-wrap">{step.selectedEdgeIds.length ? step.selectedEdgeIds.map((id) => <span className="mini-pill" key={id}>{id}</span>) : <em>None yet</em>}</div></div>
      {step.visited ? <div><small>Visited vertices</small><div className="pill-wrap">{step.visited.map((id) => <span className="mini-pill visited" key={id}>{id}</span>)}</div></div> : null}
      {step.frontierEdgeIds ? <div><small>Frontier edges</small><div className="pill-wrap">{step.frontierEdgeIds.length ? step.frontierEdgeIds.map((id) => <span className="mini-pill muted" key={id}>{id}</span>) : <em>Empty</em>}</div></div> : null}
      <div><small>Cycle test</small><p className={step.createsCycle ? "danger-text" : "success-text"}>{step.createsCycle === undefined ? "Not applicable" : step.createsCycle ? "Cycle would form" : "No cycle"}</p></div>
    </aside>
  </div>;
}

function AlgorithmTraceTable({ result, unit }: { result: MstResult; unit: string }) {
  const decisions = result.steps.filter((step) => step.action === "accept" || step.action === "reject");
  return <div className="trace-table-wrap"><table className="data-table trace-table"><thead><tr><th>#</th><th>Edge</th><th>Decision</th><th>Reason</th><th>Running cost</th></tr></thead><tbody>{decisions.map((step, index) => <tr key={`${result.algorithm}-${step.index}`}><td>{index + 1}</td><td>{step.edge ? `${step.edge.source}—${step.edge.target} (${step.edge.cost})` : "—"}</td><td><span className={`table-status ${step.action}`}>{step.action}</span></td><td>{step.explanation}</td><td>{formatCost(step.runningCost, unit)}</td></tr>)}</tbody></table></div>;
}

function WorkedExample({ kruskal, prim }: { kruskal: MstResult; prim: MstResult }) {
  const saving = kruskal.candidateCost - kruskal.totalCost;
  return <section className="worked-example">
    <div className="worked-intro"><span className="eyebrow">FULLY WORKED & HAND-VERIFIABLE</span><h3>Campus Backbone example</h3><p>Original graph G has V = {'{'}A, B, C, D, E{'}'} and eight weighted candidate edges. All calculations below are generated by the same engine used by the simulators.</p></div>
    <div className="equation-strip"><div><small>Original edge set</small><strong>AB₂, AC₃, BC₁, BD₄, CD₅, CE₆, DE₂, BE₇</strong></div><div><small>All-edge cost</small><strong>30 ₹ lakh</strong></div><div><small>MST</small><strong>{kruskal.edges.map((edge) => edge.id).join(", ")}</strong></div><div><small>Minimum cost</small><strong>{kruskal.totalCost} ₹ lakh</strong></div><div><small>Cost avoided</small><strong>{saving} ₹ lakh ({Math.round((saving / kruskal.candidateCost) * 100)}%)</strong></div></div>
    <div className="proof-note"><ShieldCheck size={21} /><p><b>Validity certificate:</b> the selected subgraph has {kruskal.edges.length} = |V| − 1 edges, is connected, contains no cycle, and both independent algorithms return cost {kruskal.totalCost} ₹ lakh.</p></div>
    <div className="worked-tables"><div><h4>Kruskal: globally cheapest safe edge</h4><p>Sorted order: BC₁, AB₂, DE₂, AC₃, BD₄, CD₅, CE₆, BE₇.</p><AlgorithmTraceTable result={kruskal} unit="₹ lakh" /></div><div><h4>Prim from A: cheapest edge crossing the cut</h4><p>Visited set grows from A until every building belongs to the tree.</p><AlgorithmTraceTable result={prim} unit="₹ lakh" /></div></div>
  </section>;
}

export default function NetworkDesignStudio() {
  const [graph, setGraph] = useState<NetworkGraph>(() => cloneNetwork(WORKED_EXAMPLE));
  const [section, setSection] = useState<Section>("dashboard");
  const [algorithm, setAlgorithm] = useState<"Kruskal" | "Prim">("Kruskal");
  const [startVertex, setStartVertex] = useState("A");
  const [kruskalStep, setKruskalStep] = useState(0);
  const [primStep, setPrimStep] = useState(0);
  const [kruskalPlaying, setKruskalPlaying] = useState(false);
  const [primPlaying, setPrimPlaying] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newVertex, setNewVertex] = useState("");
  const [newEdge, setNewEdge] = useState({ source: "A", target: "B", cost: "1" });
  const [editorMessage, setEditorMessage] = useState("");
  const canvasRef = useRef<NetworkCanvasHandle>(null);

  const analysis = useMemo(() => analyzeGraph(graph, startVertex), [graph, startVertex]);
  const currentResult = algorithm === "Kruskal" ? analysis.kruskal : analysis.prim;
  const saving = currentResult ? currentResult.candidateCost - currentResult.totalCost : 0;
  const savingPercent = currentResult?.candidateCost ? (saving / currentResult.candidateCost) * 100 : 0;
  const matrix = useMemo(() => weightedAdjacencyMatrix(graph), [graph]);
  const adjacency = useMemo(() => buildAdjacencyList(graph), [graph]);

  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  const chooseSection = (next: Section) => { setSection(next); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const loadSample = (sample: NetworkGraph) => { setGraph(cloneNetwork(sample)); setStartVertex(sample.vertices[0]?.id ?? ""); setEditorMessage(`Loaded ${sample.name}.`); };
  const selectedEdgeIds = currentResult?.edges.map((edge) => edge.id) ?? [];
  const currentStep = section === "kruskal" && analysis.kruskal ? analysis.kruskal.steps[Math.min(kruskalStep, analysis.kruskal.steps.length - 1)] : section === "prim" && analysis.prim ? analysis.prim.steps[Math.min(primStep, analysis.prim.steps.length - 1)] : null;
  const visibleSelectedEdges = currentStep ? currentStep.selectedEdgeIds : selectedEdgeIds;

  const onCanvasSelect = useCallback((id: string | null) => setSelectedElement(id), []);

  const addVertex = () => {
    const label = newVertex.trim();
    if (!label) return;
    const base = label.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || `V${graph.vertices.length + 1}`;
    let id = base;
    let suffix = 2;
    while (graph.vertices.some((vertex) => vertex.id === id)) id = `${base}-${suffix++}`;
    setGraph((current) => ({ ...current, vertices: [...current.vertices, { id, label }] }));
    setNewVertex("");
    setEditorMessage(`Added ${label}.`);
  };

  const renameVertex = (id: string, label: string) => setGraph((current) => ({ ...current, vertices: current.vertices.map((vertex) => vertex.id === id ? { ...vertex, label } : vertex) }));
  const deleteVertex = (id: string) => setGraph((current) => ({ ...current, vertices: current.vertices.filter((vertex) => vertex.id !== id), edges: current.edges.filter((edge) => edge.source !== id && edge.target !== id) }));

  const addEdge = () => {
    const cost = Number(newEdge.cost);
    if (!newEdge.source || !newEdge.target || newEdge.source === newEdge.target || !Number.isFinite(cost) || cost < 0) { setEditorMessage("Choose two different locations and enter a nonnegative numeric cost."); return; }
    if (graph.edges.some((edge) => [edge.source, edge.target].sort().join("|") === [newEdge.source, newEdge.target].sort().join("|"))) { setEditorMessage("That undirected connection already exists."); return; }
    const id = `${newEdge.source}-${newEdge.target}-${Date.now()}`;
    setGraph((current) => ({ ...current, edges: [...current.edges, { id, source: newEdge.source, target: newEdge.target, cost }] }));
    setEditorMessage("Connection added.");
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { const imported = parseNetworkCsv(await file.text(), file.name.replace(/\.csv$/i, "")); setGraph(imported); setStartVertex(imported.vertices[0]?.id ?? ""); setEditorMessage(`Imported ${file.name}.`); }
    catch (error) { setEditorMessage(error instanceof Error ? error.message : "Could not import CSV."); }
    event.target.value = "";
  };

  const downloadText = (content: string, name: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X /></button>
      <div className="brand"><div className="brand-mark"><TreePine size={24} /></div><div><strong>Network Design</strong><span>STUDIO</span></div></div>
      <div className="project-chip"><i /><div><b>Topic 4</b><span>Minimum Spanning Trees</span></div></div>
      <nav aria-label="Primary navigation">{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => chooseSection(item.id)}><Icon size={18} /><span>{item.label}</span><ChevronRight size={15} /></button>; })}</nav>
      <div className="academic-card"><BookOpen size={17} /><div><b>OFFICIAL DMGT OUTCOME</b><p>A minimum-cost connected network with quantitative comparison of Kruskal&apos;s and Prim&apos;s algorithms.</p></div></div>
      <p className="privacy-note">Runs entirely in your browser. Uploaded CSV files are not transmitted.</p>
    </aside>

    <main>
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button><div><b>Minimum Spanning Tree for Cost-Effective Network Design</b><span>TREES · WEIGHTED GRAPHS · KRUSKAL · PRIM</span></div><div className="top-actions"><button className="icon-button" aria-label="Print report" onClick={() => window.print()}><Printer size={18} /></button><button className="icon-button" aria-label="Toggle theme" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div></header>
      <div className="content">
        {section === "dashboard" && <>
          <section className="hero">
            <div><div className="hero-tags"><span>ACADEMICALLY ALIGNED</span><span>MATHEMATICALLY VERIFIABLE</span></div><h1>Connect every location.<br /><em>Pay the minimum cost.</em></h1><p>Construct a weighted network, watch Kruskal and Prim make every decision, and verify that both algorithms produce the same optimal cost.</p><div className="hero-actions"><button className="primary" onClick={() => chooseSection("network")}><Network size={18} />Explore the network</button><button className="secondary" onClick={() => chooseSection("compare")}><Grid3X3 size={18} />Compare algorithms</button></div></div>
            <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><TreePine size={78} /><span>Σ w(e)</span><strong>{currentResult ? currentResult.totalCost : "—"}</strong><small>minimum total cost</small></div>
          </section>

          <div className="metrics-grid">
            <MetricCard label="Locations" value={String(graph.vertices.length)} note={`${graph.edges.length} candidate connections`} icon={<Network size={20} />} />
            <MetricCard label="Candidate installation" value={currentResult ? formatCost(currentResult.candidateCost, graph.unit) : "Invalid graph"} note="Cost of installing every edge" icon={<CircleDollarSign size={20} />} />
            <MetricCard label="Minimum network cost" value={currentResult ? formatCost(currentResult.totalCost, graph.unit) : "—"} note={currentResult?.status ?? "Correct input to calculate"} icon={<TreePine size={20} />} />
            <MetricCard label="Cost reduction" value={currentResult ? `${formatCost(saving, graph.unit)} · ${savingPercent.toFixed(1)}%` : "—"} note="Relative to all candidate edges" icon={<ArrowDownToLine size={20} />} />
          </div>

          <section className="agreement-panel"><div className="agreement-icon"><ShieldCheck /></div><div><span className="eyebrow">INDEPENDENT OPTIMALITY CHECK</span><h3>{analysis.agree ? "Kruskal and Prim agree." : "The graph needs attention."}</h3><p>{analysis.agree && analysis.kruskal && analysis.prim ? `Both algorithms independently return ${formatCost(analysis.kruskal.totalCost, graph.unit)}. The selected structure has ${analysis.kruskal.edges.length} edge${analysis.kruskal.edges.length === 1 ? "" : "s"}, ${analysis.kruskal.connected ? `exactly |V| − 1 = ${Math.max(0, graph.vertices.length - 1)}` : `forming a forest across ${analysis.kruskal.components.length} components`}.` : analysis.validation.errors.join(" ")}</p></div><span className={`validity-pill ${analysis.kruskal?.valid ? "valid" : "invalid"}`}>{analysis.kruskal?.valid ? <Check size={15} /> : <X size={15} />}{analysis.kruskal?.valid ? "Verified" : "Invalid"}</span></section>
          {analysis.kruskal && analysis.prim ? <WorkedExample kruskal={runWorkedKruskal()} prim={runWorkedPrim()} /> : null}
        </>}

        {section === "editor" && <>
          <SectionHeading eyebrow="BUILD YOUR OWN WEIGHTED GRAPH" title="Network editor" description="Define locations and the nonnegative cost of each available undirected connection. The analysis updates immediately." />
          <div className="sample-row">{SAMPLE_NETWORKS.map((sample) => <button key={sample.name} className={graph.name === sample.name ? "sample active" : "sample"} onClick={() => loadSample(sample)}><b>{sample.name}</b><span>{sample.vertices.length} locations · {sample.edges.length} edges</span></button>)}</div>
          <div className="editor-layout">
            <section className="panel"><div className="panel-title"><div><span className="eyebrow">VERTICES</span><h3>Locations</h3></div><span>{graph.vertices.length}</span></div><div className="add-row"><input value={newVertex} onChange={(event) => setNewVertex(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addVertex(); }} placeholder="New location name" aria-label="New location name" /><button className="primary compact" onClick={addVertex}><Plus size={16} />Add</button></div><div className="editable-list">{graph.vertices.map((vertex) => <div key={vertex.id}><span className="vertex-id">{vertex.id}</span><input value={vertex.label} onChange={(event) => renameVertex(vertex.id, event.target.value)} aria-label={`Rename ${vertex.id}`} /><button className="danger-button" aria-label={`Delete ${vertex.label}`} onClick={() => deleteVertex(vertex.id)}><Trash2 size={16} /></button></div>)}</div></section>
            <section className="panel"><div className="panel-title"><div><span className="eyebrow">EDGES</span><h3>Available connections</h3></div><span>{graph.edges.length}</span></div><div className="edge-form"><select value={newEdge.source} onChange={(event) => setNewEdge({ ...newEdge, source: event.target.value })} aria-label="Connection source">{graph.vertices.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.label}</option>)}</select><select value={newEdge.target} onChange={(event) => setNewEdge({ ...newEdge, target: event.target.value })} aria-label="Connection target">{graph.vertices.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.label}</option>)}</select><input type="number" min="0" step="0.1" value={newEdge.cost} onChange={(event) => setNewEdge({ ...newEdge, cost: event.target.value })} aria-label="Connection cost" /><button className="primary compact" onClick={addEdge}><Plus size={16} />Add</button></div><div className="edge-edit-list">{graph.edges.map((edge) => <div key={edge.id}><b>{edge.source}—{edge.target}</b><label>Cost <input type="number" min="0" step="0.1" value={edge.cost} onChange={(event) => setGraph((current) => ({ ...current, edges: current.edges.map((item) => item.id === edge.id ? { ...item, cost: Number(event.target.value) } : item) }))} /></label><span>{graph.unit}</span><button className="danger-button" aria-label={`Delete ${edge.source} to ${edge.target}`} onClick={() => setGraph((current) => ({ ...current, edges: current.edges.filter((item) => item.id !== edge.id) }))}><Trash2 size={15} /></button></div>)}</div></section>
          </div>
          <section className="csv-panel"><div><Upload /><div><h3>Import connection list</h3><p>CSV columns: <code>source,target,cost</code>. Location names are created automatically. Duplicate undirected edges, self-loops, missing endpoints, negative values, and malformed costs are rejected.</p></div></div><div><label className="primary file-button"><Upload size={17} />Choose CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label><button className="secondary" onClick={() => downloadText(EXAMPLE_CSV, "example-network.csv", "text/csv")}><Download size={17} />Example CSV</button></div></section>
          {editorMessage ? <p className="editor-message" role="status">{editorMessage}</p> : null}
          {!analysis.validation.valid ? <div className="error-box"><b>Correct these inputs</b>{analysis.validation.errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
        </>}

        {section === "network" && <>
          <SectionHeading eyebrow="INTERACTIVE WEIGHTED GRAPH" title="Minimum-cost network visualizer" description="Gold edges belong to the selected minimum spanning tree. Muted edges are valid candidates that are not needed in the optimal design." />
          <div className="visualizer-toolbar"><div className="algorithm-toggle"><button className={algorithm === "Kruskal" ? "active" : ""} onClick={() => setAlgorithm("Kruskal")}>Kruskal MST</button><button className={algorithm === "Prim" ? "active" : ""} onClick={() => setAlgorithm("Prim")}>Prim MST</button></div><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find location" aria-label="Find location" /></div><button className="icon-button" onClick={() => canvasRef.current?.fit()} aria-label="Fit graph"><Maximize2 size={17} /></button><button className="icon-button" onClick={() => canvasRef.current?.reset()} aria-label="Reset graph layout"><RefreshCw size={17} /></button><button className="icon-button" onClick={() => canvasRef.current?.downloadPng()} aria-label="Export graph as PNG"><Download size={17} /></button></div>
          <div className="visualizer-layout"><div className="canvas-panel"><NetworkCanvas ref={canvasRef} graph={graph} selectedEdgeIds={visibleSelectedEdges} activeEdgeId={currentStep?.edge?.id} search={search} onSelect={onCanvasSelect} /><div className="canvas-legend"><span><i className="legend-mst" />Selected MST</span><span><i className="legend-candidate" />Available candidate</span><span><i className="legend-active" />Current step</span></div></div><aside className="network-summary"><span className="eyebrow">OPTIMAL DESIGN</span><h3>{currentResult ? formatCost(currentResult.totalCost, graph.unit) : "Invalid graph"}</h3><p>{currentResult?.connected ? "All locations connected" : `${currentResult?.components.length ?? 0} separate components`}</p><div className="summary-list"><div><span>Algorithm</span><b>{algorithm}</b></div><div><span>Selected edges</span><b>{currentResult?.edges.length ?? 0}</b></div><div><span>Required edge count</span><b>{Math.max(0, graph.vertices.length - 1)}</b></div><div><span>Cost reduction</span><b>{savingPercent.toFixed(1)}%</b></div><div><span>Clicked element</span><b>{selectedElement ?? "None"}</b></div></div><div className="selected-edge-list">{currentResult?.edges.map((edge) => <EdgePill key={edge.id} edge={edge} unit={graph.unit} />)}</div></aside></div>
        </>}

        {section === "kruskal" && analysis.kruskal && <><SectionHeading eyebrow="EDGE-DRIVEN GREEDY ALGORITHM" title="Kruskal’s algorithm simulator" description="Sort every connection by cost. Accept the next cheapest edge only when Disjoint Set Union proves that it joins two different components." /><Simulator title="Kruskal execution" subtitle="Global edge ordering + cycle detection" result={analysis.kruskal} index={kruskalStep} setIndex={setKruskalStep} playing={kruskalPlaying} setPlaying={setKruskalPlaying} unit={graph.unit} /><div className="algorithm-explainer"><code>sort(E) → for each edge (u,v): if find(u) ≠ find(v), union(u,v)</code><p>Time complexity: <b>O(E log E)</b>, dominated by sorting. DSU operations are near constant amortized time, O(α(V)).</p></div></>}

        {section === "prim" && analysis.prim && <><SectionHeading eyebrow="VERTEX-DRIVEN GREEDY ALGORITHM" title="Prim’s algorithm simulator" description="Grow one tree from a chosen location by repeatedly taking the cheapest edge that crosses from the visited set to an unvisited vertex." /><div className="start-picker"><label>Starting location <select value={startVertex} onChange={(event) => setStartVertex(event.target.value)}>{graph.vertices.map((vertex) => <option key={vertex.id} value={vertex.id}>{vertex.id} · {vertex.label}</option>)}</select></label></div><Simulator title="Prim execution" subtitle={`Priority frontier starting from ${startVertex}`} result={analysis.prim} index={primStep} setIndex={setPrimStep} playing={primPlaying} setPlaying={setPrimPlaying} unit={graph.unit} /><div className="algorithm-explainer"><code>visit(start) → repeatedly extract the cheapest frontier edge</code><p>Time complexity with an adjacency list and binary heap: <b>O(E log V)</b>.</p></div></>}

        {section === "compare" && analysis.kruskal && analysis.prim && <>
          <SectionHeading eyebrow="SAME GRAPH · INDEPENDENT IMPLEMENTATIONS" title="Kruskal vs Prim" description="The algorithms use different greedy viewpoints. Equality of final cost provides a direct quantitative cross-check." />
          <div className="comparison-result"><div><span>OPTIMALITY VERDICT</span><h3>{analysis.agree ? "Algorithms agree on minimum cost" : "Cost mismatch detected"}</h3><p>{formatCost(analysis.kruskal.totalCost, graph.unit)} = {formatCost(analysis.prim.totalCost, graph.unit)}</p></div><div className={analysis.agree ? "agreement-seal" : "agreement-seal error"}>{analysis.agree ? <Check /> : <X />}<b>{analysis.agree ? "VERIFIED" : "CHECK"}</b></div></div>
          <div className="comparison-grid"><article className="algorithm-card"><span className="card-index">K</span><h3>Kruskal</h3><p>Chooses the globally cheapest cycle-safe edge.</p><div className="comparison-stats"><div><small>Total cost</small><b>{formatCost(analysis.kruskal.totalCost, graph.unit)}</b></div><div><small>Processed edges</small><b>{analysis.kruskal.processedEdges}</b></div><div><small>Trace steps</small><b>{analysis.kruskal.steps.length}</b></div><div><small>Complexity</small><b>O(E log E)</b></div></div><div className="pill-wrap">{analysis.kruskal.edges.map((edge) => <span className="mini-pill" key={edge.id}>{edge.source}—{edge.target}</span>)}</div></article><article className="algorithm-card"><span className="card-index">P</span><h3>Prim</h3><p>Chooses the cheapest edge crossing the visited cut.</p><div className="comparison-stats"><div><small>Total cost</small><b>{formatCost(analysis.prim.totalCost, graph.unit)}</b></div><div><small>Processed edges</small><b>{analysis.prim.processedEdges}</b></div><div><small>Trace steps</small><b>{analysis.prim.steps.length}</b></div><div><small>Complexity</small><b>O(E log V)</b></div></div><div className="pill-wrap">{analysis.prim.edges.map((edge) => <span className="mini-pill" key={edge.id}>{edge.source}—{edge.target}</span>)}</div></article></div>
          <div className="concept-note"><b>Why can the edge sets differ?</b><p>If several edges have equal weights, more than one MST can exist. Kruskal and Prim may choose different tied edges because they inspect candidates in different contexts, yet every valid MST has the same minimum total weight. This implementation resolves ties deterministically by endpoint and edge ID.</p></div>
          <WorkedExample kruskal={runWorkedKruskal()} prim={runWorkedPrim()} />
        </>}

        {section === "mathematics" && <>
          <SectionHeading eyebrow="DISCRETE MATHEMATICS & GRAPH THEORY" title="Mathematics laboratory" description="Each concept below is connected directly to the representations and algorithm operations implemented in this application." />
          <div className="concept-grid">
            {[
              ["01", "Weighted graph", "G = (V, E, w)", "V is the set of locations, E the feasible undirected connections, and w(e) ≥ 0 the installation cost."],
              ["02", "Tree", "connected + acyclic", "A tree connects all of its vertices without cycles. A tree on |V| vertices contains exactly |V| − 1 edges."],
              ["03", "Spanning tree", "V(T) = V(G)", "A spanning tree uses every original vertex and only a subset of the candidate edges."],
              ["04", "Minimum spanning tree", "min Σₑ∈T w(e)", "Among all spanning trees, an MST has the smallest total edge weight."],
              ["05", "Cut property", "light edge is safe", "For any cut, a minimum-weight crossing edge belongs to at least one MST. This is the basis of Prim’s greedy choice."],
              ["06", "Cycle property", "heavy cycle edge is avoidable", "If an edge closes a cycle, Kruskal rejects it; connectivity is preserved without paying for the redundant edge."],
            ].map(([number, title, formula, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><code>{formula}</code><p>{text}</p></article>)}
          </div>
          <section className="representation-grid"><div className="panel"><span className="eyebrow">ADJACENCY LIST</span><h3>Incident weighted edges</h3><div className="mono-list">{graph.vertices.map((vertex) => <p key={vertex.id}><b>{vertex.id}</b> → {(adjacency.get(vertex.id) ?? []).map((edge) => `${edge.source === vertex.id ? edge.target : edge.source}(${edge.cost})`).join(", ") || "∅"}</p>)}</div></div><div className="panel matrix-panel"><span className="eyebrow">WEIGHTED ADJACENCY MATRIX</span><h3>Symmetric cost representation</h3><div className="matrix-scroll"><table className="matrix"><thead><tr><th>·</th>{graph.vertices.map((v) => <th key={v.id}>{v.id}</th>)}</tr></thead><tbody>{matrix.map((row, rowIndex) => <tr key={graph.vertices[rowIndex].id}><th>{graph.vertices[rowIndex].id}</th>{row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}>{value ?? "∞"}</td>)}</tr>)}</tbody></table></div></div></section>
          <section className="correctness"><ShieldCheck /><div><h3>Why the algorithms are correct</h3><p>Kruskal repeatedly applies the safe-edge theorem to distinct components; Prim repeatedly applies the cut property to the visited/unvisited cut. Neither accepts a cycle. When a connected graph reaches |V| − 1 selected edges, the result is a spanning tree. Because every accepted edge is safe, the completed tree is minimum.</p></div></section>
        </>}

        {section === "results" && analysis.kruskal && analysis.prim && <>
          <SectionHeading eyebrow="CALCULATED OUTPUTS" title="Results and evidence" description="Export the exact graph, selected edges, execution traces, and costs used in the displayed analysis." />
          <section className="result-hero"><div><span className="eyebrow">FINAL MINIMUM COST</span><h2>{formatCost(currentResult?.totalCost ?? 0, graph.unit)}</h2><p>{graph.name} · {currentResult?.edges.length} selected connections · {savingPercent.toFixed(1)}% reduction</p></div><div className="validity-stack"><span><Check />Connected: {String(currentResult?.connected)}</span><span><Check />Acyclic: {String(currentResult?.valid)}</span><span><Check />Edge count: {currentResult?.edges.length} {currentResult?.connected ? `= ${graph.vertices.length} − 1` : "in forest"}</span><span><Check />Algorithms agree: {String(analysis.agree)}</span></div></section>
          <div className="export-grid"><button onClick={() => exportMstCsv(currentResult ?? analysis.kruskal!)}><FileSpreadsheet /><div><b>MST edge list</b><span>CSV · selected source, target, and cost</span></div><Download /></button><button onClick={() => exportAnalysisJson(graph, analysis.kruskal!, analysis.prim!)}><FileJson /><div><b>Complete analysis</b><span>JSON · graph, traces, validation, results</span></div><Download /></button><button onClick={() => chooseSection("network")}><Network /><div><b>Network visual</b><span>Open visualizer to export a high-resolution PNG</span></div><ChevronRight /></button><button onClick={() => window.print()}><Printer /><div><b>Academic summary</b><span>Print · clean report-ready layout</span></div><Download /></button></div>
          <div className="result-table-wrap"><table className="data-table"><thead><tr><th>Selected connection</th><th>Cost</th><th>Cumulative cost</th><th>Purpose</th></tr></thead><tbody>{(currentResult?.edges ?? []).reduce<{ edge: MstResult["edges"][number]; cumulative: number }[]>((rows, edge) => { const cumulative = (rows.at(-1)?.cumulative ?? 0) + edge.cost; rows.push({ edge, cumulative }); return rows; }, []).map(({ edge, cumulative }, index) => <tr key={edge.id}><td><b>{edge.source} — {edge.target}</b></td><td>{formatCost(edge.cost, graph.unit)}</td><td>{formatCost(cumulative, graph.unit)}</td><td>Safe edge {index + 1} of {currentResult?.edges.length}</td></tr>)}</tbody></table></div>
        </>}

        {!analysis.validation.valid && section !== "editor" ? <section className="invalid-state"><X /><h2>The current network is invalid</h2><p>{analysis.validation.errors.join(" ")}</p><button className="primary" onClick={() => chooseSection("editor")}>Open network editor</button></section> : null}
      </div>
      <footer><div className="footer-brand"><TreePine size={18} />Network Design Studio</div><span>Topic 4 · Minimum Spanning Tree for Cost-Effective Network Design</span><span>Correlation ≠ causation is irrelevant here; this is exact combinatorial optimization.</span></footer>
    </main>
  </div>;
}

function runWorkedKruskal(): MstResult { return analyzeGraph(WORKED_EXAMPLE, "A").kruskal!; }
function runWorkedPrim(): MstResult { return analyzeGraph(WORKED_EXAMPLE, "A").prim!; }
