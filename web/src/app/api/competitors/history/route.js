import { auth } from "@clerk/nextjs/server";
import { getCompetitorHistory } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (await getIsDemoMode()) {
      return apiSuccess({ history: [] });
    }

    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    if (!subjectId) {
      return apiError(new Error("Subject ID is required"), 400);
    }

    const history = await getCompetitorHistory(userId, subjectId, limit);
    return apiSuccess({ history });
  } catch (error) {
    return apiError(error);
  }
}
