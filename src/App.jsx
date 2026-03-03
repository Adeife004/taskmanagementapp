import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './firebase/AuthContext'
import { TaskProvider } from './context/TaskContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './components/auth/Login'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import Boards from './components/boards/Boards'
import MyTasks from './components/tasks/MyTasks'
import Calendar from './components/calendar/Calendar'
import Profile from './components/profile/Profile'
import Notifications from './components/notifications/Notifications'

const AppLayout = ({ children }) => {
  const location = useLocation()
  const isAuthPage = ['/', '/login'].includes(location.pathname)
  if (isAuthPage) return children
  return (
    <div className="flex bg-[#0b0f19] min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 mt-14 lg:mt-0 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TaskProvider>
          <ToastProvider>
            <AppLayout>
              <Routes>
                <Route path="/"          element={<Login />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/tasks"     element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
                <Route path="/boards"    element={<ProtectedRoute><Boards /></ProtectedRoute>} />
                <Route path="/calendar"  element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              </Routes>
            </AppLayout>
          </ToastProvider>
        </TaskProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App