import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: '🎞', text: 'Log every roll you shoot' },
  { icon: '⏱', text: 'Never miss an agitation step' },
  { icon: '📂', text: 'Track your development history' },
]

export default function Onboarding() {
  const navigate = useNavigate()

  const handleStart = () => {
    localStorage.setItem('grain_onboarded', 'true')
    navigate('/auth')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between p-8 bg-primary">
      {/* Top spacer */}
      <div />

      {/* Centre content */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-3">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6 mx-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-accent">
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <circle cx="12" cy="13" r="3" />
              <path d="M8 6V4" /><path d="M16 6V4" /><path d="M2 10h20" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-widest text-accent mb-3">GRAIN</h1>
          <p className="text-sm text-text-muted uppercase tracking-widest">Your darkroom in your pocket.</p>
        </div>

        <div className="mt-12 space-y-4 w-full max-w-xs">
          {FEATURES.map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-4 bg-surface border border-border/50 rounded-xl px-5 py-4">
              <span className="text-xl">{icon}</span>
              <span className="text-sm text-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-xs">
        <button
          onClick={handleStart}
          className="w-full bg-accent text-primary font-bold py-4 rounded-xl shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-95 transition-all text-sm uppercase tracking-widest"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
