// runtime/scoring.js — правила начисления баллов. Одинаковые для предпросмотра и экспорта.
// Каждый interaction возвращает { scoreMax, check(state) -> {earned, details} }.

export function clampScore(x) { return Math.max(0, Math.round(x * 100) / 100); }

/** choice-multi partial: (верно_отмечено − ошибочно_отмечено) / len(correct), не ниже 0. */
export function partialScore(selected, correct, max) {
  const hit = selected.filter((i) => correct.includes(i)).length;
  const wrong = selected.filter((i) => !correct.includes(i)).length;
  return clampScore(max * (hit - wrong) / correct.length);
}

export function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
