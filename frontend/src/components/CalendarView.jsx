import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function CalendarView() {
  const [view, setView] = useState("Month"); // Month, Week, Day
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Data lists
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected event for modal details
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all events
  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, eRes, rRes, gRes] = await Promise.allSettled([
          api.get("/tasks/"),
          api.get("/exams/"),
          api.get("/reminders/"),
          api.get("/goals/")
        ]);

        if (tRes.status === "fulfilled") setTasks(tRes.value.data);
        if (eRes.status === "fulfilled") setExams(eRes.value.data);
        if (rRes.status === "fulfilled") setReminders(rRes.value.data);
        if (gRes.status === "fulfilled") setGoals(gRes.value.data);
      } catch (e) {
        console.error("Error loading calendar data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper date conversions
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrev = () => {
    if (view === "Month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === "Week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (view === "Month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === "Week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  // Compile all items for a particular date
  const getEventsForDate = (checkDate) => {
    const checkStr = checkDate.toISOString().split("T")[0];
    const items = [];

    // Add tasks
    tasks.forEach((t) => {
      if (t.due_date === checkStr) {
        items.push({ ...t, type: "Task", color: "bg-primary/25 border-primary text-blue-200" });
      }
    });

    // Add exams
    exams.forEach((e) => {
      if (e.exam_date === checkStr) {
        items.push({ ...e, title: `Exam: ${e.name}`, type: "Exam", color: "bg-secondary/25 border-secondary text-pink-200" });
      }
    });

    // Add reminders
    reminders.forEach((r) => {
      if (r.remind_at && r.remind_at.split("T")[0] === checkStr) {
        items.push({ ...r, type: "Reminder", color: "bg-accent/25 border-accent text-yellow-200" });
      }
    });

    // Add goals
    goals.forEach((g) => {
      if (g.deadline === checkStr) {
        items.push({ ...g, title: `Goal: ${g.title}`, type: "Goal", color: "bg-emerald-500/25 border-emerald-500 text-emerald-200" });
      }
    });

    return items;
  };

  // Month rendering details
  const renderMonthDays = () => {
    const daysCount = getDaysInMonth(currentDate);
    const firstDayIndex = getFirstDayOfMonth(currentDate);
    const totalSlots = daysCount + firstDayIndex;
    const grid = [];

    // Empty padding slots
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(<div key={`empty-${i}`} className="h-28 bg-white/5 border border-white/5 rounded-xl opacity-30" />);
    }

    // Days slots
    for (let day = 1; day <= daysCount; day++) {
      const thisDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const cellEvents = getEventsForDate(thisDate);
      const isToday = thisDate.toDateString() === new Date().toDateString();

      grid.push(
        <div
          key={`day-${day}`}
          className={`h-28 bg-white/5 border border-white/10 rounded-xl p-2 space-y-1 overflow-y-auto relative ${
            isToday ? "ring-2 ring-primary bg-primary/5" : ""
          }`}
        >
          <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-gray-400"}`}>
            {day}
          </span>
          <div className="space-y-1">
            {cellEvents.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEvent(ev)}
                className={`text-[10px] px-1.5 py-0.5 border rounded cursor-pointer truncate font-medium transition hover:scale-[1.02] ${ev.color}`}
                title={ev.title}
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return grid;
  };

  // Week View Details
  const getStartOfWeek = (d) => {
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const renderWeekDays = () => {
    const startOfWeek = getStartOfWeek(new Date(currentDate));
    const grid = [];

    for (let i = 0; i < 7; i++) {
      const thisDate = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000);
      const cellEvents = getEventsForDate(thisDate);
      const isToday = thisDate.toDateString() === new Date().toDateString();

      grid.push(
        <div
          key={`week-day-${i}`}
          className={`min-h-[350px] bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 flex-1 ${
            isToday ? "ring-2 ring-primary bg-primary/5" : ""
          }`}
        >
          <div className="text-center border-b border-white/5 pb-2">
            <p className="text-xs text-gray-400 font-bold uppercase">
              {thisDate.toLocaleDateString("en-US", { weekday: "short" })}
            </p>
            <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-gray-200"}`}>
              {thisDate.getDate()}
            </p>
          </div>
          <div className="space-y-1.5 overflow-y-auto h-72 pr-1">
            {cellEvents.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEvent(ev)}
                className={`text-xs p-2 border rounded cursor-pointer space-y-1 font-medium transition hover:scale-[1.02] ${ev.color}`}
              >
                <div className="font-bold text-[10px] uppercase tracking-wide opacity-80">{ev.type}</div>
                <div className="truncate">{ev.title}</div>
              </div>
            ))}
            {cellEvents.length === 0 && (
              <p className="text-[10px] text-gray-500 text-center py-6">No events</p>
            )}
          </div>
        </div>
      );
    }

    return grid;
  };

  // Day View Details
  const renderDayView = () => {
    const cellEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-gray-100">
            {currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{cellEvents.length} events scheduled</p>
        </div>

        <div className="space-y-3">
          {cellEvents.map((ev, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedEvent(ev)}
              className={`p-4 border rounded-xl cursor-pointer flex items-center justify-between transition hover:bg-white/10 ${ev.color}`}
            >
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-black/30 px-2 py-0.5 rounded-full mr-2">
                  {ev.type}
                </span>
                <span className="font-semibold text-sm">{ev.title}</span>
                {ev.description && <p className="text-xs opacity-75 mt-1">{ev.description}</p>}
              </div>
              <span className="text-xs opacity-80 font-mono">📅 Due</span>
            </div>
          ))}

          {cellEvents.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <span className="text-3xl block mb-2">🎈</span>
              <p className="text-sm">Enjoy your day! No study planner tasks or exams scheduled.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getHeaderLabel = () => {
    if (view === "Month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (view === "Week") {
      const start = getStartOfWeek(new Date(currentDate));
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Calendar View</h1>
          <p className="text-gray-400 text-sm mt-1">Timeline tracker for exams, habits, and tasks</p>
        </div>

        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 max-w-xs self-start">
          {["Month", "Week", "Day"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                view === v ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation and Calendar body */}
      <div className="space-y-4">
        {/* Navigation bar */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-lg font-bold text-gray-200">{getHeaderLabel()}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-gray-300 transition"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-gray-300 transition"
            >
              ▶
            </button>
          </div>
        </div>

        {/* View render */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading schedules...</div>
        ) : view === "Month" ? (
          <div className="space-y-1">
            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-400 py-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            {/* Grid days */}
            <div className="grid grid-cols-7 gap-2">
              {renderMonthDays()}
            </div>
          </div>
        ) : view === "Week" ? (
          <div className="flex flex-col md:flex-row gap-2">
            {renderWeekDays()}
          </div>
        ) : (
          renderDayView()
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-darkBg border border-white/10 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${selectedEvent.color}`}>
                {selectedEvent.type}
              </span>
              <h3 className="text-xl font-bold text-gray-100 mt-2">{selectedEvent.title}</h3>
            </div>

            <div className="space-y-2 text-sm text-gray-300 border-t border-white/5 pt-3">
              {selectedEvent.description && (
                <div>
                  <span className="text-gray-400 block text-xs">Description</span>
                  <p className="mt-0.5">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.due_date && (
                <div>
                  <span className="text-gray-400 block text-xs">Deadline</span>
                  <p className="font-mono mt-0.5">{selectedEvent.due_date}</p>
                </div>
              )}
              {selectedEvent.exam_date && (
                <div>
                  <span className="text-gray-400 block text-xs">Exam Date</span>
                  <p className="font-mono mt-0.5">{selectedEvent.exam_date}</p>
                </div>
              )}
              {selectedEvent.remind_at && (
                <div>
                  <span className="text-gray-400 block text-xs">Remind At</span>
                  <p className="font-mono mt-0.5">{new Date(selectedEvent.remind_at).toLocaleString()}</p>
                </div>
              )}
              {selectedEvent.priority && (
                <div>
                  <span className="text-gray-400 block text-xs">Priority</span>
                  <p className="mt-0.5">{selectedEvent.priority}</p>
                </div>
              )}
              {selectedEvent.status && (
                <div>
                  <span className="text-gray-400 block text-xs">Status</span>
                  <p className="mt-0.5">{selectedEvent.status}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
