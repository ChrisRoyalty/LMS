"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Edit2 } from "lucide-react";
import { UltraLoader } from "./_shared/UltraLoader";
import { api } from "../../lib/api";
import { showToast } from "../../lib/toast";
import { getUser } from "../../lib/storage";
import { AxiosResponse } from "axios";

type Course = { id: string; title: string };
type Batch = { id: string; name: string };
type Announcement = {
  id: string;
  title: string;
  message: string;
  course: string;
  batch: string;
  postedBy: string;
  postedAt: string;
};

/* ---------------- Helper: Portal Root ---------------- */
function getOrCreatePortalRoot(id = "announcement-modal-root") {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

/* ---------------- Main Component ---------------- */
export default function InstructorAnnouncements() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const me = getUser();
  const token =
    localStorage.getItem("token") || localStorage.getItem("lms_token");

  /* ---------------- Load Everything ---------------- */
  useEffect(() => {
    void loadEverything();
  }, []);

  async function loadEverything() {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error("Authentication required");
      }

      // STEP 1: Load courses FIRST (needed for filtering)
      console.log("[Announcements] Loading courses...");
      const coursesRes = await api.get("/api/courses/all-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesList: Course[] = Array.isArray(coursesRes.data)
        ? coursesRes.data
        : coursesRes.data?.courses || [];
      setCourses(coursesList);
      console.log(`[Announcements] Loaded ${coursesList.length} courses`);

      // STEP 2: Load announcements & FILTER using courses
      console.log("[Announcements] Loading announcements...");
      const announcementsRes = await api.get("/api/announcement/get-announcement", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allAnnouncements: Announcement[] = Array.isArray(announcementsRes.data)
        ? announcementsRes.data
        : [];
      
      const myAnnouncements = allAnnouncements.filter((announcement) =>
        coursesList.some((course) => course.title === announcement.course)
      );
      
      setAnnouncements(myAnnouncements);
      console.log(`[Announcements] Loaded ${allAnnouncements.length} total, ${myAnnouncements.length} for this instructor`);

      // STEP 3: Load batches (only for CREATE/EDIT form)
      console.log("[Announcements] Loading batches...");
      const batchesRes = await api.get("/api/admin/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const batchesList: Batch[] = Array.isArray(batchesRes.data)
        ? batchesRes.data
        : batchesRes.data?.batches || [];
      setBatches(batchesList);
      console.log(`[Announcements] Loaded ${batchesList.length} batches`);

    } catch (err: any) {
      console.error("[LoadEverything] Error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load announcements");
      showToast({
        kind: "error",
        title: "Load Failed",
        message: "Could not load announcements",
      });
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- Handle Edit Click ---------------- */
  function handleEdit(announcement: Announcement) {
    // Find courseId and batchId from dropdown options
    const course = courses.find(c => c.title === announcement.course);
    const batch = batches.find(b => b.name === announcement.batch);
    
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setCourseId(course?.id || "");
    setBatchId(batch?.id || "");
    setOpen(true);
  }

  /* ---------------- Create/Update Announcement ---------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast({
        kind: "error",
        title: "Missing Fields",
        message: "Please enter both title and message",
      });
      return;
    }

    if (!courseId || !batchId) {
      showToast({
        kind: "error",
        title: "Missing Info",
        message: "Please select both a course and batch",
      });
      return;
    }

    if (!token) {
      showToast({
        kind: "error",
        title: "Authentication Error",
        message: "Please log in",
      });
      return;
    }

    try {
      setWorking(true);

      let res: AxiosResponse<any, any, {}>;
      if (editingId) {
        // UPDATE
        res = await api.put(
          `/api/announcement/update-announcement/${editingId}`,
          { title, message, courseId, batchId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update existing announcement
        setAnnouncements(prev =>
          prev.map(a =>
            a.id === editingId
              ? {
                  ...a,
                  title: res.data?.announcement.title,
                  message: res.data?.announcement.message,
                  postedAt: "Just now",
                }
              : a
          )
        );

        showToast({
          kind: "success",
          title: "Updated",
          message: "Announcement has been updated",
        });
      } else {
        // CREATE
        res = await api.post(
          "/api/announcement/announcement",
          { title, message, courseId, batchId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newAnnouncement: Announcement = {
          id: res.data?.announcement.id,
          title: res.data?.announcement.title,
          message: res.data?.announcement.message,
          course: courses.find(c => c.id === courseId)?.title || "",
          batch: batches.find(b => b.id === batchId)?.name || "",
          postedBy: me?.name || "You",
          postedAt: "Just now",
        };

        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        showToast({
          kind: "success",
          title: "Announcement Posted",
          message: "Your announcement has been posted.",
        });
      }

      // Reset form & close modal
      setOpen(false);
      setEditingId(null);
      setTitle("");
      setMessage("");
      setCourseId("");
      setBatchId("");
    } catch (err: any) {
      console.error("[Submit Error]", err);
      showToast({
        kind: "error",
        title: editingId ? "Update Failed" : "Create Failed",
        message: err?.response?.data?.message || "Please try again",
      });
    } finally {
      setWorking(false);
    }
  }

  const ultraBusy = loading || working;
  const ultraLabel = loading 
    ? "Loading announcements…" 
    : working 
    ? (editingId ? "Updating…" : "Posting…") 
    : "";

  /* ---------------- UI ---------------- */
  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[22px] font-semibold text-neutral-900">
              Announcements
            </div>
            <div className="text-sm text-neutral-500 -mt-0.5">
              Post announcements and feedback for your students
            </div>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setTitle("");
              setMessage("");
              setCourseId("");
              setBatchId("");
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95 disabled:opacity-60"
            disabled={working}
          >
            <span className="text-lg leading-none">+</span> New Announcement
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={() => loadEverything()}
              className="ml-4 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-neutral-100 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-500">
              No announcements yet.
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="text-[16px] font-semibold text-neutral-900">
                    {a.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-800">
                      {a.batch}
                    </span>
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
                      title="Edit"
                      disabled={working}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {/* 🗑️ DELETE HIDDEN - endpoint not ready */}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-neutral-500">
                    {a.postedBy}
                  </span>
                  <span className="text-sm text-neutral-500">{a.postedAt}</span>
                </div>
                <p className="mt-3 text-neutral-800">{a.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* UltraLoader */}
      <UltraLoader show={ultraBusy} label={ultraLabel} />

      {/* Modal */}
      {open && (
        <AnnouncementModal
          onClose={() => {
            if (!working) {
              setOpen(false);
              setEditingId(null);
              setTitle("");
              setMessage("");
              setCourseId("");
              setBatchId("");
            }
          }}
          title={title}
          message={message}
          setTitle={setTitle}
          setMessage={setMessage}
          working={working}
          onSubmit={handleSubmit}
          courses={courses}
          courseId={courseId}
          setCourseId={setCourseId}
          batches={batches}
          batchId={batchId}
          setBatchId={setBatchId}
          isEditing={!!editingId}
          mode={editingId ? "Edit Announcement" : "Create Announcement"}
        />
      )}
    </>
  );
}

/* ---------------- Modal ---------------- */
function AnnouncementModal({
  onClose,
  title,
  message,
  setTitle,
  setMessage,
  working,
  onSubmit,
  courses,
  courseId,
  setCourseId,
  batches,
  batchId,
  setBatchId,
  isEditing,
  mode,
}: any) {
  const root = useMemo(() => getOrCreatePortalRoot(), []);

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
        className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
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
              <h3 className="text-lg font-semibold">{mode}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                {isEditing 
                  ? "Update your announcement for students" 
                  : "Post a new announcement for your students"
                }
              </p>
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

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={working}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 py-2 text-sm focus:border-[#0B5CD7] focus:bg-white focus:ring-2 focus:ring-[#0B5CD7]/20 outline-none resize-y"
                placeholder="Your announcement message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={working}
              />
            </div>

            {/* Course Dropdown */}
            <Dropdown
              label="Course"
              value={courseId}
              onChange={setCourseId}
              options={courses.map((c: Course) => ({ value: c.id, label: c.title }))}
              placeholder="Select course"
              disabled={working || !courses.length}
            />

            {/* Batch Dropdown */}
            <Dropdown
              label="Batch"
              value={batchId}
              onChange={setBatchId}
              options={batches.map((b: Batch) => ({ value: b.id, label: b.name }))}
              placeholder="Select batch"
              disabled={working || !batches.length}
            />

            {/* Buttons */}
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
                className="inline-flex items-center rounded-xl bg-[#0B5CD7] px-4 py-2 text-sm text-white hover:brightness-95 disabled:opacity-60"
                disabled={working}
              >
                {working ? (isEditing ? "Updating…" : "Posting…") : isEditing ? "Update Announcement" : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    root
  );
}

/* ---------------- Dropdown ---------------- */
function Dropdown({ label, value, onChange, options, placeholder, disabled }: any) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          className={`h-11 w-full rounded-xl border border-neutral-200 bg-[#F4F5F7] px-3 pr-10 text-left text-sm ${
            disabled ? "opacity-60 pointer-events-none" : ""
          }`}
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
        >
          {selected ? selected.label : (
            <span className="text-neutral-400">{placeholder}</span>
          )}
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            <ul className="max-h-60 overflow-auto py-1">
              {options.map((opt: any) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-[#0B5CD7] hover:text-white"
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="h-4 w-4" />}
                </li>
              ))}
              {!options.length && (
                <li className="px-3 py-2 text-sm text-neutral-500">
                  No options found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}