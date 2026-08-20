import { supabase } from './supabaseClient.js'

function mapLesson(row) {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

function mapConcept(row) {
  return {
    id: row.id,
    title: row.title,
    facts: Array.isArray(row.facts) ? row.facts : [],
    lessonId: row.lesson_id ?? null,
  }
}

export async function getLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(mapLesson)
}

export async function addLesson(name) {
  const { data, error } = await supabase
    .from('lessons')
    .insert({ name })
    .select('id, name, created_at')
    .maybeSingle()
  if (error) throw error
  return mapLesson(data)
}

export async function updateLesson(id, name) {
  const { data, error } = await supabase
    .from('lessons')
    .update({ name })
    .eq('id', id)
    .select('id, name, created_at')
    .maybeSingle()
  if (error) throw error
  return data ? mapLesson(data) : null
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lessons').delete().eq('id', id)
  if (error) throw error
}

export async function getConcepts() {
  const { data, error } = await supabase
    .from('concepts')
    .select('id, title, facts, lesson_id, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(mapConcept)
}

export async function addConcept(title, facts, lessonId) {
  const { data, error } = await supabase
    .from('concepts')
    .insert({ title, facts, lesson_id: lessonId || null })
    .select('id, title, facts, lesson_id, created_at')
    .maybeSingle()
  if (error) throw error
  return mapConcept(data)
}

export async function updateConcept(id, title, facts, lessonId) {
  const { data, error } = await supabase
    .from('concepts')
    .update({ title, facts, lesson_id: lessonId || null })
    .eq('id', id)
    .select('id, title, facts, lesson_id, created_at')
    .maybeSingle()
  if (error) throw error
  return data ? mapConcept(data) : null
}

export async function deleteConcept(id) {
  const { error } = await supabase.from('concepts').delete().eq('id', id)
  if (error) throw error
}

function mapMapPin(row) {
  return {
    id: row.id,
    title: row.title,
    facts: Array.isArray(row.facts) ? row.facts : [],
    pins: Array.isArray(row.pins) ? row.pins : [],
    showLabels: !!row.show_labels,
  }
}

export async function getMapPins() {
  const { data, error } = await supabase
    .from('map_pins')
    .select('id, title, facts, pins, show_labels, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(mapMapPin)
}

export async function addMapPin(title, facts, pins, showLabels) {
  const { data, error } = await supabase
    .from('map_pins')
    .insert({ title, facts, pins: pins || [], show_labels: showLabels || false, x: 0, y: 0 })
    .select('id, title, facts, pins, show_labels, created_at')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Kayıt eklenemedi: veritabanı boş yanıt döndü.')
  return mapMapPin(data)
}

export async function updateMapPin(id, title, facts, pins, showLabels) {
  const { data, error } = await supabase
    .from('map_pins')
    .update({ title, facts, pins, show_labels: showLabels || false })
    .eq('id', id)
    .select('id, title, facts, pins, show_labels, created_at')
    .maybeSingle()
  if (error) throw error
  return data ? mapMapPin(data) : null
}

export async function deleteMapPin(id) {
  const { error } = await supabase.from('map_pins').delete().eq('id', id)
  if (error) throw error
}
