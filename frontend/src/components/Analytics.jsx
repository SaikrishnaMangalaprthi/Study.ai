import React, { useState, useEffect } from "react";
import api from "../utils/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const [days, setDays] = useState(7); // 7, 30 days range
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  async function loadAnalytics() {
    try {
      const res = await api.get(`/analytics/summary?days=${days}`);
      setData(res.data);
    } catch {
      setErrorMsg("Failed to load study analytics summary.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Compiling productivity report...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-red-400">
        {errorMsg || "Unable to display analytics summaries."}
      </div>
    );
  }

  // Chart 1: Study Hours Line Chart
  const studyHoursChartData = {
    labels: data.study_hours_trend.map((x) => x.date.split("-").slice(1).join("/")), // MM/DD format
    datasets: [
      {
        label: "Study Hours",
        data: data.study_hours_trend.map((x) => x.hours),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "rgb(59, 130, 246)"
      }
    ]
  };

  // Chart 2: Task Completion Doughnut
  const taskDistributionData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [
          data.task_stats.completed,
          data.task_stats.in_progress,
          data.task_stats.pending
        ],
        backgroundColor: [
          "rgba(16, 185, 129, 0.6)", // green
          "rgba(245, 158, 11, 0.6)", // amber
          "rgba(239, 68, 68, 0.6)"   // red
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)"
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart 3: Subject Performance Bar Chart
  const subjectScoresData = {
    labels: data.subject_performance.map((x) => x.subject),
    datasets: [
      {
        label: "Average Score %",
        data: data.subject_performance.map((x) => x.avg_score),
        backgroundColor: "rgba(236, 72, 153, 0.6)", // secondary/pink
        borderColor: "rgb(236, 72, 153)",
        borderWidth: 1
      }
    ]
  };

  // Chart 4: Habit Consistency Line Chart
  const habitConsistencyData = {
    labels: data.habit_consistency.map((x) => x.date.split("-").slice(1).join("/")),
    datasets: [
      {
        label: "Consistency Rate %",
        data: data.habit_consistency.map((x) => x.percentage),
        borderColor: "rgb(245, 158, 11)", // orange
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.2,
        fill: true,
        pointBackgroundColor: "rgb(245, 158, 11)"
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#9ca3af" // gray-400
        }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#9ca3af" }
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#9ca3af" }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 font-sans">Productivity Engine</h1>
          <p className="text-gray-400 text-sm mt-1">Deep insight analytics of your studies and routines</p>
        </div>

        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 max-w-xs self-start">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                days === d ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Grid stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Productivity score gauge */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3 flex flex-col justify-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 bg-secondary" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Productivity Score</span>
          <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {data.productivity_score}%
          </div>
          <p className="text-xs text-gray-400">
            {data.productivity_score >= 80 ? "Superb work! Keep it up! 🔥" : 
             data.productivity_score >= 60 ? "Solid consistency. Aim for 80% next!" : 
             "A great time to check off outstanding tasks."}
          </p>
        </div>

        {/* Study Hours sum */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3 flex flex-col justify-center shadow-lg">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Focus Time</span>
          <div className="text-4xl font-extrabold text-blue-400">{data.focus_summary.total_study_hours} hrs</div>
          <p className="text-xs text-gray-400">Daily average: {data.focus_summary.avg_daily_hours} hrs</p>
        </div>

        {/* Pomodoros completed */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3 flex flex-col justify-center shadow-lg">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pomodoros Done</span>
          <div className="text-4xl font-extrabold text-amber-400">{data.focus_summary.pomodoros_completed}</div>
          <p className="text-xs text-gray-400">XP gained from timers: {data.focus_summary.pomodoros_completed * 15} XP</p>
        </div>

        {/* Tasks completed stats */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3 flex flex-col justify-center shadow-lg">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Task Completion</span>
          <div className="text-4xl font-extrabold text-emerald-400">
            {data.task_stats.completed}/{data.task_stats.total}
          </div>
          <p className="text-xs text-gray-400">
            Pending backlog: {data.task_stats.pending} items
          </p>
        </div>
      </div>

      {/* Charts Panel: First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hour Trend */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-gray-200">Study hours trend</h3>
          <div className="h-64">
            <Line data={studyHoursChartData} options={options} />
          </div>
        </div>

        {/* Subject Score Performance */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-gray-200">Subject Exam Performance</h3>
          <div className="h-64">
            <Bar data={subjectScoresData} options={options} />
          </div>
        </div>
      </div>

      {/* Charts Panel: Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Consistency */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-gray-200">Habit Consistency (Check-ins)</h3>
          <div className="h-64">
            <Line data={habitConsistencyData} options={options} />
          </div>
        </div>

        {/* Task Distribution Doughnut */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col">
          <h3 className="text-base font-bold text-gray-200">Task Backlog Distribution</h3>
          <div className="h-48 flex-1 flex items-center justify-center">
            <Doughnut 
              data={taskDistributionData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9ca3af' }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Weak Subjects Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-gray-200">⚠️ Weak Subject Alerts</h3>
        <p className="text-xs text-gray-400">Subjects with average exam scores below 65%</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.weak_subjects.map((ws, idx) => (
            <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-200 block">{ws.subject}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">Requires priority study session</span>
              </div>
              <span className="text-lg font-mono font-bold text-red-400">{ws.avg_score}%</span>
            </div>
          ))}
          {data.weak_subjects.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-medium">
              Excellent! No weak subjects detected. All average scores are above 65%. 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
