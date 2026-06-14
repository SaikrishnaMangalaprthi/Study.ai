import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function HealthTracker() {
  const [log, setLog] = useState({
    water_ml: 0,
    sleep_hours: 0.0,
    exercise_min: 0,
    weight_kg: 0.0,
    date: new Date().toISOString().split("T")[0]
  });

  const [heightCm, setHeightCm] = useState(175);
  const [bmiData, setBmiData] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayLog();
    loadHistory();
  }, [log.date]);

  async function loadTodayLog() {
    try {
      const res = await api.get(`/health/?date=${log.date}`);
      setLog(prev => ({
        ...prev,
        water_ml: res.data.water_ml || 0,
        sleep_hours: res.data.sleep_hours || 0.0,
        exercise_min: res.data.exercise_min || 0,
        weight_kg: res.data.weight_kg || 0.0
      }));
    } catch {
      setErrorMsg("Failed to load today's health metrics.");
    }
  }

  async function loadHistory() {
    try {
      const res = await api.get("/health/history");
      setHistory(res.data);
    } catch {
      console.error("Error loading health logs history");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveLog(customData = null) {
    const dataToSave = customData || log;
    try {
      await api.post("/health/", dataToSave);
      setSuccessMsg("Health metrics logged successfully!");
      loadHistory();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Failed to log health metrics.");
    }
  }

  // Quick increment handlers
  const adjustWater = (amount) => {
    const val = Math.max(0, log.water_ml + amount);
    const updated = { ...log, water_ml: val };
    setLog(updated);
    handleSaveLog(updated);
  };

  const adjustSleep = (amount) => {
    const val = Math.max(0.0, Math.round((log.sleep_hours + amount) * 10) / 10);
    const updated = { ...log, sleep_hours: val };
    setLog(updated);
    handleSaveLog(updated);
  };

  const adjustExercise = (amount) => {
    const val = Math.max(0, log.exercise_min + amount);
    const updated = { ...log, exercise_min: val };
    setLog(updated);
    handleSaveLog(updated);
  };

  const handleWeightChange = (val) => {
    const weight = Math.max(0.0, parseFloat(val) || 0.0);
    setLog(prev => ({ ...prev, weight_kg: weight }));
  };

  async function handleCalculateBMI() {
    if (!heightCm || heightCm <= 0) {
      setErrorMsg("Please enter a valid height.");
      return;
    }
    if (!log.weight_kg || log.weight_kg <= 0) {
      setErrorMsg("Please enter and save your weight first.");
      return;
    }
    try {
      const res = await api.get(`/health/bmi?height_cm=${heightCm}`);
      setBmiData(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || "Error calculating BMI.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Health Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">
          Maintain a healthy mind and body to optimize study productivity
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: QUICK LOGGING (Water, Sleep, Exercise) */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-100">Daily Log</h2>
            <input
              type="date"
              value={log.date}
              onChange={(e) => setLog(prev => ({ ...prev, date: e.target.value }))}
              className="bg-black/40 text-xs border border-white/10 rounded-lg px-2 py-1 text-gray-200 focus:outline-none"
            />
          </div>

          {/* Water widget */}
          <div className="bg-black/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-gray-200">💧 Water Intake</span>
                <p className="text-[10px] text-gray-400">Target: 2000 ml</p>
              </div>
              <span className="text-lg font-extrabold text-blue-400">{log.water_ml} ml</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => adjustWater(250)}
                className="flex-1 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-lg transition"
              >
                + 250ml (Cup)
              </button>
              <button
                onClick={() => adjustWater(-250)}
                className="py-1.5 px-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs rounded-lg transition"
              >
                -
              </button>
            </div>
          </div>

          {/* Sleep widget */}
          <div className="bg-black/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-gray-200">😴 Sleep Tracker</span>
                <p className="text-[10px] text-gray-400">Target: 7-8 hours</p>
              </div>
              <span className="text-lg font-extrabold text-indigo-400">{log.sleep_hours} hrs</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => adjustSleep(0.5)}
                className="flex-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg transition"
              >
                + 30 mins
              </button>
              <button
                onClick={() => adjustSleep(-0.5)}
                className="py-1.5 px-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs rounded-lg transition"
              >
                -
              </button>
            </div>
          </div>

          {/* Exercise widget */}
          <div className="bg-black/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-gray-200">🏃 Exercise Duration</span>
                <p className="text-[10px] text-gray-400">Target: 30 mins</p>
              </div>
              <span className="text-lg font-extrabold text-emerald-400">{log.exercise_min} mins</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => adjustExercise(5)}
                className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition"
              >
                + 5 mins
              </button>
              <button
                onClick={() => adjustExercise(-5)}
                className="py-1.5 px-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs rounded-lg transition"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 2: WEIGHT LOG & BMI CALCULATOR */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-gray-100">Weight & BMI Tool</h2>

          {/* Log weight */}
          <div className="bg-black/30 p-4 rounded-xl space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Log Current Weight (kg)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 70.5"
                  value={log.weight_kg || ""}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="flex-1 bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveLog()}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow transition hover:bg-primary/95"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Calculate BMI widget */}
          <div className="bg-black/30 p-4 rounded-xl space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Enter Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none"
                />
              </div>

              <button
                onClick={handleCalculateBMI}
                className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow transition hover:bg-secondary/95"
              >
                Calculate BMI
              </button>
            </div>

            {/* BMI Result display */}
            {bmiData && (
              <div className="border-t border-white/5 pt-3 text-center space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Your BMI Status</p>
                <p className="text-3xl font-extrabold text-secondary">{bmiData.bmi}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  bmiData.category === "Normal" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {bmiData.category}
                </span>
                <p className="text-[10px] text-gray-500 mt-1">Based on saved weight: {bmiData.weight_kg} kg</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: HISTORY LIST */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
          <h2 className="text-lg font-bold text-gray-100">Health History</h2>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading history...</div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {history.map((h) => (
                <div key={h.id} className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-300 block">{h.date}</span>
                    <div className="flex gap-3 text-gray-400 mt-1">
                      <span>💧 {h.water_ml}ml</span>
                      <span>😴 {h.sleep_hours}h</span>
                      <span>🏃 {h.exercise_min}m</span>
                    </div>
                  </div>
                  {h.weight_kg > 0 && (
                    <span className="font-mono text-secondary font-bold">{h.weight_kg} kg</span>
                  )}
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <span className="text-2xl block mb-1">📋</span>
                  <p className="text-[10px]">No logs recorded yet. Start logging above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
