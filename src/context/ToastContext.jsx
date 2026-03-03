import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

const toastStyles = {
  overdue:  { bar: 'bg-red-500',    icon: '⚠️', ring: 'border-red-500/20',    bg: 'bg-red-500/10'    },
  today:    { bar: 'bg-orange-400', icon: '📅', ring: 'border-orange-400/20', bg: 'bg-orange-400/10' },
  upcoming: { bar: 'bg-sky-400',    icon: '⏰', ring: 'border-sky-400/20',    bg: 'bg-sky-400/10'    },
  done:     { bar: 'bg-emerald-400',icon: '✅', ring: 'border-emerald-400/20',bg: 'bg-emerald-400/10'},
  info:     { bar: 'bg-indigo-400', icon: '🔔', ring: 'border-indigo-400/20', bg: 'bg-indigo-400/10' },
}

const Toast = ({ toast, onDismiss }) => {
  const s = toastStyles[toast.type] || toastStyles.info
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95  }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative flex items-start gap-3 w-80 rounded-2xl border p-4 shadow-2xl backdrop-blur-sm
        ${s.ring} ${s.bg} bg-[#111827]`}
    >
      {/* coloured left bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${s.bar}`} />
      <span className="text-lg leading-none mt-0.5 ml-1">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">{toast.title}</p>
        <p className="text-sm text-slate-400 mt-0.5 truncate">{toast.body}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)}
        className="text-slate-600 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer text-lg leading-none mt-0.5">
        ×
      </button>
    </motion.div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const addToast = useCallback(({ type = 'info', title, body, duration = 5000 }) => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, type, title, body }])
    if (duration > 0) setTimeout(() => dismissToast(id), duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}