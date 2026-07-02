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
      // Reset last_updated on all channels to 0 (so they are seen as stale and will reload fresh)
      await client.execute("UPDATE channels SET last_updated = 0");
      
      // Delete all generated AI video ideas & insights
      await client.execute("DELETE FROM trend_radar");
      
      console.log("[Admin Channels API] Purged ALL trend radar caches and set channel freshness to stale.");
      return apiSuccess({ success: true, message: "All generated competitor & video idea caches successfully purged." });
    }

    if (!channelId) {
      return apiError(new Error("channelId query parameter is required"), 400);
    }

    // Set last_updated to 0 for the specific channel so it reloads fresh next time
    await client.execute({
      sql: "UPDATE channels SET last_updated = 0 WHERE id = ?",
      args: [channelId]
    });

    // Delete generated AI ideas & insights for the specific channel
    await client.execute({
      sql: "DELETE FROM trend_radar WHERE channel_id = ?",
      args: [channelId]
    });

    console.log(`[Admin Channels API] Reset cache freshness and cleared ideas for channel: ${channelId}`);
    return apiSuccess({ success: true, message: "Channel competitor & idea cache successfully cleared." });
  } catch (error) {
    console.error("[Admin Channels API] DELETE Error:", error);
    return apiError(error);
  }
}
