import { auth } from "@clerk/nextjs/server";
import { togglePin, getPinnedChannels, isChannelPinned } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (channelId) {
      const isPinned = await isChannelPinned(userId, channelId);
      return apiSuccess({ isPinned });
    }

    const pinned = await getPinnedChannels(userId);
    return apiSuccess({ items: pinned });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { channelId } = await req.json();
    if (!channelId) return apiError(new Error("Channel ID is required"), 400);

    const result = await togglePin(userId, channelId);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
