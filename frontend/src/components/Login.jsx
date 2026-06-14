import React, { useState } from "react";
import api from "../utils/api";

export default function Login({ onLogin }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "register") {
        await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setTab("login");
        setError("Registered! Please log in.");
      } else {
        const { data } = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_name", data.name || form.email);
        onLogin(data.name || form.email);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-darkBg">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">study.ai</h1>
          <p className="text-gray-400 mt-2 text-sm">Your personal academic tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  tab === t
                    ? "bg-primary text-white shadow"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                <input
                  id="login-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required={tab === "register"}
                  className="w-full rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-4 py-2.5 bg-white/10 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>

            {error && (
              <p className={`text-sm text-center ${error.includes("Registered") ? "text-green-400" : "text-red-400"}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg shadow-primary/20 mt-2"
            >
              {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
