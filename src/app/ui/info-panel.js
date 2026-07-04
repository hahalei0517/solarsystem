export function createInfoPanelController({
  document,
  state,
  planets,
  comets,
  dwarfs,
  cometShowers,
  ephem,
  ephemerisAU,
  cometOrbitPos,
  updatePlanetListUI,
}) {
  // Zodiac constellations along the ecliptic (each spans 30° of ecliptic longitude).
  const ZODIAC = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座',
                  '天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
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
    if (dayOfYear < 78) return '冬';
    if (dayOfYear < 171) return '春';
    if (dayOfYear < 265) return '夏';
    if (dayOfYear < 355) return '秋';
    return '冬';
  }

  // Diameter comparison bar: body diameter relative to Earth, log-scaled so the
  // gas giants don't pin everything else to zero width.
  function diameterBar(realDiameterKm) {
    const earth = 12742;
    const ratio = realDiameterKm / earth;
    const pct = Math.min(100, Math.log10(ratio + 1) / Math.log10(11 + 1) * 100);
    const label = ratio >= 0.1 ? `${ratio.toFixed(ratio >= 1 ? 2 : 3)}× 地球` : '< 0.1× 地球';
    return `<div class="cmp"><span class="cmp-label">直径对比地球</span>`
      + `<span class="cmp-bar"><span class="cmp-fill" style="width:${pct}%"></span></span>`
      + `<span class="cmp-val">${label}</span></div>`;
  }

  function fillFact(p) {
    const el = document.getElementById('info-fact');
    if (!el) return;
    if (p.fact) { el.textContent = '💡 ' + p.fact; el.style.display = 'block'; }
    else el.style.display = 'none';
  }

  function showInfo(i) {
    const info = document.getElementById('info');
    if (i < 0) { info.classList.add('hidden'); return; }
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const p = planets[i];
    info.classList.remove('hidden');
    const swatch = document.getElementById('info-swatch');
    swatch.style.background = '#' + p.color.toString(16).padStart(6,'0');
    swatch.style.color = swatch.style.background;
    document.getElementById('info-name').textContent = `${p.name} · ${p.en}`;
    document.getElementById('info-desc').textContent = p.desc;
    fillFact(p);
    const dl = document.getElementById('info-stats'); dl.innerHTML = '';
    const eph = ephem[p.en] ? ephemerisAU(p.en, state.simDays) : null;
    if (eph) {
      const x_ecl = eph.x, y_ecl = -eph.z;
      const dist = Math.sqrt(x_ecl*x_ecl + y_ecl*y_ecl + eph.y*eph.y);
      let lon = Math.atan2(y_ecl, x_ecl) * 180/Math.PI;
      if (lon < 0) lon += 360;
      dl.innerHTML += `<dt>📡 当前距日</dt><dd>${dist.toFixed(3)} AU</dd>`
                    + `<dt>📡 黄经</dt><dd>${lon.toFixed(2)}°</dd>`;
    }
    // Dynamic educational metrics
    const prog = orbitProgress(p);
    if (prog != null) dl.innerHTML += `<dt>🛰️ 公转进度</dt><dd>${prog.toFixed(1)}%</dd>`;
    const ed = earthDistanceAU(p);
    if (Number.isFinite(ed)) dl.innerHTML += `<dt>🌍 与地球距离</dt><dd>${ed.toFixed(3)} AU</dd>`;
    const glon = geoLon(p);
    if (Number.isFinite(glon)) dl.innerHTML += `<dt>🔭 视方向星座</dt><dd>${zodiacOf(glon)}</dd>`;
    if (p.en === 'Earth') dl.innerHTML += `<dt>🍂 北半球季节</dt><dd>${northernSeason()}季</dd>`;
    for (const [k,v] of Object.entries(p.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    // Diameter comparison bar after the stats list.
    if (dl.parentElement) {
      const bar = document.getElementById('info-compare');
      if (bar) bar.innerHTML = diameterBar(p.realDiameterKm);
    }
    const mw = document.getElementById('info-moons-wrap'), mr = document.getElementById('info-moons');
    const md = document.getElementById('moon-detail');
    if (p.moons.length) {
      mw.style.display = 'block';
      mr.innerHTML = p.moons.map((m, mi) => {
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
    if (days == null || !isFinite(days)) return '未知';
    if (days < 365) return `约 ${Math.round(days)} 天`;
    const y = days / 365.25;
    return `约 ${y.toFixed(1)} 年 (${Math.round(days)} 天)`;
  }

  function showCometInfo(cometIdx=0) {
    const c = comets[cometIdx];
    const info = document.getElementById('info');
    info.classList.remove('hidden');
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const swatch = document.getElementById('info-swatch');
    const cc = '#' + c.color.toString(16).padStart(6,'0');
    swatch.style.background = cc;
    swatch.style.color = cc;
    document.getElementById('info-name').textContent = `${c.name} · ${c.en}`;
    document.getElementById('info-desc').textContent = c.desc;
    fillFact(c);
    const dl = document.getElementById('info-stats');
    dl.innerHTML = '';
    const pos = cometOrbitPos(c, state.simDays);
    dl.innerHTML += `<dt>📡 当前距日</dt><dd>${pos.length().toFixed(3)} AU</dd>`;
    const dNext = daysToNextPerihelion(c);
    if (dNext != null) dl.innerHTML += `<dt>⏳ 距下次近日点</dt><dd>${formatCountdown(dNext)}</dd>`;
    const showers = cometShowers[c.en];
    if (showers && showers.length) {
      dl.innerHTML += `<dt>☄️ 关联流星雨</dt><dd>${showers.map(s => `${s.name} (${s.month})`).join('、')}</dd>`;
    }
    if (c.stats) for (const [k,v] of Object.entries(c.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    const bar = document.getElementById('info-compare');
    if (bar) bar.innerHTML = '';
    document.getElementById('info-moons-wrap').style.display = 'none';
  }

  function showDwarfInfo(dwarfIdx=0) {
    const d = dwarfs[dwarfIdx];
    const info = document.getElementById('info');
    info.classList.remove('hidden');
    const exitBtn = document.getElementById('event-exit');
    if (exitBtn) exitBtn.style.display = 'none';
    const swatch = document.getElementById('info-swatch');
    const cc = '#' + d.color.toString(16).padStart(6,'0');
    swatch.style.background = cc;
    swatch.style.color = cc;
    document.getElementById('info-name').textContent = `${d.name} · ${d.en}`;
    document.getElementById('info-desc').textContent = d.desc;
    fillFact(d);
    const dl = document.getElementById('info-stats');
    dl.innerHTML = '';
    const pos = cometOrbitPos(d, state.simDays);
    dl.innerHTML += `<dt>📡 当前距日</dt><dd>${pos.length().toFixed(3)} AU</dd>`;
    const dNext = daysToNextPerihelion(d);
    if (dNext != null) dl.innerHTML += `<dt>⏳ 距下次近日点</dt><dd>${formatCountdown(dNext)}</dd>`;
    if (d.stats) for (const [k,v] of Object.entries(d.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
    const bar = document.getElementById('info-compare');
    if (bar) bar.innerHTML = diameterBar(d.realDiameterKm);
    document.getElementById('info-moons-wrap').style.display = 'none';
  }

  function showMoonDetail(planetIdx, moonIdx) {
    if (state.focusIndex !== planetIdx) {
      state.focusIndex = planetIdx;
      showInfo(planetIdx);
      updatePlanetListUI();
    }
    const p = planets[planetIdx];
    const m = p.moons[moonIdx];
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
    if (state.soloIndex === -1) {
      state.focusIndex = -1;
      updatePlanetListUI();
    }
  }

  return { showInfo, showCometInfo, showDwarfInfo, showMoonDetail, closeInfoPanel };
}
