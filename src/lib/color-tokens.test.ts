import { describe, expect, it } from "vitest";
import { colorForLabel } from "./color-tokens";

describe("colorForLabel", () => {
  it("is deterministic for the same label", () => {
    expect(colorForLabel("Laptop")).toBe(colorForLabel("Laptop"));
  });

  it("returns a value from the known palette", () => {
    expect(["accent", "violet", "warning", "success"]).toContain(
      colorForLabel("Monitor"),
    );
  });
});
