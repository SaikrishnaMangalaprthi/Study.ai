import React from "react";

export default function EmptyState({ icon = "📭", title, description }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-gray-400">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
}
