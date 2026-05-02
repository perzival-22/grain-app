import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getRollById, updateRoll, getFrames, upsertFrame, deleteRoll } from '../lib/localStorage'
import { ArrowLeftIcon, CloseIcon } from '../components/Icons'

const STATUSES = [
  { id: 'in_camera', label: 'In Camera' },
  { id: 'shot', label: 'Shot' },
  { id: 'developing', label: 'Developing' },
  { id: 'at_lab', label: 'At Lab' },
  { id: 'scanned', label: 'Scanned' }
]

export default function RollDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roll, setRoll] = useState(null)
  const [frames, setFrames] = useState([])
  const [activeFrame, setActiveFrame] = useState(null) // for note modal

  useEffect(() => {
    const r = getRollById(id)
    if (r) {
      setRoll(r)
      setFrames(getFrames(id))
    } else {
      navigate('/')
    }
  }, [id, navigate])

  if (!roll) return <div className="p-8 text-center text-text-muted text-sm">Loading...</div>

  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    const updated = updateRoll(id, { status: newStatus })
    setRoll(updated)
  }

  const handleNotesChange = (e) => {
    const updated = updateRoll(id, { notes: e.target.value })
    setRoll(updated)
  }

  const handleDelete = () => {
    if (window.confirm("Delete this roll completely? This cannot be undone.")) {
      deleteRoll(id)
      navigate('/')
    }
  }

  const toggleFrame = (frameNum) => {
    const existing = frames.find(f => f.frame_number === frameNum)
    if (existing) {
      // If it has a note, open note modal. Else we could delete it, but let's just open modal
      setActiveFrame(existing)
    } else {
      // Mark as shot
      upsertFrame(id, frameNum, { note: '' })
      const newFrames = getFrames(id)
      setFrames(newFrames)
      const updated = updateRoll(id, { frames_shot: newFrames.length })
      setRoll(updated)
    }
  }

  const saveFrameNote = (e) => {
    e.preventDefault()
    const note = e.target.note.value
    upsertFrame(id, activeFrame.frame_number, { note })
    setFrames(getFrames(id))
    setActiveFrame(null)
  }

  return (
    <div className="min-h-screen pb-12">
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
        {/* Header Info */}
        <div>
          <h1 className="text-3xl font-bold mb-1">{roll.film_stock}</h1>
          <div className="flex gap-4 text-text-muted text-sm">
            <span>{roll.camera}</span>
            <span>•</span>
            <span>ISO {roll.iso} {roll.push_pull !== 0 && `(${roll.push_pull > 0 ? '+' : ''}${roll.push_pull})`}</span>
          </div>
        </div>

        {/* Frame Grid */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xs uppercase tracking-widest text-text-muted">Frame Counter</h2>
            <span className="text-xs font-bold text-accent">{frames.length} / {roll.frame_count}</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: roll.frame_count }).map((_, i) => {
              const frameNum = i + 1
              const frame = frames.find(f => f.frame_number === frameNum)
              const isShot = !!frame
              const hasNote = frame && frame.note.trim().length > 0

              return (
                <button
                  key={frameNum}
                  onClick={() => toggleFrame(frameNum)}
                  className={`
                    aspect-square rounded flex items-center justify-center text-xs font-medium transition-all
                    ${isShot ? 'bg-surface border-2 border-accent text-text shadow-[0_0_8px_rgba(239,159,39,0.3)]' : 'border border-border/50 text-text-muted hover:border-border'}
                  `}
                >
                  {hasNote ? <div className="w-2 h-2 rounded-full bg-accent" /> : frameNum}
                </button>
              )
            })}
          </div>
        </div>

        {/* Dev Timer Link */}
        <Link 
          to="/timer"
          className="block w-full bg-surface border border-border p-4 rounded-lg flex items-center justify-between group hover:border-accent transition-colors"
        >
          <div>
            <div className="font-bold mb-1 group-hover:text-accent transition-colors">Start Development</div>
            <div className="text-xs text-text-muted">Chemistry presets & timer</div>
          </div>
          <ArrowLeftIcon className="w-5 h-5 rotate-180 text-text-muted group-hover:text-accent transition-colors" />
        </Link>

        {/* Notes */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-2">Roll Notes</h2>
          <textarea
            value={roll.notes}
            onChange={handleNotesChange}
            placeholder="Push processing instructions, lighting conditions..."
            className="w-full bg-surface border border-border rounded-lg p-4 text-sm text-text focus:outline-none focus:border-accent min-h-[120px] resize-none transition-colors"
          />
        </div>

        {/* Delete */}
        <div className="pt-8">
          <button 
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-300 uppercase tracking-wider w-full text-center p-4 opacity-50 hover:opacity-100 transition-all"
          >
            Destroy Roll
          </button>
        </div>
      </div>

      {/* Frame Note Modal */}
      {activeFrame && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-primary/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-[390px] rounded-xl border border-border p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Frame {activeFrame.frame_number}</h2>
              <button onClick={() => setActiveFrame(null)} className="text-text-muted hover:text-text p-1">
                <CloseIcon />
              </button>
            </div>
            
            <form onSubmit={saveFrameNote} className="space-y-4">
              <div>
                <textarea 
                  name="note" 
                  defaultValue={activeFrame.note}
                  placeholder="Subject, settings, lighting..." 
                  className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors resize-none h-32"
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-accent text-primary font-bold py-3 rounded mt-2 hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Save Note
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
