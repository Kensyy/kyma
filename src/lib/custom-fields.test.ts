import { describe, expect, it } from "vitest";
import {
  fieldOptions,
  isEmptyValue,
  validateCustomFieldValue,
} from "./custom-fields";

describe("fieldOptions", () => {
  it("returns the string entries of an options array", () => {
    expect(fieldOptions(["A", "B"])).toEqual(["A", "B"]);
  });

  it("returns an empty array for null, undefined, or non-array input", () => {
    expect(fieldOptions(null)).toEqual([]);
    expect(fieldOptions(undefined)).toEqual([]);
    expect(fieldOptions("not an array")).toEqual([]);
  });

  it("filters out non-string entries", () => {
    expect(fieldOptions(["A", 1, null, "B"])).toEqual(["A", "B"]);
  });
});

describe("isEmptyValue", () => {
  it("treats null, undefined, and whitespace-only strings as empty", () => {
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue("   ")).toBe(true);
  });

  it("treats a real value as non-empty", () => {
    expect(isEmptyValue("hello")).toBe(false);
  });
});

describe("validateCustomFieldValue", () => {
  it("rejects an empty value for a required field", () => {
    const result = validateCustomFieldValue(
      { fieldType: "TEXT", options: null, required: true },
      "",
    );
    expect(result.ok).toBe(false);
  });

  it("allows an empty value for an optional field", () => {
    const result = validateCustomFieldValue(
      { fieldType: "TEXT", options: null, required: false },
      "",
    );
    expect(result.ok).toBe(true);
  });

  it("accepts any non-empty text for TEXT fields", () => {
    expect(
      validateCustomFieldValue(
        { fieldType: "TEXT", options: null, required: false },
        "anything",
      ).ok,
    ).toBe(true);
  });

  describe("NUMBER fields", () => {
    it("accepts numeric strings", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "NUMBER", options: null, required: false },
          "42",
        ).ok,
      ).toBe(true);
    });

    it("rejects non-numeric strings", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "NUMBER", options: null, required: false },
          "not-a-number",
        ).ok,
      ).toBe(false);
    });
  });

  describe("DATE fields", () => {
    it("accepts a valid date string", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "DATE", options: null, required: false },
          "2026-01-15",
        ).ok,
      ).toBe(true);
    });

    it("rejects an invalid date string", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "DATE", options: null, required: false },
          "not-a-date",
        ).ok,
      ).toBe(false);
    });
  });

  describe("BOOLEAN fields", () => {
    it("accepts the literal strings true/false", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "BOOLEAN", options: null, required: false },
          "true",
        ).ok,
      ).toBe(true);
      expect(
        validateCustomFieldValue(
          { fieldType: "BOOLEAN", options: null, required: false },
          "false",
        ).ok,
      ).toBe(true);
    });

    it("rejects anything else", () => {
      expect(
        validateCustomFieldValue(
          { fieldType: "BOOLEAN", options: null, required: false },
          "yes",
        ).ok,
      ).toBe(false);
    });
  });

  describe("SELECT fields", () => {
    const def = {
      fieldType: "SELECT" as const,
      options: ["A", "B"],
      required: false,
    };

    it("accepts a value from the options list", () => {
      expect(validateCustomFieldValue(def, "A").ok).toBe(true);
    });

    it("rejects a value not in the options list", () => {
      expect(validateCustomFieldValue(def, "C").ok).toBe(false);
    });
  });
});
