import { Audiowide, Montserrat_Alternates, Righteous } from "next/font/google";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { UserProvider } from "@/contexts/user";
import { ChannelProvider } from "@/contexts/channel";
import { BottomSheetProvider } from "@/contexts/bottomSheet";
import RouteGater from "./components/RouteGater";
import { cookies } from "next/headers";
import "./globals.css";


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
    template: "%s | Vyron",
    default: "Vyron Intelligence",
  },
  description: "Advanced Content Ecosystem Tracking",
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
      subscription = userId ? await getSubscriptionStatus(userId) : null;
      isSubscribed = subscription?.isActive;
    } catch (e) {
      console.warn("Clerk auth failed, using defaults");
    }
  }

  return (
    <html
      lang="en"
      className={`${audiowide.variable} ${montserratAlternates.variable} ${righteous.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-black text-[#ededed] selection:bg-[#0070f3] selection:text-white font-sans">
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
