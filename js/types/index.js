// js/types/index.js — точка регистрации типов. Добавление нового типа = импорт + строка addType здесь.
// (см. docs/ADDING_TYPES.md — 3 шага, ядро не меняется)

import { addType, hasType } from './registry.js';
import reading from './reading.js';
import choiceSingle from './choice-single.js';
import choiceMulti from './choice-multi.js';
import dragWord from './drag-word.js';
import dragParts from './drag-parts.js';
import matchColumns from './match-columns.js';

const ALL = [reading, choiceSingle, choiceMulti, dragWord, dragParts, matchColumns];

export function registerAllTypes() {
  for (const t of ALL) if (!hasType(t.id)) addType(t);
}

export { ALL as typeList };
