import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '../../context/TaskContext'

const priorityConfig = {
  urgent: { dot: 'bg-red-400',    bar: 'bg-red-400',    badge: 'bg-red-500/10 text-red-400 border-red-500/20'          },
  high:   { dot: 'bg-orange-400', bar: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20'  },
  medium: { dot: 'bg-yellow-400', bar: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'  },
  low:    { dot: 'bg-slate-400',  bar: 'bg-slate-500',  badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20'    },
}

// ── Generate a consistent colour per board from a palette ────────────────────
const BOARD_PALETTE = [
  { dot: 'bg-sky-400',     color: 'bg-sky-500',      light: 'bg-sky-500/10 text-sky-400 border-sky-500/20'           },
  { dot: 'bg-violet-400',  color: 'bg-violet-500',   light: 'bg-violet-500/10 text-violet-400 border-violet-500/20'  },
  { dot: 'bg-emerald-400', color: 'bg-emerald-500',  light: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  { dot: 'bg-pink-400',    color: 'bg-pink-500',     light: 'bg-pink-500/10 text-pink-400 border-pink-500/20'        },
  { dot: 'bg-amber-400',   color: 'bg-amber-500',    light: 'bg-amber-500/10 text-amber-400 border-amber-500/20'     },
  { dot: 'bg-teal-400',    color: 'bg-teal-500',     light: 'bg-teal-500/10 text-teal-400 border-teal-500/20'        },
  { dot: 'bg-rose-400',    color: 'bg-rose-500',     light: 'bg-rose-500/10 text-rose-400 border-rose-500/20'        },
  { dot: 'bg-indigo-400',  color: 'bg-indigo-500',   light: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'  },
]

const getBoardStyle = (boardName, boards) => {
  const idx = boards.findIndex((b) => b.name === boardName)
  return BOARD_PALETTE[(idx >= 0 ? idx : 0) % BOARD_PALETTE.length]
}

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ChevLeft  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>)
const ChevRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>)
const CloseIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
const CalIcon   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)

const formatKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

// ─── Add Task Modal ───────────────────────────────────────────────────────────
const AddTaskModal = ({ date, boards, onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', board: boards[0]?.name || '', priority: 'medium' })
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full sm:max-w-sm bg-[#111827] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>Add Task</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {date?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-1"><CloseIcon /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title..." autoFocus
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
              text-sm text-slate-200 placeholder-slate-600 outline-none font-[Outfit]
              focus:border-sky-500/40 transition-all" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Board</label>
              <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5
                  text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer">
                {boards.map((b) => (
                  <option key={b.id} value={b.name} className="bg-[#111827]">{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5
                  text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer">
                {['urgent','high','medium','low'].map((p) => (
                  <option key={p} value={p} className="bg-[#111827]">{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer font-[Outfit]">
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { if (form.title.trim()) { onAdd(form, date); onClose() } }}
            disabled={!form.title.trim()}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl border-none cursor-pointer
              bg-gradient-to-r from-sky-400 to-indigo-500 disabled:opacity-40 font-[Outfit]">
            Add Task
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
const TaskDetailModal = ({ task, boards, onClose }) => {
  const p = priorityConfig[task.priority]
  const b = getBoardStyle(task.board, boards)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full sm:max-w-sm bg-[#111827] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        <div className={`h-1 w-full ${b.color}`} />
        <div className="flex items-start justify-between px-5 py-4">
          <p className="text-base font-bold text-slate-100 flex-1 pr-3">{task.title}</p>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-1 flex-shrink-0">
            <CloseIcon />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${b.dot}`} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${b.light}`}>{task.board}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${p?.dot}`} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${p?.badge}`}>
              {task.priority?.charAt(0).toUpperCase()+task.priority?.slice(1)} Priority
            </span>
          </div>
          {task.due && (
            <div className="flex items-center gap-2 text-slate-400">
              <CalIcon />
              <span className="text-sm">
                {new Date(task.due).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          {task.description && (
            <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Calendar ────────────────────────────────────────────────────────────
const Calendar = () => {
  const { tasks, boards, addTask } = useTasks()
  const today = new Date()
  const [currentDate,  setCurrentDate]  = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [addModal,     setAddModal]     = useState(null)
  const [detailModal,  setDetailModal]  = useState(null)
  const [colorMode,    setColorMode]    = useState('board')

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev  = new Date(year, month, 0).getDate()
    const days = []
    for (let i = firstDay - 1; i >= 0; i--)       days.push({ date: new Date(year, month-1, daysInPrev-i), current: false })
    for (let d = 1; d <= daysInMonth; d++)          days.push({ date: new Date(year, month, d),              current: true  })
    for (let d = 1; d <= 42-days.length; d++)       days.push({ date: new Date(year, month+1, d),            current: false })
    return days
  }, [year, month])

  const tasksByDate = useMemo(() => tasks.reduce((map, t) => {
    if (t.due) { if (!map[t.due]) map[t.due] = []; map[t.due].push(t) }
    return map
  }, {}), [tasks])

  const isToday = (d) =>
    d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && d.getFullYear()===today.getFullYear()

  const handleAddTask = (form, date) => {
    addTask({ title: form.title, board: form.board, priority: form.priority,
      due: formatKey(date), status: 'todo', done: false, tags: [], assignees: [], description: '' })
  }

  const totalThisMonth = tasks.filter((t) => {
    if (!t.due) return false
    const d = new Date(t.due)
    return d.getMonth()===month && d.getFullYear()===year
  }).length

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-[Outfit]">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>Calendar</h1>
            <p className="text-slate-500 text-sm mt-0.5">{totalThisMonth} tasks due in {MONTHS[month]}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Color mode toggle */}
            <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
              {['board','priority'].map((mode) => (
                <button key={mode} onClick={() => setColorMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none
                    ${colorMode===mode
                      ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white'
                      : 'bg-transparent text-slate-500 hover:text-slate-300'}`}>
                  {mode.charAt(0).toUpperCase()+mode.slice(1)}
                </button>
              ))}
            </div>
            {/* Month nav */}
            <div className="flex items-center gap-1">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07]
                  text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 cursor-pointer">
                <ChevLeft />
              </motion.button>
              <button onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer">
                Today
              </button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.07]
                  text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 cursor-pointer">
                <ChevRight />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Month title */}
        <motion.h2 key={`${year}-${month}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="text-xl font-extrabold text-slate-200 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          {MONTHS[month]} <span className="text-slate-500 font-bold">{year}</span>
        </motion.h2>

        {/* Legend — dynamic from real boards */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {colorMode === 'board'
            ? boards.map((b) => {
                const style = getBoardStyle(b.name, boards)
                return (
                  <div key={b.id} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="text-xs text-slate-500">{b.name}</span>
                  </div>
                )
              })
            : Object.entries(priorityConfig).map(([n, c]) => (
                <div key={n} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="text-xs text-slate-500 capitalize">{n}</span>
                </div>
              ))
          }
        </div>

        {/* Calendar grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {DAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-widest">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, current }, idx) => {
              const key      = formatKey(date)
              const dayTasks = tasksByDate[key] || []
              return (
                <motion.div key={key} whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                  onClick={() => current && setAddModal(date)}
                  className={`relative min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-r border-b border-white/[0.05] transition-colors
                    ${current ? 'cursor-pointer' : 'opacity-25'}
                    ${idx >= 35 ? 'border-b-0' : ''}
                    ${(idx+1) % 7 === 0 ? 'border-r-0' : ''}`}>
                  <div className="mb-1">
                    <span className={`text-xs sm:text-sm font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full
                      ${isToday(date)
                        ? 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'
                        : current ? 'text-slate-300' : 'text-slate-600'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => {
                      const style = colorMode === 'board'
                        ? getBoardStyle(task.board, boards)
                        : priorityConfig[task.priority]
                      return (
                        <motion.button key={task.id} whileHover={{ scale: 1.02 }}
                          onClick={(e) => { e.stopPropagation(); setDetailModal(task) }}
                          className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded-md
                            bg-white/[0.04] hover:bg-white/[0.08] border-none cursor-pointer">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                            ${colorMode === 'board' ? style?.dot : style?.bar}`} />
                          <span className="text-[10px] sm:text-xs text-slate-300 truncate">{task.title}</span>
                        </motion.button>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-slate-600 px-1.5">+{dayTasks.length-3} more</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Upcoming list */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-5 bg-[#111827] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-200 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Upcoming This Month
          </p>
          <div className="space-y-2">
            {tasks
              .filter((t) => {
                if (!t.due) return false
                const d = new Date(t.due)
                return d.getMonth()===month && d.getFullYear()===year && d>=today
              })
              .sort((a, b) => new Date(a.due) - new Date(b.due))
              .slice(0, 5)
              .map((task, i) => {
                const p = priorityConfig[task.priority]
                const b = getBoardStyle(task.board, boards)
                return (
                  <motion.div key={task.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    onClick={() => setDetailModal(task)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMode==='board' ? b?.dot : p?.dot}`} />
                    <span className="flex-1 text-sm text-slate-300 truncate group-hover:text-slate-100">{task.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0
                      ${colorMode==='board' ? b?.light : p?.badge}`}>
                      {colorMode==='board' ? task.board : task.priority}
                    </span>
                    <span className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <CalIcon />
                      {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                )
              })}
            {tasks.filter((t) => {
              if (!t.due) return false
              const d = new Date(t.due)
              return d.getMonth()===month && d.getFullYear()===year && d>=today
            }).length === 0 && (
              <p className="text-sm text-slate-600 text-center py-4">No upcoming tasks this month</p>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {addModal    && <AddTaskModal    date={addModal}    boards={boards} onClose={() => setAddModal(null)}    onAdd={handleAddTask} />}
        {detailModal && <TaskDetailModal task={detailModal} boards={boards} onClose={() => setDetailModal(null)} />}
      </AnimatePresence>
    </div>
  )
}

export default Calendar