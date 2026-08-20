import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

describe("relativeTime", () => {
  const now = new Date("2026-01-05T12:00:00Z");

  it("renders minutes for recent timestamps", () => {
    expect(relativeTime(new Date("2026-01-05T11:55:00Z"), now)).toBe(
      "5 minutes ago",
    );
  });

  it("renders hours for same-day timestamps", () => {
    expect(relativeTime(new Date("2026-01-05T09:00:00Z"), now)).toBe(
      "3 hours ago",
    );
  });

  it("renders days for older timestamps", () => {
    expect(relativeTime(new Date("2026-01-02T12:00:00Z"), now)).toBe(
      "3 days ago",
    );
  });

  it("accepts an ISO string", () => {
    expect(relativeTime("2026-01-05T11:00:00Z", now)).toBe("1 hour ago");
  });

  it("falls back to 'just now' for sub-minute gaps", () => {
    expect(relativeTime(new Date("2026-01-05T11:59:45Z"), now)).toBe(
      "just now",
    );
  });
});
