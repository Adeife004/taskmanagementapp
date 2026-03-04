// src/pages/Notifications.jsx
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence }       from 'framer-motion'
import { useTasks }                      from '../../context/TaskContext'
import { useToast }                      from '../../context/ToastContext'
import { usePushNotifications }          from '../../hooks/usePushNotifications'

// ── Icons ─────────────────────────────────────────────────────────────────────
const BellIcon     = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const CheckAllIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
    <polyline points="20 6 13 17 8 12"/>
  </svg>
)
const TrashIcon    = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
)

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  overdue:  { icon: '⚠️', label: 'Overdue',      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     dot: 'bg-red-400'     },
  today:    { icon: '📅', label: 'Due Today',    color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  dot: 'bg-orange-400'  },
  upcoming: { icon: '⏰', label: 'Due Tomorrow', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     dot: 'bg-sky-400'     },
  done:     { icon: '✅', label: 'Completed',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
}

const FILTERS = ['all', 'overdue', 'today', 'upcoming', 'done']

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildNotifications = (tasks) => {
  const now     = new Date()
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in24hrs = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const results = []

  tasks.forEach((task) => {
    if (!task.due) return
    // Support both Firestore Timestamp and plain date strings
    const due    = task.due?.toDate?.() ?? new Date(task.due)
    if (isNaN(due)) return
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

    if (!task.done && dueDay < today)
      results.push({ id: `od-${task.id}`, type: 'overdue',  title: task.title, sub: `Was due ${due.toLocaleDateString()}`, taskId: task.id, time: due })
    else if (!task.done && dueDay.getTime() === today.getTime())
      results.push({ id: `td-${task.id}`, type: 'today',    title: task.title, sub: "Due today — don't forget!",           taskId: task.id, time: due })
    else if (!task.done && dueDay.getTime() === in24hrs.getTime())
      results.push({ id: `24-${task.id}`, type: 'upcoming', title: task.title, sub: 'Due tomorrow',                        taskId: task.id, time: due })
    else if (task.done)
      results.push({ id: `dn-${task.id}`, type: 'done',     title: task.title, sub: 'Marked as complete',                  taskId: task.id, time: due })
  })

  return results.sort((a, b) => {
    const order = { overdue: 0, today: 1, upcoming: 2, done: 3 }
    return order[a.type] - order[b.type]
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 gap-4"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-2xl">
      🎉
    </div>
    <div className="text-center">
      <p className="text-slate-200 font-semibold text-base">You're all caught up!</p>
      <p className="text-slate-500 text-sm mt-1">No notifications right now. Check back later.</p>
    </div>
  </motion.div>
)

const NotifCard = ({ notif, isRead, onRead, onDismiss }) => {
  const c = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.upcoming
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1,  y: 0  }}
      exit={{    opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onRead(notif.id)}
      className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer
        transition-all duration-200 group
        ${isRead
          ? 'bg-white/[0.02] border-white/[0.05] opacity-60'
          : `${c.bg} ${c.border} hover:brightness-110`}`}
    >
      {!isRead && <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${c.dot}`} />}

      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-white/[0.06] border border-white/[0.08]">
        {c.icon}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${c.color}`}>{c.label}</span>
        <p className={`text-sm font-semibold truncate mt-0.5 ${isRead ? 'text-slate-500' : 'text-slate-100'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{notif.sub}</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id) }}
        aria-label="Dismiss notification"
        className="absolute top-3 right-7 opacity-0 group-hover:opacity-100 transition-opacity
          text-slate-600 hover:text-red-400 bg-transparent border-none cursor-pointer p-1"
      >
        <TrashIcon />
      </button>
    </motion.div>
  )
}

// ── Permission Banner ─────────────────────────────────────────────────────────
const PermissionBanner = ({ onEnable }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between gap-4 p-4 mb-6 rounded-2xl
      bg-sky-500/10 border border-sky-500/20"
  >
    <div className="flex items-center gap-3">
      <span className="text-xl">🔔</span>
      <div>
        <p className="text-sm font-semibold text-slate-200">Enable background reminders</p>
        <p className="text-xs text-slate-500">Get notified even when the app is closed</p>
      </div>
    </div>
    <button
      onClick={onEnable}
      className="px-4 py-2 rounded-xl text-xs font-semibold text-white
        bg-gradient-to-r from-sky-400 to-indigo-500 cursor-pointer border-none
        hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
    >
      Enable Now
    </button>
  </motion.div>
)

// ── Main Page ─────────────────────────────────────────────────────────────────
const Notifications = () => {
  const { tasks }    = useTasks()
  const { addToast } = useToast()
  const { requestPermission } = usePushNotifications(addToast)

  const [items,   setItems]   = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const [filter,  setFilter]  = useState('all')
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  // Rebuild notification list when tasks change
  useEffect(() => {
    setItems(buildNotifications(tasks))
  }, [tasks])

  const handleEnableNotifications = async () => {
    await requestPermission()
    setPermissionState(Notification.permission)
  }

  const markRead    = (id) => setReadIds((prev) => new Set([...prev, id]))
  const markAllRead = ()   => setReadIds(new Set(items.map((i) => i.id)))
  const dismiss     = (id) => setItems((prev) => prev.filter((i) => i.id !== id))
  const clearAll    = ()   => setItems([])

  const filtered    = useMemo(
    () => filter === 'all' ? items : items.filter((i) => i.type === filter),
    [items, filter]
  )
  const unreadCount = useMemo(
    () => items.filter((i) => !readIds.has(i.id)).length,
    [items, readIds]
  )

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500
            flex items-center justify-center shadow-[0_4px_16px_rgba(56,189,248,0.25)] text-white">
            <BellIcon />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              Notifications
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={markAllRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                  text-sky-400 bg-sky-500/10 border border-sky-500/20 cursor-pointer
                  hover:bg-sky-500/20 transition-colors">
                <CheckAllIcon /> Mark all read
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                text-slate-400 bg-white/[0.04] border border-white/[0.07] cursor-pointer
                hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
              <TrashIcon /> Clear all
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Permission banner — only shown if not yet granted */}
      {permissionState !== 'granted' && permissionState !== 'denied' && (
        <PermissionBanner onEnable={handleEnableNotifications} />
      )}

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-2 mb-6 flex-wrap"
      >
        {FILTERS.map((f) => {
          const count = f === 'all' ? items.length : items.filter((i) => i.type === f).length
          const c     = TYPE_CONFIG[f]
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                border transition-all cursor-pointer
                ${filter === f
                  ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white border-transparent shadow-[0_4px_12px_rgba(56,189,248,0.2)]'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.07] hover:bg-white/[0.07] hover:text-slate-200'}`}
            >
              {f !== 'all' && <span>{c?.icon}</span>}
              {f === 'all' ? 'All' : c?.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filter === f ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Notification list */}
      <div className="max-w-2xl space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0
            ? <EmptyState key="empty" />
            : filtered.map((notif) => (
                <NotifCard
                  key={notif.id}
                  notif={notif}
                  isRead={readIds.has(notif.id)}
                  onRead={markRead}
                  onDismiss={dismiss}
                />
              ))
          }
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Notifications