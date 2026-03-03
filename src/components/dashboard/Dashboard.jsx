import { useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTasks } from '../../context/TaskContext'
import { useAuth } from '../../firebase/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../hooks/useNotifications'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'

// ── Helpers ───────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const formatDue = (due) => {
  if (!due) return '—'
  const date = due?.toDate?.() ?? (typeof due === 'string' ? new Date(due) : null)
  if (!date || isNaN(date)) return due
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const buildWeeklyData = (tasks) => {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { day: DAY_LABELS[d.getDay()], date: d.toDateString(), completed: 0, added: 0 }
  })

  tasks.forEach((task) => {
    if (task.createdAt?.toDate) {
      const slot = week.find((w) => w.date === task.createdAt.toDate().toDateString())
      if (slot) slot.added += 1
    }
    if (task.done && task.updatedAt?.toDate) {
      const slot = week.find((w) => w.date === task.updatedAt.toDate().toDateString())
      if (slot) slot.completed += 1
    }
  })

  return week.map(({ day, completed, added }) => ({ day, completed, added }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const AVATAR_COLORS = {
  AJ: 'from-sky-400 to-cyan-500',
  TK: 'from-emerald-400 to-teal-500',
  ML: 'from-violet-400 to-purple-500',
}

const STAT_CARDS = [
  {
    key: 'total',
    label: 'Total Tasks',
    gradient: 'from-sky-400 to-cyan-500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    key: 'completed',
    label: 'Completed',
    gradient: 'from-emerald-400 to-teal-500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    key: 'inprogress',
    label: 'In Progress',
    gradient: 'from-violet-400 to-indigo-500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: 'overdue',
    label: 'Overdue',
    gradient: 'from-red-400 to-rose-500',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
]

const StatCard = ({ label, value, sub, icon, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -3 }}
    className="relative bg-[#111827] border border-white/[0.07] rounded-2xl p-5 overflow-hidden cursor-default"
  >
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.12] blur-xl pointer-events-none`} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-extrabold text-slate-100 tracking-tight font-display">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0`}>
        {icon}
      </div>
    </div>
  </motion.div>
)

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'completed' ? '✓ Completed' : '+ Added'}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth()
  const {
    tasks,
    loading,
    totalCount,
    seedTasks,
    completedCount,
    overdueTasks,
    activity = [],
    toggleTask,
    notifications,
  } = useTasks()
  const { addToast } = useToast()
  const { requestPermission } = useNotifications(tasks, addToast, notifications)

  // Stable ref so the effect dep is satisfied without re-running on every render
  const stableRequestPermission = useCallback(requestPermission, [])
  useEffect(() => { stableRequestPermission() }, [stableRequestPermission])

  // ── Derived values (memoised) ─────────────────────────────────────────────
  const inProgressCount = useMemo(
    () => tasks.filter((t) => t.status === 'inprogress').length,
    [tasks]
  )

  const progressPercent = useMemo(
    () => (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0),
    [completedCount, totalCount]
  )

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => (b.createdAt?.toDate?.() ?? 0) - (a.createdAt?.toDate?.() ?? 0))
        .slice(0, 5),
    [tasks]
  )

  const weeklyData   = useMemo(() => buildWeeklyData(tasks), [tasks])
  const progressData = useMemo(() => [{ name: 'Done', value: progressPercent, fill: '#38bdf8' }], [progressPercent])

  const statValues = {
    total:      { value: totalCount,          sub: 'All tasks' },
    completed:  { value: completedCount,       sub: `${progressPercent}% done` },
    inprogress: { value: inProgressCount,      sub: 'Active tasks' },
    overdue:    { value: overdueTasks.length,  sub: 'Needs attention' },
  }

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  // ── Loading / empty states ────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />

  if (totalCount === 0) return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center gap-4">
      <p className="text-slate-300 text-lg font-semibold">No tasks yet</p>
      <p className="text-slate-500 text-sm">Start fresh or load some sample tasks</p>
      <button
        onClick={seedTasks}
        className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-sm font-semibold rounded-xl cursor-pointer border-none"
      >
        Load Sample Tasks
      </button>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-8" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your projects today.</p>
        </div>
        <span className="text-xs text-slate-500 bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-lg self-start sm:self-auto whitespace-nowrap">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {STAT_CARDS.map(({ key, label, gradient, icon }, i) => (
          <StatCard
            key={key}
            label={label}
            value={statValues[key].value}
            sub={statValues[key].sub}
            gradient={gradient}
            icon={icon}
            delay={0.05 + i * 0.05}
          />
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-[#111827] border border-white/[0.07] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-slate-200">Weekly Activity</p>
              <p className="text-xs text-slate-500">Tasks completed vs added</p>
            </div>
            <span className="text-xs text-slate-500 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-lg">This week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="completed" stroke="#38bdf8" strokeWidth={2} fill="url(#colorCompleted)" dot={false} activeDot={{ r: 4, fill: '#38bdf8' }} />
              <Area type="monotone" dataKey="added"     stroke="#818cf8" strokeWidth={2} fill="url(#colorAdded)"     dot={false} activeDot={{ r: 4, fill: '#818cf8' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"/>
              <span className="text-xs text-slate-500">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"/>
              <span className="text-xs text-slate-500">Added</span>
            </div>
          </div>
        </motion.div>

        {/* Radial Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5 flex flex-col"
        >
          <p className="text-sm font-semibold text-slate-200 mb-1">Overall Progress</p>
          <p className="text-xs text-slate-500 mb-4">Sprint completion</p>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" startAngle={90} endAngle={-270} data={progressData}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>{progressPercent}%</span>
              <span className="text-xs text-slate-500">Complete</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: 'Done', val: completedCount,              color: 'text-sky-400' },
              { label: 'Left', val: totalCount - completedCount, color: 'text-indigo-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 text-center">
                <p className={`text-lg font-bold ${color}`} style={{ fontFamily: 'Syne, sans-serif' }}>{val}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-[#111827] border border-white/[0.07] rounded-2xl p-5"
        >
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-200">Recent Tasks</p>
            <p className="text-xs text-slate-500">Your latest assignments</p>
          </div>
          <ul className="space-y-2">
            {recentTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                  className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer bg-transparent
                    ${task.done ? 'bg-sky-500 border-sky-500' : 'border-slate-600 hover:border-sky-500'}`}
                >
                  {task.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm transition-all truncate ${task.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {task.title}
                </span>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {task.priority && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low}`}>
                      {task.priority}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-600 w-16 text-right">{formatDue(task.due)}</span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5"
        >
          <p className="text-sm font-semibold text-slate-200 mb-1">Activity Feed</p>
          <p className="text-xs text-slate-500 mb-4">Recent team actions</p>
          {activity.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${AVATAR_COLORS[item.user] ?? 'from-slate-400 to-slate-500'} text-white text-[10px] font-bold`}>
                    {item.user}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-200 font-semibold">{item.user} </span>
                      {item.action} <span className="text-slate-300">"{item.target}"</span>
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}

export default Dashboard