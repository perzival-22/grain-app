const ROLLS_KEY = 'grain_rolls'
const FRAMES_KEY = 'grain_frames'

function generateId() {
  return crypto.randomUUID()
}

export function getRolls() {
  try {
    return JSON.parse(localStorage.getItem(ROLLS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveRolls(rolls) {
  localStorage.setItem(ROLLS_KEY, JSON.stringify(rolls))
}

export function createRoll(data) {
  const rolls = getRolls()
  const roll = {
    id: generateId(),
    created_at: new Date().toISOString(),
    film_stock: data.film_stock || '',
    camera: data.camera || '',
    iso: data.iso || 400,
    push_pull: data.push_pull || 0,
    frames_shot: data.frames_shot || 0,
    frame_count: data.frame_count || 36,
    status: data.status || 'in_camera',
    notes: data.notes || '',
  }
  rolls.unshift(roll)
  saveRolls(rolls)
  return roll
}

export function updateRoll(id, data) {
  const rolls = getRolls()
  const idx = rolls.findIndex(r => r.id === id)
  if (idx === -1) return null
  rolls[idx] = { ...rolls[idx], ...data }
  saveRolls(rolls)
  return rolls[idx]
}

export function deleteRoll(id) {
  const rolls = getRolls().filter(r => r.id !== id)
  saveRolls(rolls)
  const frames = getFrames(id)
  const allFrames = JSON.parse(localStorage.getItem(FRAMES_KEY) || '[]')
  localStorage.setItem(FRAMES_KEY, JSON.stringify(allFrames.filter(f => f.roll_id !== id)))
}

export function getRollById(id) {
  return getRolls().find(r => r.id === id) || null
}

export function getFrames(rollId) {
  try {
    const all = JSON.parse(localStorage.getItem(FRAMES_KEY) || '[]')
    return all.filter(f => f.roll_id === rollId)
  } catch {
    return []
  }
}

export function upsertFrame(rollId, frameNumber, data) {
  const all = JSON.parse(localStorage.getItem(FRAMES_KEY) || '[]')
  const idx = all.findIndex(f => f.roll_id === rollId && f.frame_number === frameNumber)
  if (idx === -1) {
    const frame = {
      id: generateId(),
      roll_id: rollId,
      frame_number: frameNumber,
      note: data.note || '',
      shot_at: data.shot_at || new Date().toISOString(),
    }
    all.push(frame)
  } else {
    all[idx] = { ...all[idx], ...data }
  }
  localStorage.setItem(FRAMES_KEY, JSON.stringify(all))
}

export function deleteFrame(rollId, frameNumber) {
  const all = JSON.parse(localStorage.getItem(FRAMES_KEY) || '[]')
  localStorage.setItem(
    FRAMES_KEY,
    JSON.stringify(all.filter(f => !(f.roll_id === rollId && f.frame_number === frameNumber)))
  )
}
