import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  deleteDoc, serverTimestamp, query, orderBy, writeBatch, setDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../firebase/AuthContext'

const TaskContext = createContext(null)

const DEFAULT_NOTIF_PREFS = {
  taskDue: true, taskAssigned: true, boardUpdates: false,
  weeklyDigest: true, mentions: true, emailAlerts: false,
}

const DEFAULT_BOARDS = ['Personal', 'Work', 'Side Project']

export const TaskProvider = ({ children }) => {
  const { user } = useAuth()
  const [tasks,   setTasks]   = useState([])
  const [boards,  setBoards]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notif_prefs')
      return saved ? JSON.parse(saved) : DEFAULT_NOTIF_PREFS
    } catch { return DEFAULT_NOTIF_PREFS }
  })

  useEffect(() => {
    try { localStorage.setItem('notif_prefs', JSON.stringify(notifications)) }
    catch {}
  }, [notifications])

  const updateNotification = useCallback((key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Real-time tasks listener ──
  useEffect(() => {
    if (!user) { setTasks([]); setLoading(false); return }
    setLoading(true)
    const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => { setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false) },
      (err)  => { console.error(err); setError(err.message); setLoading(false) }
    )
    return unsub
  }, [user])

  // ── Real-time boards listener ──
  useEffect(() => {
    if (!user) { setBoards([]); return }
    const q = query(collection(db, 'users', user.uid, 'boards'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q,
      (snap) => {
        if (snap.empty) {
          // seed default boards for new users
          seedBoards()
        } else {
          setBoards(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        }
      },
      (err) => console.error(err)
    )
    return unsub
  }, [user])

  const boardsRef = useCallback(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'boards')
  }, [user])

  const tasksRef = useCallback(() => {
    if (!user) return null
    return collection(db, 'users', user.uid, 'tasks')
  }, [user])

  // ── Board CRUD ──
  const seedBoards = async () => {
    if (!user) return
    const ref = boardsRef()
    const batch = writeBatch(db)
    DEFAULT_BOARDS.forEach((name) => {
      batch.set(doc(ref), { name, createdAt: serverTimestamp(), uid: user.uid })
    })
    await batch.commit()
  }

  const addBoard = async (name) => {
    const ref = boardsRef()
    if (!ref || !name.trim()) return
    await addDoc(ref, { name: name.trim(), createdAt: serverTimestamp(), uid: user.uid })
  }

  const renameBoard = async (id, name) => {
    if (!user || !name.trim()) return
    await updateDoc(doc(db, 'users', user.uid, 'boards', id), { name: name.trim() })
  }

  const deleteBoard = async (id) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'boards', id))
    // move tasks on deleted board to first remaining board
    const remaining = boards.filter((b) => b.id !== id)
    const fallback  = remaining[0]?.name || 'General'
    const affected  = tasks.filter((t) => {
      const board = boards.find((b) => b.id === id)
      return board && t.board === board.name
    })
    const batch = writeBatch(db)
    affected.forEach((t) => {
      batch.update(doc(db, 'users', user.uid, 'tasks', t.id), { board: fallback })
    })
    if (affected.length) await batch.commit()
  }

  // ── Task CRUD ──
  const addTask = async (task) => {
    const ref = tasksRef()
    if (!ref) return
    await addDoc(ref, {
      title: task.title || '', description: task.description || '',
      board: task.board || boards[0]?.name || 'General',
      priority: task.priority || 'medium', status: task.status || 'todo',
      due: task.due || null, done: task.done || false,
      tags: task.tags || [], assignees: task.assignees || [],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), uid: user.uid,
    })
  }

  const updateTask = async (task) => {
    if (!user || !task.id) return
    const { id, createdAt, ...data } = task
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { ...data, updatedAt: serverTimestamp() })
  }

  const deleteTask = async (id) => {
    if (!user || !id) return
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', id))
  }

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task || !user) return
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { done: !task.done, updatedAt: serverTimestamp() })
  }

  const moveTask = async (taskId, newStatus) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), { status: newStatus, updatedAt: serverTimestamp() })
  }

  const seedTasks = async () => {
    const ref = tasksRef()
    if (!ref || !user) return
    const firstBoard  = boards[0]?.name || 'General'
    const secondBoard = boards[1]?.name || firstBoard
    const thirdBoard  = boards[2]?.name || firstBoard
    const defaults = [
      { title: 'Design onboarding screens', board: firstBoard,  priority: 'high',   status: 'todo',       due: null, done: false, tags: ['Design'], assignees: [], description: '' },
      { title: 'Set up CI/CD pipeline',     board: secondBoard, priority: 'medium', status: 'todo',       due: null, done: false, tags: ['DevOps'], assignees: [], description: '' },
      { title: 'Build auth module',         board: secondBoard, priority: 'urgent', status: 'inprogress', due: null, done: false, tags: ['Dev'],    assignees: [], description: '' },
      { title: 'Write API docs',            board: secondBoard, priority: 'low',    status: 'inprogress', due: null, done: false, tags: ['Docs'],   assignees: [], description: '' },
      { title: 'Dashboard UI review',       board: firstBoard,  priority: 'high',   status: 'inreview',   due: null, done: false, tags: ['UI'],     assignees: [], description: '' },
      { title: 'Update landing page copy',  board: thirdBoard,  priority: 'low',    status: 'done',       due: null, done: true,  tags: [],         assignees: [], description: '' },
    ]
    const batch = writeBatch(db)
    defaults.forEach((t) => batch.set(doc(ref), { ...t, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), uid: user.uid }))
    await batch.commit()
  }

  const activity       = []
  const completedCount = tasks.filter((t) => t.done).length
  const totalCount     = tasks.length
  const overdueTasks   = tasks.filter((t) => !t.done && t.due && new Date(t.due) < new Date())
  const tasksByStatus  = (s) => tasks.filter((t) => t.status === s)
  const tasksByBoard   = (b) => tasks.filter((t) => t.board  === b)
  const tasksByDue     = (d) => tasks.filter((t) => t.due    === d)

  return (
    <TaskContext.Provider value={{
      tasks, boards, activity, loading, error,
      completedCount, totalCount, overdueTasks,
      tasksByStatus, tasksByBoard, tasksByDue,
      addTask, updateTask, deleteTask, toggleTask, moveTask, seedTasks,
      addBoard, renameBoard, deleteBoard,
      notifications, updateNotification,
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTasks = () => {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used inside <TaskProvider>')
  return ctx
}