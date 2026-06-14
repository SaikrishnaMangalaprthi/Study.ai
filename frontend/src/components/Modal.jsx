import React from "react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/70 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/95 shadow-soft p-6 text-white">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">Close</button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
