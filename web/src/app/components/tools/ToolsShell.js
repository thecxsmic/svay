"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";

const TOOLS = [
  { href: "/tools/earnings", label: "Earnings" },
  { href: "/tools/title", label: "Title" },
  { href: "/tools/tags", label: "Tags" },
  { href: "/tools/engagement", label: "Engage" },
  { href: "/tools/script", label: "Script" },
  { href: "/tools/chapters", label: "Chapters" },
  { href: "/tools/milestones", label: "Milestones" },
  { href: "/tools/seo", label: "SEO" },
];

/**
 * Shared chrome for free public tools — matches Support / Billing style.
 */
export default function ToolsShell({
  title,
  description,
  icon: Icon = Wrench,
  children,
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const isIndex = pathname === "/tools";

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
              <Icon className="h-4 w-4 text-black" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg uppercase tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="hidden truncate text-[10px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isIndex && (
              <Link
                href="/tools"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                All tools
              </Link>
            )}

            {isLoaded && !isSignedIn && (
              <Link
                href="/sign-in"
                className="cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
              >
                Sign in
              </Link>
            )}
            {isLoaded && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 ring-1 ring-zinc-800",
                  },
                }}
              />
            )}

            <Link
              href="/"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success" />
              Svay
            </Link>
          </div>
        </div>
      </nav>

      {!isIndex && (
        <div className="border-b border-zinc-900">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 no-scrollbar sm:px-6">
            {TOOLS.map((tool) => {
              const active = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {tool.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">{children}</div>

      <footer className="border-t border-zinc-900 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 text-center sm:px-6">
          <p className="text-[11px] leading-relaxed text-zinc-600">
            Free tools are rate-limited by account tier and network. Abuse is blocked
            automatically. For unlimited creator intel —{" "}
            <Link
              href="/sign-in"
              className="text-zinc-400 underline-offset-2 hover:text-white hover:underline"
            >
              start a free Pro trial
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            <Link href="/tools" className="hover:text-zinc-400">
              Tools
            </Link>
            <Link href="/docs" className="hover:text-zinc-400">
              Docs
            </Link>
            <Link href="/support" className="hover:text-zinc-400">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-zinc-400">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
