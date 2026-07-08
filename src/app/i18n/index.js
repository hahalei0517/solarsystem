import { TRANSLATIONS } from './translations.js';

export const DEFAULT_LANG = 'zh-CN';
export const LANGS = ['zh-CN', 'en'];
const STORAGE_KEY = 'solar-system-lang';

function readStoredLang() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGS.includes(stored)) return stored;
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_LANG;
}

let current = readStoredLang();
const listeners = new Set();

export function currentLang() { return current; }

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return;
  current = lang;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  for (const cb of listeners) cb(lang);
}

export function onLangChange(cb) { listeners.add(cb); }
export function offLangChange(cb) { listeners.delete(cb); }

export function t(key, opts = {}) {
  let value = TRANSLATIONS[current]?.[key];
  if (value === undefined) value = TRANSLATIONS[DEFAULT_LANG]?.[key];
  if (value === undefined) return opts.default !== undefined ? opts.default : key;
  if (typeof value !== 'string') return opts.default !== undefined ? opts.default : key;
  return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    opts[k] !== undefined ? opts[k] : `{{${k}}}`
  );
}

export function applyTranslations(document) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const parts = el.dataset.i18nAttr.split('|');
    for (let i = 0; i + 1 < parts.length; i += 2) {
      const attr = parts[i];
      const key = parts[i + 1];
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}
