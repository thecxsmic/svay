import { parseFilters } from "@/lib/youtube/filters";
import { searchPipeline } from "@/lib/search/pipeline";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const filters = parseFilters(req);
    
    if (!filters.query) {
      return apiError(new Error("Query parameter 'q' is required"), 400);
    }

    const { items, nextPageToken } = await searchPipeline(filters);

    return apiSuccess({ items, nextPageToken });
  } catch (error) {
    return apiError(error);
  }
}
