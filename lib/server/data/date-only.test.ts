import { describe, expect, it } from "vitest";

import { dateOnly } from "./date-only";

describe("dateOnly", () => {
  it("normalizes PostgreSQL Date objects without shifting the calendar day", () => {
    expect(dateOnly(new Date(2026, 8, 8))).toBe("2026-09-08");
  });

  it("keeps a database date string canonical", () => {
    expect(dateOnly("2026-09-08T00:00:00.000Z")).toBe("2026-09-08");
  });
});
