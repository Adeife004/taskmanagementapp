// scripts/reminders.js
// Queries Firestore for tasks and sends Web Push notifications.
// Run via: node scripts/reminders.js [due-today|due-tomorrow|overdue|custom]

const admin    = require('firebase-admin')
const webpush  = require('web-push')

// ── Init Firebase Admin ───────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // GitHub Actions escapes the newlines — this restores them
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})

const db = admin.firestore()

// ── Init Web Push (VAPID) ─────────────────────────────────────────────────────
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// ── Date helpers ──────────────────────────────────────────────────────────────
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay   = (d) => { const x = startOfDay(d); x.setHours(23,59,59,999); return x }

const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// ── Fetch all FCM / Web Push subscriptions for a user ────────────────────────
const getSubscriptions = async (uid) => {
  const snap = await db.collection('users').doc(uid).collection('fcmTokens').get()
  // Support both FCM tokens (string) and Web Push subscriptions (object)
  return snap.docs
    .map((d) => d.data())
    .filter((d) => d.subscription || d.token)
}

// ── Send push to a single subscription ───────────────────────────────────────
const sendPush = async (subscription, payload) => {
  // Web Push subscription object
  if (subscription.subscription) {
    try {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify(payload)
      )
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired — clean it up
        console.warn('[Push] Stale subscription, skipping:', err.statusCode)
      } else {
        console.error('[Push] Send error:', err.message)
      }
    }
    return
  }

  // FCM token string — use Firebase Admin Messaging
  if (subscription.token) {
    try {
      await admin.messaging().send({
        token: subscription.token,
        notification: { title: payload.title, body: payload.body },
        webpush: {
          notification: {
            title:   payload.title,
            body:    payload.body,
            icon:    '/icon-192.png',
            badge:   '/badge-72.png',
            actions: [
              { action: 'open',    title: '📋 Open Task' },
              { action: 'dismiss', title: '✕ Dismiss'    },
            ],
          },
          data: payload.data ?? {},
        },
      })
    } catch (err) {
      console.error('[FCM] Send error:', err.message)
    }
  }
}

// ── Notify all users with matching tasks ──────────────────────────────────────
const notifyAll = async (taskPairs, buildPayload) => {
  let sent = 0
  await Promise.all(
    taskPairs.map(async ({ uid, task }) => {
      const subs = await getSubscriptions(uid)
      if (!subs.length) return
      const payload = buildPayload(task)
      await Promise.all(subs.map((s) => sendPush(s, payload)))
      sent += subs.length
    })
  )
  console.log(`[reminders] Sent ${sent} notifications to ${taskPairs.length} tasks`)
}

// ── Query helpers ─────────────────────────────────────────────────────────────
const getTasksDueIn = async (from, to) => {
  const snap = await db.collectionGroup('tasks')
    .where('done', '==', false)
    .where('due',  '>=', admin.firestore.Timestamp.fromDate(from))
    .where('due',  '<',  admin.firestore.Timestamp.fromDate(to))
    .get()
  return snap.docs.map((d) => ({ uid: d.ref.parent.parent.id, task: { id: d.id, ...d.data() } }))
}

const getOverdueTasks = async (before) => {
  const snap = await db.collectionGroup('tasks')
    .where('done', '==', false)
    .where('due',  '<',  admin.firestore.Timestamp.fromDate(before))
    .get()
  return snap.docs.map((d) => ({ uid: d.ref.parent.parent.id, task: { id: d.id, ...d.data() } }))
}

// ── Reminder handlers ─────────────────────────────────────────────────────────
const reminders = {
  'due-today': async () => {
    const now   = new Date()
    const pairs = await getTasksDueIn(startOfDay(now), endOfDay(now))
    await notifyAll(pairs, (task) => ({
      title: '📅 Due Today',
      body:  `"${task.title}" is due today. Get it done!`,
      data:  { taskId: task.id, type: 'today' },
    }))
  },

  'due-tomorrow': async () => {
    const tomorrow = addDays(new Date(), 1)
    const pairs    = await getTasksDueIn(startOfDay(tomorrow), endOfDay(tomorrow))
    await notifyAll(pairs, (task) => ({
      title: '⏰ Due Tomorrow',
      body:  `"${task.title}" is due tomorrow. Don't forget!`,
      data:  { taskId: task.id, type: 'upcoming' },
    }))
  },

  'overdue': async () => {
    const today = startOfDay(new Date())
    const pairs = await getOverdueTasks(today)
    await notifyAll(pairs, (task) => ({
      title: '⚠️ Task Overdue',
      body:  `"${task.title}" is past its due date. Take action now!`,
      data:  { taskId: task.id, type: 'overdue' },
    }))
  },

  'custom': async () => {
    const now     = new Date()
    const in3days = addDays(now, 3)
    const pairs   = await getTasksDueIn(startOfDay(now), endOfDay(in3days))
    await notifyAll(pairs, (task) => ({
      title: '🔔 Evening Reminder',
      body:  `"${task.title}" is coming up soon. Plan your time!`,
      data:  { taskId: task.id, type: 'custom' },
    }))
  },
}

// ── Entry point ───────────────────────────────────────────────────────────────
;(async () => {
  const type = process.argv[2]
  if (!reminders[type]) {
    console.error(`Unknown reminder type: "${type}". Use: due-today | due-tomorrow | overdue | custom`)
    process.exit(1)
  }
  try {
    await reminders[type]()
    process.exit(0)
  } catch (err) {
    console.error('[reminders] Fatal error:', err)
    process.exit(1)
  }
})()