// js/types/drag-parts.js — соберите предложение из частей (порядок слов).
// Данные: { items:[{ parts:string[] /*верный порядок*/, translation? }] }

import { csvField, listField, textField } from '../form/schema.js';

export default {
  id: 'drag-parts',
  name: 'Части предложения',
  icon: '🔤',
  color: 'sun',

  defaults: () => ({ items: [{ parts: ['', '', ''], translation: '' }] }),

  schema: [
    listField('items', 'Предложения', [
      csvField('parts', 'Части в верном порядке', { hint: 'через пробел или запятую; слева направо' }),
      textField('translation', 'Перевод (необязательно)'),
    ], { newItem: () => ({ parts: ['', '', ''], translation: '' }) }),
  ],

  normalize(data) {
    if (!Array.isArray(data.items)) data.items = [];
    for (const it of data.items) {
      if (!Array.isArray(it.parts)) it.parts = [];
      it.parts = it.parts.map((p) => String(p ?? '').trim()).filter(Boolean);
      it.translation = String(it.translation ?? '').trim();
    }
    return data;
  },

  validate(data) {
    const errs = [];
    if (!data.items.length) return [{ path: 'items', message: 'нет ни одного предложения' }];
    data.items.forEach((it, i) => {
      const tag = `предложение ${i + 1}`;
      if (it.parts.length < 2) errs.push({ path: `items[${i}].parts`, message: `${tag}: нужно минимум 2 части` });
      const dup = it.parts.filter((p, j) => it.parts.indexOf(p) !== j);
      if (dup.length) errs.push({ path: `items[${i}].parts`, message: `${tag}: одинаковые части (${dup.join(', ')}) — ученик не различит порядок` });
    });
    return errs;
  },

  isComplete(data) {
    return data.items.length > 0 && this.validate(data).length === 0;
  },
};
