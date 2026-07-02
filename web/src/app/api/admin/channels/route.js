import { auth, currentUser } from "@clerk/nextjs/server";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return apiError(new Error("Forbidden: Admin access required"), 403);
    }

    const rs = await client.execute("SELECT id, title, custom_url, thumbnail, statistics FROM channels ORDER BY title ASC");
    const channels = rs.rows.map(row => ({
      id: row.id,
      title: row.title,
      custom_url: row.custom_url,
      thumbnail: row.thumbnail,
      statistics: JSON.parse(row.statistics || "{}")
    }));

    return apiSuccess({ channels });
  } catch (error) {
    console.error("[Admin Channels API] GET Error:", error);
    return apiError(error);
  }
}

export async function DELETE(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return apiError(new Error("Forbidden: Admin access required"), 403);
    }

    const { searchParams } = new URL(req.url);
    const purgeAll = searchParams.get("purgeAll") === "true";
    const channelId = searchParams.get("channelId");

    if (purgeAll) {
      // Clear ALL tables
      await client.execute("DELETE FROM channels");
      await client.execute("DELETE FROM videos");
      await client.execute("DELETE FROM trend_radar");
      console.log("[Admin Channels API] Purged ALL database caches.");
      return apiSuccess({ success: true, message: "All database caches purged successfully." });
    }

    if (!channelId) {
      return apiError(new Error("channelId query parameter is required"), 400);
    }

    // Delete records from channels, videos, and trend_radar for a specific channel
    await client.execute({
      sql: "DELETE FROM channels WHERE id = ?",
      args: [channelId]
    });
    
    await client.execute({
      sql: "DELETE FROM videos WHERE channel_id = ?",
      args: [channelId]
    });

    await client.execute({
      sql: "DELETE FROM trend_radar WHERE channel_id = ?",
      args: [channelId]
    });

    console.log(`[Admin Channels API] Cleared cache for channel: ${channelId}`);
    return apiSuccess({ success: true, message: "Channel cache successfully cleared." });
  } catch (error) {
    console.error("[Admin Channels API] DELETE Error:", error);
    return apiError(error);
  }
}
