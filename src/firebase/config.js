import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyApGhJPmq8gZtftgthiVHWl-h5eCWZSjMk",
  authDomain: "task-management-app-744e6.firebaseapp.com",
  projectId: "task-management-app-744e6",
  storageBucket: "task-management-app-744e6.firebasestorage.app",
  messagingSenderId: "581012318220",
  appId: "1:581012318220:web:2f3711d7a097f5aab62629"
}

const app = initializeApp(firebaseConfig)

export const auth           = getAuth(app)
export const db             = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()