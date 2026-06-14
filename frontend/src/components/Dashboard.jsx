import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const defaultSummary = {
  focusHours: "-",
  pendingTasks: 0,
  xp: "-",
  upcomingExams: 0,
  sleep: "-",
  water: "-"
};

const defaultStudyTrend = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Hours Studied",
      data: [1.5, 2.0, 2.3, 1.8, 2.6, 1.2, 2.4],
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59, 130, 246, 0.16)",
      fill: true,
      tension: 0.35,
      pointRadius: 3
    }
  ]
};

const defaultHabitTrend = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "Habit consistency",
      data: [72, 85, 78, 92],
      borderColor: "#10B981",
      backgroundColor: "rgba(16, 185, 129, 0.16)",
      fill: true,
      tension: 0.35,
      pointRadius: 3
    }
  ]
};

const defaultTaskProgress = [
  { label: "Completed", value: 60, color: "bg-emerald-500" },
  { label: "In progress", value: 25, color: "bg-blue-500" },
  { label: "Overdue", value: 15, color: "bg-red-500" }
];

const defaultAgenda = [
  { time: "09:30", title: "Review calculus notes", type: "Task", tone: "bg-slate-800" },
  { time: "11:00", title: "Biology exam prep", type: "Exam", tone: "bg-slate-800" },
  { time: "14:00", title: "Focus session: writing", type: "Focus", tone: "bg-slate-800" }
];

const defaultActivity = [
  { label: "New task", description: "Added a chemistry summary task", time: "2h ago" },
  { label: "Focus session", description: "Completed 45 minutes of Pomodoro", time: "4h ago" },
  { label: "Goal progress", description: "Advanced Algebra mastery goal", time: "Yesterday" }
];

const heroActions = [
  { label: "Start focus", icon: "⏱️", to: "/study", color: "bg-primary/20 text-primary" },
  { label: "Add task", icon: "✅", to: "/tasks", color: "bg-slate-800/80 text-slate-100" },
  { label: "Plan exam", icon: "📋", to: "/exams", color: "bg-pink-500/20 text-pink-300" }
];

function MetricCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-slate-900/80 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${accent}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, color }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(defaultSummary);
  const [studyTrend, setStudyTrend] = useState(defaultStudyTrend);
  const [habitTrend, setHabitTrend] = useState(defaultHabitTrend);
  const [taskProgress, setTaskProgress] = useState(defaultTaskProgress);
  const [agenda, setAgenda] = useState(defaultAgenda);
  const [activity, setActivity] = useState(defaultActivity);
  const [hasDashboardData, setHasDashboardData] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [tasksRes, examsRes, remindersRes, habitsRes, analyticsRes, healthRes] = await Promise.allSettled([
          api.get("/tasks/"),
          api.get("/exams/"),
          api.get("/reminders/"),
          api.get("/habits/"),
          api.get("/analytics/summary?days=7"),
          api.get("/health/")
        ]);

        const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.data : [];
        const exams = examsRes.status === "fulfilled" ? examsRes.value.data : [];
        const reminders = remindersRes.status === "fulfilled" ? remindersRes.value.data : [];
        const habits = habitsRes.status === "fulfilled" ? habitsRes.value.data : [];
        const analytics = analyticsRes.status === "fulfilled" ? analyticsRes.value.data : null;
        const health = healthRes.status === "fulfilled" ? healthRes.value.data : null;
        const hasData = tasks.length || exams.length || reminders.length || habits.length || analytics || health;
        setHasDashboardData(Boolean(hasData));

        if (hasData) {
          const pendingTasks = tasks.filter((task) => task.status !== "Completed").length;
          const upcomingExams = exams.filter((exam) => exam.status === "Upcoming").length;
          const focusHours = analytics?.today_study_hours ?? 0;
          const xpValue = analytics?.xp_total ?? 0;
          const sleepHours = health?.sleep_hours ?? 0;
          const waterIntake = health?.water_ml ?? 0;

          setSummary((current) => ({
            ...current,
            focusHours,
            pendingTasks,
            xp: xpValue,
            upcomingExams,
            sleep: sleepHours,
            water: waterIntake
          }));

          if (analytics?.study_hours_trend) {
            setStudyTrend({
              labels: analytics.study_hours_trend.map((row) => row.day_short),
              datasets: [
                {
                  label: "Hours Studied",
                  data: analytics.study_hours_trend.map((row) => row.hours),
                  borderColor: "#3B82F6",
                  backgroundColor: "rgba(59, 130, 246, 0.16)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 3
                }
              ]
            });
          }

          if (analytics?.habit_consistency) {
            setHabitTrend({
              labels: analytics.habit_consistency.map((row) => row.week_label),
              datasets: [
                {
                  label: "Habit consistency",
                  data: analytics.habit_consistency.map((row) => row.percent),
                  borderColor: "#10B981",
                  backgroundColor: "rgba(16, 185, 129, 0.16)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 3
                }
              ]
            });
          }

          if (tasks.length > 0) {
            const completed = tasks.filter((task) => task.status === "Completed").length;
            const inProgress = tasks.filter((task) => task.status === "In Progress").length;
            const overdue = tasks.filter((task) => task.status === "Overdue").length;
            const total = tasks.length || 1;

            setTaskProgress([
              { label: "Completed", value: Math.round((completed / total) * 100), color: "bg-emerald-500" },
              { label: "In progress", value: Math.round((inProgress / total) * 100), color: "bg-blue-500" },
              { label: "Overdue", value: Math.round((overdue / total) * 100), color: "bg-red-500" }
            ]);
          }

          if (tasks.length || exams.length || reminders.length) {
            const todayAgenda = [
              ...tasks
                .filter((item) => item.due_date === new Date().toISOString().slice(0, 10))
                .slice(0, 2)
                .map((task) => ({ time: task.due_date?.slice(11, 16) || "TBD", title: task.title, type: "Task" })),
              ...exams
                .filter((item) => item.exam_date === new Date().toISOString().slice(0, 10))
                .slice(0, 1)
                .map((exam) => ({ time: "11:00", title: `Exam prep: ${exam.name}`, type: "Exam" })),
              ...reminders
                .filter((item) => item.remind_at?.startsWith(new Date().toISOString().slice(0, 10)))
                .map((reminder) => ({ time: reminder.remind_at.slice(11, 16), title: reminder.title, type: "Reminder" }))
            ];
            if (todayAgenda.length) setAgenda(todayAgenda);
          }

          if (habits.length) {
            setActivity((current) => [
              { label: "Habit streak", description: `Logged ${habits.length} habits today`, time: "Today" },
              ...current.slice(0, 2)
            ]);
          } else if (!hasData) {
            setActivity([
              { label: "No recent activity", description: "Start by adding your first task or focus session.", time: "Today" }
            ]);
          }
        }
      } catch (error) {
        console.warn("Dashboard load failed", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Dashboard</p>
            <h1 className="text-4xl font-semibold text-white">Your study command center</h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              Track priorities, keep your focus sessions moving, and see the next important actions for today.
            </p>
            {!hasDashboardData && (
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">No activity yet</p>
                <p className="mt-2">Add your first task, start a focus session, or set a goal to unlock personalized analytics.</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {heroActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`rounded-3xl border border-white/10 px-4 py-3 text-sm font-semibold transition ${action.color} hover:brightness-110`}
                >
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:w-[420px]">
            <MetricCard
              label="Focus hours"
              value={summary.focusHours === "-" ? "-" : `${summary.focusHours}h`}
              icon="⏱️"
              accent="bg-primary/10 text-primary"
            />
            <MetricCard label="Pending tasks" value={summary.pendingTasks} icon="📝" accent="bg-slate-800/70 text-slate-100" />
            <MetricCard
              label="XP points"
              value={summary.xp === "-" ? "-" : summary.xp}
              icon="✨"
              accent="bg-emerald-500/10 text-emerald-300"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">AI Advisor</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Study faster with an adaptive plan</h2>
              </div>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">
                Suggested for today
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] bg-slate-900/90 p-5">
                <p className="text-sm font-semibold text-white">Today’s focus recommendation</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Review your weakest exam notes first, then block a 45-minute focus session for active recall.
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-900/90 p-5">
                <p className="text-sm font-semibold text-white">Smart guidance</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li>• 3 tasks due today</li>
                  <li>• 1 upcoming major exam</li>
                  <li>• Habit consistency at 92%</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Weekly review</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Study trend</h3>
                </div>
                <span className="text-xs text-slate-400">7 days</span>
              </div>
              <div className="mt-6 h-72">
                {hasDashboardData ? (
                  <Line
                    data={studyTrend}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
                        y: { grid: { color: "rgba(148,163,184,0.12)" }, ticks: { color: "#94A3B8" } }
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/70 text-center text-slate-400">
                    No study trend yet. Start tracking a session to see progress here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Habit consistency</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Weekly streak</h3>
                </div>
                <span className="text-xs text-slate-400">4 weeks</span>
              </div>
              <div className="mt-6 h-72">
                {hasDashboardData ? (
                  <Line
                    data={habitTrend}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
                        y: { grid: { color: "rgba(148,163,184,0.12)" }, ticks: { color: "#94A3B8" } }
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/70 text-center text-slate-400">
                    No habit trend yet. Build a streak to populate this chart.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Completion overview</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Task progress</h3>
              </div>
              <p className="text-sm text-slate-400">Based on the last 7 days</p>
            </div>
            <div className="mt-6 space-y-4">
              {hasDashboardData ? (
                taskProgress.map((segment) => (
                  <ProgressRow key={segment.label} label={segment.label} value={segment.value} color={segment.color} />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">
                  No task progress to show yet. Add tasks and mark them complete to see your completion overview.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Calendar preview</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Today at a glance</h3>
              </div>
              <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="mt-6 space-y-3">
              {agenda.map((item) => (
                <div key={`${item.time}-${item.title}`} className="rounded-3xl bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>{item.time}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">{item.type}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Quick actions</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Fast entry</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <Link to="/tasks" className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                ➕ Create task
              </Link>
              <Link to="/study" className="rounded-3xl border border-white/10 bg-primary/20 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/25">
                ⏱️ Start focus session
              </Link>
              <Link to="/notes" className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                📝 Capture note
              </Link>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Achievements</p>
            <div className="mt-4 rounded-3xl bg-slate-900/80 p-4">
              <p className="text-sm font-semibold text-white">Learning momentum</p>
              <p className="mt-2 text-sm text-slate-300">You’re on track for a 5-day streak. Keep the momentum with a quick review session.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Performance</p>
          <h3 className="mt-3 text-xl font-semibold text-white">Course mastery</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
              Your productivity score is rising. Focus on high-impact tasks first to keep the trend moving up.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/80 p-4">
                <p className="text-xs text-slate-500">Habit consistency</p>
                <p className="mt-2 text-3xl font-semibold text-white">92%</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4">
                <p className="text-xs text-slate-500">Tasks done</p>
                <p className="mt-2 text-3xl font-semibold text-white">{summary.pendingTasks ? 100 - Math.round((summary.pendingTasks / (summary.pendingTasks + 4)) * 100) : 85}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-[18px] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Activity</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Recent actions</h3>
            </div>
            <p className="text-sm text-slate-400">Updates from your study flow</p>
          </div>
          <div className="mt-6 space-y-4">
            {activity.map((item) => (
              <div key={`${item.label}-${item.time}`} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-white">{item.label}</p>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
