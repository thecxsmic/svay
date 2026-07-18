export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/privacy", "/terms", "/cookies", "/refund", "/support"],
        disallow: [
          "/api/",
          "/sign-in",
          "/sign-up",
          "/admin",
          "/billing",
          "/channels",
          "/competitors",
          "/analytics",
          "/library",
          "/radar",
          "/sso-callback",
        ],
      },
    ],
    sitemap: "https://svay.space/sitemap.xml",
    host: "https://svay.space",
  };
}
