import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../firebase/AuthContext'

// ─── Shows a spinner while Firebase checks auth state ────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-sky-400 to-indigo-500
        flex items-center justify-center shadow-[0_8px_24px_rgba(56,189,248,0.3)] animate-pulse">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
)

// ─── Redirects to /login if not authenticated ─────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />

  return children
}

export default ProtectedRoute