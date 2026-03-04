// functions/index.js
// Firebase Cloud Functions — scheduled push notifications for task reminders
//
// Setup steps (run in your project root):
//   npm install -g firebase-tools
//   firebase login
//   firebase init functions          (choose JavaScript, install deps)
//   cd functions && npm install      (installs dependencies below)
//
// Deploy:
//   firebase deploy --only functions

const { onSchedule }          = require('firebase-functions/v2/scheduler')
const { initializeApp }       = require('firebase-admin/app')
const { getFirestore }        = require('firebase-admin/firestore')
const { getMessaging }        = require('firebase-admin/messaging')

initializeApp()
const db        = getFirestore()
const messaging = getMessaging()

// ── Helpers ───────────────────────────────────────────────────────────────────

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const endOfDay = (date) => {
  const d = startOfDay(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Fetch all FCM tokens for a given user uid.
 */
const getTokensForUser = async (uid) => {
  const snap = await db.collection('users').doc(uid).collection('fcmTokens').get()
  return snap.docs.map((d) => d.data().token).filter(Boolean)
}

/**
 * Send a push notification to every token for a user.
 * Silently removes stale tokens that Firebase rejects.
 */
const sendToUser = async (uid, notification, data = {}) => {
  const tokens = await getTokensForUser(uid)
  if (!tokens.length) return

  const messages = tokens.map((token) => ({
    token,
    notification,
    data: { ...data, url: '/' },
    webpush: {
      notification: {
        ...notification,
        icon:  '/icon-192.png',
        badge: '/badge-72.png',
        requireInteraction: true,
        actions: [
          { action: 'open',    title: '📋 Open Task' },
          { action: 'dismiss', title: '✕ Dismiss'    },
        ],
      },
    },
  }))

  const response = await messaging.sendEach(messages)

  // Clean up invalid tokens
  const staleTokens = []
  response.responses.forEach((resp, i) => {
    if (!resp.success) {
      const code = resp.error?.code
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        staleTokens.push(tokens[i])
      }
    }
  })

  await Promise.all(
    staleTokens.map((token) =>
      db.collection('users').doc(uid).collection('fcmTokens').doc(token).delete()
    )
  )
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Get all tasks matching a due date window across all users.
 * Returns: [{ uid, task }]
 */
const getTasksDueIn = async (from, to) => {
  const snap = await db.collectionGroup('tasks')
    .where('done', '==', false)
    .where('due',  '>=', from)
    .where('due',  '<',  to)
    .get()

  return snap.docs.map((d) => {
    // tasks are stored at users/{uid}/tasks/{taskId}
    const uid = d.ref.parent.parent.id
    return { uid, task: { id: d.id, ...d.data() } }
  })
}

/**
 * Get all overdue tasks (due before today, not done).
 */
const getOverdueTasks = async (before) => {
  const snap = await db.collectionGroup('tasks')
    .where('done', '==', false)
    .where('due',  '<',  before)
    .get()

  return snap.docs.map((d) => ({
    uid:  d.ref.parent.parent.id,
    task: { id: d.id, ...d.data() },
  }))
}

// ── Scheduled Functions ───────────────────────────────────────────────────────

/**
 * 1. Morning of due date — fires at 8:00 AM UTC daily.
 *    Sends "Due today" reminder for every task due today.
 */
exports.remindDueToday = onSchedule('0 8 * * *', async () => {
  const now   = new Date()
  const from  = startOfDay(now)
  const to    = endOfDay(now)
  const pairs = await getTasksDueIn(from, to)

  await Promise.all(
    pairs.map(({ uid, task }) =>
      sendToUser(
        uid,
        {
          title: '📅 Due Today',
          body:  `"${task.title}" is due today. Get it done!`,
        },
        { taskId: task.id, type: 'today' }
      )
    )
  )
  console.log(`[remindDueToday] Sent ${pairs.length} notifications`)
})

/**
 * 2. One day before — fires at 8:00 AM UTC daily.
 *    Sends "Due tomorrow" reminder.
 */
exports.remindDueTomorrow = onSchedule('0 8 * * *', async () => {
  const now      = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const from  = startOfDay(tomorrow)
  const to    = endOfDay(tomorrow)
  const pairs = await getTasksDueIn(from, to)

  await Promise.all(
    pairs.map(({ uid, task }) =>
      sendToUser(
        uid,
        {
          title: '⏰ Due Tomorrow',
          body:  `"${task.title}" is due tomorrow. Don't forget!`,
        },
        { taskId: task.id, type: 'upcoming' }
      )
    )
  )
  console.log(`[remindDueTomorrow] Sent ${pairs.length} notifications`)
})

/**
 * 3. Overdue reminder — fires at 9:00 AM UTC daily.
 *    Pings users about any task that's past its due date.
 */
exports.remindOverdue = onSchedule('0 9 * * *', async () => {
  const now   = startOfDay(new Date())       // anything before today
  const pairs = await getOverdueTasks(now)

  await Promise.all(
    pairs.map(({ uid, task }) =>
      sendToUser(
        uid,
        {
          title: '⚠️ Task Overdue',
          body:  `"${task.title}" is past its due date. Take action now!`,
        },
        { taskId: task.id, type: 'overdue' }
      )
    )
  )
  console.log(`[remindOverdue] Sent ${pairs.length} notifications`)
})

/**
 * 4. Custom time reminder — fires at 6:00 PM UTC daily.
 *    Sends an end-of-day digest for tasks due within the next 3 days.
 *    Adjust the cron schedule below to your preferred time.
 *    e.g. '0 17 * * *' = 5 PM UTC
 */
exports.remindCustomTime = onSchedule('0 18 * * *', async () => {
  const now     = new Date()
  const in3days = new Date(now)
  in3days.setDate(now.getDate() + 3)

  const from  = startOfDay(now)
  const to    = endOfDay(in3days)
  const pairs = await getTasksDueIn(from, to)

  await Promise.all(
    pairs.map(({ uid, task }) =>
      sendToUser(
        uid,
        {
          title: '🔔 Evening Reminder',
          body:  `"${task.title}" is coming up soon. Plan your time!`,
        },
        { taskId: task.id, type: 'custom' }
      )
    )
  )
  console.log(`[remindCustomTime] Sent ${pairs.length} notifications`)
})