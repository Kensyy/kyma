import { describe, expect, it } from "vitest";
import { addHours, isSlaOverdue, resolveSlaHours } from "./sla";

describe("resolveSlaHours", () => {
  it("falls back to the hardcoded default when no policies exist", () => {
    expect(resolveSlaHours("URGENT", null, [])).toBe(4);
    expect(resolveSlaHours("LOW", null, [])).toBe(120);
  });

  it("uses a priority-only policy over the hardcoded default", () => {
    const policies = [
      { priority: "URGENT" as const, categoryId: null, hours: 2 },
    ];
    expect(resolveSlaHours("URGENT", null, policies)).toBe(2);
  });

  it("uses a category-specific policy over the priority-only one", () => {
    const policies = [
      { priority: "URGENT" as const, categoryId: null, hours: 4 },
      { priority: "URGENT" as const, categoryId: "cat-network", hours: 1 },
    ];
    expect(resolveSlaHours("URGENT", "cat-network", policies)).toBe(1);
  });

  it("falls back to the priority-only policy for a category with no override", () => {
    const policies = [
      { priority: "URGENT" as const, categoryId: null, hours: 4 },
    ];
    expect(resolveSlaHours("URGENT", "cat-hardware", policies)).toBe(4);
  });

  it("doesn't let a different priority's category policy leak through", () => {
    const policies = [
      { priority: "HIGH" as const, categoryId: "cat-network", hours: 1 },
    ];
    expect(resolveSlaHours("URGENT", "cat-network", policies)).toBe(4);
  });
});

describe("addHours", () => {
  it("adds the given number of hours", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    expect(addHours(from, 4).toISOString()).toBe("2026-01-01T04:00:00.000Z");
    expect(addHours(from, 120).toISOString()).toBe("2026-01-06T00:00:00.000Z");
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
