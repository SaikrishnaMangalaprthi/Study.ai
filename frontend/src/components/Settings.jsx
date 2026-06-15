import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function Settings() {
  // Account state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColor, setThemeColor] = useState("blue");
  
  // Theme mode override state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const applyThemeColor = (color) => {
  const colorMap = {
    blue:   "#3B82F6",
    green:  "#10B981",
    red:    "#EF4444",
    purple: "#8B5CF6",
    pink:   "#EC4899",
  };
  const hex = colorMap[color] || colorMap.blue;
  document.documentElement.style.setProperty("--color-primary", hex);
  localStorage.setItem("user_theme_color", color);
};
  const handleToggleDarkMode = (checked) => {
    setIsDarkMode(checked);
    const root = document.documentElement;
    if (checked) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Notification checkboxes
  const [notifPrefs, setNotifPrefs] = useState({
    taskReminders: true,
    dailySummary: true,
    examAlerts: true,
    achievementUnlocks: true
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Theme presets
  const themes = [
    { name: "Blue Glow", value: "blue", colorClass: "bg-blue-500" },
    { name: "Emerald Mint", value: "green", colorClass: "bg-emerald-500" },
    { name: "Crimson Red", value: "red", colorClass: "bg-red-500" },
    { name: "Amethyst Purple", value: "purple", colorClass: "bg-purple-500" },
    { name: "Hot Pink", value: "pink", colorClass: "bg-pink-500" }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get("/users/profile");
      setName(res.data.name || "");
      setAvatarUrl(res.data.avatar_url || "");
      setThemeColor(res.data.theme_color || "blue");
      
      if (res.data.notification_prefs) {
        try {
          const parsed = JSON.parse(res.data.notification_prefs);
          setNotifPrefs(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    } catch {
      setErrorMsg("Failed to load account settings.");
    } finally {
      setLoading(false);
    }
    setThemeColor(res.data.theme_color || "blue");
    applyThemeColor(res.data.theme_color || "blue");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    applyThemeColor(themeColor);
    
    if (!name.trim()) {
      setErrorMsg("Name cannot be blank.");
      return;
    }
    try {
      const res = await api.put("/users/settings", {
        name,
        avatar_url: avatarUrl,
        theme_color: themeColor,
        notification_prefs: JSON.stringify(notifPrefs)
      });
      // Save theme to local storage to reflect immediately if needed
      localStorage.setItem("user_theme_color", themeColor);
      setSuccessMsg("Profile settings updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Error updating profile settings.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setErrorMsg("Please fill out all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    try {
      await api.put("/users/password", {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccessMsg("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || "Failed to change password.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  }

  const handleNotifChange = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your profile, theme, and notification preferences</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center text-sm font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PANEL 1: ACCOUNT PROFILE & THEMES */}
        <div className="space-y-6">
          {/* Profile Form */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-100 border-b border-white/5 pb-2">Profile Customization</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Avatar Picture URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium block">Select Accent Theme</label>
                <div className="flex flex-wrap gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setThemeColor(t.value)}
                      className={`w-8 h-8 rounded-full border-2 transition ${t.colorClass} ${
                        themeColor === t.value ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>

              {/* Theme Mode Toggle */}
              <div className="flex items-center justify-between bg-black/25 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-gray-300 font-semibold">Enable Dark Mode Theme</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-sm transition"
              >
                Save Settings
              </button>
            </form>
          </div>

          {/* Notifications Preferences Card */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-100 border-b border-white/5 pb-2">Notification Preferences</h2>
            
            <div className="space-y-3 text-sm text-gray-300">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.taskReminders}
                  onChange={() => handleNotifChange("taskReminders")}
                  className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                />
                <span>Task deadlines and overdue reminders</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.dailySummary}
                  onChange={() => handleNotifChange("dailySummary")}
                  className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                />
                <span>Daily study report digests</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.examAlerts}
                  onChange={() => handleNotifChange("examAlerts")}
                  className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                />
                <span>Upcoming exam count-down notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.achievementUnlocks}
                  onChange={() => handleNotifChange("achievementUnlocks")}
                  className="rounded bg-black/40 border-white/10 text-primary focus:ring-0"
                />
                <span>Badge unlocking and XP milestone system alerts</span>
              </label>
            </div>
          </div>
        </div>

        {/* PANEL 2: SECURITY & PASSWORD CHANGE */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
          <h2 className="text-lg font-bold text-gray-100 border-b border-white/5 pb-2">Security & Password</h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl text-sm transition"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
