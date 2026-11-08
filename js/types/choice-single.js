// js/types/choice-single.js — тест с одним вариантом ответа.

import { listField, textField } from '../form/schema.js';

export default {
  id: 'choice-single',
  name: 'Тест: один ответ',
  icon: '☑️',
  color: 'grass',

  defaults: () => ({ question: '', options: ['', ''], correct: 0 }),

  schema: [
    textField('question', 'Вопрос'),
    listField('options', 'Варианты', [textField('_', 'Вариант')], {
      itemIsPrimitive: true,
      newItem: () => '',
    }),
    { kind: 'number', key: 'correct', label: 'Номер верного варианта (с 1)', min: 1 },
  ],

  normalize(data) {
    data.question = String(data.question ?? '').trim();
    if (!Array.isArray(data.options)) data.options = [];
    data.options = data.options.map((o) => String(o ?? ''));
    // в JSON index 0-based; в форме показываем 1-based — конвертация на границе формы не нужна,
    // если договориться: поле correct хранит индекс; form-renderer number показывает как есть.
    data.correct = Number.isInteger(data.correct) ? data.correct : 0;
    return data;
  },

  validate(data) {
    const errs = [];
    if (!data.question) errs.push({ path: 'question', message: 'пустой вопрос' });
    const filled = data.options.filter((o) => o.trim() !== '');
    if (filled.length < 2) errs.push({ path: 'options', message: 'нужно минимум 2 непустых варианта' });
    if (data.correct < 0 || data.correct >= data.options.length)
      errs.push({ path: 'correct', message: `верный вариант ${data.correct + 1} вне диапазона (1..${data.options.length})` });
    else if (!data.options[data.correct]?.trim())
      errs.push({ path: 'correct', message: 'верный вариант пустой' });
    return errs;
  },

  isComplete(data) {
    return !!data.question && data.options.filter((o) => o.trim()).length >= 2;
  },
};
