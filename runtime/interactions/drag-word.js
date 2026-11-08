// runtime/interactions/drag-word.js — слово в пропуск. Основной способ: тап по слову → тап по пропуску.
// Поддержка per-blank (банк у каждого пропуска) и shared (общий банк на предложение).

import { shuffle } from '../scoring.js';

export default {
  id: 'drag-word',
  scoreMax(block) {
    return (block.data.sentences || []).reduce((n, s) => n + (s.blanks?.length || 0), 0);
  },

  mount(container, block) {
    const d = block.data;
    const rows = [];   // [{blankEl, answer, chip}]
    let pendingChip = null; // выбранный тапом чип в ожидании пропуска

    for (const s of d.sentences || []) {
      const row = el('div', 'af-dw-row');
      // текст с пропусками-слотами
      const parts = String(s.text || '').split(/_{3,}/);
      let bi = 0;
      parts.forEach((txt, i) => {
        if (i > 0 && s.blanks && s.blanks[bi]) {
          const blank = s.blanks[bi];
          const slot = el('button', 'af-slot');
          slot.type = 'button';
          slot.dataset.idx = String(bi);
          slot.onclick = () => {
            if (slot.classList.contains('checked')) return;
            if (pendingChip) { place(pendingChip, slot); pendingChip = null; }
            else if (slot.chip) { release(slot); }
          };
          row.append(slot);
          rows.push({ slot, answer: blank.answer });
          bi += 1;
        }
        if (txt) row.append(el('span', 'af-dw-text', txt));
      });

      // банк слов этого предложения
      const bank = el('div', 'af-bank');
      const words = d.wordBank === 'shared'
        ? unique((s.blanks || []).flatMap((b) => b.words || []))
        : unique((s.blanks || []).flatMap((b) => b.words || []));
      shuffle(words).forEach((w) => {
        const chip = el('button', 'af-chip', w);
        chip.type = 'button';
        chip.onclick = () => {
          if (chip.classList.contains('used') || bank.closest('.checked')) return;
          if (pendingChip === chip) { chip.classList.remove('selected'); pendingChip = null; return; }
          if (pendingChip) pendingChip.classList.remove('selected');
          pendingChip = chip;
          chip.classList.add('selected');
        };
        bank.append(chip);
      });
      row.append(bank);
      container.append(row);
    }

    function place(chip, slot) {
      if (slot.chip) release(slot);
      slot.textContent = chip.textContent;
      slot.classList.add('filled');
      slot.chip = chip;
      chip.classList.add('used');
      chip.classList.remove('selected');
    }
    function release(slot) {
      if (!slot.chip) return;
      slot.chip.classList.remove('used');
      slot.chip = null;
      slot.textContent = '';
      slot.classList.remove('filled');
    }

    return {
      check() {
        let earned = 0;
        for (const r of rows) {
          const filled = !!r.slot.chip;
          const ok = filled && r.slot.textContent.trim().toLowerCase() === r.answer.toLowerCase();
          r.slot.classList.add('checked');
          r.slot.classList.toggle('correct', ok);
          r.slot.classList.toggle('wrong', filled && !ok);
          if (ok) earned += 1;
        }
        container.classList.add('checked');
        return { earned };
      },
      reveal() {
        for (const r of rows) {
          const target = [...r.slot.parentElement.querySelectorAll('.af-chip')].find(
            (c) => c.textContent.trim().toLowerCase() === r.answer.toLowerCase(),
          );
          if (target) { if (r.slot.chip) release(r.slot); place(target, r.slot); }
          r.slot.classList.add('correct', 'revealed');
        }
      },
      reset() {
        for (const r of rows) release(r.slot), r.slot.classList.remove('checked', 'correct', 'wrong', 'revealed');
        container.classList.remove('checked');
        container.querySelectorAll('.af-chip').forEach((c) => c.classList.remove('used', 'selected'));
        pendingChip = null;
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
const unique = (a) => [...new Set(a)];
