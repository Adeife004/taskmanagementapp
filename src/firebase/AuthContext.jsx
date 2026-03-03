import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './config'

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extra profile data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        setUser({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName || userDoc.data()?.displayName || 'User',
          photoURL:    firebaseUser.photoURL    || null,
          ...(userDoc.exists() ? userDoc.data() : {}),
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Create Firestore user doc ──
  const createUserDoc = async (firebaseUser, extraData = {}) => {
    const ref  = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:         firebaseUser.uid,
        email:       firebaseUser.email,
        displayName: firebaseUser.displayName || extraData.displayName || 'User',
        photoURL:    firebaseUser.photoURL || null,
        role:        'Full Stack Developer',
        location:    '',
        bio:         '',
        createdAt:   serverTimestamp(),
        ...extraData,
      })
    }
  }

  // ── Sign up ──
  const signUp = async (email, password, displayName) => {
    setError(null)
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(fbUser, { displayName })
      await createUserDoc(fbUser, { displayName })
      return { success: true }
    } catch (err) {
      const msg = firebaseErrorMessage(err.code)
      setError(msg)
      return { success: false, error: msg }
    }
  }

  // ── Sign in ──
  const signIn = async (email, password) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (err) {
      const msg = firebaseErrorMessage(err.code)
      setError(msg)
      return { success: false, error: msg }
    }
  }

  // ── Google sign in ──
  const signInWithGoogle = async () => {
    setError(null)
    try {
      const { user: fbUser } = await signInWithPopup(auth, googleProvider)
      await createUserDoc(fbUser)
      return { success: true }
    } catch (err) {
      const msg = firebaseErrorMessage(err.code)
      setError(msg)
      return { success: false, error: msg }
    }
  }

  // ── Sign out ──
  const logOut = async () => {
    await signOut(auth)
  }

  // ── Password reset ──
  const resetPassword = async (email) => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (err) {
      const msg = firebaseErrorMessage(err.code)
      setError(msg)
      return { success: false, error: msg }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      signUp, signIn, signInWithGoogle, logOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ─── Firebase error messages ──────────────────────────────────────────────────
const firebaseErrorMessage = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':    return 'This email is already registered.'
    case 'auth/invalid-email':           return 'Please enter a valid email address.'
    case 'auth/weak-password':           return 'Password must be at least 6 characters.'
    case 'auth/user-not-found':          return 'No account found with this email.'
    case 'auth/wrong-password':          return 'Incorrect password. Try again.'
    case 'auth/invalid-credential':      return 'Invalid email or password.'
    case 'auth/too-many-requests':       return 'Too many attempts. Please try again later.'
    case 'auth/popup-closed-by-user':    return 'Sign-in popup was closed.'
    default:                             return 'Something went wrong. Please try again.'
  }
}