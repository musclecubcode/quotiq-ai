import { dataErrorResponse, jsonBody } from "../../http";
import { getTenantDataService } from "@/lib/server/production-runtime";

export async function POST(request: Request) {
  try { return Response.json(await (await getTenantDataService()).previewBrowserDataImport(await jsonBody(request, 5_000_000))); }
  catch (error) { return dataErrorResponse(error); }
}
