const DATABASE_NAME = "quotiq-job-files";
const DATABASE_VERSION = 1;
const STORE_NAME = "files";

export class FileStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileStorageError";
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new FileStorageError("File storage is not supported by this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new FileStorageError("Unable to open browser file storage."));
  });
}

async function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const operation = action(transaction.objectStore(STORE_NAME));
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(new FileStorageError(
      operation.error?.name === "QuotaExceededError"
        ? "Browser file storage is full. Delete files or free device storage and try again."
        : "The file could not be stored."
    ));
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => database.close();
  });
}

export const indexedDbFileStorage = {
  put(id: string, file: Blob) { return request("readwrite", (store) => store.put(file, id)); },
  get(id: string) { return request<Blob | undefined>("readonly", (store) => store.get(id)); },
  delete(id: string) { return request("readwrite", (store) => store.delete(id)); },
};
