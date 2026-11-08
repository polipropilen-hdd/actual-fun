// js/types/reading.js — текст для чтения (без оценки). Демонстрация минимального типа.

import { listField, textareaField, textField } from '../form/schema.js';

export default {
  id: 'reading',
  name: 'Текст для чтения',
  icon: '📖',
  color: 'sky',

  defaults: () => ({ heading: '', paragraphs: [''] }),

  schema: [
    textField('heading', 'Заголовок'),
    listField('paragraphs', 'Абзацы', [textareaField('_', 'Абзац')], {
      newItem: () => '',                 // элемент списка — просто строка
      itemIsPrimitive: true,
    }),
  ],

  normalize(data) {
    data.heading = String(data.heading ?? '').trim();
    if (!Array.isArray(data.paragraphs)) data.paragraphs = [];
    data.paragraphs = data.paragraphs.map((p) => String(p ?? '')).filter((p) => p.trim() !== '');
    return data;
  },

  validate(data) {
    const errs = [];
    if (!data.paragraphs.length) errs.push({ path: 'paragraphs', message: 'нет ни одного абзаца' });
    return errs;
  },

  isComplete(data) {
    return data.paragraphs.length > 0;
  },
};
