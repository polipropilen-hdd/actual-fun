// js/form/render.js — общий генератор форм из DSL-схемы типа.
// renderForm(schema, data, onChange) -> HTMLElement. Правки всегда иммутабельны для родителя:
// onChange(newData). Никакого знания о конкретных типах здесь нет.

import { BLANK_MARK } from './schema.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

function setPath(obj, path, value) {
  // path вида "sentences[0].blanks[1].words" — упрощённый парсер сегментов
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
}

export function renderForm(schema, data, onChange) {
  const root = el('div', 'af-form');
  for (const field of schema) root.append(renderField(field, data, onChange));
  return root;
}

function renderField(field, data, onChange) {
  switch (field.kind) {
    case 'text': return wrap(field, inputEl('text', data[field.key] ?? '', field, onChange, (v) => v));
    case 'textarea': return wrap(field, inputEl('textarea', data[field.key] ?? '', field, onChange, (v) => v));
    case 'number': return wrap(field, inputEl('number', data[field.key] ?? 0, field, onChange, (v) => (v === '' ? 0 : Number(v))));
    case 'checkbox': {
      const box = inputEl('checkbox', !!data[field.key], field, onChange, (v) => v);
      return wrapInline(field, box);
    }
    case 'select': {
      const sel = el('select', 'af-input');
      for (const opt of field.options || []) {
        const o = el('option'); o.value = opt.value; o.textContent = opt.label;
        if (String(data[field.key]) === String(opt.value)) o.selected = true;
        sel.append(o);
      }
      sel.onchange = () => onChange(applyChange(data, field.key, sel.value));
      return wrap(field, sel);
    }
    case 'csv': {
      const val = Array.isArray(data[field.key]) ? data[field.key].join(', ') : '';
      return wrap(field, inputEl('text', val, field, onChange, (v) => splitCsv(v), 'csv'));
    }
    case 'group': {
      const g = el('div', 'af-group');
      if (field.label) g.append(el('div', 'af-group-title', field.label));
      for (const f of field.fields) g.append(renderField(f, data, onChange));
      return g;
    }
    case 'list': return renderList(field, data, onChange);
    default: return el('div', 'af-error', `Неизвестный вид поля: ${field.kind}`);
  }
}

/** Иммутабельная запись значения по ключу (для примитивных полей верхнего уровня). */
function applyChange(data, key, value) {
  const next = structuredClone(data);
  next[key] = value;
  return next;
}

function splitCsv(s) {
  return s.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
}

function inputEl(type, value, field, onChange, cast, extraCls = '') {
  const isT = type === 'textarea';
  const inp = el(isT ? 'textarea' : 'input', `af-input ${extraCls}`.trim());
  if (isT) { inp.value = value; inp.rows = 3; }
  else if (type === 'checkbox') { inp.type = 'checkbox'; inp.checked = !!value; }
  else { inp.type = type === 'number' ? 'number' : 'text'; inp.value = value; }
  if (field.placeholder && !isT) inp.placeholder = field.placeholder;
  if (field.min != null) inp.min = field.min;
  const handler = () => onChange(cast(isT || type === 'text' || type === 'csv' ? inp.value : (type === 'checkbox' ? inp.checked : inp.value)));
  inp.addEventListener(isT || type === 'csv' ? 'input' : 'change', handler);
  return inp;
}

function wrap(field, node) {
  const w = el('label', 'af-field');
  w.append(el('span', 'af-label', field.label));
  w.append(node);
  if (field.hint) w.append(el('span', 'af-hint', field.hint));
  return w;
}

function wrapInline(field, node) {
  const w = el('label', 'af-field af-field-inline');
  w.append(node, el('span', 'af-label', field.label));
  return w;
}

// ---------- повторяемый список ----------

function renderList(field, data, onChange) {
  const box = el('div', 'af-list');
  box.append(el('div', 'af-label', field.label));
  const arrKey = field.key;
  const list = Array.isArray(data[arrKey]) ? data[arrKey] : [];

  list.forEach((item, idx) => {
    const row = el('div', 'af-list-item');
    row.append(el('div', 'af-list-num', String(idx + 1)));

    const controls = el('div', 'af-list-controls');
    const mk = (txt, fn, disabled) => {
      const b = el('button', 'af-mini-btn', txt); b.type = 'button'; b.disabled = !!disabled; b.onclick = fn; return b;
    };
    controls.append(
      mk('↑', () => onChange(move(list, idx, -1)), idx === 0),
      mk('↓', () => onChange(move(list, idx, 1)), idx === list.length - 1),
      mk('✕', () => { const n = list.slice(); n.splice(idx, 1); onChange(setArr(data, arrKey, n)); }),
    );
    row.append(controls);

    const body = el('div', 'af-list-body');
    if (field.itemIsPrimitive) {
      body.append(inputEl(field.item[0]?.kind === 'textarea' ? 'textarea' : 'text', item, field.item[0] || {}, (v) => {
        const n = list.slice(); n[idx] = v; onChange(setArr(data, arrKey, n));
      }, (v) => v));
    } else {
      body.append(renderForm(field.item, item, (newItem) => {
        const n = list.slice(); n[idx] = newItem; onChange(setArr(data, arrKey, n));
      }));
    }
    row.append(body);
    box.append(row);
  });

  const add = el('button', 'af-add-btn', '+ Добавить');
  add.type = 'button';
  add.onclick = () => onChange(setArr(data, arrKey, [...list, field.newItem ? field.newItem() : {}]));
  box.append(add);
  return box;
}

function move(arr, i, d) {
  const n = arr.slice(); const j = i + d;
  if (j < 0 || j >= n.length) return n;
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

function setArr(data, key, value) {
  const next = structuredClone(data);
  next[key] = value;
  return next;
}

export { BLANK_MARK };
