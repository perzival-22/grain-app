/**
 * dataService.js — Unified data layer for Grain
 *
 * Every exported function is async. Strategy:
 *   1. If Supabase is configured, read/write there AND mirror to localStorage.
 *   2. If Supabase is not configured (no env vars) or a call fails, fall back to localStorage.
 *
 * This means the app works fully offline out of the box, and gains cloud sync
 * the moment you add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to Replit Secrets.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import {
  getRolls as lsGetRolls,
  getRollById as lsGetRollById,
  createRoll as lsCreateRoll,
  updateRoll as lsUpdateRoll,
  deleteRoll as lsDeleteRoll,
  getFrames as lsGetFrames,
  upsertFrame as lsUpsertFrame,
  deleteFrame as lsDeleteFrame,
  saveRolls,
} from './localStorage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sbError(label, error) {
  console.warn(`[dataService] Supabase ${label} failed, falling back to localStorage:`, error?.message)
}

// ─── Rolls ────────────────────────────────────────────────────────────────────

/**
 * Fetch all rolls, newest first.
 * @returns {Promise<Roll[]>}
 */
export async function getRolls() {
  if (!isSupabaseConfigured) return lsGetRolls()
  try {
    const { data, error } = await supabase
      .from('rolls')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    // Mirror into localStorage so offline reads stay fresh
    saveRolls(data)
    return data
  } catch (e) {
    sbError('getRolls', e)
    return lsGetRolls()
  }
}

/**
 * Fetch a single roll by id.
 * @param {string} id
 * @returns {Promise<Roll|null>}
 */
export async function getRollById(id) {
  if (!isSupabaseConfigured) return lsGetRollById(id)
  try {
    const { data, error } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  } catch (e) {
    sbError('getRollById', e)
    return lsGetRollById(id)
  }
}

/**
 * Create a new roll.
 * @param {Partial<Roll>} rollData
 * @returns {Promise<Roll>}
 */
export async function createRoll(rollData) {
  // Always write to localStorage immediately for optimistic UI
  const localRoll = lsCreateRoll(rollData)

  if (!isSupabaseConfigured) return localRoll
  try {
    const { data, error } = await supabase
      .from('rolls')
      .insert([{
        film_stock: rollData.film_stock || '',
        camera: rollData.camera || '',
        iso: rollData.iso || 400,
        push_pull: rollData.push_pull ?? 0,
        frames_shot: 0,
        frame_count: rollData.frame_count || 36,
        status: 'in_camera',
        notes: rollData.notes || '',
      }])
      .select()
      .single()
    if (error) throw error
    // Replace the local roll (different id) with the Supabase one
    const rolls = lsGetRolls()
    const idx = rolls.findIndex(r => r.id === localRoll.id)
    if (idx !== -1) {
      rolls[idx] = data
      saveRolls(rolls)
    }
    return data
  } catch (e) {
    sbError('createRoll', e)
    return localRoll
  }
}

/**
 * Update fields on an existing roll.
 * @param {string} id
 * @param {Partial<Roll>} updates
 * @returns {Promise<Roll|null>}
 */
export async function updateRoll(id, updates) {
  // Optimistic local update
  const localRoll = lsUpdateRoll(id, updates)

  if (!isSupabaseConfigured) return localRoll
  try {
    const { data, error } = await supabase
      .from('rolls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    lsUpdateRoll(id, data)
    return data
  } catch (e) {
    sbError('updateRoll', e)
    return localRoll
  }
}

/**
 * Delete a roll and all its frames.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteRoll(id) {
  lsDeleteRoll(id)

  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from('rolls')
      .delete()
      .eq('id', id)
    if (error) throw error
  } catch (e) {
    sbError('deleteRoll', e)
  }
}

// ─── Frames ───────────────────────────────────────────────────────────────────

/**
 * Fetch all frames for a roll.
 * @param {string} rollId
 * @returns {Promise<Frame[]>}
 */
export async function getFrames(rollId) {
  if (!isSupabaseConfigured) return lsGetFrames(rollId)
  try {
    const { data, error } = await supabase
      .from('frames')
      .select('*')
      .eq('roll_id', rollId)
      .order('frame_number', { ascending: true })
    if (error) throw error
    return data
  } catch (e) {
    sbError('getFrames', e)
    return lsGetFrames(rollId)
  }
}

/**
 * Create or update a frame record.
 * @param {string} rollId
 * @param {number} frameNumber
 * @param {{ note?: string, shot_at?: string }} frameData
 * @returns {Promise<void>}
 */
export async function upsertFrame(rollId, frameNumber, frameData) {
  lsUpsertFrame(rollId, frameNumber, frameData)

  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from('frames')
      .upsert({
        roll_id: rollId,
        frame_number: frameNumber,
        note: frameData.note ?? '',
        shot_at: frameData.shot_at ?? new Date().toISOString(),
      }, { onConflict: 'roll_id,frame_number' })
    if (error) throw error
  } catch (e) {
    sbError('upsertFrame', e)
  }
}

/**
 * Delete a frame (unmark it as shot).
 * @param {string} rollId
 * @param {number} frameNumber
 * @returns {Promise<void>}
 */
export async function deleteFrame(rollId, frameNumber) {
  lsDeleteFrame(rollId, frameNumber)

  if (!isSupabaseConfigured) return
  try {
    const { error } = await supabase
      .from('frames')
      .delete()
      .eq('roll_id', rollId)
      .eq('frame_number', frameNumber)
    if (error) throw error
  } catch (e) {
    sbError('deleteFrame', e)
  }
}
