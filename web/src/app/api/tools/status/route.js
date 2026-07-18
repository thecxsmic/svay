import { NextResponse } from "next/server";
import {
  resolveToolIdentity,
  getQuotaSnapshot,
  toolsSidCookieOptions,
  quotaHeaders,
} from "@/lib/tools/quota";
import { TOOL_IDS, TIER_LIMITS, TOOL_META } from "@/lib/tools/config";
import { listRegions } from "@/lib/tools/engines";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const identity = await resolveToolIdentity(request);

    // Soft limit status polling abuse
    const poll = checkRateLimit(
      `tools:status:${identity.subjectKey}`,
      30,
      60_000
    );
    if (poll.limited) {
      return NextResponse.json(
        { success: false, error: "Too many status checks. Slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((poll.reset - Date.now()) / 1000))
            ),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get("tool");
    const validTool =
      toolId && TOOL_IDS.includes(toolId) ? toolId : null;

    const snapshot = await getQuotaSnapshot(identity, validTool);

    const body = {
      success: true,
      ...snapshot,
      tiers: Object.fromEntries(
        Object.entries(TIER_LIMITS).map(([id, t]) => [
          id,
          {
            id,
            label: t.label,
            dailyGlobal: t.dailyGlobal,
            dailyPerTool: t.dailyPerTool,
            burstPerMin: t.burstPerMin,
          },
        ])
      ),
      catalog: TOOL_IDS.map((id) => TOOL_META[id]),
      regions: listRegions(),
    };

    const res = NextResponse.json(body, {
      status: 200,
      headers: quotaHeaders(snapshot),
    });

    if (identity.setCookie) {
      const c = toolsSidCookieOptions(identity.sid);
      res.cookies.set(c.name, c.value, {
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
        path: c.path,
        maxAge: c.maxAge,
      });
    }

    return res;
  } catch (err) {
    console.error("[Tools Status]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load tool status" },
      { status: 500 }
    );
  }
}
