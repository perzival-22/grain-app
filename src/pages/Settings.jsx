import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SETTINGS_KEY = 'grain_settings'

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(() => {
    const s = loadSettings()
    return {
      defaultFrameCount: s.defaultFrameCount ?? 36,
      defaultISO: s.defaultISO ?? 400,
      tempUnit: s.tempUnit ?? '°F',
    }
  })

  const update = (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
  }

  const handleClearAll = () => {
    if (window.confirm('This will delete all rolls, frames, and timer state. Are you sure?')) {
      localStorage.removeItem('grain_rolls')
      localStorage.removeItem('grain_frames')
      localStorage.removeItem('grain_timer_state')
      localStorage.removeItem(SETTINGS_KEY)
      navigate('/')
    }
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <header className="p-6 border-b border-border/30 sticky top-0 bg-primary/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold tracking-widest text-accent">SETTINGS</h1>
        <p className="text-text-muted text-xs mt-1 uppercase tracking-wider">Preferences</p>
      </header>

      <div className="p-6 space-y-8">

        {/* Preferences */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">Preferences</h2>
          <div className="bg-surface rounded-xl border border-border/50 divide-y divide-border/30">

            {/* Default Frame Count */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Default Frame Count</p>
                <p className="text-xs text-text-muted mt-0.5">Used when loading a new roll</p>
              </div>
              <div className="flex bg-primary border border-border rounded-lg p-1 gap-1">
                {[24, 36].map(n => (
                  <button
                    key={n}
                    onClick={() => update('defaultFrameCount', n)}
                    className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
                      settings.defaultFrameCount === n
                        ? 'bg-accent text-primary shadow'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Default ISO */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Default ISO</p>
                <p className="text-xs text-text-muted mt-0.5">Pre-filled when loading a roll</p>
              </div>
              <input
                type="number"
                min="25"
                max="6400"
                value={settings.defaultISO}
                onChange={e => update('defaultISO', Number(e.target.value))}
                className="w-24 bg-primary border border-border rounded p-2 text-sm text-text text-right focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Temperature Unit */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Temperature Unit</p>
                <p className="text-xs text-text-muted mt-0.5">Shown in dev timer chemistry</p>
              </div>
              <div className="flex bg-primary border border-border rounded-lg p-1 gap-1">
                {['°F', '°C'].map(unit => (
                  <button
                    key={unit}
                    onClick={() => update('tempUnit', unit)}
                    className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
                      settings.tempUnit === unit
                        ? 'bg-accent text-primary shadow'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">About</h2>
          <div className="bg-surface rounded-xl border border-border/50 p-6 text-center">
            <h3 className="text-2xl font-bold tracking-widest text-accent mb-1">GRAIN</h3>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Version 1.0.0</p>
            <p className="text-sm text-text-muted">Your darkroom in your pocket.</p>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">Danger Zone</h2>
          <div className="bg-surface rounded-xl border border-red-900/30 p-4">
            <p className="text-sm text-text-muted mb-4">
              Permanently delete all rolls, frames, and timer data stored on this device.
            </p>
            <button
              onClick={handleClearAll}
              className="w-full text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-400/50 rounded-lg py-3 font-semibold uppercase tracking-wider transition-all"
            >
              Clear All Data
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
