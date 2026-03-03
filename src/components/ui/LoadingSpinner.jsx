const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 animate-spin" />
    </div>
    <p className="text-slate-500 text-sm font-medium tracking-wide">Loading your tasks…</p>
  </div>
)

export default LoadingSpinner