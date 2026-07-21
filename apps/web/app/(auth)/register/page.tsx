"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, name, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg px-3.5 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd] transition-colors";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 60% 0%, #0d2044 0%, #0d1117 60%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #388bfd 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3fb950 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#e6edf3]">StockTicker</span>
        </div>

        <div className="rounded-2xl border border-[#30363d] p-8"
          style={{ background: "rgba(22,27,34,0.85)", backdropFilter: "blur(12px)" }}>
          <h1 className="text-xl font-semibold text-[#e6edf3] mb-1">Create your account</h1>
          <p className="text-sm text-[#8b949e] mb-6">Start tracking your portfolio today</p>

          {error && (
            <div className="mb-4 rounded-lg border border-[#f8514933] bg-[#f8514914] px-4 py-3 text-sm text-[#f85149]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className={inputCls} placeholder="Saif" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className={inputCls} placeholder="At least 6 characters" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#8b949e]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#388bfd] hover:text-[#58a6ff] font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#484f58]">
          Real-time portfolio tracking for Indian &amp; US markets
        </p>
      </div>
    </main>
  );
}
