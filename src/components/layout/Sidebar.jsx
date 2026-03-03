import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../firebase/AuthContext'
import { useTasks } from '../../context/TaskContext'

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon   = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>)
const TasksIcon       = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>)
const BoardsIcon      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>)
const CalendarIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)
const BellIcon        = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>)
const ProfileIcon     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)
const LogoutIcon      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>)
const ChevronLeft     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>)
const ChevronRight    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>)
const MenuIcon        = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>)
const CloseMenuIcon   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)

// ─── Nav config ───────────────────────────────────────────────────────────────
const navItems = [
  { label: 'Dashboard',     icon: DashboardIcon, path: '/dashboard'     },
  { label: 'My Tasks',      icon: TasksIcon,     path: '/tasks'         },
  { label: 'Boards',        icon: BoardsIcon,    path: '/boards'        },
  { label: 'Calendar',      icon: CalendarIcon,  path: '/calendar'      },
  { label: 'Notifications', icon: BellIcon,      path: '/notifications' },
]
const bottomItems = [
  { label: 'Profile', icon: ProfileIcon, path: '/profile' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
const NavItem = ({ item, collapsed, onClick, badge = 0 }) => {
  const location = useLocation()
  const isActive = location.pathname === item.path
  return (
    <NavLink to={item.path} onClick={onClick} className="block no-underline">
      <motion.div whileHover={{ x: collapsed ? 0 : 3 }} title={collapsed ? item.label : ''}
        className={`relative flex items-center gap-3 rounded-xl border transition-all duration-200 cursor-pointer mb-0.5
          ${collapsed ? 'justify-center w-11 h-11 mx-auto p-0' : 'px-3.5 py-2.5'}
          ${isActive
            ? 'bg-gradient-to-r from-sky-500/[0.15] to-indigo-500/10 border-sky-500/20 text-sky-400 shadow-[0_2px_12px_rgba(56,189,248,0.08)]'
            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`}>
        {isActive && !collapsed && (
          <motion.span layoutId="activeBar"
            className="absolute left-0 top-[20%] bottom-[20%] w-[3px] -translate-x-3.5 rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-500" />
        )}
        {/* Icon + badge dot */}
        <span className="flex-shrink-0 relative">
          <item.icon />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1
              bg-red-500 text-white text-[9px] font-bold rounded-full
              flex items-center justify-center leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className={`text-sm whitespace-nowrap flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Badge pill when expanded */}
        {!collapsed && badge > 0 && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </motion.div>
    </NavLink>
  )
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────
const SidebarContent = ({ collapsed, setCollapsed, onNavClick }) => {
  const { user, logOut } = useAuth()
  const { tasks } = useTasks()
  const navigate  = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  // ── Live notification badge: tasks due today or overdue ──
  const notifBadge = (() => {
    const now     = new Date()
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in24hrs = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    return tasks.filter((t) => {
      if (!t.due || t.done) return false
      const d = new Date(new Date(t.due).getFullYear(), new Date(t.due).getMonth(), new Date(t.due).getDate())
      return d <= in24hrs
    }).length
  })()

  const initials    = getInitials(user?.displayName)
  const displayName = user?.displayName || 'User'
  const shortName   = displayName.split(' ').slice(0, 2).join(' ')
  const email       = user?.email || ''

  const handleLogout = async () => {
    setLoggingOut(true)
    await logOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center border-b border-white/[0.06] min-h-[64px] relative
        ${collapsed ? 'justify-center px-3 py-4' : 'justify-between px-4 py-4'}`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <motion.div whileHover={{ rotate: 8, scale: 1.05 }}
            className="w-9 h-9 flex-shrink-0 rounded-[10px] flex items-center justify-center
              bg-gradient-to-br from-sky-400 to-indigo-500 shadow-[0_4px_16px_rgba(56,189,248,0.25)] cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-[1.1rem] font-extrabold text-slate-100 whitespace-nowrap tracking-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                Taskflow
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0
                bg-white/[0.04] border border-white/[0.07] text-slate-500
                hover:bg-white/[0.08] hover:text-slate-300 transition-all cursor-pointer">
              <ChevronLeft />
            </motion.button>
          )}
        </AnimatePresence>
        {collapsed && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 z-10
              flex items-center justify-center rounded-full bg-[#0f172a] border border-white/10
              text-slate-500 hover:text-slate-300 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <ChevronRight />
          </motion.button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2 py-4' : 'px-3 py-3'}`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em] px-1 mb-2">Main Menu</p>
        )}
        <div className="flex flex-col">
          {navItems.map((item, i) => (
            <motion.div key={item.path} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <NavItem item={item} collapsed={collapsed} onClick={onNavClick}
                badge={item.path === '/notifications' ? notifBadge : 0} />
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className={`border-t border-white/[0.06] ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        {bottomItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onClick={onNavClick} badge={0} />
        ))}

        {/* Logout */}
        <motion.button whileHover={{ x: collapsed ? 0 : 3 }}
          onClick={handleLogout} disabled={loggingOut}
          title={collapsed ? 'Logout' : ''}
          className={`w-full flex items-center gap-3 rounded-xl border border-transparent
            text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] hover:border-red-500/10
            transition-all duration-200 cursor-pointer bg-transparent mt-0.5 mb-3
            ${collapsed ? 'justify-center w-11 h-11 mx-auto p-0' : 'px-3.5 py-2.5'}`}>
          <span className="flex-shrink-0">
            {loggingOut
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-slate-600 border-t-red-400 rounded-full" />
              : <LogoutIcon />}
          </span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-medium whitespace-nowrap">
                {loggingOut ? 'Signing out...' : 'Logout'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User card — expanded */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                bg-gradient-to-br from-sky-400 to-indigo-500 text-white text-xs font-bold overflow-hidden">
                {user?.photoURL
                  ? <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 whitespace-nowrap leading-tight truncate">{shortName}</p>
                <p className="text-xs text-slate-500 whitespace-nowrap truncate">{email}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed avatar */}
        {collapsed && (
          <div className="flex justify-center mt-1">
            <div title={displayName}
              className="w-9 h-9 rounded-full flex items-center justify-center
                bg-gradient-to-br from-sky-400 to-indigo-500 text-white text-xs font-bold overflow-hidden cursor-pointer">
              {user?.photoURL
                ? <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                : initials}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
const Sidebar = () => {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0f172a]/90 backdrop-blur-xl
        border-b border-white/[0.06] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center
            bg-gradient-to-br from-sky-400 to-indigo-500 shadow-[0_2px_10px_rgba(56,189,248,0.25)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span className="text-base font-extrabold text-slate-100 tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>Taskflow</span>
        </div>
        <button onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-slate-200 transition-colors bg-transparent border-none cursor-pointer p-1">
          <MenuIcon />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-[60] w-64 bg-[#0f172a]
                border-r border-white/[0.06] shadow-[4px_0_32px_rgba(0,0,0,0.5)] font-[Outfit]">
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-200
                  transition-colors bg-transparent border-none cursor-pointer p-1 z-10">
                <CloseMenuIcon />
              </button>
              <SidebarContent collapsed={false} setCollapsed={() => {}} onNavClick={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block fixed top-0 left-0 h-screen z-40 bg-[#0f172a]
          border-r border-white/[0.06] overflow-visible shadow-[4px_0_24px_rgba(0,0,0,0.3)] font-[Outfit]">
        <div className="h-full overflow-hidden">
          <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} onNavClick={null} />
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar