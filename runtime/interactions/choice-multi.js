// runtime/interactions/choice-multi.js — чекбоксы, scoring exact|partial.

import { partialScore } from '../scoring.js';

export default {
  id: 'choice-multi',
  scoreMax() { return 1; },

  mount(container, block) {
    const d = block.data;
    const chosen = new Set();
    const opts = [];

    if (d.question) container.append(el('p', 'af-question', d.question));
    const list = el('div', 'af-options');
    d.options.forEach((text, i) => {
      if (!text.trim()) return;
      const b = el('button', 'af-option af-option-multi', text);
      b.type = 'button';
      b.setAttribute('role', 'checkbox');
      b.onclick = () => {
        if (b.closest('.checked')) return;
        if (chosen.has(i)) { chosen.delete(i); b.classList.remove('selected'); }
        else { chosen.add(i); b.classList.add('selected'); }
      };
      opts[i] = b;
      list.append(b);
    });
    container.append(list);

    return {
      check() {
        const sel = [...chosen];
        let earned;
        if (d.scoring === 'partial') earned = partialScore(sel, d.correct, 1);
        else {
          const a = sel.slice().sort().join(','), b2 = d.correct.slice().sort().join(',');
          earned = a === b2 ? 1 : 0;
        }
        opts.forEach((o, i) => {
          o.classList.add('checked');
          const isCorrect = d.correct.includes(i);
          const isChosen = chosen.has(i);
          if (isCorrect) o.classList.add('correct');
          if (!isCorrect && isChosen) o.classList.add('wrong');
        });
        return { earned };
      },
      reveal() {
        opts.forEach((o, i) => {
          if (d.correct.includes(i)) o.classList.add('correct', 'revealed', 'checked');
        });
      },
      reset() {
        chosen.clear();
        opts.forEach((o) => o.classList.remove('selected', 'checked', 'correct', 'wrong', 'revealed'));
      },
    };
  },
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  n.className = cls; n.textContent = text;
  return n;
}
