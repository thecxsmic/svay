"use client";

/**
 * Brand loader — gradient Svay icon only (no "Loading…" text).
 * fullScreen: covers the viewport for route transitions / auth shells.
 */
export default function SvayLoader({
  fullScreen = false,
  size = "md",
  className = "",
  label = "Svay",
}) {
  const dim =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  const icon = (
    <div
      className={`${dim} shrink-0 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_18px_rgba(0,112,243,0.4)] ${className}`}
      role="status"
      aria-label={label}
    />
  );

  if (!fullScreen) return icon;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      {icon}
    </div>
  );
}
