import { dataErrorResponse } from "../http";
import { getTenantDataService } from "@/lib/server/production-runtime";

export async function GET() {
  try { return Response.json(await (await getTenantDataService()).getCompanyDataSnapshot(), { headers: { "cache-control": "no-store" } }); }
  catch (error) { return dataErrorResponse(error); }
}
