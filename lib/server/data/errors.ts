export type DataLayerErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "NOT_CONFIGURED";

export class DataLayerError extends Error {
  constructor(public readonly code: DataLayerErrorCode, message: string) {
    super(message);
    this.name = "DataLayerError";
  }
}

export const unauthenticated = () => new DataLayerError("UNAUTHENTICATED", "Authentication is required.");
export const forbidden = () => new DataLayerError("FORBIDDEN", "You do not have access to this company.");
export const notFound = (resource: string) => new DataLayerError("NOT_FOUND", `${resource} was not found.`);
export const invalid = (message: string) => new DataLayerError("VALIDATION", message);
