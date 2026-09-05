import { getTenantDataService } from "@/lib/server/production-runtime";
import { dataErrorResponse, jsonBody } from "../http";

export async function POST(request: Request) {
  try {
    const result = await (await getTenantDataService()).importBrowserData(await jsonBody(request, 5_000_000));
    return Response.json(result);
  } catch (error) {
    return dataErrorResponse(error);
  }
}
