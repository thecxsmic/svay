import { auth } from "@clerk/nextjs/server";
import { saveAnalysis, getSavedAnalyses, getAnalysisById, getUserChannel, getLastEmail } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, MOCK_COMPETITORS_ANALYSIS } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (await getIsDemoMode()) {
      if (id) {
        return apiSuccess({ item: MOCK_COMPETITORS_ANALYSIS });
      }
      return apiSuccess({ items: [MOCK_COMPETITORS_ANALYSIS] });
    }

    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    if (id) {
      const analysis = await getAnalysisById(userId, id);
      if (analysis) {
        const lastEmail = await getLastEmail(userId, 'competitor_analysis', id);
        analysis.lastEmailSentAt = lastEmail;
      }
      return apiSuccess({ item: analysis });
    }

    const analyses = await getSavedAnalyses(userId);
    return apiSuccess({ items: analyses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req) {
  try {
    if (await getIsDemoMode()) {
      return apiSuccess({ success: true });
    }

    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { subjectId, competitorIds, title } = await req.json();
    if (!subjectId || !competitorIds) {
      return apiError(new Error("Subject ID and Competitor IDs are required"), 400);
    }

    const result = await saveAnalysis(userId, subjectId, competitorIds, title || "Untitled Analysis");
    if (!result.success && result.error?.includes("FOREIGN KEY constraint failed")) {
      return apiError(new Error("Channel data is still being processed. Please try again in a moment."), 400);
    }
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

