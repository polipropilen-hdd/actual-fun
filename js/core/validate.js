// js/core/validate.js — проверка загружаемого JSON (внешний «API» для нейросетей).
// Возвращает { ok, doc?, errors:[{path,message}], warnings:[...] }. Ошибки не чиним молча — отдаём список.

import { FORMAT, MAX_BLOCKS } from './document.js';
import { getType } from '../types/registry.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function parseDocument(text) {
  const errors = [];
  const warnings = [];

  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [{ path: '', message: `Файл не является корректным JSON: ${e.message}` }], warnings };
  }

  if (!isObj(raw)) return { ok: false, errors: [{ path: '', message: 'Ожидался JSON-объект с полями format/version/blocks' }], warnings };

  if (raw.format !== FORMAT)
    return { ok: false, errors: [{ path: 'format', message: `Поле format должно быть «${FORMAT}», найдено «${raw.format}»` }], warnings };

  if (typeof raw.version !== 'number') warnings.push({ path: 'version', message: 'нет числового поля version — считаем версию 1' });

  const meta = isObj(raw.meta) ? raw.meta : {};
  if (!isObj(raw.meta)) warnings.push({ path: 'meta', message: 'нет объекта meta — подставлены значения по умолчанию' });

  const settings = { showResultScreen: true, shuffleBlocks: false, theme: 'light', ...(isObj(raw.settings) ? raw.settings : {}) };
  if (settings.theme !== 'dark') settings.theme = 'light';
  settings.showResultScreen = !!settings.showResultScreen;
  settings.shuffleBlocks = !!settings.shuffleBlocks;

  if (!Array.isArray(raw.blocks))
    return { ok: false, errors: [{ path: 'blocks', message: 'Поле blocks должно быть массивом' }], warnings };

  if (raw.blocks.length > MAX_BLOCKS)
    errors.push({ path: 'blocks', message: `Блоков ${raw.blocks.length}, максимум ${MAX_BLOCKS}` });

  const seenIds = new Set();
  const blocks = raw.blocks.map((b, i) => {
    const tag = `Блок ${i + 1}`;
    if (!isObj(b)) { errors.push({ path: `blocks[${i}]`, message: `${tag}: ожидался объект` }); return null; }
    if (typeof b.type !== 'string' || !b.type) { errors.push({ path: `blocks[${i}].type`, message: `${tag}: нет поля type` }); return null; }
    const t = getType(b.type);
    if (!t) warnings.push({ path: `blocks[${i}].type`, message: `${tag}: неизвестный тип «${b.type}» — данные сохранены, блок будет пропущен в игроке` });

    let id = typeof b.id === 'string' && b.id ? b.id : `b${i + 1}`;
    while (seenIds.has(id)) id += '_';
    seenIds.add(id);

    let data = isObj(b.data) ? structuredClone(b.data) : {};
    if (t) {
      try { data = t.normalize(structuredClone(b.data ?? {})); } catch (e) {
        errors.push({ path: `blocks[${i}].data`, message: `${tag} (${b.type}): ${e.message}` });
      }
      for (const err of t.validate?.(data) ?? [])
        errors.push({ path: `blocks[${i}].data.${err.path}`, message: `${tag} (${b.type}): ${err.message}` });
    }

    return { id, type: b.type, title: String(b.title ?? ''), instruction: String(b.instruction ?? ''), data };
  }).filter(Boolean);

  const doc = {
    format: FORMAT,
    version: typeof raw.version === 'number' ? raw.version : 1,
    meta: {
      title: String(meta.title ?? ''),
      language: 'ru',
      description: String(meta.description ?? ''),
      author: String(meta.author ?? ''),
    },
    settings,
    blocks,
  };

  return { ok: errors.length === 0, doc, errors, warnings };
}
