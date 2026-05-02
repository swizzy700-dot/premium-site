import { NextResponse } from "next/server";
import { runLighthouseAudit } from "@/lib/website-checker/lighthouse/runLighthouse";
import { parseLhrForClient } from "@/lib/website-checker/lighthouse/parseLighthouse";
import { interpretLighthouse } from "@/lib/website-checker/lighthouse/interpretLighthouse";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

function getAdminKeyFromHeader(req: Request) {
  return req.headers.get("x-admin-key") || req.headers.get("X-ADMIN-KEY");
}

export async function POST(req: Request) {
  const adminKey = getAdminKeyFromHeader(req);
  const expected = process.env.LIGHTHOUSE_ADMIN_KEY;
  if (!expected || !adminKey || adminKey !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { url?: string };
    const url = body?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required `url`." }, { status: 400 });
    }

    const lhr = await runLighthouseAudit({ url });
    const parsed = parseLhrForClient({ lhr });
    const interpreted = interpretLighthouse({
      url,
      generatedAt: Date.now(),
      parsed,
      rawLhr: lhr,
    });

    return NextResponse.json({ audit: interpreted.client, raw: interpreted.rawLhr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to run Lighthouse audit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

