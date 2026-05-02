import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getRollById, updateRoll, getFrames, upsertFrame, deleteFrame, deleteRoll } from '../lib/dataService'
import { ArrowLeftIcon, CloseIcon } from '../components/Icons'

const STATUSES = [
  { id: 'in_camera',  label: 'In Camera'  },
  { id: 'shot',       label: 'Shot'       },
  { id: 'developing', label: 'Developing' },
  { id: 'at_lab',     label: 'At Lab'     },
  { id: 'scanned',    label: 'Scanned'    },
]

export default function RollDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [roll, setRoll]           = useState(null)
  const [frames, setFrames]       = useState([])
  const [activeFrame, setActiveFrame] = useState(null) // frame note modal
  const [loading, setLoading]     = useState(true)

  // ── Load roll + frames ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const r = await getRollById(id)
      if (!r) { navigate('/'); return }
      const f = await getFrames(id)
      setRoll(r)
      setFrames(f)
      setLoading(false)
    }
    load()
  }, [id, navigate])

  if (loading) return <div className="p-8 text-center text-text-muted text-sm">Loading…</div>
  if (!roll)   return null

  // ── Helpers ────────────────────────────────────────────────────────────────

  const refreshFrames = async (updatedRoll) => {
    const f = await getFrames(id)
    setFrames(f)
    if (updatedRoll) setRoll(updatedRoll)
  }

  const handleStatusChange = async (e) => {
    const updated = await updateRoll(id, { status: e.target.value })
    setRoll(updated)
  }

  const handleNotesChange = async (e) => {
    const updated = await updateRoll(id, { notes: e.target.value })
    setRoll(updated)
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this roll completely? This cannot be undone.')) {
      await deleteRoll(id)
      navigate('/')
    }
  }

  // Tap an empty frame → mark as shot
  // Tap a shot frame  → open note modal
  const handleFrameTap = async (frameNum) => {
    const existing = frames.find(f => f.frame_number === frameNum)
    if (existing) {
      setActiveFrame(existing)
    } else {
      await upsertFrame(id, frameNum, { note: '', shot_at: new Date().toISOString() })
      const newFrames = await getFrames(id)
      const updated   = await updateRoll(id, { frames_shot: newFrames.length })
      await refreshFrames(updated)
    }
  }

  // Save note from the modal
  const handleSaveNote = async (e) => {
    e.preventDefault()
    const note = e.target.note.value
    await upsertFrame(id, activeFrame.frame_number, { note })
    await refreshFrames()
    setActiveFrame(null)
  }

  // Unmark a frame as shot — deletes the frame record
  const handleUnmarkFrame = async () => {
    if (!window.confirm(`Unmark frame ${activeFrame.frame_number} as shot?`)) return
    await deleteFrame(id, activeFrame.frame_number)
    const newFrames = await getFrames(id)
    const updated   = await updateRoll(id, { frames_shot: newFrames.length })
    await refreshFrames(updated)
    setActiveFrame(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentStatusIndex = STATUSES.findIndex(s => s.id === roll.status)

  return (
    <div className="min-h-screen pb-12">
      {/* ── Sticky Header ── */}
      <header className="p-4 flex items-center justify-between sticky top-0 bg-primary/95 backdrop-blur-sm z-10 border-b border-border/30">
        <Link to="/" className="p-2 -ml-2 text-text-muted hover:text-accent transition-colors">
          <ArrowLeftIcon />
        </Link>
        <select
          value={roll.status}
          onChange={handleStatusChange}
          className="bg-transparent text-sm font-bold text-accent uppercase tracking-wider text-right focus:outline-none appearance-none cursor-pointer"
          style={{ direction: 'rtl' }}
        >
          {STATUSES.map(s => (
            <option key={s.id} value={s.id} className="bg-surface text-text">{s.label}</option>
          ))}
        </select>
      </header>

      <div className="p-6 space-y-8">
        {/* ── Roll Info ── */}
        <div>
          <h1 className="text-3xl font-bold mb-1">{roll.film_stock}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-muted text-sm">
            <span>{roll.camera}</span>
            <span>·</span>
            <span>ISO {roll.iso}</span>
            {roll.push_pull !== 0 && (
              <>
                <span>·</span>
                <span className="text-accent font-semibold">
                  {roll.push_pull > 0 ? `+${roll.push_pull}` : roll.push_pull} stop{Math.abs(roll.push_pull) > 1 ? 's' : ''}
                  &nbsp;{roll.push_pull > 0 ? 'push' : 'pull'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Status Pipeline ── */}
        <div>
          <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Status</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATUSES.map((s, i) => {
              const isPast    = i < currentStatusIndex
              const isCurrent = i === currentStatusIndex
              return (
                <button
                  key={s.id}
                  onClick={async () => {
                    const updated = await updateRoll(id, { status: s.id })
                    setRoll(updated)
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                    isCurrent
                      ? 'bg-accent text-primary shadow-[0_0_10px_rgba(239,159,39,0.3)]'
                      : isPast
                      ? 'bg-surface text-text-muted line-through opacity-60 hover:opacity-80'
                      : 'bg-surface text-text-muted border border-border/50 hover:border-accent/50'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Frame Grid ── */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs uppercase tracking-widest text-text-muted">Frame Counter</h2>
            <span className="text-xs font-bold text-accent tabular-nums">
              {frames.length} / {roll.frame_count}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: roll.frame_count }).map((_, i) => {
              const frameNum = i + 1
              const frame    = frames.find(f => f.frame_number === frameNum)
              const isShot   = !!frame
              const hasNote  = frame?.note?.trim().length > 0

              return (
                <button
                  key={frameNum}
                  onClick={() => handleFrameTap(frameNum)}
                  className={`
                    aspect-square rounded flex items-center justify-center text-xs font-medium transition-all
                    ${isShot
                      ? 'bg-surface border-2 border-accent text-text shadow-[0_0_8px_rgba(239,159,39,0.25)]'
                      : 'border border-border/50 text-text-muted hover:border-border active:scale-95'}
                  `}
                >
                  {hasNote
                    ? <div className="w-2 h-2 rounded-full bg-accent" />
                    : frameNum}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-text-muted mt-3 text-center">
            Tap to mark a frame. Tap a shot frame to add a note.
          </p>
        </div>

        {/* ── Dev Timer Link ── */}
        <Link
          to="/timer"
          className="block w-full bg-surface border border-border p-4 rounded-lg flex items-center justify-between group hover:border-accent transition-colors"
        >
          <div>
            <div className="font-bold mb-1 group-hover:text-accent transition-colors">Start Development</div>
            <div className="text-xs text-text-muted">Chemistry presets &amp; timer</div>
          </div>
          <ArrowLeftIcon className="w-5 h-5 rotate-180 text-text-muted group-hover:text-accent transition-colors" />
        </Link>

        {/* ── Roll Notes ── */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-2">Roll Notes</h2>
          <textarea
            value={roll.notes}
            onChange={handleNotesChange}
            placeholder="Push processing instructions, lighting conditions, location…"
            className="w-full bg-surface border border-border rounded-lg p-4 text-sm text-text focus:outline-none focus:border-accent min-h-[120px] resize-none transition-colors"
          />
        </div>

        {/* ── Danger Zone ── */}
        <div className="pt-8">
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-300 uppercase tracking-wider w-full text-center p-4 opacity-50 hover:opacity-100 transition-all"
          >
            Destroy Roll
          </button>
        </div>
      </div>

      {/* ── Frame Note Modal ── */}
      {activeFrame && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-[390px] rounded-xl border border-border p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">Frame {activeFrame.frame_number}</h2>
              <button
                onClick={() => setActiveFrame(null)}
                className="text-text-muted hover:text-text p-1"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {activeFrame.shot_at && (
              <p className="text-xs text-text-muted mb-4">
                Shot {new Date(activeFrame.shot_at).toLocaleString()}
              </p>
            )}

            <form onSubmit={handleSaveNote} className="space-y-4">
              <textarea
                name="note"
                defaultValue={activeFrame.note}
                placeholder="Subject, settings, lighting…"
                className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors resize-none h-28"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-accent text-primary font-bold py-3 rounded hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Save Note
              </button>
            </form>

            {/* ── Unmark frame ── */}
            <button
              onClick={handleUnmarkFrame}
              className="w-full mt-3 text-xs text-red-400 hover:text-red-300 py-2 transition-colors uppercase tracking-wider"
            >
              Unmark as shot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
