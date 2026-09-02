import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { validateRadius, validateZip } from "./validation";

describe("validateZip", () => {
  it("accepts a valid 5-digit ZIP", () => {
    expect(validateZip("90026")).toBe("90026");
  });

  it("trims surrounding whitespace", () => {
    expect(validateZip("  90026  ")).toBe("90026");
  });

  it("rejects a missing ZIP", () => {
    expect(() => validateZip(undefined)).toThrow(ApiError);
    expect(() => validateZip("")).toThrow(ApiError);
    try {
      validateZip(undefined);
    } catch (error) {
      expect(error).toMatchObject({ status: 400, code: "missing_zip" });
    }
  });

  it("rejects ZIPs that aren't exactly 5 digits", () => {
    for (const bad of ["9002", "900266", "abcde", "9002a", "9002.6", "-9026"]) {
      expect(() => validateZip(bad)).toThrow(ApiError);
    }
  });

  it("rejects a ZIP submitted as a list (parameter pollution / array injection)", () => {
    expect(() => validateZip(["90026", "90027"])).toThrow(ApiError);
    try {
      validateZip(["90026", "90027"]);
    } catch (error) {
      expect(error).toMatchObject({ status: 400, code: "invalid_zip" });
    }
  });

  it("rejects a ZIP submitted as an object", () => {
    expect(() => validateZip({ toString: () => "90026" })).toThrow(ApiError);
  });
});

describe("validateRadius", () => {
  it("defaults to 25 miles when omitted", () => {
    expect(validateRadius(undefined)).toBe(25);
    expect(validateRadius("")).toBe(25);
  });

  it("accepts a valid radius", () => {
    expect(validateRadius("10")).toBe(10);
  });

  it("accepts the boundary value of 500 miles", () => {
    expect(validateRadius("500")).toBe(500);
  });

  it("rejects zero, negative, non-numeric, and over-the-limit radii", () => {
    for (const bad of ["0", "-5", "abc", "501", "Infinity", "NaN"]) {
      expect(() => validateRadius(bad)).toThrow(ApiError);
    }
  });

  it("rejects scientific notation that resolves above the limit", () => {
    expect(() => validateRadius("1e3")).toThrow(ApiError);
  });

  it("rejects a radius submitted as a list", () => {
    expect(() => validateRadius(["10", "20"])).toThrow(ApiError);
  });
});
