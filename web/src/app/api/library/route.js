import { auth } from "@clerk/nextjs/server";
import { saveLibraryItem, getLibraryItems, deleteLibraryItem, getLibraryItemByReference, getLibraryItemById } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    const referenceId = searchParams.get("reference_id");

    if (id) {
      const item = await getLibraryItemById(userId, id);
      return apiSuccess({ item });
    }

    if (referenceId) {
      const item = await getLibraryItemByReference(userId, referenceId);
      return apiSuccess({ item });
    }

    const items = await getLibraryItems(userId, type);
    return apiSuccess({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const body = await req.json();
    const { id, type, reference_id, title, content, metadata, action } = body;

    if (action === 'delete') {
      const result = await deleteLibraryItem(userId, id);
      return apiSuccess(result);
    }

    if (!type || !title) {
      return apiError(new Error("Type and Title are required"), 400);
    }

    const result = await saveLibraryItem(userId, { id, type, reference_id, title, content, metadata });
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
