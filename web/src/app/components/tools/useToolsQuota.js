"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Load quota snapshot + run tools through the rate-limited API.
 */
export function useToolsQuota(toolId = null) {
  const [quota, setQuota] = useState(null);
  const [regions, setRegions] = useState([]);
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const q = toolId ? `?tool=${encodeURIComponent(toolId)}` : "";
      const res = await fetch(`/api/tools/status${q}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quota");
      setQuota(data);
      if (data.regions) setRegions(data.regions);
      if (data.tiers) setTiers(data.tiers);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runTool = useCallback(
    async (id, input) => {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: id, input }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.quota) setQuota(data.quota);
      if (!res.ok || !data.success) {
        const err = new Error(data.error || "Tool request failed");
        err.code = data.code;
        err.status = res.status;
        err.quota = data.quota;
        throw err;
      }
      return data;
    },
    []
  );

  return {
    quota,
    regions,
    tiers,
    loading,
    error,
    refresh,
    runTool,
    canRun: quota?.canRun !== false && (quota?.remaining ?? 1) > 0,
  };
}

export function formatReset(seconds) {
  if (!seconds || seconds <= 0) return "soon";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 1) return `${h}h ${m}m`;
  if (m >= 1) return `${m}m`;
  return `${seconds}s`;
}
