// js/types/registry.js — реестр типов упражнений.
// Ядро (core/*) не знает ни об одном типе; UI и рантайм спрашивают типы только здесь.
//
// Контракт дескриптора типа (см. ARCHITECTURE.md §3):
//   { id, name, icon, color?, defaults(), schema[], normalize(data), validate(data), isComplete(data) }

const types = new Map();
const order = [];

export function addType(desc) {
  if (!desc || !desc.id) throw new Error('Тип без id');
  if (types.has(desc.id)) throw new Error(`Дубликат типа: ${desc.id}`);
  types.set(desc.id, desc);
  order.push(desc.id);
}

export function getType(id) { return types.get(id) || null; }
export function hasType(id) { return types.has(id); }
export function listTypes() { return order.map((id) => types.get(id)); }

/** Прогон normalize+validate по всем блокам документа; возвращает список ошибок {blockId, message}. */
export function validateDoc(doc) {
  const out = [];
  for (const block of doc.blocks) {
    const t = getType(block.type);
    if (!t) {
      out.push({ blockId: block.id, level: 'warn', message: `Блок «${block.title || block.id}»: неизвестный тип «${block.type}» — в игроке будет пропущен` });
      continue;
    }
    try { t.normalize?.(block.data); } catch (e) {
      out.push({ blockId: block.id, level: 'error', message: `Блок «${block.title || block.id}»: не удалось привести данные (${e.message})` });
      continue;
    }
    for (const err of t.validate?.(block.data) ?? []) {
      out.push({ blockId: block.id, level: 'error', message: `Блок «${block.title || block.id}» (${block.type}): ${err.message}` });
    }
    if (t.isComplete && !t.isComplete(block.data)) {
      out.push({ blockId: block.id, level: 'error', message: `Блок «${block.title || block.id}» (${block.type}): заполнен не полностью` });
    }
  }
  return out;
}
