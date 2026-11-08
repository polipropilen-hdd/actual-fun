// runtime/interactions/drag-parts.js — собрать предложение из частей: тап по чипу добавляет в линию,
// тап по части в линии возвращает её в банк. Оценка 1 балл за item при полностью верном порядке.

import { shuffle } from '../scoring.js';

export default {
  id: 'drag-parts',
  scoreMax(block) { return (block.data.items || []).length; },

  mount(container, block) {
    const items = [];
    for (const it of block.data.items || []) {
      if (!it.parts?.length) continue;
      const row = el('div', 'af-dp-row');
      const line = el('div', 'af-line');           // куда кладём
      const bank = el('div', 'af-bank');           // откуда берём
      line.setAttribute('aria-label', 'Ваш порядок слов');

      const chips = new Map();
      shuffle(it.parts.map((p, i) => ({ p, i }))).forEach(({ p }) => {
        const c = el('button', 'af-chip', p);
        c.type = 'button';
        c.onclick = () => {
          if (row.classList.contains('checked')) return;
          if (c.parentElement === line) { bank.append(c); }   // убрать из линии
          else { line.append(c); }                             // добавить в конец линии
        };
        chips.set(p, c);
        bank.append(c);
      });

      row.append(line, bank);
      if (it.translation) row.append(el('div', 'af-translation', it.translation));
      container.append(row);
      items.push({ row, line, correct: it.parts.map((p) => p.toLowerCase()) });
    }

    return {
      check() {
        let earned = 0;
        for (const it of items) {
          const got = [...it.line.children].map((c) => c.textContent.trim().toLowerCase());
          const ok = got.length === it.correct.length && got.every((x, i) => x === it.correct[i]);
          it.row.classList.add('checked');
          it.line.classList.toggle('correct', ok);
          it.line.classList.toggle('wrong', !ok);
          if (ok) earned += 1;
        }
        return { earned };
      },
      reveal() {
        for (const it of items) {
          it.line.replaceChildren();
          for (const p of it.correct) {
            const chip = [...it.row.querySelectorAll('.af-chip')].find((c) => c.textContent.trim().toLowerCase() === p);
            if (chip) it.line.append(chip);
          }
          it.line.classList.add('correct', 'revealed');
        }
      },
      reset() {
        for (const it of items) {
          const bank = it.row.querySelector('.af-bank');
          [...it.line.children].forEach((c) => bank.append(c));
          it.row.classList.remove('checked');
          it.line.classList.remove('correct', 'wrong', 'revealed');
        }
      },
    };
  },
};

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
