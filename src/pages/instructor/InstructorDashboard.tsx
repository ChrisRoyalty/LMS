"use client";
import React, { useEffect, useState } from "react";
import { UltraLoader } from "./_shared/UltraLoader";
import { BookOpen, Users, ClipboardList, Gauge, RefreshCw } from "lucide-react";

type DashboardApi = {
  totalStudents: number;
  totalPendingReviews: number;
  classAverage: number | null;
  curriculum: Array<{
    courseId: string;
    courseName: string;
    studentsCount: number;
    avgProgress: number;
    nextDeadline?: string | null;
  }>;
  recentActivity: Array<{
    message: string;
    timeAgo: string;
  }>;
};

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [data, setData] = useState<DashboardApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = import.meta.env.VITE_API_BASE_URL as string;
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    "";

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    if (!base) {
      setError("API base URL not configured");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${base}/api/instructor/instructor-dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const json = (await res.json()) as DashboardApi;
      setData(json);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setError(e?.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }

  const ultraBusy = loading || working;
  const ultraLabel = loading ? "Loading dashboard…" : working ? "Syncing…" : "";

  const activeCourses = data?.curriculum?.length ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const pendingReviews = data?.totalPendingReviews ?? 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-neutral-900">Dashboard</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">Your teaching overview at a glance</p>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
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

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Courses"
            value={<Num n={activeCourses} className="text-[#0B5CD7]" />}
            caption="Currently teaching"
            Icon={BookOpen}
            loading={loading}
          />
          <StatCard
            title="Total Students"
            value={<Num n={totalStudents} className="text-[#0FA958]" />}
            caption="Across all courses"
            Icon={Users}
            loading={loading}
          />
          <StatCard
            title="Pending Reviews"
            value={<Num n={pendingReviews} className="text-[#E79E2B]" />}
            caption="Assignments to grade"
            Icon={ClipboardList}
            loading={loading}
          />
          <StatCard
            title="Class Average"
            value={
              <span className="text-[28px] font-semibold text-[#0FA5B4]">
                {loading ? "—" : formatAverage(data?.classAverage)}
              </span>
            }
            caption="Overall performance"
            Icon={Gauge}
            loading={loading}
          />
        </div>

        {/* Two Columns */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* My Courses */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-[16px] font-semibold text-neutral-900">My Courses</h2>
              <p className="text-sm text-neutral-500 -mt-0.5">Progress and deadlines</p>
            </div>

            {loading ? (
              <SkeletonCourseList />
            ) : data?.curriculum?.length ? (
              <div className="space-y-6">
                {data.curriculum.map((c) => (
                  <CourseRow
                    key={c.courseId}
                    title={c.courseName}
                    percent={clampPercent(c.avgProgress)}
                    students={`${c.studentsCount} ${c.studentsCount === 1 ? "student" : "students"}`}
                    nextDeadline={c.nextDeadline ?? "—"}
                  />
                ))}
              </div>
            ) : (
              <EmptyHint text="No assigned courses yet." />
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-[16px] font-semibold text-neutral-900">Recent Activity</h2>
              <p className="text-sm text-neutral-500 -mt-0.5">Latest student updates</p>
            </div>

            {loading ? (
              <SkeletonActivityList />
            ) : data?.recentActivity?.length ? (
              <ul className="space-y-5">
                {data.recentActivity.map((a, i) => (
                  <Activity
                    key={i}
                    kind={a.message.toLowerCase().includes("missed deadline") ? "warn" : "ok"}
                    title={a.message}
                    meta={a.timeAgo}
                  />
                ))}
              </ul>
            ) : (
              <EmptyHint text="No recent activity." />
            )}
          </div>
        </div>
      </div>

      <UltraLoader show={ultraBusy} label={ultraLabel} />
    </>
  );
}

/* ————— Enhanced Components ————— */

function StatCard({
  title,
  value,
  caption,
  Icon,
  loading,
}: {
  title: string;
  value: React.ReactNode;
  caption: string;
  Icon: any;
  loading: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-neutral-800">{title}</div>
        <div className="h-8 w-8 rounded-md bg-white text-neutral-400 grid place-items-center border border-neutral-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-20 bg-neutral-100 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      <div className="mt-1 text-sm text-neutral-500">{caption}</div>
    </div>
  );
}

function Num({ n, className }: { n: number; className?: string }) {
  return <span className={`text-[28px] font-semibold ${className}`}>{n}</span>;
}

function CourseRow({
  title,
  percent,
  students,
  nextDeadline,
}: {
  title: string;
  percent: number;
  students: string;
  nextDeadline: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-medium text-neutral-900 truncate max-w-[180px]">{title}</div>
        <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
          {students}
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-[#e5eefc] overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#0B5CD7] transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
        <span>{percent}% complete</span>
        <span className="truncate max-w-[120px]">Next: {nextDeadline}</span>
      </div>
    </div>
  );
}

function Activity({ kind, title, meta }: { kind: "ok" | "warn"; title: string; meta: string }) {
  const dot = kind === "ok" ? "bg-green-600" : "bg-amber-500";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1 h-2 w-2 rounded-full ${dot} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-neutral-900 truncate">{title}</div>
        <div className="text-sm text-neutral-600">{meta}</div>
      </div>
    </li>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
      {text}
    </div>
  );
}

function SkeletonCourseList() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 bg-neutral-100 rounded animate-pulse" />
            <div className="h-5 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
          <div className="h-2 w-full bg-neutral-100 rounded animate-pulse" />
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonActivityList() {
  return (
    <ul className="space-y-5">
      {[1, 2, 3].map((i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-neutral-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full max-w-md bg-neutral-100 rounded animate-pulse" />
            <div className="h-3 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ————— Helpers ————— */
function clampPercent(n: number | null | undefined): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatAverage(avg: number | null | undefined): string {
  if (avg == null) return "—";
  const n = clampPercent(avg);
  if (n >= 90) return "A";
  if (n >= 85) return "A-";
  if (n >= 80) return "B+";
  if (n >= 75) return "B";
  if (n >= 70) return "B-";
  if (n >= 65) return "C+";
  if (n >= 60) return "C";
  if (n >= 50) return "D";
  return "F";
}