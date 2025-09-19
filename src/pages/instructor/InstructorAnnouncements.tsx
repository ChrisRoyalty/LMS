import { useState } from 'react'
import { UltraLoader } from './_shared/UltraLoader'
import { Modal } from './_shared/Modal'

export default function InstructorAnnouncements() {
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const announcements = [
    { title:'Welcome to React Fundamentals', course:'React Fundamentals', posted:'3 days ago', body:"Welcome to the React Fundamentals course! I'm excited..." },
    { title:'Assignment 2 Due Date Extended', course:'React Fundamentals', posted:'1 day ago',  body:'Due to the complexity of the React Component Design...' },
    { title:'Office Hours This Week',        course:'All Courses',       posted:'2 hours ago', body:"I'll be holding extra office hours this week..." },
  ]

  function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setWorking(true)
    setTimeout(() => { setWorking(false); setOpen(false) }, 700) // plug your endpoint here when ready
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[22px] font-semibold text-neutral-900">Announcements</div>
          <div className="text-sm text-neutral-500 -mt-0.5">Post announcements and feedback for your students</div>
        </div>
        <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#0B5CD7] px-4 py-2 text-white hover:brightness-95">
          <span className="text-lg leading-none">+</span> New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a,i)=>(
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="text-[16px] font-semibold text-neutral-900">{a.title}</div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-800">{a.course}</span>
            </div>
            <div className="mt-1 text-sm text-neutral-500">{`Posted ${a.posted}`}</div>
            <p className="mt-3 text-neutral-800">{a.body}</p>
          </div>
        ))}
      </div>

      {open && (
        <Modal onClose={()=>!working && setOpen(false)} title="Create Announcement" subtext="Post a new announcement for your students" maxWidth="max-w-xl">
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Announcement title" value={title} onChange={e=>setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input min-h-[120px] resize-y" placeholder="Your announcement message" value={message} onChange={e=>setMessage(e.target.value)} required />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={()=>setOpen(false)} disabled={working}>Cancel</button>
              <button type="submit" className="btn-primary rounded-lg p-2" disabled={working}>Post Announcement</button>
            </div>
          </form>
        </Modal>
      )}

      <UltraLoader show={working} label="Posting…" />
    </>
  )
}
