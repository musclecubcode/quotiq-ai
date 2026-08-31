import "server-only";

import { DataLayerError } from "./data/errors";
import { createPostgresPool, PostgresProductionDataStore } from "./data/postgres-store";
import { getClerkServerIdentity } from "./data/clerk-identity";
import { resolveAuthorizedCompany } from "./data/authorization";
import { TenantDataService } from "./data/tenant-service";
import { createSupabasePrivateObjectStore, DEFAULT_ASSET_BUCKET } from "./storage/private-object-store";

let dataStore: PostgresProductionDataStore | null = null;
let objectStore: ReturnType<typeof createSupabasePrivateObjectStore> | null = null;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new DataLayerError("NOT_CONFIGURED", `${name} is not configured on the server.`);
  return value;
}

export function getProductionDataStore() {
  if (!dataStore) dataStore = new PostgresProductionDataStore(createPostgresPool(required("DATABASE_URL")));
  return dataStore;
}

export function getPrivateObjectStore() {
  if (!objectStore) objectStore = createSupabasePrivateObjectStore(
    required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"),
    process.env.SUPABASE_ASSET_BUCKET?.trim() || DEFAULT_ASSET_BUCKET,
  );
  return objectStore;
}

/** Creates a request-scoped service from Clerk's verified server identity. */
export async function getTenantDataService() {
  const store = getProductionDataStore();
  const context = await resolveAuthorizedCompany(store, await getClerkServerIdentity());
  return new TenantDataService(store, context);
}
