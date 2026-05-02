import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CHEMISTRY_PRESETS, DEV_STEPS } from '../lib/chemistry'
import { ArrowLeftIcon, PlayIcon, PauseIcon, CheckIcon } from '../components/Icons'

export default function DevTimer() {
  const [selectedChemistry, setSelectedChemistry] = useState(CHEMISTRY_PRESETS[0])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1) // -1 means setup
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showAgitation, setShowAgitation] = useState(false)
  
  const intervalRef = useRef(null)
  
  // Audio context for beep could go here, but let's stick to visual UI per specs
  
  const currentStep = DEV_STEPS[currentStepIndex]
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          
          // Agitation logic (only during developer step)
          if (currentStep?.id === 'developer' && selectedChemistry.agitationInterval) {
            // e.g. every 30 seconds
            const totalTime = selectedChemistry.devTime
            const elapsed = totalTime - newTime
            // Show agitation banner for 5 seconds every interval
            if (elapsed > 0 && elapsed % selectedChemistry.agitationInterval === 0 && newTime > 5) {
              setShowAgitation(true)
              setTimeout(() => setShowAgitation(false), 5000)
            }
          }
          
          if (newTime <= 0) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            return 0
          }
          return newTime
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    
    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, currentStep, selectedChemistry])

  const startStep = (index) => {
    const step = DEV_STEPS[index]
    const duration = step.id === 'developer' ? selectedChemistry.devTime : step.duration
    
    setCurrentStepIndex(index)
    setTimeLeft(duration)
    setIsRunning(true)
    setShowAgitation(false)
  }

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning)
    }
  }

  const nextStep = () => {
    if (currentStepIndex < DEV_STEPS.length - 1) {
      startStep(currentStepIndex + 1)
    } else {
      setCurrentStepIndex(DEV_STEPS.length) // Done
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (currentStepIndex === -1) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-4 border-b border-border/30">
          <Link to="/" className="p-2 -ml-2 inline-block text-text-muted hover:text-accent transition-colors">
            <ArrowLeftIcon />
          </Link>
        </header>
        <div className="p-6 flex-1 flex flex-col">
          <h1 className="text-2xl font-bold mb-8 text-accent">Select Chemistry</h1>
          
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
                <div className="text-xs text-text-muted space-y-1">
                  <div>Temp: {chem.temperature}</div>
                  <div>Agitation: {chem.notes}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
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

  if (currentStepIndex === DEV_STEPS.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-6">
          <CheckIcon className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Development Complete</h1>
        <p className="text-text-muted mb-8">Wash well and hang to dry.</p>
        <Link 
          to="/"
          className="bg-surface border border-border px-8 py-3 rounded-lg font-bold hover:border-accent hover:text-accent transition-colors"
        >
          Back to Rolls
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Agitation Banner */}
      <div className={`
        absolute top-0 left-0 right-0 bg-accent text-primary p-4 z-50 font-bold text-center flex items-center justify-center gap-3 transition-transform duration-300 shadow-xl
        ${showAgitation ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        AGITATE TANK NOW
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      </div>

      <header className="p-4 border-b border-border/30 flex justify-between items-center z-10 bg-primary">
        <button onClick={() => setCurrentStepIndex(-1)} className="text-xs text-text-muted uppercase tracking-widest hover:text-text">
          Cancel
        </button>
        <div className="text-xs font-bold text-accent uppercase tracking-widest">{selectedChemistry.name}</div>
      </header>

      <div className="flex-1 flex flex-col p-6 z-10">
        {/* Step Indicator */}
        <div className="flex justify-between mb-12">
          {DEV_STEPS.map((step, idx) => (
            <div 
              key={step.id} 
              className={`text-xs uppercase tracking-wider transition-colors ${
                idx === currentStepIndex ? 'text-accent font-bold' : 
                idx < currentStepIndex ? 'text-text-muted line-through' : 'text-border'
              }`}
            >
              {step.name}
            </div>
          ))}
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-12">
          <h2 className="text-xl text-text-muted mb-6 uppercase tracking-widest">{currentStep.name}</h2>
          <div className={`font-mono text-7xl font-bold tracking-tighter tabular-nums transition-colors ${timeLeft <= 5 && timeLeft > 0 ? 'text-accent' : 'text-text'}`}>
            {formatTime(timeLeft)}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-6 mt-12">
            <button 
              onClick={toggleTimer}
              disabled={timeLeft === 0}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                timeLeft === 0 ? 'bg-surface text-border opacity-50' :
                isRunning ? 'bg-surface border-2 border-border text-text hover:border-text' : 'bg-accent text-primary shadow-lg shadow-accent/20'
              }`}
            >
              {isRunning ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
            </button>
          </div>
        </div>

        {/* Next Step Button */}
        <button 
          onClick={nextStep}
          className={`w-full py-4 rounded-lg font-bold tracking-widest uppercase transition-all ${
            timeLeft === 0 
              ? 'bg-accent text-primary shadow-lg shadow-accent/20 animate-pulse' 
              : 'bg-surface text-text border border-border hover:border-accent/50'
          }`}
        >
          {currentStepIndex < DEV_STEPS.length - 1 ? `Skip to ${DEV_STEPS[currentStepIndex + 1].name}` : 'Finish'}
        </button>
      </div>
      
      {/* Dim ambient glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-accent/5 blur-[100px] pointer-events-none" />
    </div>
  )
}
