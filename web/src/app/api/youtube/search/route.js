import { parseFilters } from "@/lib/youtube/filters";
import { searchPipeline } from "@/lib/search/pipeline";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, generateMockSearch } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    const filters = parseFilters(req);
    
    if (!filters.query) {
      return apiError(new Error("Query parameter 'q' is required"), 400);
    }

    if (await getIsDemoMode()) {
      const items = generateMockSearch(filters.query);
      return apiSuccess({ items, nextPageToken: null });
    }

    const { items, nextPageToken } = await searchPipeline(filters);

    return apiSuccess({ items, nextPageToken });
  } catch (error) {
    return apiError(error);
  }
}

