// js/form/schema.js — DSL описания полей формы.
// Массив schema дескриптора типа содержит объекты-поля; form/render.js превращает их в DOM.
//
// Поля:
//   { kind:'text'|'textarea', key, label, placeholder?, hint? }
//   { kind:'number', key, label, min?, max? }
//   { kind:'checkbox', key, label }
//   { kind:'select', key, label, options:[{value,label}] }
//   { kind:'group', label?, fields:[...] }                 — визуальная группа (вложенность)
//   { kind:'list', key, label, item:[fields], newItem() }  — повторяемый список
//   { kind:'csv', key, label, hint? }                      — строка слов через пробел/запятую → string[]

export const BLANK_MARK = '___';

export function textField(key, label, extra = {}) {
  return { kind: 'text', key, label, ...extra };
}

export function textareaField(key, label, extra = {}) {
  return { kind: 'textarea', key, label, ...extra };
}

export function listField(key, label, item, extra = {}) {
  return { kind: 'list', key, label, item, ...extra };
}

export function groupField(label, fields) {
  return { kind: 'group', label, fields };
}

export function csvField(key, label, extra = {}) {
  return { kind: 'csv', key, label, ...extra };
}

/** Подсчёт пропусков ___ в тексте предложения. */
export function countBlanks(text) {
  return (String(text || '').match(/_{3,}/g) || []).length;
}
