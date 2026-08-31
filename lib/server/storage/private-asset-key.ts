import { validateEntityId } from "../data/validation";

export type PrivateAssetKind = "logos" | "photos" | "documents";

export function privateAssetKey(companyId: string, kind: PrivateAssetKind, assetId: string, fileName: string) {
  validateEntityId(companyId, "Company ID"); validateEntityId(assetId, "Asset ID");
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  return `${companyId}/${kind}/${assetId}${extension ? `.${extension}` : ""}`;
}
