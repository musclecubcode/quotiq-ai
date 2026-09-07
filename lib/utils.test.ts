import { describe, expect, it } from "vitest";

import { formatDate } from "./utils";

describe("formatDate", () => {
  it("renders a date-only value as the selected calendar date", () => {
    expect(formatDate("2026-09-08")).toBe("Sep 8, 2026");
  });

  it("continues to format timestamps as instants", () => {
    expect(formatDate("2026-09-08T16:00:00.000Z")).toBe("Sep 8, 2026");
  });
});
