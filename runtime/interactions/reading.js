// runtime/interactions/reading.js — блок текста для чтения. scoreMax = 0, проверок нет.

export default {
  id: 'reading',
  scoreMax() { return 0; },

  mount(container, block) {
    const d = block.data || {};
    if (d.heading) container.append(el('h3', 'af-reading-heading', d.heading));
    for (const p of d.paragraphs || []) container.append(el('p', 'af-reading-para', p));
    return { check: () => ({ earned: 0 }), reveal: () => {} };
  },
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  n.className = cls; n.textContent = text;
  return n;
}
