import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../firebase/AuthContext'
import { useTasks } from '../../context/TaskContext'
import {
  updateProfile, updateEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, signOut,
} from 'firebase/auth'
import { auth } from '../../firebase/config'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// ─── Icons ────────────────────────────────────────────────────────────────────
const CameraIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>)
const SaveIcon  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>)
const EyeIcon   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)
const EyeOffIcon= () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>)
const CheckIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
const LogOutIcon= () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>)
const PlusIcon  = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
const EditIcon  = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
const TrashIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>)

// ─── Reusable Field ───────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder, disabled }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full bg-white/[0.03] border rounded-xl px-3.5 py-2.5 text-sm
          text-slate-200 placeholder-slate-600 outline-none font-[Outfit] transition-all
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${focused ? 'border-sky-500/40 bg-sky-500/[0.04] shadow-[0_0_0_3px_rgba(56,189,248,0.07)]' : 'border-white/[0.07]'}`} />
    </div>
  )
}

// ─── Password Field ───────────────────────────────────────────────────────────
const PasswordField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow]       = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className={`relative rounded-xl border transition-all duration-200
        ${focused ? 'border-sky-500/40 bg-sky-500/[0.04] shadow-[0_0_0_3px_rgba(56,189,248,0.07)]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-600 py-2.5 pl-3.5 pr-10 font-[Outfit]" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer p-1">
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="bg-[#111827] border border-white/[0.07] rounded-2xl overflow-hidden">
    <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
      <h2 className="text-sm font-bold text-slate-100" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="px-5 sm:px-6 py-5">{children}</div>
  </motion.div>
)

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ enabled, onChange }) => (
  <button onClick={() => onChange(!enabled)}
    className={`relative w-10 h-5 rounded-full transition-all duration-300 cursor-pointer border-none flex-shrink-0
      ${enabled ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-white/[0.1]'}`}>
    <motion.span animate={{ x: enabled ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md" />
  </button>
)

// ─── Save Button ──────────────────────────────────────────────────────────────
const SaveBtn = ({ saved, loading, onClick, label = 'Save Changes', savedLabel = 'Saved!' }) => (
  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
    disabled={loading}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
      text-white border-none cursor-pointer transition-all disabled:opacity-60
      ${saved
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_4px_16px_rgba(56,189,248,0.2)]'}`}>
    {loading ? 'Saving…' : saved ? <><CheckIcon />{savedLabel}</> : <><SaveIcon />{label}</>}
  </motion.button>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth()
  const {
    tasks, completedCount, totalCount,
    notifications, updateNotification,
    boards, addBoard, renameBoard, deleteBoard,
  } = useTasks()

  const fileRef = useRef(null)

  // ── Profile form ──
  const [profile, setProfile] = useState({
    name:     user?.displayName || '',
    email:    user?.email       || '',
    role: '', location: '', website: '', bio: '',
  })
  const [profileSaved,   setProfileSaved]   = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError,   setProfileError]   = useState('')

  // ── Password ──
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' })
  const [pwError,   setPwError]   = useState('')
  const [pwSaved,   setPwSaved]   = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // ── Board manager ──
  const [newBoardName,    setNewBoardName]    = useState('')
  const [editingBoardId,  setEditingBoardId]  = useState(null)
  const [editingBoardVal, setEditingBoardVal] = useState('')
  const [boardError,      setBoardError]      = useState('')

  // ── App Preferences ──
  const [prefs, setPrefs]       = useState({ defaultBoard: '', weekStart: 'Monday', dateFormat: 'MM/DD/YYYY' })
  const [prefsSaved, setPrefsSaved] = useState(false)

  // ── Avatar upload ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    try {
      const storage  = getStorage()
      const photoRef = storageRef(storage, `avatars/${user.uid}`)
      await uploadBytes(photoRef, file)
      const url = await getDownloadURL(photoRef)
      await updateProfile(auth.currentUser, { photoURL: url })
    } catch (err) { console.error('Avatar upload failed:', err) }
  }

  // ── Save profile ──
  const handleSave = async () => {
    setProfileError('')
    setProfileLoading(true)
    try {
      await updateProfile(auth.currentUser, { displayName: profile.name })
      if (profile.email !== user.email) await updateEmail(auth.currentUser, profile.email)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) { setProfileError(err.message) }
    finally { setProfileLoading(false) }
  }

  // ── Change password ──
  const handlePasswordSave = async () => {
    setPwError('')
    if (!passwords.current)                    return setPwError('Enter your current password.')
    if (passwords.newPw.length < 8)            return setPwError('New password must be at least 8 characters.')
    if (passwords.newPw !== passwords.confirm) return setPwError('Passwords do not match.')
    setPwLoading(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, passwords.current)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, passwords.newPw)
      setPwSaved(true)
      setPasswords({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 2500)
    } catch (err) {
      setPwError(err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message)
    } finally { setPwLoading(false) }
  }

  // ── Board handlers ──
  const handleAddBoard = async () => {
    setBoardError('')
    if (!newBoardName.trim()) return setBoardError('Board name cannot be empty.')
    if (boards.some((b) => b.name.toLowerCase() === newBoardName.trim().toLowerCase()))
      return setBoardError('A board with that name already exists.')
    await addBoard(newBoardName.trim())
    setNewBoardName('')
  }

  const handleRenameBoard = async (id) => {
    setBoardError('')
    if (!editingBoardVal.trim()) return setBoardError('Board name cannot be empty.')
    await renameBoard(id, editingBoardVal.trim())
    setEditingBoardId(null)
    setEditingBoardVal('')
  }

  const handleDeleteBoard = async (id) => {
    setBoardError('')
    if (boards.length <= 1) return setBoardError("You can't delete your last board.")
    await deleteBoard(id)
  }

  // ── Real stats ──
  const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const stats = [
    { label: 'Tasks Done',  value: completedCount,        sub: 'All time'     },
    { label: 'Total Tasks', value: totalCount,            sub: 'In your list' },
    { label: 'In Progress', value: inProgressCount,       sub: 'Active now'   },
    { label: 'Completion',  value: `${progressPercent}%`, sub: 'This sprint'  },
  ]

  const notifLabels = {
    taskDue: 'Task due reminders', taskAssigned: 'Task assigned to me',
    boardUpdates: 'Board activity updates', weeklyDigest: 'Weekly digest email',
    mentions: 'Mentions & comments', emailAlerts: 'Email notifications',
  }

  const initials = (user?.displayName || 'U')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-[Outfit]">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}>Profile</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your account settings and preferences</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              text-slate-400 bg-white/[0.04] border border-white/[0.08]
              hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all cursor-pointer">
            <LogOutIcon /> Sign Out
          </motion.button>
        </motion.div>

        {/* ── Avatar Banner ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-[#111827] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden
                bg-gradient-to-br from-sky-400 to-indigo-500
                flex items-center justify-center shadow-[0_8px_24px_rgba(56,189,248,0.25)]">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl sm:text-3xl font-extrabold text-white"
                      style={{ fontFamily: 'Syne, sans-serif' }}>{initials}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 hover:opacity-100
                  transition-opacity flex items-center justify-center cursor-pointer border-none text-white">
                <CameraIcon />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full
                  bg-gradient-to-br from-sky-400 to-indigo-500 border-2 border-[#111827]
                  flex items-center justify-center cursor-pointer text-white shadow-lg border-none">
                <CameraIcon />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}>{user?.displayName || 'Your Name'}</h2>
              <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
              <p className="text-slate-500 text-sm mt-1">{profile.role || 'No role set'}</p>
              <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                <span className="text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-semibold">Free Plan</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">Active</span>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                text-slate-300 bg-white/[0.05] border border-white/[0.08]
                hover:bg-white/[0.09] transition-colors cursor-pointer self-start sm:self-auto">
              <CameraIcon /> Upload Photo
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <Section title="Account Stats" subtitle="Your activity overview" delay={0.1}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-2xl font-extrabold text-slate-100 tracking-tight"
                  style={{ fontFamily: 'Syne, sans-serif' }}>{stat.value}</p>
                <p className="text-xs font-semibold text-slate-300 mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Profile Info ── */}
        <Section title="Profile Information" subtitle="Update your personal details" delay={0.15}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name"    value={profile.name}     onChange={(e) => setProfile({ ...profile, name: e.target.value })}     placeholder="Your full name" />
              <Field label="Role / Title" value={profile.role}     onChange={(e) => setProfile({ ...profile, role: e.target.value })}     placeholder="e.g. Full Stack Developer" />
            </div>
            <Field label="Email Address"    value={profile.email}    onChange={(e) => setProfile({ ...profile, email: e.target.value })}    placeholder="you@example.com" type="email" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Location"        value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, Country" />
              <Field label="Website / GitHub" value={profile.website}  onChange={(e) => setProfile({ ...profile, website: e.target.value })}  placeholder="https://" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Bio</label>
              <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3} placeholder="A short bio about you..."
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                  text-sm text-slate-200 placeholder-slate-600 outline-none resize-none font-[Outfit]
                  focus:border-sky-500/40 focus:bg-sky-500/[0.04] transition-all" />
            </div>
            <AnimatePresence>
              {profileError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {profileError}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex justify-end pt-1">
              <SaveBtn saved={profileSaved} loading={profileLoading} onClick={handleSave} />
            </div>
          </div>
        </Section>

        {/* ── Change Password ── */}
        <Section title="Change Password" subtitle="You'll need to enter your current password to confirm" delay={0.2}>
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordSave() }} className="space-y-4">
            <PasswordField label="Current Password"  value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField label="New Password"     value={passwords.newPw}   onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })}   placeholder="Min. 8 characters" />
              <PasswordField label="Confirm Password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Repeat new password" />
            </div>
            <AnimatePresence>
              {pwError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {pwError}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex justify-end pt-1">
              <SaveBtn saved={pwSaved} loading={pwLoading} onClick={handlePasswordSave}
                label="Update Password" savedLabel="Password Updated!" />
            </div>
          </form>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" subtitle="Control what alerts you receive" delay={0.25}>
          <div className="space-y-1">
            {Object.entries(notifLabels).map(([key, label], i) => (
              <motion.div key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{notifications[key] ? 'Enabled' : 'Disabled'}</p>
                </div>
                <Toggle enabled={notifications[key]} onChange={(val) => updateNotification(key, val)} />
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── My Boards ── */}
        <Section title="My Boards" subtitle="Create and manage your personal boards" delay={0.3}>
          <div className="space-y-3">
            <AnimatePresence>
              {boards.map((board, i) => (
                <motion.div key={board.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex-shrink-0" />
                  {editingBoardId === board.id ? (
                    <input autoFocus value={editingBoardVal}
                      onChange={(e) => setEditingBoardVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameBoard(board.id)
                        if (e.key === 'Escape') setEditingBoardId(null)
                      }}
                      className="flex-1 bg-white/[0.05] border border-sky-500/30 rounded-lg px-2.5 py-1
                        text-sm text-slate-200 outline-none font-[Outfit]" />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-slate-200">{board.name}</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {editingBoardId === board.id ? (
                      <>
                        <button onClick={() => handleRenameBoard(board.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10
                            border border-emerald-500/20 rounded-lg cursor-pointer hover:bg-emerald-500/20 transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingBoardId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-400 bg-white/[0.04]
                            border border-white/[0.08] rounded-lg cursor-pointer hover:bg-white/[0.08] transition-colors">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingBoardId(board.id); setEditingBoardVal(board.name) }}
                          className="p-1.5 text-slate-500 hover:text-sky-400 bg-transparent border-none cursor-pointer
                            rounded-lg hover:bg-sky-500/10 transition-all">
                          <EditIcon />
                        </button>
                        <button onClick={() => handleDeleteBoard(board.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 bg-transparent border-none cursor-pointer
                            rounded-lg hover:bg-red-500/10 transition-all">
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add board */}
            <div className="flex gap-2 pt-1">
              <input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBoard()}
                placeholder="New board name..."
                className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                  text-sm text-slate-200 placeholder-slate-600 outline-none font-[Outfit]
                  focus:border-sky-500/40 focus:bg-sky-500/[0.04] transition-all" />
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleAddBoard}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-white bg-gradient-to-r from-sky-400 to-indigo-500 border-none cursor-pointer
                  shadow-[0_4px_16px_rgba(56,189,248,0.2)]">
                <PlusIcon /> Add
              </motion.button>
            </div>

            <AnimatePresence>
              {boardError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {boardError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </Section>

        {/* ── App Preferences ── */}
        <Section title="App Preferences" subtitle="Customize how the app works for you" delay={0.32}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Default Board</label>
                <select value={prefs.defaultBoard} onChange={(e) => setPrefs({ ...prefs, defaultBoard: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                    text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                  <option value="" className="bg-[#111827]">None (first board)</option>
                  {boards.map((b) => <option key={b.id} value={b.name} className="bg-[#111827]">{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Week Starts On</label>
                <select value={prefs.weekStart} onChange={(e) => setPrefs({ ...prefs, weekStart: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                    text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                  {['Monday', 'Sunday', 'Saturday'].map((d) => <option key={d} value={d} className="bg-[#111827]">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Date Format</label>
                <select value={prefs.dateFormat} onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5
                    text-sm text-slate-200 outline-none font-[Outfit] cursor-pointer focus:border-sky-500/40 transition-all">
                  {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((f) => <option key={f} value={f} className="bg-[#111827]">{f}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <SaveBtn saved={prefsSaved} loading={false} onClick={() => { setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 2500) }}
                label="Save Preferences" savedLabel="Preferences Saved!" />
            </div>
          </div>
        </Section>

        {/* ── Danger Zone ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-red-500/[0.05] border border-red-500/20 rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-bold text-red-400 mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Danger Zone</h2>
          <p className="text-xs text-slate-500 mb-4">These actions are irreversible. Please proceed with caution.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-orange-400 bg-orange-500/10
              border border-orange-500/20 rounded-xl cursor-pointer hover:bg-orange-500/20 transition-colors">
              Export My Data
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10
              border border-red-500/20 rounded-xl cursor-pointer hover:bg-red-500/20 transition-colors">
              Delete Account
            </button>
          </div>
        </motion.div>

        <div className="h-6" />
      </div>
    </div>
  )
}

export default Profile