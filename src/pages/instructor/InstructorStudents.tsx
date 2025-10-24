"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { UltraLoader } from "./_shared/UltraLoader";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { RefreshCw, Eye, X } from "lucide-react";
import { createPortal } from "react-dom";

type Course = { id: string; title: string };
type UserCourse = { id: string; title: string; UserCourse: { progress: number; completionStatus: string } };
type UserBatch = { id: string; name: string };
type User = {
  expertise: ReactNode;
  id: string;
  fullName: string;
  email: string;
  role: { name: string };
  courses: UserCourse[];
  batches: UserBatch[];
};

type Row = {
  id: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  grade: string;
  lastActivity: string;
  status: "Active" | "Behind" | "Inactive";
  batch: string;
  fullUser: User; // Store full user data for modal
};

export default function InstructorStudents() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructorCourseId, setInstructorCourseId] = useState<string>("");
  const [instructorBatches, setInstructorBatches] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Row | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const token = localStorage.getItem("token") || localStorage.getItem("lms_token");

  useEffect(() => {
    void loadStudents();
  }, []);

  async function loadStudents() {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);

      if (!token) throw new Error("Authentication required");

      // 1. Load INSTRUCTOR'S COURSES
      console.log("[Students] Loading instructor courses...");
      const coursesRes = await api.get("/api/courses/all-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesList: Course[] = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      
      if (coursesList.length === 0) {
        throw new Error("No courses assigned to you");
      }

      const mainCourseId = coursesList[0].id;
      setInstructorCourseId(mainCourseId);
      setCourses(coursesList);
      console.log(`[Students] Instructor course ID: ${mainCourseId} (${coursesList[0].title})`);

      // 2. Load ALL batches
      console.log("[Students] Loading batches...");
      const batchesRes = await api.get("/api/admin/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const batchesList: any[] = Array.isArray(batchesRes.data)
        ? batchesRes.data
        : batchesRes.data?.batches || [];
      const allBatchIds = batchesList.map((b) => b.id);
      setInstructorBatches(allBatchIds);
      console.log(`[Students] Loaded ${allBatchIds.length} batches`);

      // 3. Load all users & APPLY STRICT FILTERING
      console.log("[Students] Loading users...");
      const usersRes = await api.get("/api/user/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users: User[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];

      const studentRows: Row[] = users
        .filter((user) => user.role.name === "student")
        .filter((user) =>
          user.courses.some((uc) => uc.id === mainCourseId)
        )
        .filter((user) => user.batches.length > 0)
        .flatMap((user) =>
          user.courses
            .filter((uc) => uc.id === mainCourseId)
            .map((uc) => {
              const batchName = user.batches[0]?.name || "—";
              return {
                id: `${user.id}-${uc.id}`,
                name: user.fullName,
                email: user.email,
                course: uc.title,
                progress: uc.UserCourse.progress || 0,
                grade: formatGrade(uc.UserCourse.progress || 0),
                lastActivity: formatDate(
                  new Date(uc.UserCourse.progress > 0 ? Date.now() : Date.now() - 86400000 * 7)
                ),
                status: getStatus(uc.UserCourse.progress || 0, uc.UserCourse.completionStatus),
                batch: batchName,
                fullUser: user, // Store full user data
              };
            })
        )
        .sort((a, b) => b.progress - a.progress);

      setRows(studentRows);
      console.log(`[Students] ✅ STRICT FILTER: ${studentRows.length} students in YOUR course`);

    } catch (err: any) {
      console.error("[LoadStudents] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load students");
      showToast({
        kind: "error",
        title: "Load Failed",
        message: "Could not load students",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleViewStudent(student: Row) {
    setSelectedStudent(student);
    setModalOpen(true);
  }

  const ultraBusy = loading || working;
  const ultraLabel = loading ? "Loading students…" : working ? "Syncing…" : "";

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-neutral-900">My Students</h1>
            <p className="text-sm text-neutral-500 -mt-0.5">
              Students in your course ({rows.length})
            </p>
          </div>
          <button
            onClick={() => loadStudents()}
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
              onClick={() => loadStudents()}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-neutral-50">
                <tr className="text-left text-neutral-700">
                  <Th>Student</Th>
                  <Th>Course</Th>
                  <Th>Progress</Th>
                  <Th>Grade</Th>
                  <Th>Batch</Th>
                  <Th>Last Activity</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading ? (
                  <SkeletonRows rows={5} cols={8} />
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="text-sm text-neutral-500">
                        No students enrolled in your course yet.
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
                      <Td className="font-medium text-neutral-900 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0B5CD7] to-[#0FA958] grid place-items-center">
                            <span className="text-sm font-semibold text-white">
                              {r.name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{r.name}</div>
                            <div className="text-xs text-neutral-500 truncate">{r.email}</div>
                          </div>
                        </div>
                      </Td>
                      <Td className="max-w-[180px]">
                        <div className="font-medium text-neutral-900 truncate">{r.course}</div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-[#0B5CD7] transition-all duration-700"
                              style={{ width: `${r.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono text-neutral-700">{r.progress}%</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge label={r.grade} tone="neutral" />
                      </Td>
                      <Td>
                        <Badge label={r.batch} tone="primary" size="sm" />
                      </Td>
                      <Td className="text-sm text-neutral-600">{r.lastActivity}</Td>
                      <Td>
                        <Badge
                          label={r.status}
                          tone={r.status === "Active" ? "success" : r.status === "Behind" ? "warning" : "neutral"}
                        />
                      </Td>
                      <Td className="text-center">
                        <button
                          onClick={() => handleViewStudent(r)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-[#0B5CD7] transition-all duration-200"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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

      {/* Student Details Modal */}
      {modalOpen && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => {
            setModalOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}

/* ————— Student Details Modal ————— */
function StudentDetailsModal({ student, onClose }: { student: Row; onClose: () => void }) {
  const user = student.fullUser;
  
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10001] grid place-items-center p-4">
        <div
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-neutral-200 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0B5CD7] to-[#0FA958] grid place-items-center">
                <span className="text-lg font-semibold text-white">
                  {student.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">{student.name}</h2>
                <p className="text-sm text-neutral-500">{student.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Progress Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-600">Course Progress</span>
                  <Badge label={student.grade} tone="neutral" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-2 w-full max-w-xs rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#0B5CD7] transition-all duration-700"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                  <span className="text-2xl font-semibold text-neutral-900">{student.progress}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-600">Status</span>
                </div>
                <Badge
                  label={student.status}
                  tone={student.status === "Active" ? "success" : student.status === "Behind" ? "warning" : "neutral"}
                  size="md"
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Course</span>
                  </div>
                  <p className="font-semibold text-neutral-900">{student.course}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Batch</span>
                  </div>
                  <Badge label={student.batch} tone="primary" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-600">Last Activity</span>
                  </div>
                  <p className="text-sm text-neutral-700">{student.lastActivity}</p>
                </div>
                {user.expertise && (
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-600">Expertise</span>
                    </div>
                    <p className="text-sm text-neutral-700">{user.expertise}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {user.batches.length > 1 && (
              <div className="rounded-xl border border-neutral-200 p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">All Batches</h3>
                <div className="flex flex-wrap gap-2">
                  {user.batches.map((batch) => (
                    <Badge key={batch.id} label={batch.name} tone="primary" size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ————— Enhanced Components ————— */
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
  size = "md",
}: {
  label: string;
  tone?: "primary" | "neutral" | "warning" | "success";
  size?: "sm" | "md";
}) {
  const base = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const map: Record<string, string> = {
    primary: "bg-[#0B5CD7] text-white",
    neutral: "bg-neutral-100 text-neutral-800",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${base} ${map[tone]}`}>
      {label}
    </span>
  );
}

function SkeletonRows({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="hover:bg-neutral-50/30">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-6 py-4">
              {c === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
                  </div>
                </div>
              ) : c === 2 ? (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-4 w-8 bg-neutral-200 rounded animate-pulse" />
                </div>
              ) : (
                <div className="h-4 w-[70%] bg-neutral-200 rounded animate-pulse" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ————— Helpers ————— */
function formatGrade(progress: number): string {
  const p = Math.round(progress);
  if (p >= 90) return "A";
  if (p >= 80) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}

function getStatus(progress: number, completionStatus: string): "Active" | "Behind" | "Inactive" {
  if (completionStatus === "COMPLETED") return "Active";
  if (progress >= 50) return "Active";
  if (progress > 0) return "Behind";
  return "Inactive";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}