import { NextResponse } from "next/server";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Live market pricing is not configured yet. Add OPENAI_API_KEY to the server environment." }, { status: 503 });

    const prompt = `You are the market-pricing research engine for Quotiq AI, a professional contractor estimating application.
Research CURRENT prices using web search. The job is located at: ${body.serviceAddress || "address not provided"}.
Trade: ${body.trade || "not provided"}.
Scope: ${body.description || "not provided"}.
Saved measurements: ${JSON.stringify(body.measurements ?? [])}.

Rules:
- Prioritize local or nearby retailer pricing for materials when the location is known, then major retailers/manufacturers when local pricing is unavailable.
- Research professional contractor labor/service market ranges for the job's geographic area. Do not use bargain/DIY pricing as the recommendation.
- Never invent a live price. If a material or labor price cannot be verified, explicitly say it is unverified.
- Measurements are contractor-entered facts. Calculate quantities from them when possible, but clearly state waste-factor and scope assumptions.
- Separate material acquisition cost from professional client pricing.
- Do not expose a fake precision. Use ranges when evidence varies.
- Include source URLs and a researched-at timestamp.
- Return ONLY valid JSON with this exact shape:
{"summary":"string","materials":[{"item":"string","quantity":"string","unitPrice":"string","extendedPrice":"string","source":"string"}],"materialSubtotal":"string","laborMarketRange":"string","recommendedClientRange":"string","assumptions":["string"],"sources":[{"title":"string","url":"https://..."}],"researchedAt":"ISO timestamp"}`;

This is decision support for a professional contractor. The contractor reviews and approves the final quote.`;

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_PRICING_MODEL || "gpt-5-mini", tools: [{ type: "web_search" }], input: prompt }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Pricing research provider failed." }, { status: 502 });

    const text = (data.output ?? []).flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((item: { type?: string }) => item.type === "output_text")?.text;
    if (!text) return NextResponse.json({ error: "Pricing research returned no usable result." }, { status: 502 });
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    let parsed;
    try { parsed = JSON.parse(cleaned); } catch { return NextResponse.json({ error: "Pricing research returned an invalid result. Please retry." }, { status: 502 }); }
    parsed.researchedAt = parsed.researchedAt || new Date().toISOString();
    return NextResponse.json(parsed);
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Unable to research market pricing." }, { status: 500 });
  }
}
