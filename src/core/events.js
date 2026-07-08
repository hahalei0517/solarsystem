import { ephemerisCoordsAU } from './orbits.js';
import { t } from '../app/i18n/index.js';
import { bodyName } from '../app/i18n/bodies.js';

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z);
  return len ? { x: v.x / len, y: v.y / len, z: v.z / len } : { x: 0, y: 0, z: 0 };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function elongationFromSun(planetEn, days, ephem) {
  const earth = ephemerisCoordsAU('Earth', days, ephem);
  const planet = ephemerisCoordsAU(planetEn, days, ephem);
  if (!earth || !planet) return NaN;

  const sunFromEarth = normalize({ x: -earth.x, y: -earth.y, z: -earth.z });
  const bodyFromEarth = normalize({
    x: planet.x - earth.x,
    y: planet.y - earth.y,
    z: planet.z - earth.z,
  });
  const clamped = Math.max(-1, Math.min(1, dot(sunFromEarth, bodyFromEarth)));
  return Math.acos(clamped) * 180 / Math.PI;
}

// Geocentric ecliptic longitude (deg, 0..360) of a body as seen from Earth.
// 'Earth' returns the Sun's geocentric longitude.
export function geocentricLongitude(bodyEn, days, ephem) {
  const earth = ephemerisCoordsAU('Earth', days, ephem);
  if (!earth) return NaN;
  let v;
  if (bodyEn === 'Earth') v = { x: -earth.x, y: -earth.y, z: -earth.z };
  else {
    const b = ephemerisCoordsAU(bodyEn, days, ephem);
    if (!b) return NaN;
    v = { x: b.x - earth.x, y: b.y - earth.y, z: b.z - earth.z };
  }
  let lon = Math.atan2(v.y, v.x) * 180 / Math.PI;
  if (lon < 0) lon += 360;
  return lon;
}

// Whether an inner planet at greatest elongation sits east (evening) or west (morning) of the Sun.
export function elongationSide(planetEn, days, ephem) {
  let d = geocentricLongitude(planetEn, days, ephem) - geocentricLongitude('Earth', days, ephem);
  d = ((d + 540) % 360) - 180; // normalize to [-180,180]
  return d >= 0 ? 'east' : 'west';
}

// Geocentric angular separation (deg) between two bodies as seen from Earth.
export function separationFromEarth(aEn, bEn, days, ephem) {
  const earth = ephemerisCoordsAU('Earth', days, ephem);
  const a = ephemerisCoordsAU(aEn, days, ephem);
  const b = ephemerisCoordsAU(bEn, days, ephem);
  if (!earth || !a || !b) return NaN;
  const va = normalize({ x: a.x - earth.x, y: a.y - earth.y, z: a.z - earth.z });
  const vb = normalize({ x: b.x - earth.x, y: b.y - earth.y, z: b.z - earth.z });
  const clamped = Math.max(-1, Math.min(1, dot(va, vb)));
  return Math.acos(clamped) * 180 / Math.PI;
}

// Whether an inner planet is at inferior-conjunction geometry at time t (between Earth and Sun).
// At inferior conjunction the planet is closer to Earth than the Sun is; at superior conjunction
// it is farther (behind the Sun). Elongation → 0 at BOTH, so this distinguishes a true transit
// (inferior only) from a superior conjunction.
export function isInferiorConjunction(planetEn, t, ephem) {
  const earth = ephemerisCoordsAU('Earth', t, ephem);
  const planet = ephemerisCoordsAU(planetEn, t, ephem);
  if (!earth || !planet) return false;
  const earthSun = Math.hypot(earth.x, earth.y, earth.z); // ≈ 1 AU
  const earthPlanet = Math.hypot(planet.x - earth.x, planet.y - earth.y, planet.z - earth.z);
  return earthPlanet < earthSun;
}

export function refineMinimum(fn, center, span = 8) {
  let bestT = center;
  let bestV = fn(center);
  for (let t = center - span; t <= center + span; t += 0.25) {
    const v = fn(t);
    if (v < bestV) {
      bestV = v;
      bestT = t;
    }
  }
  return { t: bestT, v: bestV };
}

export function refineMaximum(fn, center, span = 8) {
  let bestT = center;
  let bestV = fn(center);
  for (let t = center - span; t <= center + span; t += 0.25) {
    const v = fn(t);
    if (v > bestV) {
      bestV = v;
      bestT = t;
    }
  }
  return { t: bestT, v: bestV };
}

const TRANSIT = 'transit';
const CONJUNCTION = 'conjunction';
const OPPOSITION = 'opposition';
const ELONGATION = 'elongation';
const QUADRATURE = 'quadrature';
const PLANET_CONJUNCTION = 'planetConjunction';

export function scanSkyEvents({ min, max, planets, ephem }) {
  const found = [];
  const step = 5;

  // Inner planets: transits / conjunctions (minima) and greatest elongations (maxima)
  [0, 1].forEach((idx) => {
    const p = planets[idx];
    const el = (d) => elongationFromSun(p.en, d, ephem);
    let prev = el(min);
    let cur = el(min + step);
    for (let t = min + step * 2; t <= max; t += step) {
      const next = el(t);
      if (cur < prev && cur < next) {
        const r = refineMinimum(el, t - step);
        const inferior = isInferiorConjunction(p.en, r.t, ephem);
        // 凌日 (transit) requires inferior conjunction AND elongation below the Sun's angular
        // radius (~0.267°). A superior conjunction also drives elongation → 0, but the planet is
        // then behind the Sun — that is a 上合日, never a transit.
        if (inferior && r.v < 0.27) {
          found.push(makeEvent({ typeCode: TRANSIT, bodyA: idx, bodyB: 2, days: r.t, angle: r.v, score: 100 - r.v * 80, planets }));
        } else if (r.v < 0.9) {
          found.push(makeEvent({ typeCode: CONJUNCTION, subType: inferior ? 'inferior' : 'superior', bodyA: idx, bodyB: 2, days: r.t, angle: r.v, score: 72 - r.v * 12, planets }));
        }
      }
      if (cur > prev && cur > next) {
        const r = refineMaximum(el, t - step);
        if (r.v > 10) {
          const side = elongationSide(p.en, r.t, ephem);
          found.push(makeEvent({ typeCode: ELONGATION, subType: side, bodyA: idx, bodyB: 2, days: r.t, angle: r.v, score: 50 + r.v, planets }));
        }
      }
      prev = cur;
      cur = next;
    }
  });

  // Outer planets: oppositions (maxima) and quadratures (crossings of 90°)
  for (let idx = 3; idx < planets.length; idx++) {
    const p = planets[idx];
    const el = (d) => elongationFromSun(p.en, d, ephem);
    let prev = el(min);
    let prevDev = prev - 90;
    for (let t = min + step; t <= max; t += step) {
      const cur = el(t);
      const curDev = cur - 90;
      if (cur > prev && false) { /* placeholder */ }
      // opposition (max near 180)
      // detected below via maxima
      // quadrature: 90° crossing (sign change of dev)
      if (prevDev * curDev < 0 && Math.abs(curDev) < step) {
        const r = refineMinimum((d) => Math.abs(el(d) - 90), t - step);
        if (Math.abs(r.v) < 4) {
          const side = elongationSide(p.en, r.t, ephem);
          found.push(makeEvent({ typeCode: QUADRATURE, subType: side, bodyA: idx, bodyB: 2, days: r.t, angle: 90 + r.v, score: 30 + idx, planets }));
        }
      }
      prevDev = curDev;
      prev = cur;
    }
    // oppositions (maxima of elongation)
    let prev2 = el(min);
    let cur2 = el(min + step);
    for (let t = min + step * 2; t <= max; t += step) {
      const next = el(t);
      if (cur2 > prev2 && cur2 > next) {
        const r = refineMaximum(el, t - step);
        if (r.v > 178) found.push(makeEvent({ typeCode: OPPOSITION, bodyA: idx, bodyB: 2, days: r.t, angle: r.v, score: 40 + (r.v - 178) * 18 + idx * 2, planets }));
      }
      prev2 = cur2;
      cur2 = next;
    }
  }

  // Planet–planet conjunctions: close geocentric separations (minima below threshold)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i], b = planets[j];
      const sep = (d) => separationFromEarth(a.en, b.en, d, ephem);
      let prev = sep(min);
      let cur = sep(min + step);
      for (let t = min + step * 2; t <= max; t += step) {
        const next = sep(t);
        if (cur < prev && cur < next) {
          const r = refineMinimum(sep, t - step);
          if (r.v < 2.0) {
            found.push(makeEvent({ typeCode: PLANET_CONJUNCTION, bodyA: i, bodyB: j, days: r.t, angle: r.v, score: 80 - r.v * 20, planets }));
          }
        }
        prev = cur;
        cur = next;
      }
    }
  }

  const deduped = [];
  for (const ev of found.sort((a, b) => a.days - b.days)) {
    const last = deduped[deduped.length - 1];
    if (!last || ev.label !== last.label || Math.abs(ev.days - last.days) > 20) deduped.push(ev);
  }

  const byType = new Map();
  for (const ev of deduped) {
    if (!byType.has(ev.typeCode)) byType.set(ev.typeCode, []);
    byType.get(ev.typeCode).push(ev);
  }

  return Array.from(byType.values())
    .flatMap((items) => items.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 2))
    .sort((a, b) => a.days - b.days);
}

function eventKey(typeCode, subType) {
  return subType ? `${typeCode}.${subType}` : typeCode;
}

function makeEvent({ typeCode, subType, bodyA, bodyB, days, angle, score, planets }) {
  const a = planets[bodyA];
  const b = planets[bodyB];
  const key = eventKey(typeCode, subType);
  const label = typeCode === PLANET_CONJUNCTION
    ? t(`event.label.${typeCode}`, { a: bodyName(a), b: bodyName(b) })
    : t(`event.label.${key}`, { name: bodyName(a) });
  const typeLabel = t(`event.type.${key}`);
  const effect = t(`event.effect.${key}`);
  const desc = typeCode === PLANET_CONJUNCTION
    ? t(`event.desc.${typeCode}`, { a: bodyName(a), b: bodyName(b), angle: angle.toFixed(2) })
    : t(`event.desc.${key}`, { name: bodyName(a), angle: angle.toFixed(typeCode === OPPOSITION || typeCode === QUADRATURE || typeCode === ELONGATION ? 1 : 2) });
  return { days, label, typeLabel, effect, desc, typeCode, subType, bodyA, bodyB, angle, score };
}

export function getEventColor(typeCode) {
  switch (typeCode) {
    case TRANSIT: return 0xff7777;
    case OPPOSITION: return 0x66ff99;
    case CONJUNCTION: return 0xffd966;
    case ELONGATION: return 0x66ccff;
    case QUADRATURE: return 0xc08aff;
    case PLANET_CONJUNCTION: return 0xff99cc;
    default: return 0xffd966;
  }
}

export function describeSkyEvent(ev, planets) {
  // Prefer pre-computed localized description if present; fall back to re-computing.
  if (ev.desc) return ev.desc;
  const key = eventKey(ev.typeCode, ev.subType);
  const name = bodyName(planets[ev.bodyA]);
  if (ev.typeCode === PLANET_CONJUNCTION) {
    const bName = bodyName(planets[ev.bodyB]);
    return t(`event.desc.${key}`, { a: name, b: bName, angle: ev.angle.toFixed(2) });
  }
  return t(`event.desc.${key}`, { name, angle: ev.angle.toFixed(ev.typeCode === OPPOSITION || ev.typeCode === QUADRATURE || ev.typeCode === ELONGATION ? 1 : 2) });
}
