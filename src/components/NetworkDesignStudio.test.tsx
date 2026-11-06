import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NetworkDesignStudio from "./NetworkDesignStudio";

describe("Network Design Studio", () => {
  it("surfaces the official outcome and verified worked result", () => {
    render(<NetworkDesignStudio />);
    expect(screen.getByText(/Connect every location/i)).toBeInTheDocument();
    expect(screen.getByText(/Kruskal and Prim agree/i)).toBeInTheDocument();
    expect(screen.getByText(/Campus Backbone example/i)).toBeInTheDocument();
    expect(screen.getAllByText(/9 ₹ lakh/i).length).toBeGreaterThan(0);
  });
});
