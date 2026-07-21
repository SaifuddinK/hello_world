"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";

export default function ProfilePage() {
  const { user, authFetch } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true); setNameMsg(null);
    try {
      const res = await authFetch("/api/auth/me/", { method: "PATCH", body: JSON.stringify({ name }) });
      const data = await res.json();
      if (res.ok) setNameMsg({ text: "Name updated successfully.", ok: true });
      else setNameMsg({ text: data.detail ?? JSON.stringify(data), ok: false });
    } finally { setSavingName(false); }
  };

  const handleSavePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true); setPwdMsg(null);
    try {
      const res = await authFetch("/api/auth/me/", {
        method: "PATCH",
        body: JSON.stringify({ current_password: curPwd, new_password: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ text: "Password updated successfully.", ok: true });
        setCurPwd(""); setNewPwd("");
      } else {
        const msg = typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Failed to update password.";
        setPwdMsg({ text: msg, ok: false });
      }
    } finally { setSavingPwd(false); }
  };

  const inputCls =
    "w-full rounded-lg px-3.5 py-2.5 text-sm bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd] focus:ring-1 focus:ring-[#388bfd] transition-colors";

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email[0].toUpperCase() ?? "?";

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Profile</h1>
        <p className="text-sm text-[#484f58] mt-1">Manage your account settings</p>
      </div>

      {/* Identity card */}
      <div
        className="rounded-xl p-6 mb-6 flex items-center gap-5"
        style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
      >
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(56,139,253,0.2) 0%, rgba(63,185,80,0.2) 100%)",
            color: "#58a6ff",
            border: "1px solid #30363d",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-[#e6edf3]">{user?.name || "—"}</p>
          <p className="text-sm text-[#8b949e]">{user?.email}</p>
          <p className="text-xs text-[#484f58] mt-1.5 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Member since{" "}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
              : "—"}
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: "rgba(63,185,80,0.12)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.25)" }}
        >
          Active
        </div>
      </div>

      {/* Edit name */}
      <div
        className="rounded-xl p-6 mb-4"
        style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(56,139,253,0.15)" }}>
            <svg className="w-3.5 h-3.5 text-[#388bfd]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#e6edf3]">Edit Display Name</h2>
        </div>
        <form onSubmit={handleSaveName} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
          </div>
          {nameMsg && (
            <p className="text-sm" style={{ color: nameMsg.ok ? "#3fb950" : "#f85149" }}>{nameMsg.text}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={savingName}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}
            >
              {savingName ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Name"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div
        className="rounded-xl p-6"
        style={{ background: "#161b22", border: "1px solid #30363d", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(227,179,65,0.15)" }}>
            <svg className="w-3.5 h-3.5 text-[#e3b341]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#e6edf3]">Change Password</h2>
        </div>
        <form onSubmit={handleSavePwd} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">Current password</label>
            <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} className={inputCls} placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#484f58] uppercase tracking-wide mb-1.5">New password</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} placeholder="At least 6 characters" minLength={6} required />
          </div>
          {pwdMsg && (
            <p className="text-sm" style={{ color: pwdMsg.ok ? "#3fb950" : "#f85149" }}>{pwdMsg.text}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={savingPwd || !curPwd || !newPwd}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)" }}
            >
              {savingPwd ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating…
                </span>
              ) : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
