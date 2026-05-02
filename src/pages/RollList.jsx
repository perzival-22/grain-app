import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRolls, createRoll } from '../lib/localStorage'
import { PlusIcon, CloseIcon } from '../components/Icons'

export default function RollList() {
  const [rolls, setRolls] = useState([])
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setRolls(getRolls())
  }, [])

  return (
    <div className="relative min-h-[100dvh] pb-24">
      <header className="p-6 border-b border-border/30 sticky top-0 bg-primary/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold tracking-widest text-accent">GRAIN</h1>
        <p className="text-text-muted text-xs mt-1 uppercase tracking-wider">Film Tracker</p>
      </header>

      <div className="p-6 space-y-4">
        {rolls.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="w-16 h-16 border border-dashed border-border rounded mx-auto mb-4 flex items-center justify-center">
              <span className="text-border">35mm</span>
            </div>
            <p className="text-text-muted text-sm">No rolls loaded.</p>
          </div>
        ) : (
          rolls.map(roll => (
            <Link 
              key={roll.id} 
              to={`/roll/${roll.id}`}
              className="block bg-surface p-5 rounded-lg border border-border/50 hover:border-accent/50 transition-colors group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{roll.film_stock || 'Unknown Film'}</h3>
                  <p className="text-text-muted text-sm">{roll.camera || 'Unknown Camera'} • ISO {roll.iso}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-primary px-2 py-1 rounded text-accent font-medium tracking-wide uppercase">
                    {roll.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-primary h-1 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-accent h-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, (roll.frames_shot / roll.frame_count) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-right text-xs text-text-muted">
                {roll.frames_shot} / {roll.frame_count} frames
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-1/2 translate-x-[180px] w-14 h-14 bg-accent rounded-full flex items-center justify-center text-primary shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <PlusIcon />
      </button>

      {/* Add Roll Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-primary/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-[390px] rounded-xl border border-border p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Load New Roll</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text p-1">
                <CloseIcon />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.target)
                const newRoll = createRoll({
                  film_stock: fd.get('film_stock'),
                  camera: fd.get('camera'),
                  iso: Number(fd.get('iso')),
                  frame_count: Number(fd.get('frame_count')),
                })
                setRolls(getRolls())
                setShowModal(false)
                navigate(`/roll/${newRoll.id}`)
              }}
              className="space-y-4"
            >
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
                    defaultValue="400"
                    className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1 uppercase tracking-wider">Frames</label>
                  <select 
                    name="frame_count" 
                    defaultValue="36"
                    className="w-full bg-primary border border-border rounded p-3 text-text focus:outline-none focus:border-accent transition-colors appearance-none"
                  >
                    <option value="24">24</option>
                    <option value="36">36</option>
                    <option value="120">12 (Medium Format)</option>
                  </select>
                </div>
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
