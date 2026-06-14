import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const [pRes, aRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/achievements/")
      ]);
      setProfile(pRes.data);
      setAchievements(aRes.data.achievements);
    } catch {
      setErrorMsg("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading profile stats...</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-red-400">{errorMsg || "Unable to load profile."}</div>;
  }

  // XP Progress Percentage
  const nextLevelXp = profile.level * 100;
  const xpPercent = Math.round((profile.xp_points / nextLevelXp) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: USER CARD & LEVEL STATS */}
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute -left-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-primary" />
          
          {/* Avatar */}
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full p-1 shadow-lg flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-darkBg rounded-full flex items-center justify-center text-3xl">
                🎓
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-100">{profile.name || "Student"}</h2>
            <p className="text-xs text-gray-400">{profile.email}</p>
          </div>

          {/* Level XP Bar */}
          <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-primary">Level {profile.level}</span>
              <span className="text-gray-400">{profile.xp_points} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 text-center">{xpPercent}% towards Level {profile.level + 1}</p>
          </div>

          {/* Mini Counter Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 p-3 border border-white/5 rounded-xl text-center">
              <span className="text-lg font-bold text-primary">{profile.stats.tasks_completed}</span>
              <span className="text-[9px] text-gray-400 block mt-0.5 uppercase font-semibold">Tasks Completed</span>
            </div>
            <div className="bg-white/5 p-3 border border-white/5 rounded-xl text-center">
              <span className="text-lg font-bold text-secondary">{profile.stats.goals_completed}</span>
              <span className="text-[9px] text-gray-400 block mt-0.5 uppercase font-semibold">Goals Achieved</span>
            </div>
            <div className="bg-white/5 p-3 border border-white/5 rounded-xl text-center">
              <span className="text-lg font-bold text-amber-400">{profile.stats.study_hours}h</span>
              <span className="text-[9px] text-gray-400 block mt-0.5 uppercase font-semibold">Study Hours</span>
            </div>
            <div className="bg-white/5 p-3 border border-white/5 rounded-xl text-center">
              <span className="text-lg font-bold text-emerald-400">{profile.stats.streak}d</span>
              <span className="text-[9px] text-gray-400 block mt-0.5 uppercase font-semibold">Best Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMNS: BADGES GRID & RECENT ACTIVITY (Cols 2-3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Badges card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-100">Achievement Badges</h3>
            <span className="text-xs bg-primary/20 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
              {profile.achievements_count} Earned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 border rounded-xl flex items-center gap-4 transition duration-300 ${
                  ach.earned
                    ? "bg-white/5 border-white/20 shadow-md scale-[1.01]"
                    : "bg-black/40 border-white/5 opacity-40 select-none grayscale"
                }`}
              >
                <span className="text-3xl bg-black/30 p-2 rounded-xl border border-white/5">{ach.icon}</span>
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-200 block text-sm">{ach.title}</span>
                  <p className="text-[10px] text-gray-400">{ach.description}</p>
                  <span className="text-[9px] text-primary font-bold mt-1 block">+{ach.xp_reward} XP Reward</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-100">Recent Focus Activity</h3>
          
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10 pl-8">
            {profile.recent_activity.map((act, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline node */}
                <div className="absolute -left-9 top-1.5 w-3.5 h-3.5 bg-primary border-4 border-darkBg rounded-full" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-200">{act.title}</span>
                  <span className="text-gray-500 font-mono">{new Date(act.time).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-400">{act.desc}</p>
              </div>
            ))}

            {profile.recent_activity.length === 0 && (
              <p className="text-center text-xs text-gray-500 py-6 pl-0">
                No recent study sessions completed. Go to the timer to start your sprint!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
