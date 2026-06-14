import React from "react";

export default function StatCard({ title, value, icon, accent, note }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-30 ${accent || "bg-primary"}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{title}</p>
            <p className="mt-4 text-3xl font-semibold text-gray-100">{value}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-xl text-white">
            {icon}
          </div>
        </div>
        {note && <p className="mt-4 text-sm text-gray-400">{note}</p>}
      </div>
    </div>
  );
}
