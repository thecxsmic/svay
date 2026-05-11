import { NextResponse } from "next/server";
import { runIndexingJob } from "@/lib/jobs/index-queue";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Simple check for Cron authorization if needed
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const result = await runIndexingJob();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
