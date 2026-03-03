import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks } from '../../context/TaskContext'

// ─── Config ───────────────────────────────────────────────────────────────────
const priorityConfig = {
  urgent: { label: 'Urgent', cls: 'bg-red-500/10 text-red-400 border-red-500/20'          },
  high:   { label: 'High',   cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20'  },
  medium: { label: 'Medium', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'  },
  low:    { label: 'Low',    cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20'     },
}

const columnConfig = {
  todo:       { title: 'To Do',       dot: 'bg-slate-400'   },
  inprogress: { title: 'In Progress', dot: 'bg-sky-400'     },
  inreview:   { title: 'In Review',   dot: 'bg-violet-400'  },
  done:       { title: 'Done',        dot: 'bg-emerald-400' },
}
const columnOrder = ['todo', 'inprogress', 'inreview', 'done']

const AVATAR_COLORS = [
  'from-sky-400 to-indigo-500', 'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
]
const getAvatarColor = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlusIcon  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
const EditIcon  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
const TrashIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>)
const CloseIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
const CalIcon   = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)

// ─── Task Modal ───────────────────────────────────────────────────────────────
const TaskModal = ({ task, columnId, boards, onClose, onSave }) => {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    priority:    task?.priority    || 'medium',
    due:         task?.due         || '',
    tags:        task?.tags?.join(', ')      || '',
    assignees:   task?.assignees?.join(', ') || '',
    board:       task?.board       || boards[0]?.name || '',
  })

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      ...(task || {}),
      title:       form.title.trim(),
      description: form.description.trim(),
      priority:    form.priority,
      due:         form.due || null,
      tags:        form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      assignees:   form.assignees.split(',').map((a) => a.trim()).filter(Boolean),
      board:       form.board,
      status:      task?.status || columnId,
      done:        task?.done   || false,
    })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full sm:max-w-md bg-[#111827] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-[0_32px_80px_rgba(0,0,0,0.5)]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>
            {isEdit ? 'Edit Task' : 'Add New Task'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-1"><CloseIcon /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Title *</label>
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title..."
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                text-sm text-slate-200 placeholder-slate-600 outline-none font-[Outfit]
                focus:border-sky-500/40 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Add a description..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                text-sm text-slate-200 placeholder-slate-600 outline-none resize-none font-[Outfit]
                focus:border-sky-500/40 transition-all" />
          </div>

          {/* Priority + Due */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5
                  text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                {['urgent','high','medium','low'].map((p) => (
                  <option key={p} value={p} className="bg-[#111827]">{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
              <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5
                  text-sm text-slate-200 outline-none font-[Outfit] focus:border-sky-500/40 transition-all
                  [color-scheme:dark]" />
            </div>
          </div>

          {/* Board — uses real Firestore boards */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Board</label>
            <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5
                text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
              {boards.map((b) => (
                <option key={b.id} value={b.name} className="bg-[#111827]">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Tags <span className="normal-case text-slate-600">(comma separated)</span>
            </label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Design, UI, Dev..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                text-sm text-slate-200 placeholder-slate-600 outline-none font-[Outfit]
                focus:border-sky-500/40 transition-all" />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Assignees <span className="normal-case text-slate-600">(initials, comma separated)</span>
            </label>
            <input value={form.assignees} onChange={(e) => setForm({ ...form, assignees: e.target.value })}
              placeholder="AJ, TK, ML..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                text-sm text-slate-200 placeholder-slate-600 outline-none font-[Outfit]
                focus:border-sky-500/40 transition-all" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer font-[Outfit]">
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave} disabled={!form.title.trim()}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl cursor-pointer
              bg-gradient-to-r from-sky-400 to-indigo-500 border-none font-[Outfit] disabled:opacity-40">
            {isEdit ? 'Save Changes' : 'Add Task'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onEdit, onDelete, onDragStart }) => {
  const [showActions, setShowActions] = useState(false)
  const p = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      draggable onDragStart={(e) => onDragStart(e, task.id, task.status)}
      onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}
      className="bg-[#0f172a] border border-white/[0.07] rounded-xl p-3.5 cursor-grab active:cursor-grabbing
        hover:border-white/[0.14] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.2)] relative">

      {/* Hover actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
            <button onClick={() => onEdit(task)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-sky-500/20
                text-slate-400 hover:text-sky-400 border-none cursor-pointer transition-all"><EditIcon /></button>
            <button onClick={() => onDelete(task.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-red-500/20
                text-slate-400 hover:text-red-400 border-none cursor-pointer transition-all"><TrashIcon /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority + Tags */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5 pr-16">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${p.cls}`}>{p.label}</span>
        {(task.tags || []).map((tag) => (
          <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-400">{tag}</span>
        ))}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-200 leading-snug mb-1.5 pr-2">{task.title}</p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex -space-x-1.5">
          {(task.assignees || []).slice(0, 3).map((a) => (
            <div key={a} title={a}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold
                text-white border-2 border-[#0f172a] bg-gradient-to-br ${getAvatarColor(a)}`}>
              {a.slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
        {task.due && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <CalIcon />
            <span>{new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────
const Column = ({ colId, config, tasks, boards, onAddTask, onEditTask, onDeleteTask, onDragStart, onDragOver, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  return (
    <div className="flex flex-col w-full sm:w-72 sm:flex-shrink-0"
      onDragOver={(e) => { onDragOver(e); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { onDrop(e, colId); setIsDragOver(false) }}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <h3 className="text-sm font-bold text-slate-200">{config.title}</h3>
          <span className="text-xs font-semibold text-slate-500 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded-md">
            {tasks.length}
          </span>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onAddTask(colId)}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.05]
            hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 border border-white/[0.08] cursor-pointer transition-all">
          <PlusIcon />
        </motion.button>
      </div>

      {/* Cards */}
      <div className={`flex-1 rounded-2xl p-2.5 min-h-[200px] space-y-2.5 transition-all duration-200 border
        ${isDragOver
          ? 'bg-sky-500/[0.04] border-sky-500/20'
          : 'bg-white/[0.02] border-white/[0.05]'}`}>
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task}
              onEdit={(t) => onEditTask(t, colId)}
              onDelete={onDeleteTask}
              onDragStart={onDragStart} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-slate-700 text-xs">
            {isDragOver ? 'Drop here' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Boards ──────────────────────────────────────────────────────────────
const Boards = () => {
  const { tasks, boards, addTask, updateTask, deleteTask, moveTask, totalCount } = useTasks()
  const [modal,    setModal]    = useState(null)   // { task, columnId }
  const [dragging, setDragging] = useState(null)   // { taskId, fromCol }

  // Build columns from tasks
  const cols = columnOrder.reduce((acc, colId) => {
    acc[colId] = tasks.filter((t) => t.status === colId)
    return acc
  }, {})

  const handleDragStart = (e, taskId, fromCol) => {
    setDragging({ taskId, fromCol })
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop     = (e, toCol) => {
    e.preventDefault()
    if (!dragging || dragging.fromCol === toCol) return
    moveTask(dragging.taskId, toCol)
    setDragging(null)
  }

  const handleSave = (savedTask) => {
    if (modal?.task?.id) updateTask(savedTask)
    else addTask(savedTask)
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-[Outfit]">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>Project Board</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {totalCount} tasks across {columnOrder.length} columns
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModal({ columnId: 'todo', task: null })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-sky-400 to-indigo-500 border-none cursor-pointer
              self-start sm:self-auto shadow-[0_4px_16px_rgba(56,189,248,0.2)]">
            <PlusIcon /> Add Task
          </motion.button>
        </div>
      </div>

      {/* Columns */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: single column */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {columnOrder.map((colId, i) => (
            <motion.div key={colId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Column colId={colId} config={columnConfig[colId]} tasks={cols[colId]} boards={boards}
                onAddTask={(id) => setModal({ columnId: id, task: null })}
                onEditTask={(t, id) => setModal({ columnId: id, task: t })}
                onDeleteTask={deleteTask}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />
            </motion.div>
          ))}
        </div>

        {/* Tablet: 2 columns */}
        <div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
          {columnOrder.map((colId, i) => (
            <motion.div key={colId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Column colId={colId} config={columnConfig[colId]} tasks={cols[colId]} boards={boards}
                onAddTask={(id) => setModal({ columnId: id, task: null })}
                onEditTask={(t, id) => setModal({ columnId: id, task: t })}
                onDeleteTask={deleteTask}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />
            </motion.div>
          ))}
        </div>

        {/* Desktop: horizontal scroll */}
        <div className="hidden md:block overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {columnOrder.map((colId, i) => (
              <motion.div key={colId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="w-72">
                <Column colId={colId} config={columnConfig[colId]} tasks={cols[colId]} boards={boards}
                  onAddTask={(id) => setModal({ columnId: id, task: null })}
                  onEditTask={(t, id) => setModal({ columnId: id, task: t })}
                  onDeleteTask={deleteTask}
                  onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <TaskModal
            task={modal.task}
            columnId={modal.columnId}
            boards={boards}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Boards