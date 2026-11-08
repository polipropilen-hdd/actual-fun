// js/types/choice-multi.js — тест с множественным выбором.

import { listField, textField } from '../form/schema.js';

export default {
  id: 'choice-multi',
  name: 'Тест: несколько ответов',
  icon: '📋',
  color: 'berry',

  defaults: () => ({ question: '', options: ['', '', ''], correct: [0], scoring: 'exact' }),

  schema: [
    textField('question', 'Вопрос'),
    listField('options', 'Варианты', [textField('_', 'Вариант')], { itemIsPrimitive: true, newItem: () => '' }),
    { kind: 'csv', key: 'correct', label: 'Верные варианты (номера через запятую, с 1)', hint: 'например: 1, 3' },
    {
      kind: 'select', key: 'scoring', label: 'Подсчёт баллов',
      options: [
        { value: 'exact', label: 'Точное совпадение (весь балл или ноль)' },
        { value: 'partial', label: 'Частичный (минус за лишние отметки)' },
      ],
    },
  ],

  normalize(data) {
    data.question = String(data.question ?? '').trim();
    if (!Array.isArray(data.options)) data.options = [];
    data.options = data.options.map((o) => String(o ?? ''));
    if (!Array.isArray(data.correct)) data.correct = [];
    data.correct = [...new Set(data.correct.map(Number).filter((n) => Number.isInteger(n)))].sort((a, b) => a - b);
    if (data.scoring !== 'partial') data.scoring = 'exact';
    return data;
  },

  validate(data) {
    const errs = [];
    if (!data.question) errs.push({ path: 'question', message: 'пустой вопрос' });
    if (data.options.filter((o) => o.trim()).length < 2)
      errs.push({ path: 'options', message: 'нужно минимум 2 непустых варианта' });
    if (!data.correct.length) errs.push({ path: 'correct', message: 'не отмечен ни один верный вариант' });
    for (const i of data.correct) {
      if (i < 0 || i >= data.options.length)
        errs.push({ path: 'correct', message: `номер ${i + 1} вне диапазона (1..${data.options.length})` });
      else if (!data.options[i].trim())
        errs.push({ path: 'correct', message: `верный вариант №${i + 1} пустой` });
    }
    if (data.correct.length >= data.options.filter((o) => o.trim()).length)
      errs.push({ path: 'correct', message: 'отмечены все варианты — должен быть хотя бы один неверный' });
    return errs;
  },

  isComplete(data) {
    return !!data.question && data.options.filter((o) => o.trim()).length >= 2 && data.correct.length > 0;
  },
};
