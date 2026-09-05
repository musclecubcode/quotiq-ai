import { getTenantDataService } from "@/lib/server/production-runtime";
import { validateNewWorkOrderInput } from "@/lib/server/data/validation";
import { dataErrorResponse, jsonBody } from "../http";

export async function GET() { try { return Response.json(await (await getTenantDataService()).listWorkOrders(), { headers: { "cache-control": "no-store" } }); } catch (error) { return dataErrorResponse(error); } }
export async function POST(request: Request) { try { return Response.json(await (await getTenantDataService()).createWorkOrder(validateNewWorkOrderInput(await jsonBody(request))), { status: 201 }); } catch (error) { return dataErrorResponse(error); } }
