import { DataLayerError } from "@/lib/server/data/errors";
import { getTenantDataService } from "@/lib/server/production-runtime";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 5_000_000) return Response.json({ error: "Import metadata exceeds 5 MB." }, { status: 413 });
    const result = await (await getTenantDataService()).importBrowserData(await request.json());
    return Response.json(result);
  } catch (error) {
    if (error instanceof DataLayerError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "CONFLICT" ? 409 : error.code === "VALIDATION" ? 400 : 500;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    return Response.json({ error: "The browser data import could not be completed." }, { status: 500 });
  }
}
