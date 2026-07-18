export default function sitemap() {
  const baseUrl = "https://svay.space";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" },
    { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
    { path: "/tools/earnings", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/title", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/tags", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/engagement", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/script", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/chapters", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/milestones", priority: 0.8, changeFrequency: "monthly" },
    { path: "/tools/seo", priority: 0.8, changeFrequency: "monthly" },
    { path: "/support", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
    { path: "/refund", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
