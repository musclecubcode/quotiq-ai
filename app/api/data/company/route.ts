import { getTenantDataService } from "@/lib/server/production-runtime";
import { validateCompanyProfileInput } from "@/lib/server/data/validation";
import { dataErrorResponse, jsonBody } from "../http";

export async function GET() { try { return Response.json(await (await getTenantDataService()).getCompany()); } catch (error) { return dataErrorResponse(error); } }
export async function PATCH(request: Request) { try { return Response.json(await (await getTenantDataService()).updateCompany(validateCompanyProfileInput(await jsonBody(request)))); } catch (error) { return dataErrorResponse(error); } }
