import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../firebase/AuthContext'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const EyeOpen = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)
const EyeOff  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>)

const InputField = ({ label, type, value, onChange, placeholder, icon }) => {
  const [focused, setFocused]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className={`relative rounded-xl border transition-all duration-200
        ${focused ? 'border-sky-500/50 bg-sky-500/5 shadow-[0_0_0_3px_rgba(56,189,248,0.08)]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? 'text-sky-400' : 'text-slate-500'}`}>{icon}</span>
        <input type={isPassword && showPw ? 'text' : type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-slate-200 text-sm placeholder-slate-600 py-3 pl-10 pr-10 font-[Outfit]" />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 bg-transparent border-none cursor-pointer">
            {showPw ? <EyeOff /> : <EyeOpen />}
          </button>
        )}
      </div>
    </div>
  )
}

const Login = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [isLogin, setIsLogin]   = useState(true)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let result
    if (isLogin) {
      result = await signIn(email, password)
    } else {
      if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return }
      result = await signUp(email, password, name)
    }
    setLoading(false)
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.error)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    const result = await signInWithGoogle()
    setLoading(false)
    if (result.success) navigate(from, { replace: true })
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="opacity-[0.04]">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="0.8"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute -top-[10%] -left-[5%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.07)_0%,transparent_65%)]" />
        <div className="absolute -bottom-[15%] -right-[5%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_65%)]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm sm:max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-7">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-[14px]
              flex items-center justify-center mx-auto mb-3 shadow-[0_8px_32px_rgba(56,189,248,0.25)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Taskflow</h1>
          <p className="text-slate-500 text-sm">{isLogin ? 'Welcome back — sign in to continue' : 'Create your account to get started'}</p>
        </div>

        {/* Card */}
        <div className="bg-[rgba(15,23,42,0.85)] border border-white/[0.07] rounded-2xl p-5 sm:p-8 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
          {/* Tabs */}
          <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-6">
            {['Sign In', 'Sign Up'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError('') }}
                className={`flex-1 py-2 rounded-[9px] text-sm font-semibold transition-all duration-200 cursor-pointer border-none
                  ${(isLogin ? i === 0 : i === 1) ? 'bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_2px_12px_rgba(56,189,248,0.25)]' : 'bg-transparent text-slate-500 hover:text-slate-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div key="name" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <InputField label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Adebowale Jasmine"
                    icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />

            <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3 -mt-1">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {isLogin && (
              <div className="text-right -mt-2 mb-4">
                <button type="button" className="text-sky-400 text-xs hover:text-sky-300 transition-colors bg-transparent border-none cursor-pointer font-[Outfit]">
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
              className={`w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2
                transition-all duration-300 cursor-pointer border-none mt-1
                ${loading ? 'bg-sky-500/30 cursor-not-allowed' : 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_4px_20px_rgba(56,189,248,0.2)]'}`}>
              {loading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}</>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-slate-600 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGoogle} disabled={loading}
            className="w-full py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-300 text-sm font-medium
              flex items-center justify-center gap-2.5 cursor-pointer hover:bg-white/[0.07] transition-colors duration-200">
            <GoogleIcon />
            Continue with Google
          </motion.button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5 px-4">
          By continuing, you agree to our <span className="text-sky-400 cursor-pointer hover:text-sky-300 transition-colors">Terms</span> and <span className="text-sky-400 cursor-pointer hover:text-sky-300 transition-colors">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  )
}

export default Login