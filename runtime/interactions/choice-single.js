// runtime/interactions/choice-single.js —radio-тест с одним ответом.

export default {
  id: 'choice-single',
  scoreMax() { return 1; },

  mount(container, block) {
    const d = block.data;
    let selected = -1;
    const opts = [];

    if (d.question) container.append(el('p', 'af-question', d.question));
    const list = el('div', 'af-options');
    d.options.forEach((text, i) => {
      if (!text.trim()) return;
      const b = el('button', 'af-option', text);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.onclick = () => {
        if (b.closest('.checked')) return; // после проверки блокируем до рестарта
        selected = i;
        opts.forEach((o, j) => o.classList.toggle('selected', j === i));
      };
      opts[i] = b;
      list.append(b);
    });
    container.append(list);

    return {
      check() {
        const ok = selected === d.correct;
        opts.forEach((o, i) => {
          o.classList.add('checked');
          if (i === d.correct) o.classList.add('correct');
          else if (i === selected) o.classList.add('wrong');
        });
        return { earned: ok ? 1 : 0 };
      },
      reveal() {
        opts.forEach((o, i) => o.classList.toggle('revealed', i === d.correct));
        if (opts[d.correct]) opts[d.correct].classList.add('correct', 'checked');
      },
      reset() {
        selected = -1;
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
