import { getTenantDataService } from "@/lib/server/production-runtime";
import { dataErrorResponse } from "../../http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(await (await getTenantDataService()).getClient((await context.params).id)); }
  catch (error) { return dataErrorResponse(error); }
}
