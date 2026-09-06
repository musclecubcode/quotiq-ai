import { describe, expect, it } from "vitest";
import { databaseProjectRef, supabaseProjectRef } from "./production-health-fingerprints";

describe("production health project fingerprints", () => {
  it("extracts matching refs from direct and pooled Supabase URLs", () => {
    expect(supabaseProjectRef("https://omckgafkxnzqfiqmnftj.supabase.co")).toBe("omckgafkxnzqfiqmnftj");
    expect(databaseProjectRef("postgresql://postgres:secret@db.omckgafkxnzqfiqmnftj.supabase.co:5432/postgres")).toBe("omckgafkxnzqfiqmnftj");
    expect(databaseProjectRef("postgresql://postgres.omckgafkxnzqfiqmnftj:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres")).toBe("omckgafkxnzqfiqmnftj");
  });

  it("returns null for unrelated or malformed URLs", () => {
    expect(supabaseProjectRef("https://example.com")).toBeNull();
    expect(databaseProjectRef("not-a-url")).toBeNull();
  });
});
