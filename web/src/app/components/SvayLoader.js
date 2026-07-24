"use client";

/**
 * Brand loader — gradient Svay orb (no generic spinner).
 * fullScreen: covers the viewport for route transitions / auth shells.
 * withRings: subtle radar rings for longer waits.
 */
export default function SvayLoader({
  fullScreen = false,
  size = "md",
  className = "",
  label = "Svay",
  withRings = false,
  text,
}) {
  const dim =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  const icon = (
    <div
      className={`relative flex items-center justify-center ${withRings ? "h-16 w-16" : ""}`}
    >
      {withRings && (
        <>
          <span className="dash-ring absolute inset-0 rounded-full border border-white/10" />
          <span className="dash-ring-delay absolute inset-1 rounded-full border border-white/5" />
        </>
      )}
      <div
        className={`${dim} shrink-0 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_18px_rgba(0,112,243,0.4)] dash-orb-pulse ${className}`}
        role="status"
        aria-label={label}
      />
    </div>
  );

  if (!fullScreen) {
    if (text) {
      return (
        <div className="flex flex-col items-center gap-3">
          {icon}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            {text}
          </p>
        </div>
      );
    }
    return icon;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-black">
      {icon}
      {text && (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          {text}
        </p>
      )}
    </div>
  );
}
