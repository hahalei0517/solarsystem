import { currentLang, DEFAULT_LANG, t } from './index.js';
import { BODY_TRANSLATIONS } from './translations.js';
import { SUN } from '../../data/solar-system.js';

function findBodyTranslation(body) {
  return BODY_TRANSLATIONS[body.en]
    || BODY_TRANSLATIONS.comets?.[body.en]
    || BODY_TRANSLATIONS.dwarfs?.[body.en]
    || BODY_TRANSLATIONS.spacecraft?.[body.en]
    || BODY_TRANSLATIONS.moons?.[body.en];
}

export function bodyName(body) {
  if (currentLang() === DEFAULT_LANG) return body.name;
  const tr = findBodyTranslation(body);
  return tr?.name || body.name;
}

export function bodyTitle(body) {
  if (currentLang() === DEFAULT_LANG) return `${body.name} · ${body.en}`;
  const tr = findBodyTranslation(body);
  const enName = tr?.name || body.en;
  return `${enName} · ${body.name}`;
}

export function localizedStats(stats, overlayStats) {
  const out = {};
  for (const [k, v] of Object.entries(stats)) {
    const key = t(`stats.${k}`, { default: k });
    const value = overlayStats && overlayStats[k] !== undefined ? overlayStats[k] : v;
    out[key] = value;
  }
  return out;
}

export function localizedSun() {
  const tr = BODY_TRANSLATIONS.Sun;
  if (currentLang() === DEFAULT_LANG || !tr) return SUN;
  return {
    ...SUN,
    name: tr.name || SUN.name,
    desc: tr.desc || SUN.desc,
    fact: tr.fact || SUN.fact,
    stats: localizedStats(SUN.stats, tr.stats)
  };
}

export function localizedMoon(m) {
  const tr = BODY_TRANSLATIONS.moons?.[m.en];
  if (currentLang() === DEFAULT_LANG || !tr) return m;
  return {
    ...m,
    name: tr.name || m.name,
    desc: tr.desc || m.desc,
    stats: localizedStats(m.stats, tr.stats)
  };
}

export function localizedPlanet(p) {
  const tr = BODY_TRANSLATIONS[p.en];
  if (currentLang() === DEFAULT_LANG || !tr) return p;
  return {
    ...p,
    name: tr.name || p.name,
    desc: tr.desc || p.desc,
    fact: tr.fact ?? p.fact,
    stats: localizedStats(p.stats, tr.stats),
    moons: p.moons.map(localizedMoon)
  };
}

export function localizedComet(c) {
  const tr = BODY_TRANSLATIONS.comets?.[c.en];
  if (currentLang() === DEFAULT_LANG || !tr) return c;
  return {
    ...c,
    name: tr.name || c.name,
    desc: tr.desc || c.desc,
    stats: localizedStats(c.stats, tr.stats),
    showers: tr.showers || undefined
  };
}

export function localizedDwarf(d) {
  const tr = BODY_TRANSLATIONS.dwarfs?.[d.en];
  if (currentLang() === DEFAULT_LANG || !tr) return d;
  return {
    ...d,
    name: tr.name || d.name,
    desc: tr.desc || d.desc,
    fact: tr.fact ?? d.fact,
    stats: localizedStats(d.stats, tr.stats)
  };
}

export function localizedSpacecraft(s) {
  const tr = BODY_TRANSLATIONS.spacecraft?.[s.en];
  if (currentLang() === DEFAULT_LANG || !tr) return s;
  return {
    ...s,
    name: tr.name || s.name,
    desc: tr.desc || s.desc,
    fact: tr.fact ?? s.fact,
    stats: localizedStats(s.stats, tr.stats)
  };
}

export function localizedSpeedLabel(mode) {
  return t(`speedInfo.${mode}`);
}
