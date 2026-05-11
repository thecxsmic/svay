/**
 * Virality Ranking Logic
 */

export function calculateViralityScore(item) {
  if (!item.statistics) return { score: 0, level: 'Low', color: 'text-gray-500', engagement: 0, dailyViews: 0 };
  
  const views = parseInt(item.statistics.viewCount || 0);
  const likes = parseInt(item.statistics.likeCount || 0);
  const comments = parseInt(item.statistics.commentCount || 0);
  
  if (isNaN(views) || views === 0) return { score: 0, level: 'Low', color: 'text-gray-500', engagement: 0, dailyViews: 0 };

  const publishedAt = new Date(item.snippet.publishedAt);
  const now = new Date();
  
  const diffTime = Math.abs(now - publishedAt);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const dailyViews = views / diffDays;
  
  const engagementRate = (( (isNaN(likes) ? 0 : likes) + (isNaN(comments) ? 0 : comments) * 2) / views);
  const velocityFactor = Math.min(Math.log10(dailyViews + 1) * 15, 60);
  const engagementFactor = Math.min(engagementRate * 200, 40);
  
  let score = Math.round((velocityFactor + engagementFactor) * 10) / 10;
  if (isNaN(score)) score = 0;
  score = Math.min(score, 100);
  
  let level = 'Stable';
  let color = 'from-gray-500 to-gray-700';
  if (score > 70) { level = 'Viral'; color = 'from-orange-500 to-red-600'; }
  else if (score > 40) { level = 'Hot'; color = 'from-purple-500 to-blue-600'; }
  else if (score > 10) { level = 'Rising'; color = 'from-green-500 to-emerald-600'; }

  return { 
    score, 
    level, 
    color, 
    engagement: (engagementRate * 100).toFixed(2),
    dailyViews: Math.round(dailyViews)
  };
}
