import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layout/AppShell";
import Dashboard from "./components/Dashboard";
import TaskList from "./components/TaskList";
import GoalList from "./components/GoalList";
import HabitList from "./components/HabitList";
import ScoreList from "./components/ScoreList";
import StudyTimer from "./components/StudyTimer";
import CalendarView from "./components/CalendarView";
import NoteEditor from "./components/NoteEditor";
import ExamPlanner from "./components/ExamPlanner";
import HealthTracker from "./components/HealthTracker";
import Reminders from "./components/Reminders";
import Analytics from "./components/Analytics";
import Achievements from "./components/Achievements";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import NotificationCenter from "./components/NotificationCenter";
import Login from "./components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("access_token")
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("user_name") || ""
  );

  function handleLogin(name) {
    setIsAuthenticated(true);
    setUserName(name);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    setIsAuthenticated(false);
    setUserName("");
  }

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("auth-expired", handleLogout);
    return () => window.removeEventListener("auth-expired", handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <AppShell userName={userName} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/goals" element={<GoalList />} />
          <Route path="/habits" element={<HabitList />} />
          <Route path="/scores" element={<ScoreList />} />
          <Route path="/study" element={<StudyTimer />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/notes" element={<NoteEditor />} />
          <Route path="/exams" element={<ExamPlanner />} />
          <Route path="/health" element={<HealthTracker />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
