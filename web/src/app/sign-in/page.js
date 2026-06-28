import { SignIn } from "@clerk/nextjs";
import DemoLoginButton from "../components/DemoLoginButton";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-mint/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Simple flex wrapper around components with no extra dialog borders/backgrounds */}
      <div className="w-full max-w-[400px] z-10 flex flex-col gap-4">
        <SignIn 
          routing="hash"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-full",
              card: "bg-zinc-950 border border-white/10 shadow-2xl rounded-2xl w-full max-w-full p-6", // Restored borders and backgrounds directly to Clerk card to avoid double wrapper overflow
              header: "hidden", // Hide clerk's native header to keep it sleek and minimal
              socialButtonsBlockButton: "bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all py-3.5 flex items-center justify-center gap-2 cursor-pointer w-full",
              socialButtonsBlockButtonText: "font-bold text-xs text-zinc-300",
              formButtonPrimary: "w-full py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.15)] hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] cursor-pointer text-center",
              footerActionLink: "text-brand-volt hover:underline transition-all",
              formFieldLabel: "text-zinc-500 font-bold text-[9px] uppercase tracking-wider mb-1.5",
              formFieldInput: "bg-zinc-900/60 border border-zinc-800 text-white focus:border-brand-volt focus:ring-1 focus:ring-brand-volt transition-all rounded-xl py-3 px-4 text-sm font-medium w-full",
              dividerText: "text-zinc-655 uppercase font-black text-[9px] tracking-widest",
              dividerLine: "bg-zinc-900",
              footer: "text-zinc-550 font-semibold text-xs mt-4 w-full"
            }
          }} 
        />

        <DemoLoginButton label="Enter Demo Workspace" className="w-full py-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5" />
      </div>
    </div>
  );
}
