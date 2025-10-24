"use client";
import * as React from "react";
import { Download, Upload, Calendar, FileText, Eye, X } from "lucide-react";
import { UltraLoader } from "../instructor/_shared/UltraLoader";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { useNavigate } from "react-router-dom";

type Assignment = {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  grade: number | null;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  description?: string; // Optional description field
};

export default function StudentAssignments() {
  const [tab, setTab] = React.useState<"Pending" | "Submitted" | "Graded" | "All">("Pending");
  const [loading, setLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [submissionLinks, setSubmissionLinks] = React.useState<Record<string, string>>({});
  const [fetchedTabs, setFetchedTabs] = React.useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // 🔥 Get studentId from authUser or localStorage
  const getUser = React.useCallback(() => {
    const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let localStorageUser = null;
    try {
      localStorageUser = userJson ? JSON.parse(userJson) : null;
    } catch (err) {
      console.error("[StudentAssignments] ❌ Failed to parse userJson:", err, "Raw:", userJson);
    }
    const user = authUser || localStorageUser;
    console.log("[StudentAssignments] getUser:", {
      userJson,
      localStorageUser,
      authUser,
      finalUser: user,
      studentId: user?.id,
      fullUser: JSON.stringify(user, null, 2),
    });
    return user;
  }, [authUser]);

  // 🔥 Hydrate user
  React.useEffect(() => {
    const user = getUser();
    if (!user?.id) {
      console.log("[StudentAssignments] ❌ No studentId, redirecting to login");
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in to view assignments.",
      });
      setError("Please log in to view assignments.");
      setTimeout(() => navigate("/login"), 2000);
    }
    setLoading(false);
  }, [getUser, navigate]);

  const user = getUser();
  const studentId = user?.id;

  // 🔥 Fetch assignments
  const fetchAssignments = React.useCallback(async () => {
    if (isFetching || !studentId || fetchedTabs.has(tab)) {
      console.log("[StudentAssignments] ⏹️ Skipped: fetching, no studentId, or tab already fetched", {
        isFetching,
        studentId,
        tab,
        hasAssignments: assignments.length > 0,
      });
      return;
    }

    const token = localStorage.getItem("lms_token") || localStorage.getItem("token");
    if (!token) {
      console.log("[StudentAssignments] ❌ No token, redirecting to login");
      showToast({
        kind: "error",
        title: "Session Expired",
        message: "Please log in again.",
      });
      setError("Session expired. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const filter = tab.toLowerCase();
    const url = `/api/assignments/overview/${studentId}?filter=${filter}`;
    try {
      setIsFetching(true);
      setError(null);
      console.log("[StudentAssignments] 🔄 Fetching assignments:", url, { token: token.slice(0, 10) + "..." });
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[StudentAssignments] ✅ Success:", res.data);
      setAssignments(Array.isArray(res.data.assignments) ? res.data.assignments : []);
      setFetchedTabs((prev) => new Set(prev).add(tab));
    } catch (err: any) {
      console.error("[StudentAssignments] ❌ Error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status === 401) {
        setError("Session expired. Redirecting to login...");
        showToast({
          kind: "error",
          title: "Session Expired",
          message: "Please log in again.",
        });
        setTimeout(() => {
          localStorage.removeItem("lms_token");
          localStorage.removeItem("user");
          navigate("/login");
        }, 2000);
      } else if (err.response?.status === 404) {
        setAssignments([]);
        setFetchedTabs((prev) => new Set(prev).add(tab));
        setError("No assignments found for this filter.");
        showToast({
          kind: "info",
          title: "No Assignments",
          message: "No assignments found for this filter.",
        });
      } else {
        setError(err?.response?.data?.message || "Failed to load assignments");
        showToast({
          kind: "error",
          title: "Load Failed",
          message: err?.response?.data?.message || "Please try again.",
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [studentId, tab, isFetching, fetchedTabs, navigate]);

  // 🔥 Download assignment
  const downloadAssignment = (assignment: Assignment) => {
    try {
      setIsDownloading(true);
      console.log("[StudentAssignments] 🔄 Generating download for assignment:", { assignmentId: assignment.id });
      
      // Generate file content with assignment details
      const content = `
Assignment Details
=================
ID: ${assignment.id}
Title: ${assignment.title}
Type: ${assignment.type}
Due Date: ${formatDate(assignment.dueDate)}
Status: ${assignment.status}
${assignment.grade !== null ? `Grade: ${assignment.grade}` : ""}
${assignment.description ? `Description: ${assignment.description}` : ""}
      `.trim();
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `assignment-${assignment.id}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log("[StudentAssignments] ✅ Download success:", { assignmentId: assignment.id });
      showToast({
        kind: "success",
        title: "Download Started",
        message: `Downloaded assignment ${assignment.title}.`,
      });
    } catch (err: any) {
      console.error("[StudentAssignments] ❌ Download error:", {
        message: err.message,
        assignmentId: assignment.id,
      });
      const errorMessage = "Failed to generate assignment download. Please try again.";
      setError(errorMessage);
      showToast({
        kind: "error",
        title: "Download Failed",
        message: errorMessage,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 🔥 Submit assignment
  const submitAssignment = async (assignmentId: string) => {
    const link = submissionLinks[assignmentId] || "";
    if (!link) {
      showToast({
        kind: "error",
        title: "Submission Error",
        message: "Please provide a submission link.",
      });
      return;
    }

    const token = localStorage.getItem("lms_token") || localStorage.getItem("token");
    if (!token) {
      console.log("[StudentAssignments] ❌ No token, redirecting to login");
      showToast({
        kind: "error",
        title: "Session Expired",
        message: "Please log in again.",
      });
      setError("Session expired. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("[StudentAssignments] 🔄 Submitting assignment:", {
        assignmentId,
        submissionLink: link,
        studentId,
        token: token.slice(0, 10) + "...",
      });
      const res = await api.post(`/api/submit/submit-assignment/${assignmentId}`, { submissionLink: link }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[StudentAssignments] ✅ Submission success:", res.data);
      showToast({
        kind: "success",
        title: "Assignment Submitted",
        message: "Your assignment was submitted successfully!",
      });
      setSubmissionLinks((prev) => ({ ...prev, [assignmentId]: "" }));
      setFetchedTabs(new Set());
      setAssignments([]);
      fetchAssignments();
    } catch (err: any) {
      console.error("[StudentAssignments] ❌ Submission error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        assignmentId,
        submissionLink: link,
        studentId,
        token: token.slice(0, 10) + "...",
      });
      const errorMessage = err?.response?.data?.message || "Failed to submit assignment. Please verify the assignment ID or contact support.";
      setError(errorMessage);
      showToast({
        kind: "error",
        title: "Submission Failed",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 Initial load and tab change
  React.useEffect(() => {
    if (studentId && !isFetching) {
      fetchAssignments();
    }
  }, [studentId, tab, fetchAssignments]);

  // 🔥 Filter assignments
  const visible = tab === "All" ? assignments : assignments.filter((a) => a.status === tab.toUpperCase());

  return (
    <>
      <div className="space-y-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Assignments & Projects</h2>
          <p className="text-sm text-neutral-500">Track your assignments and project deadlines</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(["Pending", "Submitted", "Graded", "All"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setAssignments([]);
                setFetchedTabs((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(t);
                  return newSet;
                });
              }}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                tab === t ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setAssignments([]);
                setFetchedTabs((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(tab);
                  return newSet;
                });
                fetchAssignments();
              }}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {visible.length === 0 && !isFetching ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <p className="text-sm text-neutral-500">No assignments yet</p>
              <p className="text-xs text-neutral-400 mt-1">Check back later for new assignments</p>
            </div>
          ) : (
            visible.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 flex flex-col gap-4"
              >
                <header className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div>
                    <div className="text-base sm:text-[16px] font-semibold text-neutral-900">{a.title}</div>
                    <div className="text-sm text-neutral-600">{a.type}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-700">
                      <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                        {a.type}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Due: {formatDate(a.dueDate)}
                      </span>
                      {a.grade !== null && (
                        <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                          Grade: {a.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                      a.status === "PENDING"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : a.status === "SUBMITTED"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-green-200 bg-green-50 text-green-700",
                    ].join(" ")}
                  >
                    {a.status}
                  </span>
                </header>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedAssignment(a)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
                  >
                    <Eye className="h-4 w-4" /> View
                  </button>
                  <button
                    onClick={() => downloadAssignment(a)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 disabled:bg-gray-400"
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                  {a.status === "PENDING" && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Submission link (e.g., GitHub)"
                        value={submissionLinks[a.id] || ""}
                        onChange={(e) =>
                          setSubmissionLinks((prev) => ({ ...prev, [a.id]: e.target.value }))
                        }
                        className="w-full sm:w-64 rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5CD7]"
                      />
                      <button
                        onClick={() => submitAssignment(a.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5CD7] px-3 py-2 text-sm text-white hover:brightness-95 disabled:bg-gray-400"
                        disabled={isSubmitting}
                      >
                        <Upload className="h-4 w-4" /> Submit
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Modal for Assignment Details */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-neutral-900">{selectedAssignment.title}</h3>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-neutral-700">
              <p><strong>ID:</strong> {selectedAssignment.id}</p>
              <p><strong>Type:</strong> {selectedAssignment.type}</p>
              <p><strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}</p>
              <p><strong>Status:</strong> {selectedAssignment.status}</p>
              {selectedAssignment.grade !== null && (
                <p><strong>Grade:</strong> {selectedAssignment.grade}</p>
              )}
              {selectedAssignment.description ? (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 text-neutral-600">{selectedAssignment.description}</p>
                </div>
              ) : (
                <p><strong>Description:</strong> No description available</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="inline-flex items-center justify-center rounded-xl bg-[#0B5CD7] px-4 py-2 text-sm text-white hover:brightness-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <UltraLoader show={loading || isFetching || isSubmitting || isDownloading} label={isSubmitting ? "Submitting…" : isDownloading ? "Downloading…" : "Loading assignments…"} />
    </>
  );
}

/* ----------------- Utils ----------------- */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
