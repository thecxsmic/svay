/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@clerk/nextjs",
    ],
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.app.github.dev",
        "*.github.dev",
        "*.preview.app.github.dev",
        "*.vercel.app",
      ],
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  // Long-cache static assets; HTML stays dynamic
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
