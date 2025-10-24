"use client";
import * as React from "react";
import { FileText } from "lucide-react";
import { UltraLoader } from "../instructor/_shared/UltraLoader";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { useNavigate } from "react-router-dom";

type Announcement = {
  id: string;
  title: string;
  message: string;
  course: string;
  batch: string;
  postedBy: string;
  postedAt: string;
};

export default function StudentAnnouncements() {
  const [loading, setLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [fetched, setFetched] = React.useState(false); // Prevent re-fetch
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // 🔥 Get studentId from authUser or localStorage
  const getUser = React.useCallback(() => {
    const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    let localStorageUser = null;
    try {
      localStorageUser = userJson ? JSON.parse(userJson) : null;
    } catch (err) {
      console.error("[StudentAnnouncements] ❌ Failed to parse userJson:", err, "Raw:", userJson);
    }
    const user = authUser || localStorageUser;
    console.log("[StudentAnnouncements] getUser:", {
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
      console.log("[StudentAnnouncements] ❌ No studentId, redirecting to login");
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in to view announcements.",
      });
      setError("Please log in to view announcements.");
      setTimeout(() => navigate("/login"), 2000);
    }
    setLoading(false);
  }, [getUser, navigate]);

  const user = getUser();
  const studentId = user?.id;

  // 🔥 Fetch announcements
  const fetchAnnouncements = React.useCallback(async () => {
    if (isFetching || !studentId || fetched) {
      console.log("[StudentAnnouncements] ⏹️ Skipped: fetching, no studentId, or already fetched", {
        isFetching,
        studentId,
        fetched,
      });
      return;
    }

    const token = localStorage.getItem("lms_token") || localStorage.getItem("token");
    if (!token) {
      console.log("[StudentAnnouncements] ❌ No token, redirecting to login");
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
      setIsFetching(true);
      setError(null);
      console.log("[StudentAnnouncements] 🔄 Fetching announcements:", {
        url: "/api/announcement/get-announcement",
        studentId,
        token: token.slice(0, 10) + "...",
      });
      const res = await api.get("/api/announcement/get-announcement", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[StudentAnnouncements] ✅ Success:", res.data);
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
      setFetched(true); // Mark as fetched
    } catch (err: any) {
      console.error("[StudentAnnouncements] ❌ Error:", {
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
        setAnnouncements([]);
        setFetched(true); // Mark as fetched even on 404
        setError("No announcements found.");
        showToast({
          kind: "info",
          title: "No Announcements",
          message: "No announcements available at this time.",
        });
      } else {
        setError(err?.response?.data?.message || "Failed to load announcements");
        showToast({
          kind: "error",
          title: "Load Failed",
          message: err?.response?.data?.message || "Please try again.",
        });
      }
    } finally {
      setIsFetching(false);
    }
  }, [studentId, isFetching, fetched, navigate]);

  // 🔥 Initial fetch
  React.useEffect(() => {
    if (studentId && !isFetching && !fetched) {
      fetchAnnouncements();
    }
  }, [studentId, isFetching, fetched, fetchAnnouncements]);

  // 🔥 Reset fetched state on studentId change
  React.useEffect(() => {
    setFetched(false);
    setAnnouncements([]);
  }, [studentId]);

  return (
    <>
      <div className="space-y-4 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl sm:text-[22px] font-semibold text-neutral-900">Announcements</h2>
          <p className="text-sm text-neutral-500">Latest updates from your instructors</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setAnnouncements([]);
                setFetched(false); // Allow retry
                fetchAnnouncements();
              }}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {announcements.length === 0 && !isFetching ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
              <p className="text-sm text-neutral-500">No announcements yet</p>
              <p className="text-xs text-neutral-400 mt-1">Check back later for new updates</p>
            </div>
          ) : (
            announcements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <header className="flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-neutral-900">{a.title}</h3>
                  <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                    {a.course}
                  </span>
                </header>
                <p className="mt-1 text-sm text-neutral-500">From {a.postedBy} - {a.postedAt}</p>
                <p className="mt-3 text-sm text-neutral-700 whitespace-pre-wrap">{a.message}</p>
              </article>
            ))
          )}
        </div>
      </div>

      <UltraLoader show={loading || isFetching} label="Loading announcements…" />
    </>
  );
}