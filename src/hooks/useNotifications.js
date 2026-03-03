import { useEffect, useCallback, useRef } from 'react'

/**
 * useNotifications
 * ─────────────────
 * Watches tasks and fires:
 *  • Browser push notifications (if permission granted)
 *  • In-app toasts via the addToast callback
 *
 * @param {object[]} tasks          — from useTasks()
 * @param {function} addToast       — from useToast()
 * @param {object}   notifications  — the toggles from Profile { taskDue, taskAssigned, ... }
 */
export const useNotifications = (tasks, addToast, notifications = {}) => {
  const notifiedRef = useRef(new Set()) // prevent duplicate notifications per session

  // ── Request browser push permission ──
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      return perm
    }
    return Notification.permission
  }, [])

  // ── Fire a browser push notification ──
  const pushNotify = useCallback((title, body, icon = '/favicon.ico') => {
    if (Notification.permission !== 'granted') return
    new Notification(title, { body, icon })
  }, [])

  // ── Check tasks for due/overdue triggers ──
  useEffect(() => {
    if (!tasks?.length) return

    const now      = new Date()
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const in24hrs  = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    tasks.forEach((task) => {
      if (task.done || !task.due) return

      const due     = new Date(task.due)
      const dueDay  = new Date(due.getFullYear(), due.getMonth(), due.getDate())
      const key_od  = `overdue-${task.id}`
      const key_td  = `today-${task.id}`
      const key_24  = `24h-${task.id}`

      // ── Overdue ──
      if (notifications.taskDue && dueDay < today && !notifiedRef.current.has(key_od)) {
        notifiedRef.current.add(key_od)
        addToast({ type: 'overdue', title: 'Task Overdue', body: task.title })
        pushNotify('⚠️ Task Overdue', task.title)
      }

      // ── Due today ──
      if (notifications.taskDue && dueDay.getTime() === today.getTime() && !notifiedRef.current.has(key_td)) {
        notifiedRef.current.add(key_td)
        addToast({ type: 'today', title: 'Due Today', body: task.title })
        pushNotify('📅 Due Today', task.title)
      }

      // ── Due in 24 hrs ──
      if (notifications.taskDue && dueDay.getTime() === in24hrs.getTime() && !notifiedRef.current.has(key_24)) {
        notifiedRef.current.add(key_24)
        addToast({ type: 'upcoming', title: 'Due Tomorrow', body: task.title })
        pushNotify('⏰ Due Tomorrow', task.title)
      }
    })
  }, [tasks, notifications, addToast, pushNotify])

  return { requestPermission }
}