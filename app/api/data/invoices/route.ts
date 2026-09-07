import { getTenantDataService } from "@/lib/server/production-runtime";
import { validateNewInvoiceInput } from "@/lib/server/data/validation";
import { dataErrorResponse, jsonBody } from "../http";

export async function GET() {
  try {
    return Response.json(await (await getTenantDataService()).listInvoices(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return dataErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateNewInvoiceInput(await jsonBody(request));
    return Response.json(await (await getTenantDataService()).createInvoice(input), { status: 201 });
  } catch (error) {
    return dataErrorResponse(error);
  }
}
