import { describe, expect, it } from "vitest";
import { formatTicketNumber } from "./ticket-number";

describe("formatTicketNumber", () => {
  it("joins the configured prefix and ticket number with a dash", () => {
    expect(formatTicketNumber("KYM", 1042)).toBe("KYM-1042");
  });

  it("supports a custom prefix per deployment", () => {
    expect(formatTicketNumber("CLAU", 7)).toBe("CLAU-7");
  });
});
