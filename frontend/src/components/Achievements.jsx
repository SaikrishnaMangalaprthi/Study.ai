import React, { useEffect, useState } from "react";
import api from "../utils/api";
import EmptyState from "./EmptyState";

export default function Achievements() {
  const [data, setData] = useState({ achievements: [], level: 1, xp: 0, next_level_xp: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchAchievements(); }, []);

  async function fetchAchievements() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/achievements/");
      setData(response.data);
    } catch (err) {
      setError("Could not load achievements.");
    } finally {
      setLoading(false);
    }
  }

  const progress = Math.min(100, Math.round((data.xp / data.next_level_xp) * 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Achievements</h1>
          <p className="text-gray-400">Track your badges, XP, and level progress as you study smarter.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Current level</p>
          <p className="mt-2 text-3xl font-semibold text-gray-100">{data.level}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-gray-400">{data.xp}/{data.next_level_xp} XP</p>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : data.achievements.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No achievements yet"
          description="Complete tasks, keep habits, and log study sessions to unlock badges."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-3xl border p-6 transition ${ach.earned ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/5"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-400">{ach.icon}</p>
                  <h2 className="mt-3 text-xl font-semibold text-gray-100">{ach.title}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ach.earned ? "bg-green-500/15 text-green-300" : "bg-white/10 text-gray-300"}`}>
                  {ach.earned ? "Earned" : "Locked"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-400">{ach.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-300">
                <span>{ach.xp_reward} XP</span>
                {ach.earned && <span>Unlocked {new Date(ach.earned_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
