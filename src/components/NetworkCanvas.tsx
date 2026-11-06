"use client";

import cytoscape, { type Core, type EventObject } from "cytoscape";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { NetworkGraph } from "@/lib/types";

export interface NetworkCanvasHandle { fit: () => void; reset: () => void; downloadPng: () => void; }

interface Props {
  graph: NetworkGraph;
  selectedEdgeIds: string[];
  activeEdgeId?: string;
  search: string;
  onSelect: (id: string | null) => void;
}

export const NetworkCanvas = forwardRef<NetworkCanvasHandle, Props>(function NetworkCanvas({ graph, selectedEdgeIds, activeEdgeId, search, onSelect }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useImperativeHandle(ref, () => ({
    fit: () => cyRef.current?.fit(undefined, 48),
    reset: () => {
      const cy = cyRef.current;
      if (!cy) return;
      cy.elements().removeClass("focused search-hit");
      cy.layout({ name: "cose", animate: true, animationDuration: 320, padding: 56 }).run();
      window.setTimeout(() => cy.fit(undefined, 48), 350);
    },
    downloadPng: () => {
      const blob = cyRef.current?.png({ output: "blob", full: true, scale: 2, bg: "#0b1526" });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "network-design-mst.png";
      link.click();
      URL.revokeObjectURL(url);
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const selected = new Set(selectedEdgeIds);
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...graph.vertices.map((vertex) => ({ data: { id: vertex.id, label: vertex.label } })),
        ...graph.edges.map((edge) => ({ data: { ...edge, label: `${edge.cost}` }, classes: selected.has(edge.id) ? "mst-edge" : "candidate-edge" })),
      ],
      minZoom: 0.3,
      maxZoom: 2.6,
      style: [
        { selector: "node", style: { "background-color": "#0b4f86", "border-color": "#7db9e3", "border-width": 4, color: "#f5f9ff", label: "data(label)", "font-size": 11, "font-weight": 700, "text-valign": "bottom", "text-margin-y": 9, "text-wrap": "wrap", "text-max-width": "90px", width: 34, height: 34 } },
        { selector: "edge", style: { label: "data(label)", color: "#d7e2ef", "font-size": 10, "text-background-color": "#0b1526", "text-background-opacity": 0.94, "text-background-padding": "3px", "line-color": "#68788e", width: 2.2, opacity: 0.52, "curve-style": "bezier" } },
        { selector: "edge.mst-edge", style: { "line-color": "#1592d0", width: 6, opacity: 1, color: "#eef8ff", "text-background-color": "#074b80" } },
        { selector: "edge.active-edge", style: { "line-color": "#79bde7", width: 8, opacity: 1 } },
        { selector: ".focused", style: { "border-color": "#79bde7", "border-width": 7 } },
        { selector: ".search-hit", style: { "background-color": "#2f9bd3", width: 43, height: 43 } },
      ],
      layout: { name: "cose", animate: false, padding: 56, nodeRepulsion: () => 9000, idealEdgeLength: () => 125 },
    });
    const select = (event: EventObject) => {
      cy.elements().removeClass("focused");
      event.target.addClass("focused");
      onSelect(event.target.id());
    };
    cy.on("tap", "node, edge", select);
    cy.on("tap", (event) => { if (event.target === cy) { cy.elements().removeClass("focused"); onSelect(null); } });
    cyRef.current = cy;
    const frame = requestAnimationFrame(() => cy.fit(undefined, 48));
    return () => { cancelAnimationFrame(frame); cy.destroy(); cyRef.current = null; };
  }, [graph, onSelect, selectedEdgeIds]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.edges().removeClass("active-edge");
    if (activeEdgeId) cy.getElementById(activeEdgeId).addClass("active-edge");
  }, [activeEdgeId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass("search-hit");
    const query = search.trim().toLowerCase();
    if (query) cy.nodes().filter((node) => `${node.id()} ${node.data("label")}`.toLowerCase().includes(query)).addClass("search-hit");
  }, [search]);

  return <div ref={containerRef} className="network-canvas" role="img" aria-label="Interactive weighted network. Bright blue connections form the current minimum spanning tree; muted connections are available but not selected." />;
});
