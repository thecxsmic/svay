import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    overview: {
      subscribers: 48250,
      subscribersGrowth: "+2.1% today",
      videoUploads: 247,
      videoUploadsGrowth: "Stable output",
      totalViews: 3485200,
      totalViewsGrowth: "+8.6K today",
      growthProjection: "100K Views",
      growthProjectionGrowth: "Predicted in 12 days"
    },
    weeklyTrajectory: [
      { day: 1, val: 90 },
      { day: 5, val: 70 },
      { day: 10, val: 80 },
      { day: 15, val: 45 },
      { day: 20, val: 55 },
      { day: 25, val: 20 },
      { day: 30, val: 10 }
    ],
    milestone: {
      goal: "100K Subscribers",
      current: "48.2K",
      progressPercent: 48.2,
      targetDate: "August 27, 2026"
    }
  };

  return NextResponse.json(data);
}
