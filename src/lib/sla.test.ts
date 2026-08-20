import { describe, expect, it } from "vitest";
import { computeSlaDueAt, isSlaOverdue } from "./sla";

describe("computeSlaDueAt", () => {
  const from = new Date("2026-01-01T00:00:00Z");

  it("gives urgent tickets a 4 hour window", () => {
    expect(computeSlaDueAt("URGENT", from).toISOString()).toBe(
      "2026-01-01T04:00:00.000Z",
    );
  });

  it("gives low priority tickets a 5 day window", () => {
    expect(computeSlaDueAt("LOW", from).toISOString()).toBe(
      "2026-01-06T00:00:00.000Z",
    );
  });
});

describe("isSlaOverdue", () => {
  const now = new Date("2026-01-05T00:00:00Z");
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2026-01-10T00:00:00Z");

  it("is overdue when the due date has passed and the status isn't terminal", () => {
    expect(isSlaOverdue(past, false, now)).toBe(true);
  });

  it("is not overdue when the due date is still ahead", () => {
    expect(isSlaOverdue(future, false, now)).toBe(false);
  });

  it("is never overdue once the ticket is in a terminal status", () => {
    expect(isSlaOverdue(past, true, now)).toBe(false);
  });

  it("is not overdue when there is no due date", () => {
    expect(isSlaOverdue(null, false, now)).toBe(false);
  });
});
