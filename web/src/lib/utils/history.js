import { REGION_CONFIG } from "./earnings";

/**
 * Generates simulated historical data for a channel
 */
export function generateChannelHistory(statistics, days = 14) {
  const totalSubs = parseInt(statistics.subscriberCount || 0);
  const totalViews = parseInt(statistics.viewCount || 0);
  const videoCount = parseInt(statistics.videoCount || 0);

  const history = [];
  let currentSubs = totalSubs;
  let currentViews = totalViews;

  // Base growth rates (very rough estimates)
  const subGrowthRate = totalSubs > 1000000 ? 0.0008 : 0.002;
  const viewGrowthRate = 0.001;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some "volatility"
    const dayFactor = 0.5 + Math.random();
    const subChange = Math.floor((totalSubs * subGrowthRate / days) * dayFactor);
    const viewChange = Math.floor((totalViews * viewGrowthRate / days) * dayFactor);

    // Revenue Range (using $2 - $6 CPM estimate)
    const revMin = (viewChange / 1000) * 2;
    const revMax = (viewChange / 1000) * 6;

    history.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }),
      dateRaw: date,
      subsTotal: currentSubs,
      subsChange: i === 0 ? subChange : subChange, // In reality, we'd subtract from current for past days
      viewsTotal: currentViews,
      viewsChange: viewChange,
      revMin,
      revMax
    });

    // For simulation, we'll just keep the current as "today" and work backwards
    // but the table usually shows most recent at bottom or top.
    // Let's adjust current values for the next iteration (going backwards)
    currentSubs -= subChange;
    currentViews -= viewChange;
  }

  return history.reverse(); // Most recent at the bottom usually for these tables
}

export function calculateAverages(history) {
  const totalDays = history.length;
  if (totalDays === 0) return null;

  const totalSubsChange = history.reduce((acc, day) => acc + day.subsChange, 0);
  const totalViewsChange = history.reduce((acc, day) => acc + day.viewsChange, 0);
  const totalRevMin = history.reduce((acc, day) => acc + day.revMin, 0);
  const totalRevMax = history.reduce((acc, day) => acc + day.revMax, 0);

  return {
    dailyAvg: {
      subs: Math.floor(totalSubsChange / totalDays),
      views: Math.floor(totalViewsChange / totalDays),
      revMin: totalRevMin / totalDays,
      revMax: totalRevMax / totalDays
    },
    weeklyAvg: {
      subs: Math.floor(totalSubsChange / totalDays * 7),
      views: Math.floor(totalViewsChange / totalDays * 7),
      revMin: totalRevMin / totalDays * 7,
      revMax: totalRevMax / totalDays * 7
    },
    monthlyEst: {
      subs: Math.floor(totalSubsChange / totalDays * 28),
      views: Math.floor(totalViewsChange / totalDays * 28),
      revMin: totalRevMin / totalDays * 28,
      revMax: totalRevMax / totalDays * 28
    }
  };
}
