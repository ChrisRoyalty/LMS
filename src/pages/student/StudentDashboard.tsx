"use client";
import * as React from "react";
import { UltraLoader } from "../instructor/_shared/UltraLoader";
import { 
  Gauge, 
  BookOpen, 
  AlertCircle, 
  Upload, 
  Check, 
  Calendar, 
  Activity, 
  RefreshCw 
} from "lucide-react";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";

type Deadline = { title: string; deadline: string };
type ActivityItem = { type: string; assignment: string; date: string };

export default function StudentDashboard() {
  const [loading, setLoading] = React.useState(false);
  const [working, setWorking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = React.useState<number>(0);
  const [averageGrade, setAverageGrade] = React.useState<string>("N/A");
  const [submissionRate, setSubmissionRate] = React.useState<string>("0/3");
  const [upcomingDeadlines, setUpcomingDeadlines] = React.useState<Deadline[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>([]);

  // 🔥 FIXED: Direct localStorage (no hydration issues)
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userJson ? JSON.parse(userJson) : null;
  const studentId = user?.id;

  /* ---------------- LOAD DASHBOARD (ABORTERROR FIXED) ---------------- */
  async function loadDashboard() {
    // 🔥 CRITICAL: Prevent multiple calls
    if (working) {
      console.log("[StudentDashboard] ⏹️ Already loading - skipping");
      return;
    }
    
    if (!studentId) {
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Could not determine student ID. Please log in again.",
      });
      return;
    }

    const token = localStorage.getItem("lms_token") || localStorage.getItem("token");
    if (!token) {
      showToast({
        kind: "error",
        title: "Session Expired",
        message: "Please log in again.",
      });
      return;
    }

    // 🔥 UNIQUE ABORT CONTROLLER PER CALL
    const controller = new AbortController();
    
    try {
      setWorking(true);
      setError(null);

      console.log("[StudentDashboard] 🔄 Fetching fresh data...");
      
      const res = await api.get(`/api/students/student-dashboard/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      console.log("[StudentDashboard] ✅ Fresh data:", res.data);
      
      const data = res.data?.data || res.data;
      
      setPendingAssignments(Number(data.pendingAssignments ?? 0));
      setAverageGrade(data.averageGrade ?? "N/A");
      setSubmissionRate(data.submissionRate ?? "0/3");
      setUpcomingDeadlines(Array.isArray(data.upcomingDeadlines) ? data.upcomingDeadlines : []);
      setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
      
    } catch (err: any) {
      // 🔥 IGNORE ABORT ERRORS COMPLETELY
      if (err.name === 'AbortError') {
        console.log("[StudentDashboard] ⏹️ Request aborted (normal)");
        return;
      }
      
      console.error("[StudentDashboard] ❌ Error:", err);
      setError(err?.response?.data?.message || "Failed to refresh dashboard");
      showToast({
        kind: "error",
        title: "Refresh Failed",
        message: err?.response?.data?.message || "Please try again.",
      });
    } finally {
      setWorking(false);
    }
  }

  // 🔥 SINGLE INITIAL LOAD ONLY
  React.useEffect(() => {
    if (studentId && !working) {
      console.log("[StudentDashboard] 💧 Initial load");
      loadDashboard();
    }
  }, [studentId]);

  // 🔥 FIXED: Auto-refresh with DEBOUNCE + working guard
  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleFocus = () => {
      // 🔥 DEBOUNCE + working guard
      if (!working && studentId) {
        timeout = setTimeout(() => {
          console.log("[StudentDashboard] 🔄 Auto-refresh on focus");
          loadDashboard();
        }, 800); // 800ms delay
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (timeout) clearTimeout(timeout);
    };
  }, [studentId, working]);

  const ultraBusy = loading || working;
  const hasData = pendingAssignments > 0 || upcomingDeadlines.length > 0 || recentActivity.length > 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-neutral-900">Dashboard</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">
              Welcome back, {user?.fullName?.split(" ")[0] || "Student"}!
              {hasData && ` (${upcomingDeadlines.length} deadlines)`}
            </p>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            disabled={working}
          >
            <RefreshCw className={`h-4 w-4 ${working ? "animate-spin" : ""}`} />
            {working ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadDashboard()}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-[#0B5CD7]" />}
            label="Pending Assignments"
            value={pendingAssignments.toString()}
            accent={pendingAssignments > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}
          >
            {pendingAssignments > 0 && (
              <span className="ml-2 text-xs font-medium">⚡ Due soon</span>
            )}
          </StatCard>
          
          <StatCard
            icon={<Gauge className="h-5 w-5 text-emerald-600" />}
            label="Average Grade"
            value={averageGrade}
            accent={averageGrade === "A" ? "bg-emerald-50 text-emerald-700" : averageGrade === "N/A" ? "bg-neutral-50 text-neutral-700" : "bg-amber-50 text-amber-700"}
          />
          
          <StatCard
            icon={<Upload className="h-5 w-5 text-amber-600" />}
            label="Submission Rate"
            value={submissionRate}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-[#0B5CD7]/5 to-[#0FA958]/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0B5CD7]/10 grid place-items-center">
                  <Calendar className="h-5 w-5 text-[#0B5CD7]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900">Upcoming Deadlines</h2>
                  <p className="text-sm text-neutral-500">
                    {upcomingDeadlines.length} assignment{upcomingDeadlines.length !== 1 ? 's' : ''} due soon
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-sm text-neutral-500">No upcoming deadlines 🎉</p>
                  <p className="text-xs text-neutral-400 mt-2">You're all caught up!</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {upcomingDeadlines.map((d, i) => (
                    <li 
                      key={i} 
                      className="group flex items-start justify-between p-4 rounded-xl border border-neutral-200 hover:border-[#0B5CD7]/20 hover:bg-[#0B5CD7]/5 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-[#0B5CD7] group-hover:scale-125 transition-transform duration-200" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-neutral-900 truncate">{d.title}</div>
                          <div className="text-sm text-neutral-600">
                            Due {formatDate(d.deadline)}
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-emerald-500/5 to-green-600/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900">Recent Activity</h2>
                  <p className="text-sm text-neutral-500">
                    {recentActivity.length} recent action{recentActivity.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                  <p className="text-sm text-neutral-500">No recent activity yet</p>
                  <p className="text-xs text-neutral-400 mt-1">Complete an assignment to see activity here</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <IconDot type={a.type} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-neutral-900 truncate">{a.assignment}</div>
                            <div className="text-sm text-neutral-600">
                              {formatActivityType(a.type)} · {formatDate(a.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 ml-2 min-w-[70px] text-right">
                          {timeAgo(a.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UltraLoader show={ultraBusy} label={working ? "Refreshing…" : ""} />
    </>
  );
}

/* ----------------- Helper Components & Utils ----------------- */
function StatCard({
  icon,
  label,
  value,
  children,
  accent = "bg-neutral-50 text-neutral-700",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-sm transition-all duration-200 hover:border-neutral-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${accent} grid place-items-center`}>
            {icon}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-neutral-600">{label}</div>
            <div className="text-2xl font-semibold text-neutral-900">{value}</div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconDot({ type }: { type: string }) {
  const config = {
    graded: { color: "bg-emerald-600", Icon: Check },
    submitted: { color: "bg-[#0B5CD7]", Icon: Upload },
    default: { color: "bg-neutral-400", Icon: AlertCircle },
  };

  const { color, Icon } = config[type as keyof typeof config] || config.default;

  return (
    <div className={`mt-1 h-8 w-8 rounded-full grid place-items-center text-white ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatActivityType(type: string): string {
  const map: Record<string, string> = {
    graded: "Graded",
    submitted: "Submitted",
    updated: "Updated",
  };
  return map[type] || type;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
}