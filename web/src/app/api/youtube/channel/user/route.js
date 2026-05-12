import { auth } from "@clerk/nextjs/server";
import { setUserChannel, getUserChannel, unsetUserChannel } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const userChannel = await getUserChannel(userId);
    return apiSuccess({ channel: userChannel });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { channelId, action } = await req.json();

    if (action === 'unset') {
      const result = await unsetUserChannel(userId);
      return apiSuccess(result);
    }

    if (!channelId) return apiError(new Error("Channel ID is required"), 400);

    const result = await setUserChannel(userId, channelId);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
