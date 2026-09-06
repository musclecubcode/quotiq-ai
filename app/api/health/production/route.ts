import { getProductionHealth } from "@/lib/server/production-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getProductionHealth();
  return Response.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
