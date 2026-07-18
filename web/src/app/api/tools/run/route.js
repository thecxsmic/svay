import { NextResponse } from "next/server";
import {
  resolveToolIdentity,
  consumeToolQuota,
  toolsSidCookieOptions,
  quotaHeaders,
} from "@/lib/tools/quota";
import { runToolEngine } from "@/lib/tools/engines";
import { TOOL_IDS, INPUT_LIMITS } from "@/lib/tools/config";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

export async function POST(request) {
  try {
    // Hard body size guard
    const cl = request.headers.get("content-length");
    if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload too large", code: "PAYLOAD_TOO_LARGE" },
        { status: 413 }
      );
    }

    const identity = await resolveToolIdentity(request);

    // Global tools API burst (separate from per-tool daily)
    const apiBurst = checkRateLimit(
      `tools:api:${identity.ipKey}`,
      40,
      60_000
    );
    if (apiBurst.limited) {
      return NextResponse.json(
        {
          success: false,
          error: "API rate limit exceeded",
          code: "API_BURST",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((apiBurst.reset - Date.now()) / 1000))
            ),
          },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body", code: "BAD_JSON" },
        { status: 400 }
      );
    }

    const toolId = String(body?.tool || "").toLowerCase();
    if (!TOOL_IDS.includes(toolId)) {
      return NextResponse.json(
        { success: false, error: "Unknown tool", code: "UNKNOWN_TOOL" },
        { status: 400 }
      );
    }

    const input = body?.input && typeof body.input === "object" ? body.input : {};

    // Shallow input size guard (string fields)
    const maxFieldLen = Math.max(
      INPUT_LIMITS.title,
      INPUT_LIMITS.topic,
      INPUT_LIMITS.niche,
      INPUT_LIMITS.keyword,
      INPUT_LIMITS.description,
      INPUT_LIMITS.script,
      INPUT_LIMITS.chapters,
      200
    );
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === "string" && v.length > maxFieldLen) {
        return NextResponse.json(
          {
            success: false,
            error: `Field "${k}" is too long`,
            code: "FIELD_TOO_LONG",
          },
          { status: 400 }
        );
      }
    }

    const consumed = await consumeToolQuota(identity, toolId);
    if (!consumed.ok) {
      const headers = quotaHeaders(consumed.snapshot, {
        ...(consumed.retryAfter
          ? { "Retry-After": String(consumed.retryAfter) }
          : {}),
      });
      const res = NextResponse.json(
        {
          success: false,
          error: consumed.error,
          code: consumed.code,
          quota: consumed.snapshot,
        },
        { status: consumed.status, headers }
      );
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
    }

    let engineResult;
    try {
      engineResult = runToolEngine(toolId, input);
    } catch (engineErr) {
      // Engine failed after consume — do not refund (prevents probe abuse)
      const status = engineErr.status || 400;
      return NextResponse.json(
        {
          success: false,
          error: engineErr.message || "Tool failed",
          code: "ENGINE_ERROR",
          quota: consumed.snapshot,
        },
        { status, headers: quotaHeaders(consumed.snapshot) }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        tool: toolId,
        ...engineResult,
        quota: consumed.snapshot,
      },
      { status: 200, headers: quotaHeaders(consumed.snapshot) }
    );

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
    console.error("[Tools Run]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Tool run failed", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
