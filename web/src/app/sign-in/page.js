import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import DemoLoginButton from "../components/DemoLoginButton";
import Link from "next/link";

export const metadata = {
  title: "Sign In | Svay",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Centered card container */}
      <div className="w-full max-w-[380px] z-10 flex flex-col gap-6 relative">
        
        {/* Wordmark & Heading */}
        <div className="text-center space-y-4">
          {/* Svay Logo Icon & Font */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-3">
              {/* Official SVG Svay Icon */}
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-[0_0_15px_rgba(0,112,243,0.35)] rounded-full">
                <rect width="32" height="32" rx="16" fill="url(#signIn_paint0_linear)"/>
                <defs>
                  <linearGradient id="signIn_paint0_linear" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0070f3"/>
                    <stop offset="1" stopColor="#00f0ff"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-medium text-xs text-[#FAFAFA] tracking-[0.25em]" style={{ fontFamily: "var(--font-righteous)" }}>SVAY</span>
            </div>
          </div>
        </div>

        {/* Clerk loading state - Skeleton Loading */}
        <ClerkLoading>
          <div className="w-full bg-black border border-white/10 p-6 rounded-lg flex flex-col gap-5 min-h-[385px] shadow-none animate-pulse">
            
            {/* Social buttons skeletons */}
            <div className="space-y-2.5">
              <div className="h-10 bg-zinc-900/60 border border-white/5 rounded-md w-full" />
              <div className="h-10 bg-zinc-900/60 border border-white/5 rounded-md w-full" />
            </div>
            
            {/* Divider skeleton */}
            <div className="flex items-center gap-4 my-2">
              <div className="h-[1px] bg-white/10 flex-1" />
              <div className="h-3 bg-zinc-900/60 rounded w-8" />
              <div className="h-[1px] bg-white/10 flex-1" />
            </div>
            
            {/* Form field 1 skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-zinc-900/60 rounded w-16" />
              <div className="h-10 bg-zinc-900/60 border border-white/5 rounded-md w-full" />
            </div>
            
            {/* Form field 2 skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-zinc-900/60 rounded w-20" />
              <div className="h-10 bg-zinc-900/60 border border-white/5 rounded-md w-full" />
            </div>
            
            {/* Primary button skeleton */}
            <div className="h-10 bg-white/10 rounded-md w-full mt-4" />
          </div>
        </ClerkLoading>

        {/* Clerk loaded state */}
        <ClerkLoaded>
          <div className="transition-all duration-150">
            <SignIn 
              routing="hash"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full max-w-full",
                  card: "bg-black border border-white/10 shadow-none rounded-lg w-full max-w-full p-6 relative overflow-hidden",
                  header: "hidden", // Hide clerk's native header to keep it sleek and minimal
                  socialButtonsBlockButton: "bg-transparent hover:bg-white/[0.04] border border-white/10 text-white font-medium text-sm rounded-md transition-all duration-150 py-2.5 flex items-center justify-center gap-2 cursor-pointer w-full focus:outline-none focus:ring-1 focus:ring-white/30",
                  socialButtonsBlockButtonText: "font-medium text-sm text-zinc-200",
                  formButtonPrimary: "w-full py-2.5 bg-[#FAFAFA] hover:bg-[#EAEAEA] text-black font-medium text-sm rounded-md transition-all duration-150 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
                  footerActionLink: "text-white hover:underline transition-all font-semibold",
                  formFieldLabel: "text-zinc-400 font-medium text-xs tracking-wider mb-1.5 uppercase text-[10px]",
                  formFieldInput: "bg-black border border-white/10 text-white focus:border-white focus:ring-1 focus:ring-white/20 transition-all duration-150 rounded-md py-2 px-3 text-sm font-normal w-full outline-none",
                  dividerText: "text-zinc-500 font-medium text-[10px] tracking-widest",
                  dividerLine: "bg-white/10",
                  footer: "text-zinc-500 font-normal text-xs mt-4 w-full"
                }
              }} 
            />
          </div>
        </ClerkLoaded>

        {/* Outlined Demo Button */}
        <DemoLoginButton label="Enter Demo Workspace" className="mx-6 py-2.5 bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-white font-medium text-xs uppercase tracking-wider rounded-md transition-all duration-150 text-center flex items-center justify-center gap-2 cursor-pointer" />
      </div>
    </div>
  );
}
