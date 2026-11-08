// core/document.js — модель ExerciseDocument. Не знает ни об одном типе упражнений.
// Знание о типах живёт в js/types/registry.js; документ хранит только «сырые» блоки.

export const FORMAT = 'lingua-exercise/1';
export const DOC_VERSION = 1;
export const MAX_BLOCKS = 20;

let seq = 0;
export function genId(prefix = 'b') {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}_${seq.toString(36)}`;
}

/** Новый пустой документ. */
export function createDocument(meta = {}) {
  return {
    format: FORMAT,
    version: DOC_VERSION,
    meta: {
      title: meta.title ?? '',
      language: 'ru',
      description: meta.description ?? '',
      author: meta.author ?? '',
    },
    settings: {
      showResultScreen: true,
      shuffleBlocks: false,
      theme: 'light', // light | dark
      ...(meta.settings || {}),
    },
    blocks: [],
  };
}

/** Каркас блока; data заполняет вызывающий (обычно registry.getType(type).defaults()). */
export function createBlock(type, data = {}, extra = {}) {
  return {
    id: genId(),
    type,
    title: extra.title ?? '',
    instruction: extra.instruction ?? '',
    data,
  };
}

export function addBlock(doc, block) {
  if (doc.blocks.length >= MAX_BLOCKS) {
    throw new Error(`Максимум ${MAX_BLOCKS} блоков в одном экспорте`);
  }
  doc.blocks.push(block);
  return block;
}

export function removeBlock(doc, id) {
  const i = doc.blocks.findIndex((b) => b.id === id);
  if (i >= 0) doc.blocks.splice(i, 1);
  return i >= 0;
}

export function moveBlock(doc, id, delta) {
  const i = doc.blocks.findIndex((b) => b.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= doc.blocks.length) return false;
  const [b] = doc.blocks.splice(i, 1);
  doc.blocks.splice(j, 0, b);
  return true;
}

export function findBlock(doc, id) {
  return doc.blocks.find((b) => b.id === id) || null;
}

/** Клонирование блока с новым id (для кнопки «дублировать»). */
export function cloneBlock(block) {
  const copy = JSON.parse(JSON.stringify(block));
  copy.id = genId();
  return copy;
}

/** Серийализация проекта в JSON-строку (детерминированный порядок полей не гарантируется — это ок). */
export function serialize(doc) {
  return JSON.stringify(doc, null, 2);
}
