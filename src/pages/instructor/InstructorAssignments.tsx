"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Check,
  ChevronDown,
  X,
  SquarePen,
  Trash2,
} from "lucide-react";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { getUser } from '../../lib/storage';

/* ---------------- Types ---------------- */
type Course = { id: string; title: string; instructors?: any[] };
type AssignmentType = "QUIZ" | "PROJECT" | "HOMEWORK" | "CAPSTONE";
type AssignmentStatus = "Active" | "Completed" | "Need Grading" | "Draft";
type Assignment = {
  id: string;
  submissionId?: string;
  title: string;
  description?: string;
  courseId: string;
  courseTitle?: string;
  deadline: string;
  maxScore?: number;
  assignmentType: AssignmentType;
  submissions?: number;
  total?: number;
  status?: AssignmentStatus;
};

/* ---------------- Hook: Debounce ---------------- */
function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const me = getUser();
const instructorId = me?.id ?? null;

/* ---------------- Instructor Assignments Page ---------------- */
export default function InstructorAssignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "graded" | "submitted">("all");
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 250);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Assignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [viewOpen, setViewOpen] = useState<Assignment | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("[Courses] No token found, skipping fetch");
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in to view courses",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("[Courses] Fetching courses...");
    api
      .get("/api/courses/all-courses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        params: { _t: Date.now() },
      })
      .then((res) => {
        console.log("[Courses] Response:", res.data);
        const payload = res.data;
        const list: any[] = Array.isArray(payload?.courses)
          ? payload.courses
          : Array.isArray(payload)
          ? payload
          : [];
        const mapped: Course[] = (list || []).map((c) => ({
          id: String(c.id),
          title: String(c.title),
          instructors: c.instructors || [],
        }));
        setCourses(mapped);
        if (!courseId && mapped.length) {
          console.log("[Courses] Setting courseId to:", mapped[0].id);
          setCourseId(mapped[0].id);
        }
        if (!mapped.length) {
          console.warn("[Courses] No courses found");
          showToast({
            kind: "warning",
            title: "No Courses",
            message: "No courses available to display assignments",
          });
        }
      })
      .catch((err) => {
        console.error("[Courses] Load error:", err);
        showToast({
          kind: "error",
          title: "Failed to load courses",
          message: err?.response?.data?.message || "Please try again",
        });
        setCourses([]);
      })
      .finally(() => {
        console.log("[Courses] Fetch complete");
        setLoading(false);
      });
  }, []);

  /* --- Load assignments when course or tab changes --- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in to view assignments",
      });
      setLoading(false);
      return;
    }

    async function fetchAssignments() {
      try {
        setLoading(true);

        let endpoint = "";
        if (tab === "all" || tab === "active") {
          if (!courseId) {
            console.log("[Assignments] No courseId, skipping fetch");
            setLoading(false);
            return;
          }
          endpoint = `/api/assignments/assignments/${courseId}`;
        } else if (tab === "submitted") {
          endpoint = `/api/assignments/overview/${instructorId}?filter=submitted`;
        } else if (tab === "graded") {
          endpoint = `/api/assignments/overview/${instructorId}?filter=graded`;
        }

        console.log(`[Assignments] Fetching: ${endpoint}`);
        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params: { _t: Date.now() },
        });
        console.log("[Assignments] Response:", res.data);

        const payload = res.data;
        const list: any[] =
          payload?.assignments ??
          payload?.data ??
          (Array.isArray(payload) ? payload : []);

        const mapped: Assignment[] = (list || []).map((a) => ({
          id: String(a.id ?? crypto.randomUUID()),
          submissionId: a.submissionId ? String(a.submissionId) : undefined,
          title: String(a.title ?? "Untitled"),
          description: a.description ?? "",
          courseId: String(a.courseId ?? courseId),
          courseTitle: a.courseTitle || "",
          deadline: String(a.dueDate ?? a.deadline ?? "").slice(0, 10),
          maxScore: a.maxScore ?? a.grade ?? undefined,
          assignmentType: String(a.type ?? a.assignmentType ?? "HOMEWORK").toUpperCase() as AssignmentType,
          submissions: Number(a.submissions ?? 0),
          total: Number(a.total ?? 25),
          status:
            tab === "submitted"
              ? "Need Grading"
              : tab === "graded" || a.status === "GRADED"
              ? "Completed"
              : "Active",
        }));

        setRows(mapped);
      } catch (err: any) {
        console.error("[Assignments] Load error:", err);
        showToast({
          kind: "error",
          title: "Failed to load assignments",
          message: err?.response?.data?.message || "Please try again",
        });
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchAssignments();
  }, [tab, courseId]);

  /* --- Delete Assignment --- */
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in to delete assignments",
      });
      setDeleteId(null);
      return;
    }

    setWorking(true);
    console.log("[Delete] Deleting assignment:", deleteId);
    try {
      const res = await api.delete(`/api/assignments/delete-assignment/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
        params: { _t: Date.now() },
      });
      console.log("[Delete] Response:", res.data);
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
      showToast({
        kind: "success",
        title: "Assignment Deleted",
        message: "The assignment has been successfully deleted.",
      });
      setDeleteId(null);
    } catch (err: any) {
      console.error("[Delete] Error:", err);
      showToast({
        kind: "error",
        title: "Failed to delete assignment",
        message: err?.response?.data?.message || "Please try again",
      });
    } finally {
      setWorking(false);
    }
  }, [deleteId]);

  /* --- Create --- */
  const handleCreate = useCallback(
    async (form: {
      title: string;
      description?: string;
      courseId: string;
      deadline: string;
      maxScore?: number;
      assignmentType: AssignmentType;
    }) => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast({
          kind: "error",
          title: "Authentication Error",
          message: "Please log in to create assignments",
        });
        return;
      }

      setWorking(true);
      console.log("[Create] Creating assignment:", form);
      try {
        const res = await api.post(
          "/api/assignments/create-assignment",
          {
            ...form,
            assignmentType: form.assignmentType.toUpperCase(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
            params: { _t: Date.now() },
          }
        );
        console.log("[Create] Response:", res.data);
        const out = res.data;
        const a = out?.assignment || out?.data || {};
        const courseTitle =
          courses.find((c) => c.id === form.courseId)?.title || "";
        const newRow: Assignment = {
          id: String(a.id ?? crypto.randomUUID()),
          title: a.title ?? form.title,
          description: a.description ?? form.description ?? "",
          courseId: a.courseId ?? form.courseId,
          courseTitle,
          deadline: String(a.deadline ?? form.deadline).slice(0, 10),
          maxScore: a.maxScore ?? form.maxScore,
          assignmentType: String(a.assignmentType ?? form.assignmentType).toUpperCase() as AssignmentType,
          submissions: 0,
          total: 25,
          status: a.status ? (String(a.status) as AssignmentStatus) : "Active",
        };
        setRows((prev) => [newRow, ...prev]);
        showToast({
          kind: "success",
          title: "Assignment Created",
          message: "Your assignment has been successfully created.",
        });
        setCreateOpen(false);
      } catch (err: any) {
        console.error("[Create] Error:", err);
        showToast({
          kind: "error",
          title: "Failed to create assignment",
          message: err?.response?.data?.message || "Please try again",
        });
      } finally {
        setWorking(false);
      }
    },
    [courses]
  );

  /* --- Edit --- */
  const handleEdit = useCallback(
    async (
      id: string,
      form: {
        title: string;
        description?: string;
        courseId: string;
        deadline: string;
        maxScore?: number;
        assignmentType: AssignmentType;
      }
    ) => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast({
          kind: "error",
          title: "Authentication Error",
          message: "Please log in to edit assignments",
        });
        return;
      }

      setWorking(true);
      console.log("[Edit] Editing assignment:", id, form);
      try {
        const res = await api.put(
          `/api/assignments/edit-assignment/${id}`,
          {
            ...form,
            assignmentType: form.assignmentType.toUpperCase(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
            params: { _t: Date.now() },
          }
        );
        console.log("[Edit] Response:", res.data);
        const out = res.data;
        const updated = out?.assignment || out?.data || null;
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  title: updated?.title ?? form.title,
                  description: updated?.description ?? form.description,
                  courseId: updated?.courseId ?? form.courseId,
                  courseTitle: courses.find(
                    (c) => c.id === (updated?.courseId ?? form.courseId)
                  )?.title,
                  deadline: String(updated?.deadline ?? form.deadline).slice(0, 10),
                  maxScore: updated?.maxScore ?? form.maxScore,
                  assignmentType: String(
                    updated?.assignmentType ?? form.assignmentType
                  ).toUpperCase() as AssignmentType,
                  status: updated?.status
                    ? (String(updated.status) as AssignmentStatus)
                    : r.status,
                }
              : r
          )
        );
        showToast({
          kind: "success",
          title: "Assignment Updated",
          message: "Your assignment has been updated successfully.",
        });
        setEditOpen(null);
      } catch (err: any) {
        console.error("[Edit] Error:", err);
        showToast({
          kind: "error",
          title: "Failed to update assignment",
          message: err?.response?.data?.message || "Please try again",
        });
      } finally {
        setWorking(false);
      }
    },
    [courses]
  );

  /* --- Filter logic --- */
  const filtered = useMemo(() => {
    let list = rows;
    if (tab === "active") list = list.filter((r) => r.status === "Active");
    if (tab === "graded") list = list.filter((r) => r.status === "Completed");
    if (tab === "submitted") list = list.filter((r) => r.status === "Need Grading");

    const term = dq.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) =>
      [r.title, r.assignmentType, r.deadline, r.courseTitle].some((v) =>
        v?.toString().toLowerCase().includes(term)
      )
    );
  }, [rows, tab, dq]);

  /* ----------------- Render ----------------- */
  return (
    <>
      <div className="space-y-4 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              Assignment Management
            </h2>
            <p className="text-sm text-neutral-500">
              Create and manage assignments for your courses
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95 disabled:opacity-60"
            disabled={working || !courses.length}
          >
            <Plus className="h-4 w-4" />
            Create Assignment
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-lg">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search assignments..."
                className="h-12 w-full rounded-2xl border border-neutral-200 bg-[#F4F5F7] pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                disabled={working}
              />
            </div>
            <div className="w-full sm:w-80">
              <HeadlessSelect
                value={courseId}
                onChange={setCourseId}
                placeholder={
                  courses.length ? "Filter by course" : "No courses found"
                }
                options={courses.map((c) => ({ value: c.id, label: c.title }))}
                disabled={working || !courses.length}
              />
            </div>
          </div>

          {["all", "active", "graded", "submitted"].map((t) => (
            <TabPill
              key={t}
              active={tab === t}
              onClick={() => setTab(t as any)}
              disabled={working}
            >
              {t === "submitted"
                ? "Submitted"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabPill>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-left text-neutral-700">
                <Th>Assignment</Th>
                <Th>Course</Th>
                <Th>Type</Th>
                <Th>Deadline</Th>
                <Th>Submissions</Th>
                <Th>Status</Th>
                <Th className="text-center">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkRows rows={5} cols={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No assignments found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-b border-neutral-200 last:border-0">
                    <Td>
                      <button
                        className="text-[#0B5CD7] hover:underline"
                        onClick={() => setViewOpen(a)}
                      >
                        {a.title}
                      </button>
                    </Td>
                    <Td>
                      {a.courseTitle ||
                        courses.find((c) => c.id === a.courseId)?.title ||
                        "—"}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {a.assignmentType}
                      </span>
                    </Td>
                    <Td>{a.deadline}</Td>
                    <Td>
                      <span className="text-sm text-neutral-600">
                        {a.submissions ?? 0}/{a.total ?? 25}
                      </span>
                    </Td>
                    <Td>
                      <StatusPill status={a.status ?? "Active"} />
                    </Td>
                    <Td className="text-center">
                      <button
                        className="rounded-md p-2 hover:bg-neutral-100"
                        title="Edit"
                        onClick={() => setEditOpen(a)}
                        disabled={working}
                      >
                        <SquarePen className="h-4 w-4 text-neutral-700" />
                      </button>
                      <button
                        className="rounded-md p-2 hover:bg-neutral-100"
                        title="Delete"
                        onClick={() => setDeleteId(a.id)}
                        disabled={working}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {createOpen && (
        <AssignmentModal
          title="Create Assignment"
          subtext="Create a new assignment for your students"
          initial={{ courseId, assignmentType: "HOMEWORK" }}
          onClose={() => !working && setCreateOpen(false)}
          onSubmit={handleCreate}
          courses={courses}
          working={working}
          submitText="Create Assignment"
        />
      )}
      
      {editOpen && (
        <AssignmentModal
          title="Edit Assignment"
          subtext="Update assignment details"
          initial={editOpen}
          onClose={() => !working && setEditOpen(null)}
          onSubmit={(p: {
            title: string;
            description?: string;
            courseId: string;
            deadline: string;
            maxScore?: number;
            assignmentType: AssignmentType;
          }) => handleEdit(editOpen.id, p)}
          courses={courses}
          working={working}
          submitText="Save Changes"
        />
      )}
      {deleteId && (
        <Modal
          title="Delete Assignment"
          subtext="Are you sure you want to delete this assignment? This action cannot be undone."
          onClose={() => !working && setDeleteId(null)}
        >
          <div className="flex items-center justify-end gap-2">
            <button
              className="inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
              onClick={() => setDeleteId(null)}
              disabled={working}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
              onClick={handleDelete}
              disabled={working}
            >
              {working ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
      {viewOpen && (
        <AssignmentDetailsModal
          assignment={viewOpen}
          onClose={() => setViewOpen(null)}
          onGraded={(updated) => {
            setRows((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            );
          }}
        />
      )}
    </>
  );
}

/* ---------------- UI Helpers ---------------- */
function TabPill({ active, onClick, children, disabled }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: AssignmentStatus }) {
  const cls =
    status === "Active"
      ? "bg-[#0B5CD7] text-white"
      : status === "Completed"
      ? "bg-neutral-100 text-neutral-700"
      : status === "Need Grading"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function Th({ children, className = "" }: any) {
  return <th className={`py-3 text-sm font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: any) {
  return <td className={`py-3 text-sm text-neutral-700 ${className}`}>{children}</td>;
}

function SkRows({ cols, rows }: any) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-neutral-200 last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="py-3">
              <div className="h-4 w-[70%] rounded bg-neutral-200 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ---------------- Modal ---------------- */
function Modal({
  title,
  subtext,
  onClose,
  children,
}: {
  title: string;
  subtext?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [root] = useState(() => {
    const el = document.createElement("div");
    el.setAttribute("data-modal-root", "true");
    return el;
  });

  useEffect(() => {
    document.body.appendChild(root);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
      try {
        document.body.removeChild(root);
      } catch {}
    };
  }, [root, onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed inset-0 z-[10001] grid place-items-center px-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtext && <p className="mt-1 text-sm text-neutral-600">{subtext}</p>}
            </div>
            <button
              className="rounded-md p-2 hover:bg-neutral-100"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>,
    root
  );
}

/* ---------------- Assignment Modal ---------------- */
function AssignmentModal({
  title,
  subtext,
  initial,
  onClose,
  onSubmit,
  courses,
  working,
  submitText,
}: any) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    courseId: initial?.courseId ?? "",
    deadline: (initial?.deadline ?? "").slice(0, 10),
    assignmentType: initial?.assignmentType ?? "HOMEWORK",
    maxScore:
      typeof initial?.maxScore === "number" ? String(initial.maxScore) : "",
  });

  const canSubmit =
    form.title.trim() && form.courseId && form.assignmentType && form.deadline;

  const [root] = useState(() => {
    const el = document.createElement("div");
    el.setAttribute("data-modal-root", "true");
    return el;
  });

  useEffect(() => {
    document.body.appendChild(root);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !working && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
      try {
        document.body.removeChild(root);
      } catch {}
    };
  }, [root, onClose, working]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed inset-0 z-[10001] grid place-items-center px-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtext && (
                <p className="mt-1 text-sm text-neutral-600">{subtext}</p>
              )}
            </div>
            <button
              className="rounded-md p-2 hover:bg-neutral-100"
              onClick={onClose}
              aria-label="Close"
              disabled={working}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) {
                showToast({
                  kind: "error",
                  title: "Missing fields",
                  message: "Please fill all required fields",
                });
                return;
              }
              console.log("[AssignmentModal] Submitting form:", form);
              onSubmit({
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                courseId: form.courseId,
                deadline: form.deadline,
                maxScore:
                  form.maxScore === "" ? undefined : Number(form.maxScore),
                assignmentType: form.assignmentType.toUpperCase(),
              });
            }}
            className="px-6 py-5 space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Title
              </label>
              <input
                className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                disabled={working}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Course
                </label>
                <HeadlessSelect
                  value={form.courseId}
                  onChange={(v: string) =>
                    setForm((p) => ({ ...p, courseId: v }))
                  }
                  placeholder="Select course"
                  options={courses.map((c: Course) => ({
                    value: c.id,
                    label: c.title,
                  }))}
                  disabled={working || !courses.length}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Type
                </label>
                <HeadlessSelect
                  value={form.assignmentType}
                  onChange={(v: string) =>
                    setForm((p) => ({ ...p, assignmentType: v }))
                  }
                  placeholder="Assignment type"
                  options={[
                    { value: "HOMEWORK", label: "Homework" },
                    { value: "PROJECT", label: "Project" },
                    { value: "QUIZ", label: "Quiz" },
                    { value: "CAPSTONE", label: "Capstone" },
                  ]}
                  disabled={working}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Due Date
                </label>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, deadline: e.target.value }))
                  }
                  required
                  disabled={working}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Max Score
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                  value={form.maxScore}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, maxScore: e.target.value }))
                  }
                  disabled={working}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Description
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 py-2 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                disabled={working}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={onClose}
                disabled={working}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || working}
                className="inline-flex items-center rounded-xl bg-[#0B5CD7] px-4 py-2 text-sm text-white hover:brightness-95 disabled:opacity-60"
              >
                {working ? "Saving..." : submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    root
  );
}

function AssignmentDetailsModal({
  assignment,
  onClose,
  onGraded,
}: {
  assignment: Assignment;
  onClose: () => void;
  onGraded: (updated: Assignment) => void;
}) {
  const [working, setWorking] = useState(false);
  const [score, setScore] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [root] = useState(() => {
    const el = document.createElement("div");
    el.setAttribute("data-modal-root", "true");
    return el;
  });

  useEffect(() => {
    document.body.appendChild(root);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
      try { document.body.removeChild(root); } catch {}
    };
  }, [root, onClose]);

  async function handleGradeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === "" || !feedback.trim()) {
      showToast({
        kind: "error",
        title: "Missing Fields",
        message: "Please enter both score and feedback",
      });
      return;
    }
    if (!assignment.submissionId) {
      showToast({
        kind: "error",
        title: "Invalid Submission",
        message: "No submission ID available for grading",
      });
      return;
    }

    try {
      setWorking(true);
      const token = localStorage.getItem("token");
      console.log("[Grade] Submitting grade:", {
        submissionId: assignment.submissionId,
        score,
        feedback,
        token: token?.slice(0, 10) + "...",
      });
      const res = await api.post(
        `/api/submit/grade/${assignment.submissionId}`,
        { score: Number(score), feedback },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[Grade] Response:", res.data);
      showToast({
        kind: "success",
        title: "Graded Successfully",
        message: res.data?.message || "Assignment graded successfully",
      });

      onGraded({
        ...assignment,
        status: "Completed",
      });
      onClose();
    } catch (err: any) {
      console.error("[Grade] Error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      showToast({
        kind: "error",
        title: "Grade Failed",
        message: err?.response?.data?.message || "Please try again",
      });
    } finally {
      setWorking(false);
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed inset-0 z-[10001] grid place-items-center px-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold">{assignment.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                {assignment.courseTitle} • {assignment.assignmentType}
              </p>
            </div>
            <button
              className="rounded-md p-2 hover:bg-neutral-100"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-3 text-sm text-neutral-800">
            <p><strong>Description:</strong> {assignment.description || "No description provided."}</p>
            <p><strong>Deadline:</strong> {assignment.deadline}</p>
            <p><strong>Max Score:</strong> {assignment.maxScore ?? "—"}</p>
            <p><strong>Status:</strong> {assignment.status}</p>
            {assignment.submissionId && (
              <p><strong>Submission ID:</strong> {assignment.submissionId}</p>
            )}
          </div>

          {assignment.status === "Need Grading" && (
            <form onSubmit={handleGradeSubmit} className="px-6 pb-6 space-y-4 border-t border-neutral-200 pt-4">
              <h4 className="text-base font-medium text-neutral-900">Grade Assignment</h4>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Score
                </label>
                <input
                  type="number"
                  className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value) || "")}
                  placeholder="e.g. 85"
                  disabled={working}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-700">
                  Feedback
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback"
                  disabled={working}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                  disabled={working}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={working}
                  className="inline-flex items-center rounded-xl bg-[#0B5CD7] px-4 py-2 text-sm text-white hover:brightness-95"
                >
                  {working ? "Submitting…" : "Submit Grade"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>,
    root
  );
}

/* ---------------- Headless Select ---------------- */
function HeadlessSelect({ value, onChange, placeholder, options, disabled }: any) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        className={`h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 pr-10 text-left text-sm text-neutral-900 focus:border-[#0B5CD7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]/20 ${
          disabled ? "opacity-60 pointer-events-none" : ""
        }`}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        {selected ? (
          selected.label
        ) : (
          <span className="text-neutral-400">
            {placeholder || "Select..."}
          </span>
        )}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <ul role="listbox" className="max-h-60 overflow-auto py-1">
            {options.map((opt: any) => {
              const isSel = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-[#0B5CD7] hover:text-white"
                >
                  <span>{opt.label}</span>
                  {isSel && <Check className="h-4 w-4 opacity-90" />}
                </li>
              );
            })}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-neutral-500">
                No options
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}