import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";

export default function StudyTimer() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [mode, setMode] = useState("Pomodoro"); // Pomodoro (25m), Long Study (50m), Custom
  const [customMinutes, setCustomMinutes] = useState(30);
  const [isBreak, setIsBreak] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [xpEarned, setXpEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const intervalRef = useRef(null);

  // Load subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await api.get("/subjects/");
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    }
    fetchSubjects();
  }, []);

  // Restore timer state from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem("pomodoro_timer_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const elapsedSinceSave = parsed.isRunning 
          ? Math.floor((Date.now() - parsed.savedAt) / 1000)
          : 0;
        
        const remaining = parsed.secondsLeft - elapsedSinceSave;
        
        if (remaining > 0) {
          setSecondsLeft(remaining);
          setIsRunning(parsed.isRunning);
          setMode(parsed.mode);
          setIsBreak(parsed.isBreak);
          setTotalDuration(parsed.totalDuration);
          setSelectedSubject(parsed.selectedSubject || "");
        } else if (parsed.isRunning) {
          // Finished while browser was closed
          setSecondsLeft(0);
          setIsRunning(false);
        }
      } catch (e) {
        console.error("Error parsing saved timer state:", e);
      }
    }
  }, []);

  // Save state to localStorage on timer tick/update
  useEffect(() => {
    const stateToSave = {
      secondsLeft,
      isRunning,
      mode,
      isBreak,
      totalDuration,
      selectedSubject,
      savedAt: Date.now()
    };
    localStorage.setItem("pomodoro_timer_state", JSON.stringify(stateToSave));
  }, [secondsLeft, isRunning, mode, isBreak, totalDuration, selectedSubject]);

  // Adjust duration on mode change
  useEffect(() => {
    if (!isRunning) {
      let mins = 25;
      if (isBreak) {
        mins = mode === "Long Study" ? 10 : 5;
      } else {
        if (mode === "Pomodoro") mins = 25;
        else if (mode === "Long Study") mins = 50;
        else mins = customMinutes;
      }
      setSecondsLeft(mins * 60);
      setTotalDuration(mins * 60);
    }
  }, [mode, isBreak, customMinutes, isRunning]);

  // Timer Tick Core Logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  async function handleTimerComplete() {
    // Notify user
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
    try { audio.play(); } catch {}

    if (!isBreak) {
      // Completed focus session! Record to backend
      try {
        const durationMins = Math.round(totalDuration / 60);
        const breakMins = mode === "Long Study" ? 10 : 5;
        
        const res = await api.post("/sessions/pomodoro", {
          duration: durationMins,
          break_time: breakMins,
          completed: true,
          subject_id: selectedSubject ? parseInt(selectedSubject) : null
        });
        
        setXpEarned(res.data.xp_earned || 15);
        setSuccessMsg(`Focus session completed! You earned +${res.data.xp_earned || 15} XP! 🎉`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        setErrorMsg("Failed to save study session to history.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
      // Toggle to break mode automatically
      setIsBreak(true);
    } else {
      // Completed break! Toggle back
      setIsBreak(false);
      setSuccessMsg("Break over! Time to focus! 💪");
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  }

  function handleStartPause() {
    setIsRunning(!isRunning);
  }

  function handleReset() {
    setIsRunning(false);
    setIsBreak(false);
    let mins = mode === "Pomodoro" ? 25 : mode === "Long Study" ? 50 : customMinutes;
    setSecondsLeft(mins * 60);
    setTotalDuration(mins * 60);
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center justify-center gap-2">
          {isBreak ? "💆 Break Timer" : "⏱️ Focus Timer"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isBreak ? "Take a breath, rest your eyes, stretch out." : "Boost your focus with the Pomodoro technique."}
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

      {/* Main Glassmorphic Panel */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl text-center space-y-6">
        {/* Mode Selectors */}
        <div className="flex justify-center bg-black/20 p-1 rounded-xl border border-white/5 max-w-sm mx-auto">
          {["Pomodoro", "Long Study", "Custom"].map((m) => (
            <button
              key={m}
              disabled={isRunning}
              onClick={() => {
                setMode(m);
                setIsBreak(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                mode === m 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-gray-400 hover:text-white disabled:opacity-50"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Custom Mode Controls */}
        {mode === "Custom" && !isRunning && (
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl max-w-xs mx-auto">
            <span className="text-xs text-gray-400">Duration:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-black/40 text-center text-sm border border-white/10 rounded px-1.5 py-1 text-gray-100 focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-gray-400">mins</span>
          </div>
        )}

        {/* Subject Selector */}
        {!isBreak && !isRunning && (
          <div className="max-w-xs mx-auto text-left space-y-2">
            <label className="text-xs font-medium text-gray-400">Associate Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-black/40 text-sm border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="">General / None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Big Radial/Visual Countdown Clock */}
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          {/* Outer Ring Circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              className="stroke-white/5 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              className={`fill-none transition-all duration-1000 ${
                isBreak ? "stroke-emerald-400" : "stroke-primary"
              }`}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text inside ring */}
          <div className="text-center z-10 space-y-1">
            <p className={`text-5xl font-extrabold tracking-tight ${isBreak ? "text-emerald-400" : "text-gray-100"}`}>
              {formatTime(secondsLeft)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {isBreak ? "Rest Phase" : "Focus Phase"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleStartPause}
            className={`px-8 py-3 rounded-xl font-bold shadow-lg transition duration-200 hover:scale-105 active:scale-95 text-sm ${
              isRunning
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                : isBreak 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-primary text-white hover:bg-primary/95"
            }`}
          >
            {isRunning ? "Pause Session" : "Start Focus"}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm transition duration-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Forest/TickTick inspired focus guidelines card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-sm text-gray-400 space-y-3">
        <h3 className="font-semibold text-gray-200">How to use:</h3>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Choose the topic or subject you want to focus on.</li>
          <li>Select a timer cycle (25 minutes is recommended for learning sprint).</li>
          <li>Press "Start Focus" and dedicate full attention to your study material.</li>
          <li>Avoid switching browser tabs or picking up your phone.</li>
          <li>Take the automatic 5 or 10 minutes break when the chime rings to maintain top energy levels!</li>
        </ol>
      </div>
    </div>
  );
}
