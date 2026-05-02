import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CHEMISTRY_PRESETS, DEV_STEPS } from '../lib/chemistry'
import { ArrowLeftIcon, PlayIcon, PauseIcon, CheckIcon } from '../components/Icons'

// ── localStorage persistence key ────────────────────────────────────────────
const TIMER_STORAGE_KEY = 'grain_timer_state'

function saveTimerState(state) {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
  } catch (_) {}
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function clearTimerState() {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY)
  } catch (_) {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DevTimer() {
  // Restore saved state on first mount, or fall back to defaults
  const saved = loadTimerState()
  const initialChemistry =
    CHEMISTRY_PRESETS.find(c => c.id === saved?.chemistryId) ?? CHEMISTRY_PRESETS[0]

  const [selectedChemistry, setSelectedChemistry] = useState(initialChemistry)
  const [currentStepIndex, setCurrentStepIndex]   = useState(saved?.currentStepIndex ?? -1)
  const [timeLeft, setTimeLeft]                   = useState(saved?.timeLeft ?? 0)
  const [isRunning, setIsRunning]                 = useState(false) // never auto-resume after refresh
  const [showAgitation, setShowAgitation]         = useState(false)

  const intervalRef = useRef(null)
  const currentStep = DEV_STEPS[currentStepIndex]

  // ── Persist state whenever it changes ──────────────────────────────────────
  useEffect(() => {
    if (currentStepIndex === -1 || currentStepIndex >= DEV_STEPS.length) {
      clearTimerState()
    } else {
      saveTimerState({
        chemistryId: selectedChemistry.id,
        currentStepIndex,
        timeLeft,
        // Don't persist isRunning — always start paused after a refresh
      })
    }
  }, [selectedChemistry.id, currentStepIndex, timeLeft])

  // ── Countdown interval ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1

          // Agitation reminder during developer step
          if (currentStep?.id === 'developer' && selectedChemistry.agitationInterval) {
            const elapsed = selectedChemistry.devTime - next
            if (elapsed > 0 && elapsed % selectedChemistry.agitationInterval === 0 && next > 5) {
              setShowAgitation(true)
              // Haptic feedback if supported
              if (navigator.vibrate) navigator.vibrate([200, 100, 200])
              setTimeout(() => setShowAgitation(false), 5000)
            }
          }

          if (next <= 0) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            return 0
          }
          return next
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, currentStep, selectedChemistry])

  // ── Actions ────────────────────────────────────────────────────────────────

  const startStep = (index) => {
    const step     = DEV_STEPS[index]
    const duration = step.id === 'developer' ? selectedChemistry.devTime : step.duration
    setCurrentStepIndex(index)
    setTimeLeft(duration)
    setIsRunning(true)
    setShowAgitation(false)
  }

  const toggleTimer = () => {
    if (timeLeft > 0) setIsRunning(r => !r)
  }

  const nextStep = () => {
    if (currentStepIndex < DEV_STEPS.length - 1) {
      startStep(currentStepIndex + 1)
    } else {
      setCurrentStepIndex(DEV_STEPS.length) // marks as done
      setIsRunning(false)
      clearTimerState()
    }
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setCurrentStepIndex(-1)
    setTimeLeft(0)
    setIsRunning(false)
    setShowAgitation(false)
    clearTimerState()
  }

  // ── Screen: Chemistry Selection (or a resume prompt if state was restored) ─

  if (currentStepIndex === -1) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-4 border-b border-border/30">
          <Link to="/" className="p-2 -ml-2 inline-block text-text-muted hover:text-accent transition-colors">
            <ArrowLeftIcon />
          </Link>
        </header>

        <div className="p-6 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-2 text-accent">Dev Timer</h1>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-8">Select Chemistry</p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {CHEMISTRY_PRESETS.map(chem => (
              <button
                key={chem.id}
                onClick={() => setSelectedChemistry(chem)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedChemistry.id === chem.id
                    ? 'bg-surface border-accent shadow-[0_0_15px_rgba(239,159,39,0.1)]'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{chem.name}</span>
                  <span className="text-sm font-mono text-accent">{formatTime(chem.devTime)}</span>
                </div>
                <div className="text-xs text-text-muted space-y-0.5">
                  <div>{chem.temperature}</div>
                  <div>{chem.notes}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pb-24">
            <button
              onClick={() => startStep(0)}
              className="w-full bg-accent text-primary font-bold py-4 rounded-lg shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all text-lg"
            >
              Begin Process
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Screen: Development Complete ───────────────────────────────────────────

  if (currentStepIndex >= DEV_STEPS.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6">
          <CheckIcon className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Development Complete</h1>
        <p className="text-text-muted mb-8">Wash well and hang to dry.</p>
        <Link
          to="/"
          onClick={clearTimerState}
          className="bg-surface border border-border px-8 py-3 rounded-lg font-bold hover:border-accent hover:text-accent transition-colors"
        >
          Back to Rolls
        </Link>
      </div>
    )
  }

  // ── Screen: Active Timer ───────────────────────────────────────────────────

  // Show a "paused / resumed after refresh" notice if state was loaded but not running
  const wasRestored = saved && !isRunning && timeLeft > 0

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* ── Agitation Banner ── */}
      <div
        className={`absolute top-0 left-0 right-0 bg-accent text-primary p-4 z-50 font-bold text-center flex items-center justify-center gap-3 transition-transform duration-300 shadow-xl ${
          showAgitation ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
        AGITATE TANK NOW
        <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
      </div>

      {/* ── Header ── */}
      <header className="p-4 border-b border-border/30 flex justify-between items-center z-10 bg-primary">
        <button
          onClick={resetTimer}
          className="text-xs text-text-muted uppercase tracking-widest hover:text-text transition-colors"
        >
          ← Reset
        </button>
        <div className="text-xs font-bold text-accent uppercase tracking-widest">
          {selectedChemistry.name}
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 z-10">
        {/* ── Step Indicator ── */}
        <div className="flex justify-between mb-8">
          {DEV_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`text-xs uppercase tracking-wider transition-colors ${
                idx === currentStepIndex
                  ? 'text-accent font-bold'
                  : idx < currentStepIndex
                  ? 'text-text-muted line-through opacity-50'
                  : 'text-border'
              }`}
            >
              {step.name}
            </div>
          ))}
        </div>

        {/* ── Restored-state notice ── */}
        {wasRestored && (
          <div className="mb-4 text-xs text-center text-text-muted bg-surface border border-border/50 rounded-lg px-4 py-3">
            Timer paused after page reload. Press play to resume.
          </div>
        )}

        {/* ── Countdown ── */}
        <div className="flex-1 flex flex-col items-center justify-center mb-10">
          <h2 className="text-xl text-text-muted mb-4 uppercase tracking-widest">{currentStep.name}</h2>

          <div
            className={`font-mono text-7xl font-bold tracking-tighter tabular-nums transition-colors ${
              timeLeft <= 10 && timeLeft > 0 ? 'text-accent' : 'text-text'
            }`}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Agitation note under the timer */}
          {currentStep.id === 'developer' && (
            <p className="mt-4 text-xs text-text-muted text-center">
              {selectedChemistry.notes}
            </p>
          )}

          {/* ── Play / Pause button ── */}
          <div className="mt-10">
            <button
              onClick={toggleTimer}
              disabled={timeLeft === 0}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                timeLeft === 0
                  ? 'bg-surface text-border opacity-50 cursor-not-allowed'
                  : isRunning
                  ? 'bg-surface border-2 border-border text-text hover:border-text'
                  : 'bg-accent text-primary shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'
              }`}
              aria-label={isRunning ? 'Pause' : 'Play'}
            >
              {isRunning
                ? <PauseIcon className="w-8 h-8" />
                : <PlayIcon  className="w-8 h-8 ml-1" />}
            </button>
          </div>
        </div>

        {/* ── Next Step Button ── */}
        <button
          onClick={nextStep}
          className={`w-full py-4 rounded-lg font-bold tracking-widest uppercase transition-all ${
            timeLeft === 0
              ? 'bg-accent text-primary shadow-lg shadow-accent/20 animate-pulse'
              : 'bg-surface text-text border border-border hover:border-accent/50'
          }`}
        >
          {currentStepIndex < DEV_STEPS.length - 1
            ? timeLeft === 0
              ? `Next: ${DEV_STEPS[currentStepIndex + 1].name} →`
              : `Skip to ${DEV_STEPS[currentStepIndex + 1].name}`
            : 'Finish'}
        </button>
      </div>

      {/* Ambient darkroom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
    </div>
  )
}
