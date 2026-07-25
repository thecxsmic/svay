"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  DashPage,
  DashToolbar,
  DashBody,
  BrandOrb,
} from "../dashboard/ui";

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

  // Tools can render outside app shell — show title when bare, toolbar when in app
  const showPageTitle = true;

  return (
    <DashPage>
      <DashToolbar
        left={
          <>
            {showPageTitle && (
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
                  <Icon className="h-4 w-4 text-black" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm uppercase tracking-tight text-white">
                    {title}
                  </p>
                  {description && (
                    <p className="hidden truncate text-[9px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        }
        tabs={
          !isIndex ? (
            <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 no-scrollbar sm:px-6">
              {TOOLS.map((tool) => {
                const active = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-white/[0.1] text-white"
                        : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                    }`}
                  >
                    {tool.label}
                  </Link>
                );
              })}
            </div>
          ) : null
        }
      >
        {!isIndex && (
          <Link
            href="/tools"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            All tools
          </Link>
        )}

        {isLoaded && !isSignedIn && (
          <Link
            href="/sign-in"
            className="inline-flex h-9 cursor-pointer items-center rounded-xl bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200"
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
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
        >
          <BrandOrb size="xs" />
          Svay
        </Link>
      </DashToolbar>

      <DashBody narrow className="space-y-6">
        {children}
      </DashBody>

      <footer className="border-t border-zinc-900 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 text-center sm:px-6">
          <p className="text-[11px] leading-relaxed text-zinc-600">
            Free tools have daily limits by account and network. Abuse is blocked
            automatically. For full creator tools —{" "}
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
    </DashPage>
  );
}
