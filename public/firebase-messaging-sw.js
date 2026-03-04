// public/firebase-messaging-sw.js
// Place this file in your /public folder (next to index.html)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// ── Paste your Firebase config here ──────────────────────────────────────────
// Must match the config in your main app (src/firebase/config.js)
firebase.initializeApp({
  apiKey:            'AIzaSyApGhJPmq8gZtftgthiVHWl-h5eCWZSjMk',
  authDomain:        'task-management-app-744e6.firebaseapp.com',
  projectId:         'task-management-app-744e6',
  storageBucket:     'task-management-app-744e6.firebasestorage.app',
  messagingSenderId: '581012318220',
  appId:             '1:581012318220:web:2f3711d7a097f5aab62629',
})

const messaging = firebase.messaging()

// ── Background message handler ────────────────────────────────────────────────
// Fires when a push arrives and the app tab is closed / in background
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, badge, data } = payload.notification ?? payload.data ?? {}

  const notificationTitle = title ?? 'Task Reminder'
  const notificationOptions = {
    body:    body  ?? 'You have a task due soon.',
    icon:    icon  ?? '/icon-192.png',   // add your app icon to /public
    badge:   badge ?? '/badge-72.png',   // monochrome badge icon (optional)
    tag:     data?.taskId ?? 'task-reminder', // collapses duplicate notifications
    renotify: true,
    data:    data ?? {},
    actions: [
      { action: 'open',    title: '📋 Open Task' },
      { action: 'dismiss', title: '✕ Dismiss'    },
    ],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  // Focus existing tab or open a new one
  const urlToOpen = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NOTIFICATION_CLICK', taskId: event.notification.data?.taskId })
          return
        }
      }
      clients.openWindow(urlToOpen)
    })
  )
})