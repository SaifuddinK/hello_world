"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/providers";

interface Stock {
  id: number;
  symbol: string;
  name: string;
  current_price: string | null;
  previous_close: string | null;
  change_percent: number | null;
  last_updated: string | null;
}

function fmtPrice(v: string | null) {
  if (!v) return "—";
  const n = parseFloat(v);
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function PctBadge({ v }: { v: number | null }) {
  if (v === null) return <span style={{ color: "#484f58" }}>—</span>;
  const up = v > 0, dn = v < 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{
        color: up ? "#3fb950" : dn ? "#f85149" : "#8b949e",
        background: up ? "rgba(63,185,80,0.1)" : dn ? "rgba(248,81,73,0.1)" : "rgba(139,148,158,0.1)",
      }}
    >
      {up ? "▲" : dn ? "▼" : ""} {up ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}

const inputCls =
  "w-full rounded-lg px-3 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd] transition-colors";

export default function WatchlistPage() {
  const { authFetch } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [symbol, setSymbol] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const res = await authFetch("/api/stocks/");
    if (res.ok) { setStocks(await res.json()); setLastRefresh(new Date()); }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setAddError(""); setAdding(true);
    try {
      const res = await authFetch("/api/stocks/", {
        method: "POST",
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) setAddError(data.detail ?? JSON.stringify(data));
      else { setStocks((p) => [data, ...p]); setSymbol(""); }
    } finally { setAdding(false); }
  };

  const handleDelete = async (sym: string) => {
    const res = await authFetch(`/api/stocks/${sym}/`, { method: "DELETE" });
    if (res.ok || res.status === 204) setStocks((p) => p.filter((s) => s.symbol !== sym));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Watchlist</h1>
          <p className="text-sm text-[#484f58] mt-1">Monitor US stocks in real time</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#484f58]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading…"}
        </div>
      </div>

      {/* Add form */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Add Symbol</h2>
        <form onSubmit={handleAdd} className="flex gap-3 items-start">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value); setAddError(""); }}
              placeholder="Enter US ticker (e.g. NVDA, MSFT)"
              className={`${inputCls} uppercase`}
            />
            {addError && <p className="mt-1.5 text-xs text-[#f85149]">{addError}</p>}
          </div>
          <button
            type="submit"
            disabled={adding || !symbol.trim()}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding…
              </span>
            ) : "Add to Watchlist"}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #30363d" }}>
          <h2 className="text-sm font-semibold text-[#e6edf3]">
            Tracked Symbols
            {stocks.length > 0 && (
              <span
                className="ml-2 text-[11px] font-normal px-2 py-0.5 rounded-full text-[#8b949e]"
                style={{ background: "#21262d" }}
              >
                {stocks.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-[#484f58]">Refreshes every 30s</span>
        </div>

        {stocks.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "#21262d" }}
            >
              <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#8b949e]">No symbols watched yet</p>
            <p className="text-xs text-[#484f58] mt-1">Add a US ticker above to start monitoring</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d" }}>
                {["Symbol", "Company", "Price", "Prev Close", "Day Change", "Last Updated", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider first:pl-6 last:pr-6 bg-[#1c2333]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => (
                <tr
                  key={s.id}
                  className="transition-colors"
                  style={{ borderBottom: i < stocks.length - 1 ? "1px solid #21262d" : "none", borderTop: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1c2333")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-4 pl-6">
                    <span className="font-mono font-bold text-sm text-[#e6edf3]">{s.symbol}</span>
                  </td>
                  <td className="px-4 py-4 max-w-48">
                    <span className="text-sm text-[#8b949e] truncate block">{s.name || "—"}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-[#e6edf3]">{fmtPrice(s.current_price)}</span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-[#8b949e]">{fmtPrice(s.previous_close)}</td>
                  <td className="px-4 py-4 text-right"><PctBadge v={s.change_percent} /></td>
                  <td className="px-4 py-4 text-right text-xs text-[#484f58] font-mono">{fmtTime(s.last_updated)}</td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <button
                      onClick={() => handleDelete(s.symbol)}
                      className="transition-colors p-1.5 rounded-lg"
                      style={{ color: "#484f58" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f85149")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#484f58")}
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
