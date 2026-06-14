import React, { useEffect, useState } from "react";
import api from "../utils/api";
import EmptyState from "./EmptyState";

const EMPTY_FORM = { date: "", water_ml: "", sleep_hours: "", exercise_min: "", weight_kg: "" };

export default function Health() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/health/logs");
      setLogs(data.logs);
    } catch {
      setError("Unable to load health data.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/health/logs", {
        date: form.date,
        water_ml: Number(form.water_ml) || 0,
        sleep_hours: Number(form.sleep_hours) || 0,
        exercise_min: Number(form.exercise_min) || 0,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      });
      setForm(EMPTY_FORM);
      setSuccess("Health log saved.");
      fetchLogs();
    } catch {
      setError("Failed to save health log.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Health Tracker</h1>
        <p className="text-gray-400">Track water, sleep, exercise, and weight as part of a balanced study routine.</p>
      </div>
      {error && <p className="text-red-400">{error}</p>}
      {success && <p className="text-green-400">{success}</p>}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-gray-100">Latest logs</h2>
          {loading ? (
            <div className="mt-6 space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-3xl bg-white/5" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon="💧"
              title="No health logs yet"
              description="Add your first daily log to keep your study health habits on track."
            />
          ) : (
            <div className="mt-6 space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-400">{new Date(log.date).toLocaleDateString()}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{log.weight_kg ? `${log.weight_kg} kg` : "Weight pending"}</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Water</p>
                      <p className="mt-2 text-lg font-semibold text-gray-100">{log.water_ml} ml</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Sleep</p>
                      <p className="mt-2 text-lg font-semibold text-gray-100">{log.sleep_hours} hrs</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Exercise</p>
                      <p className="mt-2 text-lg font-semibold text-gray-100">{log.exercise_min} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-gray-100">Add a daily log</h2>
          <div className="mt-5 grid gap-4">
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              name="water_ml"
              type="number"
              min="0"
              value={form.water_ml}
              onChange={handleChange}
              placeholder="Water intake (ml)"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              name="sleep_hours"
              type="number"
              min="0"
              step="0.1"
              value={form.sleep_hours}
              onChange={handleChange}
              placeholder="Sleep (hours)"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              name="exercise_min"
              type="number"
              min="0"
              value={form.exercise_min}
              onChange={handleChange}
              placeholder="Exercise (minutes)"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              name="weight_kg"
              type="number"
              min="0"
              step="0.1"
              value={form.weight_kg}
              onChange={handleChange}
              placeholder="Weight (kg)"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            className="mt-6 w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary/80"
          >
            Save log
          </button>
        </form>
      </div>
    </div>
  );
}
