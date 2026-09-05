import { getTenantDataService } from "@/lib/server/production-runtime";
import { validateWorkOrderUpdate } from "@/lib/server/data/validation";
import { dataErrorResponse, jsonBody } from "../../http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { return Response.json(await (await getTenantDataService()).getWorkOrder((await context.params).id)); } catch (error) { return dataErrorResponse(error); } }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { return Response.json(await (await getTenantDataService()).updateWorkOrder((await context.params).id, validateWorkOrderUpdate(await jsonBody(request)))); } catch (error) { return dataErrorResponse(error); } }
