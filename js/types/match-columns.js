// js/types/match-columns.js — соединение элементов из двух колонок, строго 1 к 1.
// Данные: { pairs:[{ left, right }] }

import { listField, textField } from '../form/schema.js';

export default {
  id: 'match-columns',
  name: 'Соедини колонки',
  icon: '🔗',
  color: 'sky',

  defaults: () => ({ pairs: [{ left: '', right: '' }, { left: '', right: '' }] }),

  schema: [
    listField('pairs', 'Пары', [
      textField('left', 'Левая колонка'),
      textField('right', 'Правая колонка'),
    ], { newItem: () => ({ left: '', right: '' }) }),
  ],

  normalize(data) {
    if (!Array.isArray(data.pairs)) data.pairs = [];
    for (const p of data.pairs) {
      p.left = String(p.left ?? '').trim();
      p.right = String(p.right ?? '').trim();
    }
    return data;
  },

  validate(data) {
    const errs = [];
    const filled = data.pairs.filter((p) => p.left || p.right);
    if (filled.length < 2) return [{ path: 'pairs', message: 'нужно минимум 2 заполненные пары' }];
    for (const key of ['left', 'right']) {
      const vals = filled.map((p) => p[key]);
      const dup = vals.filter((v, i) => v && vals.indexOf(v) !== i);
      if (dup.length)
        errs.push({ path: 'pairs', message: `дубли в колонке «${key === 'left' ? 'левая' : 'правая'}»: ${[...new Set(dup)].join(', ')} (режим 1 к 1)` });
    }
    filled.forEach((p, i) => {
      if (!p.left || !p.right) errs.push({ path: `pairs[${i}]`, message: `пара ${i + 1}: заполнена только одна сторона` });
    });
    return errs;
  },

  isComplete(data) {
    return this.validate(data).length === 0 && data.pairs.some((p) => p.left && p.right);
  },
};
