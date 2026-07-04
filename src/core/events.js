import { ephemerisCoordsAU } from './orbits.js';

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
        if (inferior && r.v < 0.27) found.push({ days: r.t, label: `${p.name}凌日`, type: '凌日', bodyA: idx, bodyB: 2, angle: r.v, score: 100 - r.v * 80 });
        else if (r.v < 0.9) found.push({ days: r.t, label: `${p.name}${inferior ? '下合日' : '上合日'}`, type: '合日', bodyA: idx, bodyB: 2, angle: r.v, score: 72 - r.v * 12 });
      }
      if (cur > prev && cur > next) {
        const r = refineMaximum(el, t - step);
        if (r.v > 10) {
          const side = elongationSide(p.en, r.t, ephem);
          const type = side === 'east' ? '东大距' : '西大距';
          found.push({ days: r.t, label: `${p.name}${type}`, type, bodyA: idx, bodyB: 2, angle: r.v, score: 50 + r.v });
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
          const type = side === 'east' ? '东方照' : '西方照';
          found.push({ days: r.t, label: `${p.name}${type}`, type: '方照', bodyA: idx, bodyB: 2, angle: 90 + r.v, score: 30 + idx });
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
        if (r.v > 178) found.push({ days: r.t, label: `${p.name}冲日`, type: '冲日', bodyA: idx, bodyB: 2, angle: r.v, score: 40 + (r.v - 178) * 18 + idx * 2 });
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
            found.push({ days: r.t, label: `${a.name}合${b.name}`, type: '合行星', bodyA: i, bodyB: j, angle: r.v, score: 80 - r.v * 20 });
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
    if (!byType.has(ev.type)) byType.set(ev.type, []);
    byType.get(ev.type).push(ev);
  }

  return Array.from(byType.values())
    .flatMap((items) => items.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 2))
    .sort((a, b) => a.days - b.days);
}

export function getEventColor(type) {
  switch (type) {
    case '凌日': return 0xff7777;
    case '冲日': return 0x66ff99;
    case '合日': return 0xffd966;
    case '东大距': return 0x66ccff;
    case '西大距': return 0x99aaff;
    case '方照': return 0xc08aff;
    case '合行星': return 0xff99cc;
    default: return 0xffd966;
  }
}

export function describeSkyEvent(ev, planets) {
  const p = planets[ev.bodyA];

  if (ev.type === '凌日') {
    return `地球视角下，${p.name}位于地球与太阳之间附近，几乎从太阳盘面前方经过，角距约 ${ev.angle.toFixed(2)}°。本模型用近似星历和放大的可视标记提示几何关系，真实凌日还取决于太阳视直径、轨道倾角和观测条件。`;
  }

  if (ev.type === '合日') {
    let where;
    if (ev.label && ev.label.includes('上合')) where = '位于太阳远侧（上合日）';
    else if (ev.label && ev.label.includes('下合')) where = '位于地球与太阳之间（下合日）';
    else where = '与太阳在天空中方向几乎同向';
    return `${p.name}${where}，角距约 ${ev.angle.toFixed(2)}°，此时通常淹没在太阳眩光中，不适合观测；本模型只标出地球视角的近似同向关系。`;
  }

  if (ev.type === '东大距' || ev.type === '西大距') {
    const when = ev.type === '东大距' ? '日落后西边天空（昏星）' : '日出前东边天空（晨星）';
    return `${p.name}到达${ev.type}，与太阳角距约 ${ev.angle.toFixed(1)}°，是内行星离太阳视距最大的时刻，此时${when}观测条件较佳。`;
  }

  if (ev.type === '方照') {
    return `${p.name}与太阳角距约 90°（${ev.label.includes('东') ? '东方照' : '西方照'}），此时它相对太阳成直角，是观察外行星相位与阴影的好时机，${ev.label.includes('东') ? '日落后位于南方高位' : '日出前位于南方高位'}。`;
  }

  if (ev.type === '合行星') {
    const q = planets[ev.bodyB];
    return `${p.name}与${q.name}在天空中非常接近，角距约 ${ev.angle.toFixed(2)}°。行星相合是较罕见的天象，两颗行星在视线方向上靠近，但实际空间距离仍可能很远。`;
  }

  return `${p.name}与太阳在天空中接近相对，角距约 ${ev.angle.toFixed(1)}°。外行星冲日前后通常日落时升起、接近整夜可见，也往往更接近地球；实际亮度和可见性仍受距离、地平高度和天气影响。`;
}
