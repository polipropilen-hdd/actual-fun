// core/state.js — единое состояние конструктора + pub/sub + автосейв в localStorage.

import { createDocument, serialize } from './document.js';

const STORAGE_KEY = 'actual-fun:project:v1';
const SAVE_DEBOUNCE_MS = 600;

const listeners = new Set();
let doc = createDocument();
let selectedBlockId = null;
let saveTimer = null;

function emit(event) {
  for (const fn of listeners) {
    try { fn(event, doc); } catch (e) { console.error('state listener error', e); }
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDoc() { return doc; }
export function setDoc(next) {
  doc = next;
  selectedBlockId = doc.blocks[0]?.id ?? null;
  emit('doc');
  scheduleSave();
}

export function getSelectedBlockId() { return selectedBlockId; }
export function selectBlock(id) {
  if (id === selectedBlockId) return;
  selectedBlockId = id;
  emit('select');
}

/** Мутируем документ через fn, затем уведомляем. Основа всех правок из UI. */
export function update(fn, event = 'doc') {
  fn(doc);
  emit(event);
  scheduleSave();
}

// ---------- persistence ----------

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
}

export function saveNow() {
  try { localStorage.setItem(STORAGE_KEY, serialize(doc)); } catch (e) { /* quota / private mode */ }
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
      setDoc(parsed);
      return true;
    }
  } catch (e) { /* повреждённый кэш — молча игнорируем */ }
  return false;
}

export function clearSaved() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
}

export function resetDoc() {
  clearSaved();
  setDoc(createDocument());
}
