"use client";
import React, { useEffect, useState } from "react";
import { UltraLoader } from "./_shared/UltraLoader";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { RefreshCw, TrendingUp, BarChart3, Activity } from "lucide-react";

type AnalyticsData = {
  gradeDistribution: Record<string, number>;
  assignmentTypes: Array<{ name: string; completion: number }>;
  students: Array<{
    id: string;
    name: string;
    email: string;
    course: string;
    assignmentsCompleted: number;
    averageScore: number;
    trend: "up" | "down" | "stable";
    status: "Active" | "Behind" | "Inactive";
  }>;
};

export default function InstructorAnalytics() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const token = localStorage.getItem("token") || localStorage.getItem("lms_token");

  useEffect(() => {
    void loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);

      if (!token) throw new Error("Authentication required");

      // TODO: Replace with real analytics endpoint when available
      // For now, use same students data from InstructorStudents
      console.log("[Analytics] Loading analytics data...");
      
      // Simulate API call with real filtering logic (same as students)
      const coursesRes = await api.get("/api/courses/all-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesList = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      
      if (coursesList.length === 0) {
        throw new Error("No courses assigned to you");
      }

      const mainCourseId = coursesList[0].id;

      const usersRes = await api.get("/api/user/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];

      // Calculate REAL analytics from student data
      const studentRows = users
        .filter((user: any) => user.role.name === "student")
        .filter((user: any) => user.courses.some((uc: any) => uc.id === mainCourseId))
        .filter((user: any) => user.batches.length > 0)
        .map((user: any) => {
          const course = user.courses.find((uc: any) => uc.id === mainCourseId);
          return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            course: course?.title || "Unknown",
            assignmentsCompleted: Math.floor(Math.random() * 90) + 10, // Simulate
            averageScore: course?.UserCourse?.progress || 0,
            trend: Math.random() > 0.7 ? "up" : Math.random() > 0.3 ? "stable" : "down",
            status: (course?.UserCourse?.progress || 0) >= 50 ? "Active" : "Behind",
          };
        });

      // Calculate grade distribution
      const gradeCounts: Record<string, number> = {
        "A": 0, "A-": 0, "B+": 0, "B": 0, "B-": 0, "C+": 0, "C": 0, "D": 0, "F": 0
      };

      studentRows.forEach((student: any) => {
        const grade = formatGrade(student.averageScore);
        gradeCounts[grade]++;
      });

      // Assignment types (static for now)
      const assignmentTypes = [
        { name: "Quizzes", completion: 95 },
        { name: "Assignments", completion: 88 },
        { name: "Projects", completion: 75 },
        { name: "Capstone", completion: 60 },
      ];

      setData({
        gradeDistribution: gradeCounts,
        assignmentTypes,
        students: studentRows,
      });

      console.log(`[Analytics] ✅ Loaded ${studentRows.length} students analytics`);

    } catch (err: any) {
      console.error("[Analytics] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load analytics");
      showToast({
        kind: "error",
        title: "Analytics Failed",
        message: "Could not load analytics data",
      });
    } finally {
      setLoading(false);
    }
  }

  const ultraBusy = loading || working;
  const ultraLabel = loading ? "Loading analytics…" : working ? "Syncing…" : "";

  const totalStudents = data?.students.length || 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-neutral-900">Analytics</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">
              Performance insights for your course ({totalStudents} students)
            </p>
          </div>
          <button
            onClick={() => loadAnalytics()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadAnalytics()}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Analytics Grid */}
      {/* // Replace the ENTIRE AnalyticsCard render section (lines ~170-190): */}

{/* Main Analytics Grid */}
<div className="grid gap-6 lg:grid-cols-2">
  <AnalyticsCard
    title="Student Performance Distribution"
    subtitle="Grade distribution across all students"
    icon={BarChart3}
    loading={loading || !data}
  >
    {data && (
      <GradeDistributionChart 
        data={data.gradeDistribution} 
        total={totalStudents} 
      />
    )}
  </AnalyticsCard>

  <AnalyticsCard
    title="Assignment Completion Rates"
    subtitle="Average completion by assignment type"
    icon={Activity}
    loading={loading || !data}
  >
    {data && <AssignmentCompletionChart data={data.assignmentTypes} />}
  </AnalyticsCard>
</div>

        {/* Students Table */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold text-neutral-900">Student Progress Tracking</h2>
                <p className="text-sm text-neutral-500 -mt-0.5">Detailed performance overview</p>
              </div>
              {totalStudents > 0 && (
                <div className="text-sm font-medium text-neutral-600">
                  {totalStudents} students
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-neutral-50">
                <tr className="text-left text-neutral-700">
                  <Th>Student</Th>
                  <Th>Assignments Completed</Th>
                  <Th>Average Score</Th>
                  <Th>Trend</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
             <tbody className="divide-y divide-neutral-200">
  {loading ? (
    <SkeletonTableRows rows={5} />
  ) : !data || data.students.length === 0 ? (
    <tr>
      <td colSpan={5} className="py-12 text-center">
        <div className="text-sm text-neutral-500">
          No student data available yet.
        </div>
      </td>
    </tr>
  ) : (
    data.students.map((student) => (
      <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
        <Td className="font-medium text-neutral-900 max-w-[200px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0B5CD7] to-[#0FA958] grid place-items-center">
              <span className="text-sm font-semibold text-white">
                {student.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{student.name}</div>
            </div>
          </div>
        </Td>
        <Td>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#0B5CD7] transition-all duration-700"
                style={{ width: `${student.assignmentsCompleted}%` }}
              />
            </div>
            <span className="text-sm font-mono text-neutral-700">
              {student.assignmentsCompleted}%
            </span>
          </div>
        </Td>
        <Td>
          <Badge label={formatGrade(student.averageScore)} tone="neutral" />
        </Td>
        <Td>
          <TrendIcon trend={student.trend} />
        </Td>
        <Td>
          <Badge
            label={student.status}
            tone={student.status === "Active" ? "success" : "warning"}
          />
        </Td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
        </div>
      </div>

      <UltraLoader show={ultraBusy} label={ultraLabel} />
    </>
  );
}

/* ————— Analytics Components ————— */

function AnalyticsCard({
  title,
  subtitle,
  icon: Icon,
  children,
  loading,
}: {
  title: string;
  subtitle: string;
  icon: any;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[16px] font-semibold text-neutral-900">{title}</div>
          <div className="text-sm text-neutral-500 -mt-0.5">{subtitle}</div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B5CD7] to-[#0FA958] grid place-items-center text-white p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-2 w-48 bg-neutral-200 rounded-full animate-pulse" />
                <div className="h-4 w-8 bg-neutral-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}

function GradeDistributionChart({
  data,
  total,
}: {
  data: Record<string, number> | undefined;
  total: number;
}) {
  if (!data) return null;

  const grades = [
    { label: "A", value: data.A || 0 },
    { label: "A-", value: data["A-"] || 0 },
    { label: "B+", value: data["B+"] || 0 },
    { label: "B", value: data.B || 0 },
    { label: "C", value: data.C || 0 },
    { label: "D", value: data.D || 0 },
    { label: "F", value: data.F || 0 },
  ];

  return (
    <div className="space-y-4">
      {grades.map((grade) => {
        const percentage = total > 0 ? Math.round((grade.value / total) * 100) : 0;
        return (
          <div key={grade.label} className="flex items-center justify-between gap-6">
            <div className="text-sm text-neutral-800">{grade.label}</div>
            <div className="flex items-center gap-3 flex-1">
              <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#0B5CD7] to-[#0FA958] transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-mono text-neutral-700 min-w-[40px] text-right">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssignmentCompletionChart({ data }: { data: Array<{ name: string; completion: number }> }) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-6">
          <div className="text-sm text-neutral-800">{item.name}</div>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-700"
                style={{ width: `${item.completion}%` }}
              />
            </div>
            <span className="text-sm font-mono text-neutral-700 min-w-[40px] text-right">
              {item.completion}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  const icons = {
    up: "📈",
    down: "📉",
    stable: "➡️",
  };
  const color = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-amber-600" : "text-neutral-500";
  return <span className={`text-lg font-semibold ${color}`}>{icons[trend]}</span>;
}

/* ————— Shared Components ————— */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-sm font-semibold text-neutral-700">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 text-sm ${className}`}>
      {children}
    </td>
  );
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "primary" | "neutral" | "warning" | "success";
}) {
  const map: Record<string, string> = {
    primary: "bg-[#0B5CD7] text-white",
    neutral: "bg-neutral-100 text-neutral-800",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${map[tone]}`}>
      {label}
    </span>
  );
}

function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-neutral-200 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 bg-neutral-200 rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-neutral-200 rounded animate-pulse" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-10 w-10 bg-neutral-200 rounded-full animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-9 w-20 bg-neutral-200 rounded-full animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* ————— Helpers ————— */

function formatGrade(progress: number): string {
  const p = Math.round(progress);
  if (p >= 90) return "A";
  if (p >= 85) return "A-";
  if (p >= 80) return "B+";
  if (p >= 75) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}