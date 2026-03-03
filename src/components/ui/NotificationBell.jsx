import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '../../context/TaskContext'

const typeStyles = {
  overdue:  { dot: 'bg-red-500',     label: 'Overdue',   icon: '⚠️' },
  today:    { dot: 'bg-orange-400',  label: 'Due Today', icon: '📅' },
  upcoming: { dot: 'bg-sky-400',     label: 'Tomorrow',  icon: '⏰' },
  done:     { dot: 'bg-emerald-400', label: 'Completed', icon: '✅' },
}

const BellIcon = ({ hasUnread }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    {hasUnread && <circle cx="18" cy="5" r="4" fill="#f87171" stroke="#0b0f19" strokeWidth="1.5" />}
  </svg>
)

const NotificationBell = ({ notificationPrefs = {} }) => {
  const { tasks, completedCount } = useTasks()
  const [open,        setOpen]        = useState(false)
  const [items,       setItems]       = useState([])
  const [readIds,     setReadIds]     = useState(new Set())
  const prevCompleted = useRef(completedCount)
  const dropdownRef   = useRef(null)

  // ── Build notification items from tasks ──
  useEffect(() => {
    if (!notificationPrefs.taskDue) return
    const now     = new Date()
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in24hrs = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const results = []

    tasks.forEach((task) => {
      if (task.done || !task.due) return
      const due    = new Date(task.due)
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

      if (dueDay < today)
        results.push({ id: `od-${task.id}`, type: 'overdue',  title: task.title, sub: 'This task is overdue' })
      else if (dueDay.getTime() === today.getTime())
        results.push({ id: `td-${task.id}`, type: 'today',    title: task.title, sub: 'Due today'            })
      else if (dueDay.getTime() === in24hrs.getTime())
        results.push({ id: `24-${task.id}`, type: 'upcoming', title: task.title, sub: 'Due tomorrow'         })
    })

    setItems((prev) => {
      // merge: keep existing, add new ones
      const existingIds = new Set(prev.map((i) => i.id))
      const fresh = results.filter((r) => !existingIds.has(r.id))
      return [...fresh, ...prev].slice(0, 20)
    })
  }, [tasks, notificationPrefs.taskDue])

  // ── Watch for completed tasks ──
  useEffect(() => {
    if (!notificationPrefs.taskAssigned) return
    if (completedCount > prevCompleted.current) {
      const last = tasks.find((t) => t.done)
      if (last) {
        const item = { id: `done-${last.id}-${Date.now()}`, type: 'done', title: last.title, sub: 'Marked as complete' }
        setItems((prev) => [item, ...prev].slice(0, 20))
      }
    }
    prevCompleted.current = completedCount
  }, [completedCount, tasks, notificationPrefs.taskAssigned])

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length

  const markAllRead = () => setReadIds(new Set(items.map((i) => i.id)))

  const dismiss = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setReadIds((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl border cursor-pointer transition-all
          ${open
            ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
            : 'bg-white/[0.04] border-white/[0.07] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'}`}>
        <BellIcon hasUnread={unreadCount > 0} />
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
              bg-red-500 text-white text-[10px] font-bold rounded-full
              flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1    }}
            exit={{    opacity: 0, y: 8, scale: 0.97  }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-auto left-auto w-80 bg-[#111827] border border-white/[0.08]
              rounded-2xl shadow-2xl z-[9999] overflow-hidden"
            style={{ top: dropdownRef.current?.getBoundingClientRect().bottom + 8,
                     left: dropdownRef.current?.getBoundingClientRect().right + 8 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-xs text-slate-500 hover:text-sky-400 transition-colors bg-transparent border-none cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              <AnimatePresence>
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <span className="text-2xl">🎉</span>
                    <p className="text-sm text-slate-500">You're all caught up!</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const s       = typeStyles[item.type] || typeStyles.upcoming
                    const isRead  = readIds.has(item.id)
                    return (
                      <motion.div key={item.id}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        onClick={() => setReadIds((prev) => new Set([...prev, item.id]))}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04]
                          last:border-0 cursor-pointer transition-colors
                          ${isRead ? 'opacity-50' : 'hover:bg-white/[0.03]'}`}>
                        <span className="text-base mt-0.5 leading-none">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                        </div>
                        {!isRead && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${s.dot}`} />}
                        <button onClick={(e) => { e.stopPropagation(); dismiss(item.id) }}
                          className="text-slate-600 hover:text-slate-300 bg-transparent border-none cursor-pointer text-base leading-none">
                          ×
                        </button>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell