import { CompanyProfileValidationError } from "@/lib/company-profile";
import { DataLayerError } from "@/lib/server/data/errors";

export function dataErrorResponse(error: unknown) {
  if (error instanceof DataLayerError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : error.code === "VALIDATION" ? 400 : 500;
    return Response.json({ error: error.message, code: error.code }, { status });
  }
  if (error instanceof CompanyProfileValidationError || error instanceof TypeError || error instanceof SyntaxError) return Response.json({ error: "The submitted data is invalid.", code: "VALIDATION" }, { status: 400 });
  return Response.json({ error: "The request could not be completed." }, { status: 500 });
}

export async function jsonBody(request: Request, maximumBytes = 1_000_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBytes) throw new DataLayerError("VALIDATION", "The submitted data is too large.");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) throw new DataLayerError("VALIDATION", "The submitted data is too large.");
  return JSON.parse(body) as unknown;
}
