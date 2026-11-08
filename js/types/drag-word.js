// js/types/drag-word.js — перетаскивание слова в пропуск (многопропускные предложения).
// Данные: { wordBank:'per-blank'|'shared', sentences:[{ text, blanks:[{answer, words[]}] }] }

import { csvField, listField, textField } from '../form/schema.js';

export default {
  id: 'drag-word',
  name: 'Слово в пропуск',
  icon: '🧩',
  color: 'accent',

  defaults: () => ({
    wordBank: 'per-blank',
    sentences: [{ text: '', blanks: [{ answer: '', words: [''] }] }],
  }),

  schema: [
    {
      kind: 'select', key: 'wordBank', label: 'Банк слов',
      options: [
        { value: 'per-blank', label: 'Отдельный набор для каждого пропуска' },
        { value: 'shared', label: 'Общий банк на предложение' },
      ],
    },
    listField('sentences', 'Предложения', [
      textField('text', 'Предложение (пропуск = ___)', { placeholder: 'Я читаю ___ каждый день.' }),
      listField('blanks', 'Пропуски', [
        textField('answer', 'Верное слово'),
        csvField('words', 'Слова для выбора', { hint: 'через пробел или запятую; первое — обычно верное' }),
      ], { newItem: () => ({ answer: '', words: [''] }) }),
    ], { newItem: () => ({ text: '', blanks: [{ answer: '', words: [''] }] }) }),
  ],

  normalize(data) {
    if (data.wordBank !== 'shared') data.wordBank = 'per-blank';
    if (!Array.isArray(data.sentences)) data.sentences = [];
    for (const s of data.sentences) {
      s.text = String(s.text ?? '');
      if (!Array.isArray(s.blanks)) s.blanks = [];
      for (const b of s.blanks) {
        b.answer = String(b.answer ?? '').trim();
        if (!Array.isArray(b.words)) b.words = [];
        b.words = b.words.map((w) => String(w ?? '').trim()).filter(Boolean);
      }
    }
    return data;
  },

  validate(data) {
    const errs = [];
    if (!data.sentences.length) return [{ path: 'sentences', message: 'нет ни одного предложения' }];
    data.sentences.forEach((s, si) => {
      const nBlanks = (s.text.match(/_{3,}/g) || []).length;
      const tag = `предложение ${si + 1}`;
      if (!s.text.trim()) { errs.push({ path: `sentences[${si}].text`, message: `${tag}: пустое` }); return; }
      if (nBlanks === 0) errs.push({ path: `sentences[${si}].text`, message: `${tag}: нет ни одного пропуска «___»` });
      if (nBlanks !== s.blanks.length)
        errs.push({ path: `sentences[${si}].blanks`, message: `${tag}: пропусков в тексте ${nBlanks}, а описано ${s.blanks.length}` });
      s.blanks.forEach((b, bi) => {
        const bt = `${tag}, пропуск ${bi + 1}`;
        if (!b.answer) errs.push({ path: `sentences[${si}].blanks[${bi}].answer`, message: `${bt}: не указано верное слово` });
        else if (!b.words.includes(b.answer))
          errs.push({ path: `sentences[${si}].blanks[${bi}].words`, message: `${bt}: верное слово «${b.answer}» отсутствует среди вариантов` });
        if (b.words.length < 2) errs.push({ path: `sentences[${si}].blanks[${bi}].words`, message: `${bt}: нужно минимум 2 слова (ответ + дистрактор)` });
      });
    });
    return errs;
  },

  isComplete(data) {
    return data.sentences.length > 0 && this.validate(data).length === 0;
  },
};
