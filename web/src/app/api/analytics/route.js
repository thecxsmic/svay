import { auth } from "@clerk/nextjs/server";
import { getUserChannel, saveChannelSnapshot, getChannelSnapshots, getChannelVideos } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, generateMockAnalytics } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    if (await getIsDemoMode()) {
      const mockData = generateMockAnalytics();
      return apiSuccess({
        data: mockData.snapshots,
        channel: mockData.channel,
        videos: mockData.videos.slice(0, 10)
      });
    }

    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const userChannel = await getUserChannel(userId);
    if (!userChannel) return apiSuccess({ data: [], channel: null, videos: [] });

    // 1. Fetch historical snapshots
    const snapshots = await getChannelSnapshots(userChannel.id);
    
    // 2. Fetch recent videos for analysis
    const videos = await getChannelVideos(userChannel.id);
    
    return apiSuccess({ 
      data: snapshots, 
      channel: userChannel,
      videos: videos.slice(0, 10) // Only send recent 10 for basic analytics
    });
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

    const userChannel = await getUserChannel(userId);
    if (!userChannel) return apiError(new Error("No channel connected"), 400);

    // Sync latest stats from YouTube first
    const res = await fetch(`${new URL(req.url).origin}/api/youtube/channel?channelId=${userChannel.id}`);
    const latest = await res.json();
    
    if (latest.success && latest.channel) {
      const result = await saveChannelSnapshot(userId, latest.channel);
      return apiSuccess(result);
    }

    return apiError(new Error("Failed to sync latest channel data"), 500);
  } catch (error) {
    return apiError(error);
  }
}

