import { auth } from "@clerk/nextjs/server";
import { setUserChannel, getUserChannel, unsetUserChannel, getChannel, saveChannel } from "@/lib/cache/turso";
import { fetchYouTubeChannels } from "@/lib/youtube/channels";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, MOCK_CHANNELS } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    if (await getIsDemoMode()) {
      return apiSuccess({ channel: MOCK_CHANNELS["UC-techvibeai123"] });
    }

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
    if (await getIsDemoMode()) {
      return apiSuccess({ success: true });
    }

    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { channelId, action } = await req.json();

    if (action === 'unset') {
      const result = await unsetUserChannel(userId);
      return apiSuccess(result);
    }

    if (!channelId) return apiError(new Error("Channel ID is required"), 400);

    // Ensure the channel exists in the database to prevent FOREIGN KEY constraint failure
    const existing = await getChannel(channelId);
    if (!existing) {
      const channels = await fetchYouTubeChannels(channelId);
      if (channels && channels.length > 0) {
        await saveChannel(channels[0]);
      } else {
        return apiError(new Error("Channel not found on YouTube"), 404);
      }
    }

    const result = await setUserChannel(userId, channelId);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

