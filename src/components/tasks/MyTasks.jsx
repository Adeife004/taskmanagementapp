import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '../../context/TaskContext'

const priorityConfig = {
  urgent: { label: 'Urgent', cls: 'bg-red-500/10 text-red-400 border-red-500/20',        dot: 'bg-red-400'     },
  high:   { label: 'High',   cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400'  },
  medium: { label: 'Medium', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400'  },
  low:    { label: 'Low',    cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20',    dot: 'bg-slate-400'   },
}

const statusConfig = {
  todo:       { label: 'To Do'       },
  inprogress: { label: 'In Progress' },
  inreview:   { label: 'In Review'   },
  done:       { label: 'Done'        },
}

const boardColors = {
  Product:   'from-sky-400 to-cyan-500',
  Dev:       'from-violet-400 to-indigo-500',
  Marketing: 'from-emerald-400 to-teal-500',
}

const SearchIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
const EditIcon   = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
const TrashIcon  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>)
const CalIcon    = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)
const CloseIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
const SortIcon   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>)

const EditModal = ({ task, onClose, onSave, boards }) => {
  const [form, setForm] = useState({ title: task.title, priority: task.priority, status: task.status, due: task.due, board: task.board })
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full sm:max-w-md bg-[#111827] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>Edit Task</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-1"><CloseIcon /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 outline-none font-[Outfit] focus:border-sky-500/40 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                {['urgent','high','medium','low'].map(p => <option key={p} value={p} className="bg-[#111827]">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k} className="bg-[#111827]">{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Board</label>
              <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                {boards.map(b => <option key={b} value={b} className="bg-[#111827]">{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
              <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none font-[Outfit] focus:border-sky-500/40 transition-all" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer font-[Outfit]">Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { onSave({ ...task, ...form }); onClose() }}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl cursor-pointer border-none bg-gradient-to-r from-sky-400 to-indigo-500 font-[Outfit]">
            Save Changes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const TaskRow = ({ task, onToggle, onEdit, onDelete }) => {
  const p = priorityConfig[task.priority]
  const isOverdue = !task.done && task.due && new Date(task.due) < new Date()
  const dueLabel  = task.due ? new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-200">
      <button onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer bg-transparent
          ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-sky-500'}`}>
        {task.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </button>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot} ${task.done ? 'opacity-30' : ''}`} />
      <span className={`flex-1 text-sm min-w-0 truncate transition-all ${task.done ? 'line-through text-slate-600' : 'text-slate-200'}`}>{task.title}</span>
      <span className={`hidden sm:flex text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r ${boardColors[task.board] || 'from-slate-400 to-slate-500'} bg-clip-text text-transparent border border-white/[0.08] flex-shrink-0`}>{task.board}</span>
      <span className={`hidden md:flex text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${p.cls}`}>{p.label}</span>
      <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${isOverdue ? 'text-red-400' : task.done ? 'text-slate-700' : 'text-slate-500'}`}>
        <CalIcon /><span className="hidden sm:inline">{dueLabel}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(task)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-sky-500/20 text-slate-500 hover:text-sky-400 border-none cursor-pointer transition-all"><EditIcon /></button>
        <button onClick={() => onDelete(task.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-500 hover:text-red-400 border-none cursor-pointer transition-all"><TrashIcon /></button>
      </div>
    </motion.div>
  )
}

const FilterBtn = ({ value, current, setter, label }) => (
  <button onClick={() => setter(value)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border
      ${current === value ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-transparent text-slate-500 border-white/[0.07] hover:text-slate-300 hover:border-white/[0.14]'}`}>
    {label}
  </button>
)

const MyTasks = () => {
  const { tasks, boards, toggleTask, updateTask, deleteTask, completedCount, totalCount } = useTasks()

  const [search, setSearch]               = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [sortBy, setSortBy]               = useState('due')
  const [groupByBoard, setGroupByBoard]   = useState(false)
  const [editTask, setEditTask]           = useState(null)
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => {
      const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase())
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority
      const matchStatus   = filterStatus   === 'all' || t.status   === filterStatus
      return matchSearch && matchPriority && matchStatus
    })
    result.sort((a, b) => {
      if (sortBy === 'due')      return new Date(a.due) - new Date(b.due)
      if (sortBy === 'priority') { const o = { urgent:0, high:1, medium:2, low:3 }; return o[a.priority] - o[b.priority] }
      if (sortBy === 'title')    return a.title.localeCompare(b.title)
      return 0
    })
    return result
  }, [tasks, search, filterPriority, filterStatus, sortBy])

  const grouped = useMemo(() => {
    if (!groupByBoard) return { All: filtered }
    return filtered.reduce((acc, t) => { if (!acc[t.board]) acc[t.board] = []; acc[t.board].push(t); return acc }, {})
  }, [filtered, groupByBoard])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-[Outfit]">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>My Tasks</h1>
            <p className="text-slate-500 text-sm mt-0.5">{completedCount} of {totalCount} tasks completed</p>
          </div>
          <div className="sm:w-48">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl p-4 space-y-3">
          <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-200
            ${searchFocused ? 'border-sky-500/40 bg-sky-500/[0.04]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
            <span className={searchFocused ? 'text-sky-400' : 'text-slate-500'}><SearchIcon /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600 font-[Outfit]" />
            {search && <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer"><CloseIcon /></button>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Priority:</span>
            {['all','urgent','high','medium','low'].map((p) => (
              <FilterBtn key={p} value={p} current={filterPriority} setter={setFilterPriority} label={p === 'all' ? 'All' : p.charAt(0).toUpperCase()+p.slice(1)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            {['all','todo','inprogress','inreview','done'].map((s) => (
              <FilterBtn key={s} value={s} current={filterStatus} setter={setFilterStatus} label={s === 'all' ? 'All' : statusConfig[s]?.label || s} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium flex items-center gap-1"><SortIcon /> Sort:</span>
              {[{ value: 'due', label: 'Due Date' }, { value: 'priority', label: 'Priority' }, { value: 'title', label: 'Title' }].map((s) => (
                <FilterBtn key={s.value} value={s.value} current={sortBy} setter={setSortBy} label={s.label} />
              ))}
            </div>
            <button onClick={() => setGroupByBoard(!groupByBoard)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border
                ${groupByBoard ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : 'bg-transparent text-slate-500 border-white/[0.07] hover:text-slate-300'}`}>
              Group by Board
            </button>
          </div>
        </motion.div>

        {/* Task Groups */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([group, groupTasks], gi) => (
            <motion.div key={group} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
              className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
              {groupByBoard && (
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-bold text-slate-200">{group}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">{groupTasks.length}</span>
                </div>
              )}
              <div className="px-2 py-1.5">
                <AnimatePresence mode="popLayout">
                  {groupTasks.length > 0
                    ? groupTasks.map((task) => (
                        <TaskRow key={task.id} task={task} onToggle={toggleTask} onEdit={setEditTask} onDelete={deleteTask} />
                      ))
                    : <div className="flex items-center justify-center py-8 text-slate-700 text-sm">No tasks match your filters</div>
                  }
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-slate-500 text-sm font-medium">No tasks found</p>
              <p className="text-slate-700 text-xs mt-1">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editTask && <EditModal task={editTask} boards={boards} onClose={() => setEditTask(null)} onSave={updateTask} />}
      </AnimatePresence>
    </div>
  )
}

export default MyTasks