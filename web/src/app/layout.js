import { Audiowide, Montserrat_Alternates, Righteous } from "next/font/google";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { UserProvider } from "@/contexts/user";
import { ChannelProvider } from "@/contexts/channel";
import { BottomSheetProvider } from "@/contexts/bottomSheet";
import RouteGater from "./components/RouteGater";
import { cookies } from "next/headers";
import "./globals.css";
import Script from "next/script";


const audiowide = Audiowide({
  weight: "400",
  variable: "--font-audiowide",
  subsets: ["latin"],
  display: "swap",
});

const montserratAlternates = Montserrat_Alternates({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat-alternates",
  subsets: ["latin"],
  display: "swap",
});

const righteous = Righteous({
  weight: "400",
  variable: "--font-righteous",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    template: "%s | Svay",
    default: "Svay Intelligence",
  },
  description: "Advanced Content Ecosystem Tracking and Creator Analytics Platform",
  keywords: ["Svay", "Creator Economy", "YouTube Analytics", "Content Intelligence", "Viral Trends", "Competitor Tracking"],
  authors: [{ name: "Svay Team" }],
  metadataBase: new URL("https://svay.space"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Svay Intelligence",
    description: "Advanced Content Ecosystem Tracking and Creator Analytics Platform",
    url: "https://svay.space",
    siteName: "Svay",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Svay Intelligence",
    description: "Advanced Content Ecosystem Tracking and Creator Analytics Platform",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest"
};

export const viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get("demo_mode")?.value === "true";

  let isSubscribed = false;
  let subscription = null;

  if (isDemoMode) {
    isSubscribed = true;
  } else {
    try {
      const { userId } = await auth();
      if (userId) {
        // Fetch Clerk user details to check if they are the admin
        const user = await currentUser();
        const userEmail = user?.emailAddresses[0]?.emailAddress;
        
        if (userEmail === "thecxsmic@gmail.com") {
          isSubscribed = true;
          subscription = {
            status: "active",
            isActive: true,
            isHalted: false,
            isExpired: false,
            currentPeriodEnd: 0
          };
          console.log("[Auth] Admin user detected: Bypassing subscription required gate");
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
      className={`${audiowide.variable} ${montserratAlternates.variable} ${righteous.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-black text-[#ededed] selection:bg-[#0070f3] selection:text-white font-sans">
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="0e5f3f30-23db-41cf-b7d0-d7abfd372536"
          strategy="afterInteractive"
        />
        <ClerkProvider>
          <UserProvider>
            <ChannelProvider>
              <BottomSheetProvider>
                <RouteGater 
                  initialIsSubscribed={isSubscribed} 
                  initialSubscription={subscription}
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
