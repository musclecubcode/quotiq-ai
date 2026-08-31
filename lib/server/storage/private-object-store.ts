import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { invalid } from "../data/errors";
export { privateAssetKey, type PrivateAssetKind } from "./private-asset-key";
export const DEFAULT_ASSET_BUCKET = "quotiq-assets";

export class SupabasePrivateObjectStore {
  constructor(private readonly client: SupabaseClient, private readonly bucket = DEFAULT_ASSET_BUCKET) {}

  async put(key: string, bytes: ArrayBuffer, contentType: string) {
    if (!key || key.startsWith("/") || key.includes("..")) throw invalid("Storage key is invalid.");
    const { error } = await this.client.storage.from(this.bucket).upload(key, bytes, { contentType, upsert: false });
    if (error) throw new Error(`Private asset upload failed: ${error.message}`);
    return key;
  }
  async get(key: string) {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error) throw new Error(`Private asset download failed: ${error.message}`);
    return data;
  }
  async remove(key: string) {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) throw new Error(`Private asset removal failed: ${error.message}`);
  }
}

export function createSupabasePrivateObjectStore(url: string, serviceRoleKey: string, bucket = DEFAULT_ASSET_BUCKET) {
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return new SupabasePrivateObjectStore(client, bucket);
}
