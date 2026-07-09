import { t, onLangChange, currentLang } from '../i18n/index.js';
import {
  bodyTitle,
  bodyName,
  localizedPlanet,
  localizedComet,
  localizedDwarf,
  localizedSpacecraft,
  localizedMoon,
  localizedStats,
} from '../i18n/bodies.js';

export function createInfoPanelController({
  document,
  state,
  planets,
  comets,
  dwarfs,
  spacecraft,
  cometShowers,
  ephem,
  ephemerisAU,
  cometOrbitPos,
  spacecraftPositionAU,
  updatePlanetListUI,
}) {
  // Zodiac constellations along the ecliptic (each spans 30° of ecliptic longitude).
  const ZODIAC = ['aries','taurus','gemini','cancer','leo','virgo',
                  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  function zodiacOf(lonDeg) {
    return ZODIAC[Math.floor(((lonDeg % 360) + 360) % 360 / 30)];
  }
  // Approximate geocentric ecliptic longitude (deg) of a body from Earth.
  function geoLon(p) {
    if (!ephem[p.en]) return NaN;
    const earth = ephemerisAU('Earth', state.simDays);
    const body = ephemerisAU(p.en, state.simDays);
    if (!earth || !body) return NaN;
    const x = body.x - earth.x, y = body.y - earth.y;
    let lon = Math.atan2(y, x) * 180 / Math.PI;
    if (lon < 0) lon += 360;
    return lon;
  }
  function earthDistanceAU(p) {
    if (p.en === 'Earth') return 0;
    if (!ephem[p.en]) return NaN;
    const earth = ephemerisAU('Earth', state.simDays);
    const body = ephemerisAU(p.en, state.simDays);
    if (!earth || !body) return NaN;
    return Math.hypot(body.x - earth.x, body.y - earth.y, body.z - earth.z);
  }
  function orbitProgress(p) {
    if (!p.period) return null;
    const frac = (((state.simDays % p.period) + p.period) % p.period) / p.period;
    return frac * 100;
  }

  // North-hemisphere season from Earth's orbit phase + axial tilt. Perihelion (≈Jan 4)
  // is near northern winter solstice; phase 0 here = J2000 → northern winter.
  function northernSeason() {
    const dayOfYear = ((state.simDays % 365.25) + 365.25) % 365.25;
    if (dayOfYear < 78) return 'winter';
    if (dayOfYear < 171) return 'spring';
    if (dayOfYear < 265) return 'summer';
    if (dayOfYear < 355) return 'autumn';
    return 'winter';
  }

  // Diameter comparison bar: body diameter relative to Earth, log-scaled so the
  // gas giants don't pin everything else to zero width.
  function diameterBar(realDiameterKm) {
    const earth = 12742;
    const ratio = realDiameterKm / earth;
    const pct = Math.min(100, Math.log10(ratio + 1) / Math.log10(11 + 1) * 100);
    const label = ratio >= 0.1 ? `${ratio.toFixed(ratio >= 1 ? 2 : 3)}${t('compare.unit')}` : t('compare.less');
    return `<div class="cmp"><span class="cmp-label">${t('compare.label')}</span>`
      + `<span class="cmp-bar"><span class="cmp-fill" style="width:${pct}%"></span></span>`
      + `<span class="cmp-val">${label}</span></div>`;
  }

  function fillFact(p) {
    const el = document.getElementById('info-fact');
    if (!el) return;
    if (p.fact) { el.textContent = `${t('label.factPrefix')} ${p.fact}`; el.style.display = 'block'; }
    else el.style.display = 'none';
  }

  function showInfo(i) {
    const info = document.getElementById('info');
    if (i < 0) { info.classList.add('hidden'); return; }
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    state.focusIndex = i;
    state.cometFocusIndex = -1;
    state.dwarfFocusIndex = -1;
    const p = planets[i];
    const pLoc = localizedPlanet(p);
    info.classList.remove('hidden');
    const swatch = document.getElementById('info-swatch');
    swatch.style.background = '#' + p.color.toString(16).padStart(6,'0');
    swatch.style.color = swatch.style.background;
    document.getElementById('info-name').textContent = bodyTitle(p);
    document.getElementById('info-desc').textContent = pLoc.desc;
    fillFact(pLoc);
    const dl = document.getElementById('info-stats'); dl.innerHTML = '';
    const eph = ephem[p.en] ? ephemerisAU(p.en, state.simDays) : null;
    if (eph) {
      const x_ecl = eph.x, y_ecl = -eph.z;
      const dist = Math.sqrt(x_ecl*x_ecl + y_ecl*y_ecl + eph.y*eph.y);
      let lon = Math.atan2(y_ecl, x_ecl) * 180/Math.PI;
      if (lon < 0) lon += 360;
      dl.innerHTML += `<dt>${t('label.currentDistance')}</dt><dd>${dist.toFixed(3)} AU</dd>`
                    + `<dt>${t('label.longitude')}</dt><dd>${lon.toFixed(2)}°</dd>`;
    }
    // Dynamic educational metrics
    const prog = orbitProgress(p);
    if (prog != null) dl.innerHTML += `<dt>${t('label.orbitProgress')}</dt><dd>${prog.toFixed(1)}%</dd>`;
    const ed = earthDistanceAU(p);
    if (Number.isFinite(ed)) dl.innerHTML += `<dt>${t('label.earthDistance')}</dt><dd>${ed.toFixed(3)} AU</dd>`;
    const glon = geoLon(p);
    if (Number.isFinite(glon)) dl.innerHTML += `<dt>${t('label.zodiac')}</dt><dd>${t(`zodiac.${zodiacOf(glon)}`)}</dd>`;
    if (p.en === 'Earth') dl.innerHTML += `<dt>${t('label.season')}</dt><dd>${t(`season.${northernSeason()}`)}</dd>`;
    for (const [k,v] of Object.entries(pLoc.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    // Diameter comparison bar after the stats list.
    if (dl.parentElement) {
      const bar = document.getElementById('info-compare');
      if (bar) bar.innerHTML = diameterBar(p.realDiameterKm);
    }
    const mw = document.getElementById('info-moons-wrap'), mr = document.getElementById('info-moons');
    const md = document.getElementById('moon-detail');
    if (p.moons.length) {
      mw.style.display = 'block';
      mr.innerHTML = pLoc.moons.map((m, mi) => {
        const cc = '#' + m.color.toString(16).padStart(6,'0');
        return `<span class="moon-pill" data-mi="${mi}"><span class="dot" style="background:${cc};box-shadow:0 0 6px ${cc}"></span>${m.name}</span>`;
      }).join('');
      md.style.display = 'none';
      mr.querySelectorAll('.moon-pill').forEach(el => {
        el.addEventListener('click', () => {
          showMoonDetail(i, +el.dataset.mi);
        });
      });
    } else mw.style.display = 'none';
  }

  // Days until the next perihelion, computed from the comet's period & last tp.
  function daysToNextPerihelion(c) {
    const T = c.T * 365.25;
    if (!isFinite(T) || T <= 0) return null;
    const since = ((state.simDays - c.tp) % T + T) % T;
    return T - since;
  }
  function formatCountdown(days) {
    if (days == null || !isFinite(days)) return t('countdown.unknown');
    if (days < 365) return t('countdown.days', { days: Math.round(days) });
    const y = days / 365.25;
    return t('countdown.years', { years: y.toFixed(1), days: Math.round(days) });
  }

  function showCometInfo(cometIdx=0) {
    const c = comets[cometIdx];
    state.cometFocusIndex = cometIdx;
    state.focusIndex = -1;
    state.dwarfFocusIndex = -1;
    const cLoc = localizedComet(c);
    const info = document.getElementById('info');
    info.classList.remove('hidden');
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const swatch = document.getElementById('info-swatch');
    const cc = '#' + c.color.toString(16).padStart(6,'0');
    swatch.style.background = cc;
    swatch.style.color = cc;
    document.getElementById('info-name').textContent = bodyTitle(c);
    document.getElementById('info-desc').textContent = cLoc.desc;
    fillFact(cLoc);
    const dl = document.getElementById('info-stats');
    dl.innerHTML = '';
    const pos = cometOrbitPos(c, state.simDays);
    dl.innerHTML += `<dt>${t('label.currentDistance')}</dt><dd>${pos.length().toFixed(3)} AU</dd>`;
    const dNext = daysToNextPerihelion(c);
    if (dNext != null) dl.innerHTML += `<dt>${t('label.nextPerihelion')}</dt><dd>${formatCountdown(dNext)}</dd>`;
    const showers = cLoc.showers || cometShowers[c.en];
    if (showers && showers.length) {
      dl.innerHTML += `<dt>${t('label.showers')}</dt><dd>${showers.map(s => `${s.name} (${s.month})`).join('、')}</dd>`;
    }
    for (const [k,v] of Object.entries(cLoc.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    const bar = document.getElementById('info-compare');
    if (bar) bar.innerHTML = '';
    document.getElementById('info-moons-wrap').style.display = 'none';
  }

  function showDwarfInfo(dwarfIdx=0) {
    const d = dwarfs[dwarfIdx];
    state.dwarfFocusIndex = dwarfIdx;
    state.focusIndex = -1;
    state.cometFocusIndex = -1;
    const dLoc = localizedDwarf(d);
    const info = document.getElementById('info');
    info.classList.remove('hidden');
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const swatch = document.getElementById('info-swatch');
    const cc = '#' + d.color.toString(16).padStart(6,'0');
    swatch.style.background = cc;
    swatch.style.color = cc;
    document.getElementById('info-name').textContent = bodyTitle(d);
    document.getElementById('info-desc').textContent = dLoc.desc;
    fillFact(dLoc);
    const dl = document.getElementById('info-stats');
    dl.innerHTML = '';
    const pos = cometOrbitPos(d, state.simDays);
    dl.innerHTML += `<dt>${t('label.currentDistance')}</dt><dd>${pos.length().toFixed(3)} AU</dd>`;
    const dNext = daysToNextPerihelion(d);
    if (dNext != null) dl.innerHTML += `<dt>${t('label.nextPerihelion')}</dt><dd>${formatCountdown(dNext)}</dd>`;
    for (const [k,v] of Object.entries(dLoc.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    const bar = document.getElementById('info-compare');
    if (bar) bar.innerHTML = diameterBar(d.realDiameterKm);
    document.getElementById('info-moons-wrap').style.display = 'none';
  }

  function showSpacecraftInfo(scIdx=0) {
    const s = spacecraft[scIdx];
    state.spacecraftFocusIndex = scIdx;
    state.focusIndex = -1;
    state.cometFocusIndex = -1;
    state.dwarfFocusIndex = -1;
    const sLoc = localizedSpacecraft(s);
    const info = document.getElementById('info');
    info.classList.remove('hidden');
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const swatch = document.getElementById('info-swatch');
    const cc = '#' + s.color.toString(16).padStart(6,'0');
    swatch.style.background = cc;
    swatch.style.color = cc;
    document.getElementById('info-name').textContent = bodyTitle(s);
    document.getElementById('info-desc').textContent = sLoc.desc;
    fillFact(sLoc);
    const dl = document.getElementById('info-stats');
    dl.innerHTML = '';
    const pos = spacecraftPositionAU(s, state.simDays);
    const dist = pos.length();
    let lon = Math.atan2(pos.y, pos.x) * 180 / Math.PI;
    if (lon < 0) lon += 360;
    const lat = Math.asin(THREE.MathUtils.clamp(pos.z / dist, -1, 1)) * 180 / Math.PI;
    dl.innerHTML += `<dt>${t('label.currentDistance')}</dt><dd>${dist.toFixed(3)} AU</dd>`;
    dl.innerHTML += `<dt>${t('label.longitude')}</dt><dd>${lon.toFixed(2)}°</dd>`;
    dl.innerHTML += `<dt>${t('label.latitude')}</dt><dd>${lat.toFixed(2)}°</dd>`;
    // Distance from Earth
    const earthPos = ephemerisAU('Earth', state.simDays);
    if (earthPos) {
      const dx = pos.x - earthPos.x, dy = pos.y - earthPos.y, dz = pos.z - earthPos.z;
      const earthDist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      dl.innerHTML += `<dt>${t('label.earthDistance')}</dt><dd>${earthDist.toFixed(3)} AU</dd>`;
    }
    for (const [k,v] of Object.entries(sLoc.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    const bar = document.getElementById('info-compare');
    if (bar) bar.innerHTML = '';
    document.getElementById('info-moons-wrap').style.display = 'none';
  }

  function showMoonDetail(planetIdx, moonIdx) {
    if (state.focusIndex !== planetIdx) {
      state.focusIndex = planetIdx;
      showInfo(planetIdx);
      updatePlanetListUI();
    }
    const p = planets[planetIdx];
    const m = localizedMoon(p.moons[moonIdx]);
    if (!m) return;
    const mr = document.getElementById('info-moons');
    const md = document.getElementById('moon-detail');
    mr.querySelectorAll('.moon-pill').forEach((x, idx) => x.classList.toggle('active', idx === moonIdx));
    const cc = '#' + m.color.toString(16).padStart(6,'0');
    const statsHtml = m.stats ? Object.entries(m.stats).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('') : '';
    md.style.display = 'block';
    md.innerHTML =
      `<div class="mname"><span class="dot" style="width:10px;height:10px;border-radius:50%;background:${cc};box-shadow:0 0 8px ${cc}"></span>${m.name}</div>`
      + (m.desc ? `<div class="mdesc">${m.desc}</div>` : '')
      + (statsHtml ? `<dl>${statsHtml}</dl>` : '');
    if (md.scrollIntoView) md.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const pill = mr.querySelector(`.moon-pill[data-mi="${moonIdx}"]`);
    if (pill && pill.scrollIntoView) pill.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  function closeInfoPanel() {
    const info = document.getElementById('info');
    info.classList.add('hidden');
    state.cometFocusIndex = -1;
    state.dwarfFocusIndex = -1;
    state.spacecraftFocusIndex = -1;
    if (state.soloIndex === -1) {
      state.focusIndex = -1;
      updatePlanetListUI();
    }
  }

  onLangChange(() => {
    if (state.focusIndex >= 0) showInfo(state.focusIndex);
    else if (state.cometFocusIndex >= 0) showCometInfo(state.cometFocusIndex);
    else if (state.dwarfFocusIndex >= 0) showDwarfInfo(state.dwarfFocusIndex);
    else if (state.spacecraftFocusIndex >= 0) showSpacecraftInfo(state.spacecraftFocusIndex);
  });

  return { showInfo, showCometInfo, showDwarfInfo, showSpacecraftInfo, showMoonDetail, closeInfoPanel };
}
