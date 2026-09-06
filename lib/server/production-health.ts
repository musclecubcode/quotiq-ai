import "server-only";

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { DEFAULT_ASSET_BUCKET } from "./storage/private-object-store";
import { databaseProjectRef, supabaseProjectRef } from "./production-health-fingerprints";

const EXPECTED_TABLES = [
  "contractor_companies", "memberships", "company_assets", "clients", "work_orders",
  "work_order_measurements", "work_order_notes", "work_order_attachments", "estimates", "invoices",
] as const;

export async function getProductionHealth() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const bucketName = process.env.SUPABASE_ASSET_BUCKET?.trim() || DEFAULT_ASSET_BUCKET;
  const apiRef = supabaseProjectRef(supabaseUrl);
  const databaseRef = databaseProjectRef(databaseUrl);
  const requiredVariablesPresent = Boolean(databaseUrl && supabaseUrl && serviceRoleKey && bucketName);
  let databaseReachable = false;
  let schemaProvisioned = false;
  let missingTables: string[] = [...EXPECTED_TABLES];
  let storageReachable = false;
  let bucketProvisioned = false;
  let bucketPrivate = false;

  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 8_000,
      ssl: databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false } });
    try {
      const checks = await pool.query<{ table_name: string; present: boolean }>(
        `select table_name, to_regclass('public.' || table_name) is not null as present from unnest($1::text[]) table_name`,
        [[...EXPECTED_TABLES]],
      );
      databaseReachable = true;
      missingTables = checks.rows.filter((row) => !row.present).map((row) => row.table_name);
      schemaProvisioned = missingTables.length === 0;
    } catch { databaseReachable = false; }
    finally { await pool.end().catch(() => undefined); }
  }

  if (supabaseUrl && serviceRoleKey) {
    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    try {
      const { data, error } = await client.storage.listBuckets();
      if (!error) {
        storageReachable = true;
        const bucket = data.find((item) => item.name === bucketName);
        bucketProvisioned = Boolean(bucket);
        bucketPrivate = bucket ? !bucket.public : false;
      }
    } catch { storageReachable = false; }
  }

  const refsAgree = Boolean(apiRef && databaseRef && apiRef === databaseRef);
  return {
    ok: requiredVariablesPresent && refsAgree && databaseReachable && schemaProvisioned && storageReachable && bucketProvisioned && bucketPrivate,
    deploymentCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    supabaseProjectRef: apiRef,
    databaseProjectRef: databaseRef,
    refsAgree,
    requiredVariablesPresent,
    databaseReachable,
    schemaProvisioned,
    missingTables,
    storageReachable,
    bucketName,
    bucketProvisioned,
    bucketPrivate,
    checkedAt: new Date().toISOString(),
  };
}
