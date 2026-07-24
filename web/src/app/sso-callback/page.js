import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import SvayLoader from "../components/SvayLoader";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <SvayLoader size="lg" withRings text="Completing secure session…" />
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
