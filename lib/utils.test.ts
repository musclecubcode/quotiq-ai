import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate } from "./utils";

describe("formatCurrency", () => {
  it("keeps invoice cents without adding unnecessary zeros", () => {
    expect(formatCurrency(123.45)).toBe("$123.45");
    expect(formatCurrency(321)).toBe("$321");
  });
});

describe("formatDate", () => {
  it("renders a date-only value as the selected calendar date", () => {
    expect(formatDate("2026-09-08")).toBe("Sep 8, 2026");
  });

  it("continues to format timestamps as instants", () => {
    expect(formatDate("2026-09-08T16:00:00.000Z")).toBe("Sep 8, 2026");
  });
});
