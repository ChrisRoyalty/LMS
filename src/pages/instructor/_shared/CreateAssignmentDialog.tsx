// import { useEffect, useState, type ReactNode } from "react";
// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { toast } from "sonner";

// import {
//   Dialog,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogClose,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// export type CreatedAssignmentPayload = {
//   assignment?: any;
//   title: string;
//   courseId: string;
//   courseTitle: string;
//   type: "Assignment" | "Project" | "Quiz" | "Capstone";
//   dueDate: string; // YYYY-MM-DD
//   totalSubmissions?: number;
// };

// const schema = z.object({
//   title: z.string().trim().min(3, "Title is required"),
//   courseId: z.string().min(1, "Select a course"),
//   type: z.enum(["Assignment", "Project", "Quiz", "Capstone"]),
//   dueDate: z.string().min(1, "Pick a due date"),
//   description: z.string().trim().optional(),
// });
// type FormValues = z.infer<typeof schema>;

// function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
//   const out: Partial<T> = {};
//   (Object.entries(obj) as [keyof T, unknown][]).forEach(([k, v]) => {
//     const isEmpty = typeof v === "string" ? v.trim() === "" : v === undefined || v === null;
//     if (!isEmpty) out[k] = v as T[keyof T];
//   });
//   return out;
// }

// export default function CreateAssignmentDialog({
//   buttonLabel = "Create Assignment",
//   onCreated,
// }: {
//   buttonLabel?: ReactNode;
//   onCreated?: (payload: CreatedAssignmentPayload) => void;
// }) {
//   const {
//     register,
//     setValue,
//     watch,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//   } = useForm<FormValues>({
//     resolver: zodResolver(schema),
//     defaultValues: { title: "", courseId: "", type: "Assignment", dueDate: "", description: "" },
//   });

//   // register <Select> controlled fields
//   useEffect(() => {
//     register("courseId");
//     register("type");
//   }, [register]);

//   const [open, setOpen] = useState(false);
//   const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
//   const [loadingCourses, setLoadingCourses] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         setLoadingCourses(true);
//         const r = await fetch("/api/courses/all-courses", { cache: "no-store" });
//         const j = await r.json().catch(() => null);
//         if (r.ok && j && j.ok !== false) {
//           const list = Array.isArray(j.courses) ? j.courses : [];
//           setCourses(list.map((c: any) => ({ id: String(c.id), title: String(c.title) })));
//           if (!list.length) toast.message("No courses found", { description: "Create a course first." });
//         } else {
//           toast.error(j?.message ?? "Failed to load courses");
//         }
//       } catch {
//         toast.error("Network error while loading courses");
//       } finally {
//         setLoadingCourses(false);
//       }
//     })();
//   }, [open]);

//   const courseValue = watch("courseId") ?? "";
//   const typeValue = watch("type") ?? "Assignment";

//   const onSubmit = async (data: FormValues) => {
//     const payload = compact({
//       title: data.title,
//       courseId: data.courseId,
//       type: data.type,
//       dueDate: data.dueDate,
//       description: data.description,
//     });

//     try {
//       const res = await fetch("/api/instructor/assignments", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(payload),
//       });
//       const ct = res.headers.get("content-type") || "";
//       if (ct.includes("text/html")) {
//         toast.error("Proxy route missing", { description: "/api/instructor/assignments returned HTML" });
//         return;
//       }
//       const out = await res.json().catch(() => ({}));
//       if (!res.ok || out?.ok === false) {
//         toast.error(out?.message ?? "Failed to create assignment");
//         return;
//       }

//       const assignment = out.assignment ?? out.data ?? out;
//       const courseTitle = courses.find((c) => c.id === data.courseId)?.title ?? "";

//       toast.success(out?.message ?? "Assignment created");
//       onCreated?.({
//         assignment,
//         title: data.title,
//         courseId: data.courseId,
//         courseTitle,
//         type: data.type,
//         dueDate: data.dueDate,
//         totalSubmissions: 25,
//       });
//       reset();
//       setOpen(false);
//     } catch {
//       toast.error("Network error");
//     }
//   };

//   const coursePlaceholder =
//     loadingCourses ? "Loading courses…" : courses.length ? "Select course" : "No courses found";

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button className="bg-blue-600 text-white hover:bg-blue-700">{buttonLabel}</Button>
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Create New Assignment</DialogTitle>
//           <DialogDescription>Create a new assignment for your students</DialogDescription>
//         </DialogHeader>

//         <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
//           <div>
//             <Label htmlFor="title">Title</Label>
//             <Input id="title" placeholder="Assignment title" {...register("title")} />
//             {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
//           </div>

//           <div>
//             <Label>Course</Label>
//             <Select
//               value={courseValue}
//               onValueChange={(val) => setValue("courseId", val, { shouldValidate: true })}
//               disabled={loadingCourses || courses.length === 0}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder={coursePlaceholder} />
//               </SelectTrigger>
//               <SelectContent>
//                 {courses.map((c) => (
//                   <SelectItem key={c.id} value={c.id}>
//                     {c.title}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.courseId && <p className="text-xs text-red-600">{errors.courseId.message}</p>}
//           </div>

//           <div>
//             <Label>Type</Label>
//             <Select value={typeValue} onValueChange={(val) => setValue("type", val as any, { shouldValidate: true })}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Assignment type" />
//               </SelectTrigger>
//               <SelectContent>
//                 {(["Assignment", "Project", "Quiz", "Capstone"] as const).map((t) => (
//                   <SelectItem key={t} value={t}>
//                     {t}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="due">Due Date</Label>
//             <Input id="due" type="date" {...register("dueDate")} />
//             {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate.message}</p>}
//           </div>

//           <div>
//             <Label htmlFor="desc">Description</Label>
//             <Textarea id="desc" placeholder="Assignment instructions and requirements" {...register("description")} />
//           </div>

//           <DialogFooter>
//             <DialogClose asChild>
//               <Button variant="outline" type="button">Cancel</Button>
//             </DialogClose>
//             <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white">
//               {isSubmitting ? "Creating…" : "Create Assignment"}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }


import React from 'react'

const CreateAssignmentDialog = () => {
  return (
    <div>CreateAssignmentDialog</div>
  )
}

export default CreateAssignmentDialog