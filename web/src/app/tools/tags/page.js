"use client";

import { useState } from "react";
import { Tags, Copy, Check, Loader2 } from "lucide-react";
import ToolsShell from "../../components/tools/ToolsShell";
import ToolsQuotaBanner from "../../components/tools/ToolsQuotaBanner";
import { useToolsQuota } from "../../components/tools/useToolsQuota";

export default function TagsToolPage() {
  const { quota, loading, canRun, runTool } = useToolsQuota("tags");
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [tags, setTags] = useState([]);
  const [csv, setCsv] = useState("");
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const onRun = async (e) => {
    e.preventDefault();
    if (!canRun || running || (!topic.trim() && !niche.trim())) return;
    setRunning(true);
    setRunError("");
    try {
      const data = await runTool("tags", { topic, niche });
      setTags(data.result?.tags || []);
      setCsv(data.result?.csv || "");
    } catch (err) {
      setRunError(err.message);
      setTags([]);
      setCsv("");
    } finally {
      setRunning(false);
    }
  };

  const copyAll = async () => {
    if (!csv) return;
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <ToolsShell title="Tag Generator" description="Keyword tags from a topic" icon={Tags}>
      <p className="text-sm text-zinc-500">
        Generate a clean tag set for YouTube upload. Generation is rate-limited per account.
      </p>

      <ToolsQuotaBanner quota={quota} loading={loading} blockedError={runError} />

      <form onSubmit={onRun} className="space-y-6">
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Inputs
            </p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Video topic / title
              </span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 120))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                placeholder="e.g. faceless YouTube channel automation"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Niche (optional)
              </span>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value.slice(0, 80))}
                className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
                placeholder="e.g. AI tools, finance, gaming"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={
            !canRun || running || loading || (!topic.trim() && !niche.trim())
          }
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate · 1 run"
          )}
        </button>
      </form>

      {(tags.length > 0 || runError) && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Tags · {tags.length}
            </p>
            <button
              type="button"
              onClick={copyAll}
              disabled={!tags.length}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-black px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy all
                </>
              )}
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-zinc-600 sm:px-5">
              No tags yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-4 sm:p-5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(tag);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="cursor-pointer rounded-md border border-zinc-800 bg-black px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                  title="Click to copy"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </ToolsShell>
  );
}
