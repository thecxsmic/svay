import { auth } from "@clerk/nextjs/server";
import { saveAnalysis, getSavedAnalyses } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const analyses = await getSavedAnalyses(userId);
    return apiSuccess({ items: analyses });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { subjectId, competitorIds, title } = await req.json();
    if (!subjectId || !competitorIds) {
      return apiError(new Error("Subject ID and Competitor IDs are required"), 400);
    }

    const result = await saveAnalysis(userId, subjectId, competitorIds, title || "Untitled Analysis");
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
