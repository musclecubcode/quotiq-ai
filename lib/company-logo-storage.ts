import type { CompanyLogoAsset } from "./types";

const DATABASE_NAME = "quotiq-company-assets";
const DATABASE_VERSION = 1;
const STORE_NAME = "logos";
export const MAX_COMPANY_LOGO_BYTES = 5 * 1024 * 1024;
export const COMPANY_LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

export interface CompanyLogoStorage {
  put(ownerId: string, file: File): Promise<CompanyLogoAsset>;
  get(asset: CompanyLogoAsset): Promise<Blob | undefined>;
  delete(asset: CompanyLogoAsset): Promise<void>;
}

export class CompanyLogoStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompanyLogoStorageError";
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new CompanyLogoStorageError("Logo storage is not supported by this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new CompanyLogoStorageError("Unable to open local logo storage."));
  });
}

async function databaseRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new CompanyLogoStorageError(
      request.error?.name === "QuotaExceededError" ? "Local logo storage is full." : "The logo could not be stored."
    ));
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });
}

async function detectedMimeType(file: File): Promise<CompanyLogoAsset["mimeType"] | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const ascii = String.fromCharCode(...bytes);
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function validateCompanyLogo(file: File): Promise<CompanyLogoAsset["mimeType"]> {
  if (!file.size) throw new CompanyLogoStorageError("Choose a non-empty logo file.");
  if (file.size > MAX_COMPANY_LOGO_BYTES) throw new CompanyLogoStorageError("Logo must be 5 MB or smaller.");
  const detected = await detectedMimeType(file);
  if (!detected || detected !== file.type) {
    throw new CompanyLogoStorageError("Logo must be a valid PNG, JPEG, or WebP image.");
  }
  return detected;
}

export const localCompanyLogoStorage: CompanyLogoStorage = {
  async put(ownerId, file) {
    const mimeType = await validateCompanyLogo(file);
    const id = crypto.randomUUID();
    const storageKey = `${ownerId}/logos/${id}`;
    await databaseRequest("readwrite", (store) => store.put(file, storageKey));
    return { id, storageKey, fileName: file.name, mimeType, size: file.size, createdAt: new Date().toISOString() };
  },
  get(asset) { return databaseRequest<Blob | undefined>("readonly", (store) => store.get(asset.storageKey)); },
  delete(asset) { return databaseRequest("readwrite", (store) => store.delete(asset.storageKey)); },
};
