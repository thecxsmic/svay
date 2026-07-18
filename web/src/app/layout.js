import { Montserrat_Alternates, Righteous } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { UserProvider } from "@/contexts/user";
import { ChannelProvider } from "@/contexts/channel";
import { BottomSheetProvider } from "@/contexts/bottomSheet";
import RouteGater from "./components/RouteGater";
import JsonLd from "./components/JsonLd";
import { cookies } from "next/headers";
import "./globals.css";
import Script from "next/script";

// Only weights used in UI — much smaller than full 100–900 + italic family
const montserratAlternates = Montserrat_Alternates({
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal"],
  variable: "--font-montserrat-alternates",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const righteous = Righteous({
  weight: "400",
  variable: "--font-righteous",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const SITE_URL = "https://svay.space";
const SITE_NAME = "Svay";
const DEFAULT_TITLE =
  "Svay — YouTube Trend Radar & Creator Analytics";
const DEFAULT_DESCRIPTION =
  "Discover viral YouTube trends, track competitors, and grow faster. Svay is creator intelligence for serious channels — trend radar, smart search, and growth analytics. Start a 7-day free trial.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Svay",
    default: DEFAULT_TITLE,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Svay",
    "YouTube analytics",
    "YouTube trends",
    "creator tools",
    "viral content",
    "competitor tracking",
    "trend radar",
    "YouTube growth",
    "content intelligence",
    "creator economy",
  ],
  authors: [{ name: "Svay Team", url: SITE_URL }],
  creator: "Svay",
  publisher: "Svay",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Svay — YouTube creator intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get("demo_mode")?.value === "true";

  let isSubscribed = false;
  let subscription = null;
  let isSignedIn = false;

  if (isDemoMode) {
    isSubscribed = true;
  } else {
    try {
      const { userId } = await auth();
      if (userId) {
        isSignedIn = true;
        const user = await currentUser();
        const userEmail = user?.emailAddresses[0]?.emailAddress;

        if (userEmail === "thecxsmic@gmail.com") {
          isSubscribed = true;
          subscription = {
            status: "active",
            isActive: true,
            isHalted: false,
            isExpired: false,
            currentPeriodEnd: 0,
          };
        } else {
          subscription = await getSubscriptionStatus(userId);
          isSubscribed = subscription?.isActive;
        }
      }
    } catch (e) {
      console.warn("Clerk auth failed, using defaults", e);
    }
  }

  return (
    <html
      lang="en"
      className={`${montserratAlternates.variable} ${righteous.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="h-full bg-black text-[#ededed] selection:bg-[#0070f3] selection:text-white font-sans">
        <JsonLd />
        <link rel="preconnect" href="https://cloud.umami.is" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cloud.umami.is" />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="0e5f3f30-23db-41cf-b7d0-d7abfd372536"
          strategy="lazyOnload"
        />
        <ClerkProvider>
          <UserProvider>
            <ChannelProvider>
              <BottomSheetProvider>
                <RouteGater
                  initialIsSubscribed={isSubscribed}
                  initialSubscription={subscription}
                  initialIsSignedIn={isSignedIn}
                  initialIsDemoMode={isDemoMode}
                >
                  {children}
                </RouteGater>
              </BottomSheetProvider>
            </ChannelProvider>
          </UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
