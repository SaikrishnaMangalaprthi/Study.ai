import React, { useState, useEffect, useCallback } from "react";
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
import api from "./utils/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => {
      const token = localStorage.getItem("access_token");
      // Restore the Authorization header on initial load/refresh
      if (token && api.defaults && api.defaults.headers) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      return !!token;
    }
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("user_name") || ""
  );

  const handleLogin = useCallback((name, access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user_name", name);
    if (api.defaults && api.defaults.headers) {
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    }
    setIsAuthenticated(true);
    setUserName(name);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    // Clear the Authorization header on logout
    if (api.defaults && api.defaults.headers) {
      api.defaults.headers.common["Authorization"] = "";
    }
    setIsAuthenticated(false);
    setUserName("");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
    else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Handle global authentication state
  useEffect(() => {
    // 1. Listen for the custom "auth-expired" event
    window.addEventListener("auth-expired", handleLogout);

    // 2. Set up an interceptor to trigger the event on 401 errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If the error is 401, we haven't retried this request yet, 
        // and it's not a request to the refresh endpoint itself.
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url.includes("/auth/refresh")
        ) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("refresh_token");

          if (refreshToken) {
            try {
              // Attempt to get a new access token using the refresh token
              const response = await api.post("/auth/refresh", { refresh: refreshToken });
              const { access } = response.data; // Note: Adjust 'access' based on your API response key

              localStorage.setItem("access_token", access);
              api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
              originalRequest.headers["Authorization"] = `Bearer ${access}`;

              // Retry the original request with the new access token
              return api(originalRequest);
            } catch (refreshError) {
              // If refresh fails (e.g., refresh token expired), log out the user
              window.dispatchEvent(new Event("auth-expired"));
              return Promise.reject(refreshError);
            }
          } else {
            window.dispatchEvent(new Event("auth-expired"));
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      window.removeEventListener("auth-expired", handleLogout);
      api.interceptors.response.eject(interceptor);
    };
  }, [handleLogout]);

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
