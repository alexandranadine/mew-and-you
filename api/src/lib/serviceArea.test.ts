import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import {
  assertSupportedServiceAreaZip,
  isSupportedServiceAreaZip,
  OUTSIDE_SERVICE_AREA_CODE,
  OUTSIDE_SERVICE_AREA_MESSAGE,
} from "./serviceArea";

describe("isSupportedServiceAreaZip", () => {
  it("accepts Downtown Los Angeles 90012", () => {
    expect(isSupportedServiceAreaZip("90012")).toBe(true);
  });

  it("accepts Downtown San Diego 92101", () => {
    expect(isSupportedServiceAreaZip("92101")).toBe(true);
  });

  it("accepts a representative Orange County ZIP", () => {
    expect(isSupportedServiceAreaZip("92660")).toBe(true);
  });

  it("accepts representative Riverside, San Bernardino, and Ventura ZIPs", () => {
    expect(isSupportedServiceAreaZip("92501")).toBe(true);
    expect(isSupportedServiceAreaZip("92401")).toBe(true);
    expect(isSupportedServiceAreaZip("93003")).toBe(true);
  });

  it("rejects a Sacramento ZIP", () => {
    expect(isSupportedServiceAreaZip("95814")).toBe(false);
  });

  it("rejects a San Francisco ZIP", () => {
    expect(isSupportedServiceAreaZip("94102")).toBe(false);
  });
});

describe("assertSupportedServiceAreaZip", () => {
  it("does not throw for a supported ZIP", () => {
    expect(() => assertSupportedServiceAreaZip("90012")).not.toThrow();
  });

  it("throws OUTSIDE_SERVICE_AREA for an unsupported ZIP", () => {
    try {
      assertSupportedServiceAreaZip("95814");
      throw new Error("expected assertSupportedServiceAreaZip to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 400,
        code: OUTSIDE_SERVICE_AREA_CODE,
        message: OUTSIDE_SERVICE_AREA_MESSAGE,
      });
    }
  });
});
