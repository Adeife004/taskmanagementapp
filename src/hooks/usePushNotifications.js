// src/hooks/usePushNotifications.js
// Handles permission, FCM token registration, and saving token to Firestore

import { useEffect, useRef, useCallback } from 'react'
import { getMessaging, getToken, onMessage }  from 'firebase/messaging'
import { doc, setDoc, serverTimestamp }       from 'firebase/firestore'
import { db }                                 from '../firebase/config'   // your Firestore instance
import { useAuth }                            from '../firebase/AuthContext'

// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BPGRFhYK5l5UUP0G3u7D5nC_RzPJSDX9l4YhbtMAHfqeN4Cpwv0YlfoclpxeBAPzjqPlSdwJ4pa3sMjdyvlkDxk'

export const usePushNotifications = (addToast) => {
  const { user }       = useAuth()
  const messaging      = getMessaging()
  const tokenSavedRef  = useRef(false)

  // Save FCM token to Firestore under users/{uid}/fcmTokens/{token}
  const saveToken = useCallback(async (token) => {
    if (!user?.uid || tokenSavedRef.current) return
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'fcmTokens', token),
        { token, createdAt: serverTimestamp(), platform: 'web' },
        { merge: true }
      )
      tokenSavedRef.current = true
    } catch (err) {
      console.error('[Push] Failed to save token:', err)
    }
  }, [user?.uid])

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!user) return

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('[Push] Notification permission denied')
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
      if (token) {
        await saveToken(token)
        console.info('[Push] FCM token registered')
      }
    } catch (err) {
      console.error('[Push] Permission/token error:', err)
    }
  }, [user, messaging, saveToken])

  // Handle foreground messages (app is open)
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification ?? {}
      if (addToast && title) {
        addToast({ title, message: body, type: 'info' })
      }
    })
    return unsubscribe
  }, [messaging, addToast])

  return { requestPermission }
}