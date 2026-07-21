"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/providers";

type Exchange = "US" | "NSE" | "BSE";

interface Holding {
  id: number;
  symbol: string;
  exchange: Exchange;
  yahoo_symbol: string;
  name: string;
  quantity: string;
  buy_price: string;
  current_price: string | null;
  previous_close: string | null;
  market_value: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  day_change_percent: number | null;
  last_updated: string | null;
}

const EXCHANGES: Exchange[] = ["US", "NSE", "BSE"];
const EXCHANGE_LABEL: Record<Exchange, string> = { US: "US (NYSE/NASDAQ)", NSE: "NSE India", BSE: "BSE India" };
const EXCHANGE_COLOR: Record<Exchange, { bg: string; text: string; border: string }> = {
  US:  { bg: "rgba(56,139,253,0.12)",  text: "#388bfd", border: "rgba(56,139,253,0.3)"  },
  NSE: { bg: "rgba(63,185,80,0.12)",   text: "#3fb950", border: "rgba(63,185,80,0.3)"   },
  BSE: { bg: "rgba(227,179,65,0.12)",  text: "#e3b341", border: "rgba(227,179,65,0.3)"  },
};

function fmtNum(v: string | number | null, pfx = "$") {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "—";
  return `${pfx}${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      <p className="text-[11px] font-semibold text-[#484f58] uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold leading-none" style={{ color: color ?? "#e6edf3" }}>{value}</p>
      {sub && <p className="text-xs text-[#484f58] mt-1.5">{sub}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd] transition-colors";

export default function PortfolioPage() {
  const { authFetch } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState<Exchange>("US");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const res = await authFetch("/api/holdings/");
    if (res.ok) { setHoldings(await res.json()); setLastRefresh(new Date()); }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !quantity || !buyPrice) return;
    setAddError(""); setAdding(true);
    try {
      const res = await authFetch("/api/holdings/", {
        method: "POST",
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase(), exchange, quantity: parseFloat(quantity), buy_price: parseFloat(buyPrice) }),
      });
      const data = await res.json();
      if (!res.ok) setAddError(data.detail ?? JSON.stringify(data));
      else { setHoldings((p) => [data, ...p]); setSymbol(""); setQuantity(""); setBuyPrice(""); }
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: number) => {
    const res = await authFetch(`/api/holdings/${id}/`, { method: "DELETE" });
    if (res.ok || res.status === 204) setHoldings((p) => p.filter((h) => h.id !== id));
  };

  const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.quantity) * parseFloat(h.buy_price), 0);
  const totalValue = holdings.reduce((s, h) => s + (h.market_value ?? 0), 0);
  const totalPnl = totalValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const pfx = (ex: Exchange) => ex === "US" ? "$" : "₹";

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Portfolio</h1>
          <p className="text-sm text-[#484f58] mt-1">
            Track your holdings across US &amp; Indian markets
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#484f58]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading…"}
        </div>
      </div>

      {/* Summary strip */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 [&>div]:shadow-lg [&>div]:[box-shadow:0_4px_24px_rgba(0,0,0,0.4)]">
          <StatCard label="Invested" value={`$${totalInvested.toFixed(2)}`} />
          <StatCard label="Current Value" value={`$${totalValue.toFixed(2)}`} />
          <StatCard
            label="Total P&L"
            value={`${totalPnl >= 0 ? "+" : "-"}$${Math.abs(totalPnl).toFixed(2)}`}
            color={totalPnl >= 0 ? "#3fb950" : "#f85149"}
          />
          <StatCard
            label="Return"
            value={`${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
            sub={`${holdings.length} position${holdings.length !== 1 ? "s" : ""}`}
            color={totalPnlPct >= 0 ? "#3fb950" : "#f85149"}
          />
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
        <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Add Position</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">Exchange</label>
            <select value={exchange} onChange={(e) => setExchange(e.target.value as Exchange)} className={inputCls}>
              {EXCHANGES.map((ex) => <option key={ex} value={ex}>{EXCHANGE_LABEL[ex]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">Symbol</label>
            <input type="text" value={symbol} onChange={(e) => { setSymbol(e.target.value); setAddError(""); }}
              placeholder={exchange === "US" ? "e.g. AAPL" : "e.g. RELIANCE"}
              className={`${inputCls} uppercase`} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">Quantity</label>
            <input type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              placeholder="10" className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">
              Buy Price ({exchange === "US" ? "USD $" : "INR ₹"})
            </label>
            <input type="number" min="0.0001" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="150.00" className={inputCls} />
          </div>
          <button type="submit" disabled={adding || !symbol.trim() || !quantity || !buyPrice}
            className="rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}>
            {adding ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding…
              </span>
            ) : "Add Position"}
          </button>
        </form>
        {addError && <p className="mt-3 text-xs text-[#f85149]">{addError}</p>}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #30363d" }}>
          <h2 className="text-sm font-semibold text-[#e6edf3]">
            Holdings
            {holdings.length > 0 && (
              <span className="ml-2 text-[11px] font-normal px-2 py-0.5 rounded-full text-[#8b949e]"
                style={{ background: "#21262d" }}>{holdings.length}</span>
            )}
          </h2>
        </div>

        {holdings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "#21262d" }}>
              <svg className="w-6 h-6 text-[#484f58]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#8b949e]">No positions yet</p>
            <p className="text-xs text-[#484f58] mt-1">Add your first holding above to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #30363d", background: "#1c2333" }}>
                  {["Symbol", "Exchange", "Company", "Qty", "Avg Cost", "LTP", "Mkt Value", "P&L", "P&L %", "Day %", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#484f58] uppercase tracking-wider first:pl-6 last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const ex = EXCHANGE_COLOR[h.exchange];
                  const pnlUp = (h.pnl ?? 0) >= 0;
                  return (
                    <tr key={h.id}
                      className="transition-colors"
                      style={{ borderBottom: i < holdings.length - 1 ? "1px solid #21262d" : "none", borderTop: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1c2333")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-4 py-4 pl-6">
                        <span className="font-mono font-bold text-sm text-[#e6edf3]">{h.symbol}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: ex.bg, color: ex.text, border: `1px solid ${ex.border}` }}>
                          {h.exchange}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-37.5">
                        <span className="text-sm text-[#8b949e] truncate block">{h.name || "—"}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#8b949e] text-right">{parseFloat(h.quantity).toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-[#8b949e] text-right">{fmtNum(h.buy_price, pfx(h.exchange))}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#e6edf3] text-right">{fmtNum(h.current_price, pfx(h.exchange))}</td>
                      <td className="px-4 py-4 text-sm text-[#8b949e] text-right">{h.market_value !== null ? fmtNum(h.market_value, pfx(h.exchange)) : "—"}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-right" style={{ color: pnlUp ? "#3fb950" : "#f85149" }}>
                        {h.pnl !== null ? `${pnlUp ? "+" : "-"}${fmtNum(Math.abs(h.pnl), pfx(h.exchange))}` : "—"}
                      </td>
                      <td className="px-4 py-4 text-right"><PctBadge v={h.pnl_percent} /></td>
                      <td className="px-4 py-4 text-right"><PctBadge v={h.day_change_percent} /></td>
                      <td className="px-4 py-4 pr-6 text-right">
                        <button onClick={() => handleDelete(h.id)}
                          className="transition-colors p-1.5 rounded-lg hover:bg-[#f8514914]"
                          style={{ color: "#484f58" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f85149")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#484f58")}
                          title="Remove">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
