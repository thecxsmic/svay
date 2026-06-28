import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-volt border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Completing secure session authorization...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
