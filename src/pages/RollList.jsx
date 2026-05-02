import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRolls, createRoll } from '../lib/dataService'
import { PlusIcon, CloseIcon } from '../components/Icons'

const STATUS_LABELS = {
  in_camera: 'In Camera',
  shot: 'Shot',
  developing: 'Developing',
  at_lab: 'At Lab',
  scanned: 'Scanned',
}

function getDefaultSettings() {
  try {
    return JSON.parse(localStorage.getItem('grain_settings') || '{}')
  } catch {
    return {}
  }
}

export default function RollList() {
  const [rolls, setRolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [pushPull, setPushPull] = useState(0)
  const navigate = useNavigate()
  const savedSettings = getDefaultSettings()
  const defaultFrameCount = savedSettings.defaultFrameCount ?? 36
  const defaultISO = savedSettings.defaultISO ?? 400

  useEffect(() => {
    getRolls().then(data => {
      setRolls(data)
      setLoading(false)
    })
  }, [])

  // The most recent roll with status "in_camera" is treated as the active roll
  const activeRoll = rolls.find(r => r.status === 'in_camera') ?? null
  const recentRolls = rolls.filter(r => r !== activeRoll)

  const handleAddRoll = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const newRoll = await createRoll({
      film_stock: fd.get('film_stock'),
      camera: fd.get('camera'),
      iso: Number(fd.get('iso')),
      push_pull: pushPull,
      frame_count: Number(fd.get('frame_count')),
    })
    setRolls(await getRolls())
    setShowModal(false)
    setPushPull(0)
    navigate(`/roll/${newRoll.id}`)
  }

  return (
    <div className="relative min-h-[100dvh] pb-24">
      {/* ── Header ── */}
      <header className="p-6 border-b border-border/30 sticky top-0 bg-primary/95 backdrop-blur-sm z-10 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-accent">GRAIN</h1>
          <p className="text-text-muted text-xs mt-1 uppercase tracking-wider">Film Tracker</p>
        </div>
        {!loading && (
          <span className="text-xs text-text-muted font-medium tabular-nums">
            {rolls.length} {rolls.length === 1 ? 'roll' : 'rolls'}
          </span>
        )}
      </header>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-lg h-28 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : rolls.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="w-16 h-16 border border-dashed border-border rounded mx-auto mb-4 flex items-center justify-center">
              <span className="text-border text-xs">35mm</span>
            </div>
            <p className="text-text-muted text-sm">No rolls loaded yet.</p>
            <p className="text-text-muted text-xs mt-1">Tap + to log your first roll.</p>
          </div>
        ) : (
          <>
            {/* ── Active Roll Card ── */}
            {activeRoll && (
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-3">In Camera</p>
                <Link
                  to={`/roll/${activeRoll.id}`}
                  className="block bg-surface p-5 rounded-xl border-2 border-accent/60 shadow-[0_0_20px_rgba(239,159,39,0.08)] group transition-all hover:border-accent"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-bold text-xl">{activeRoll.film_stock || 'Unknown Film'}</h2>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded font-semibold tracking-wide uppercase">
                      In Camera
                    </span>
                  </div>
                  <p className="text-text-muted text-sm mb-4">
                    {activeRoll.camera || 'Unknown Camera'} · ISO {activeRoll.iso}
                    {activeRoll.push_pull !== 0 && (
                      <span className="ml-1 text-accent font-medium">
                        {activeRoll.push_pull > 0 ? `+${activeRoll.push_pull}` : activeRoll.push_pull}
                      </span>
                    )}
                  </p>

                  {/* 36-frame visual grid */}
                  <div className="grid grid-cols-12 gap-1 mb-3">
                    {Array.from({ length: activeRoll.frame_count }).map((_, i) => {
                      const isShot = i < activeRoll.frames_shot
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-sm ${
                            isShot
                              ? 'bg-accent'
                              : 'bg-primary border border-border/50'
                          }`}
                        />
                      )
                    })}
                  </div>

                  <p className="text-right text-xs text-text-muted tabular-nums">
                    {activeRoll.frames_shot} / {activeRoll.frame_count} frames
                  </p>
                </Link>
              </div>
            )}

            {/* ── Recent Rolls List ── */}
            {recentRolls.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Recent Rolls</p>
                <div className="space-y-3">
                  {recentRolls.map(roll => (
                    <Link
                      key={roll.id}
                      to={`/roll/${roll.id}`}
                      className="flex items-center justify-between bg-surface p-4 rounded-lg border border-border/50 hover:border-accent/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-semibold truncate">{roll.film_stock || 'Unknown Film'}</p>
                        <p className="text-text-muted text-xs mt-0.5 truncate">
                          {roll.camera || 'Unknown Camera'} · ISO {roll.iso}
                          {roll.push_pull !== 0 && (
                            <span className="text-accent ml-1">
                              {roll.push_pull > 0 ? `+${roll.push_pull}` : roll.push_pull}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs bg-primary px-2 py-1 rounded text-text-muted font-medium tracking-wide uppercase whitespace-nowrap">
                          {STATUS_LABELS[roll.status] ?? roll.status}
                        </span>
                        <p className="text-text-muted text-xs mt-1 tabular-nums">
                          {roll.frames_shot}/{roll.frame_count}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating Add Button ── */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-1/2 translate-x-[180px] w-14 h-14 bg-accent rounded-full flex items-center justify-center text-primary shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all z-20"
        aria-label="Log new roll"
      >
        <PlusIcon />
      </button>

      {/* ── New Roll Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-[390px] rounded-xl border border-border p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Load New Roll</h2>
              <button
                onClick={() => { setShowModal(false); setPushPull(0) }}
                className="text-text-muted hover:text-text p-1"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddRoll} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Film Stock</label>
                <input
                  required
                  name="film_stock"
                  placeholder="e.g. Portra 400"
                  className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Camera</label>
                <input
                  required
                  name="camera"
                  placeholder="e.g. Leica M6"
                  className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1 uppercase tracking-wider">ISO</label>
                  <input
                    required
                    type="number"
                    name="iso"
                    defaultValue={defaultISO}
                    min="25"
                    max="6400"
                    className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Frames</label>
                  <select
                    name="frame_count"
                    defaultValue={defaultFrameCount}
                    className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors appearance-none"
                  >
                    <option value="24">24</option>
                    <option value="36">36</option>
                    <option value="12">12 (Medium Format)</option>
                  </select>
                </div>
              </div>

              {/* ── Push / Pull ── */}
              <div>
                <label className="block text-xs text-text-muted mb-2 uppercase tracking-wider">
                  Push / Pull
                </label>
                <div className="flex items-center justify-between bg-primary border border-border rounded p-1">
                  {[-2, -1, 0, 1, 2, 3].map(stop => (
                    <button
                      key={stop}
                      type="button"
                      onClick={() => setPushPull(stop)}
                      className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
                        pushPull === stop
                          ? 'bg-accent text-primary shadow'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {stop === 0 ? '0' : stop > 0 ? `+${stop}` : stop}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-1 text-center">
                  {pushPull === 0
                    ? 'Box speed — no push or pull'
                    : pushPull > 0
                    ? `Pushing ${pushPull} stop${pushPull > 1 ? 's' : ''} (overexposed ${pushPull} stop${pushPull > 1 ? 's' : ''})`
                    : `Pulling ${Math.abs(pushPull)} stop${Math.abs(pushPull) > 1 ? 's' : ''} (underexposed ${Math.abs(pushPull)} stop${Math.abs(pushPull) > 1 ? 's' : ''})`}
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-accent text-primary font-bold py-4 rounded mt-4 hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Load Roll
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
