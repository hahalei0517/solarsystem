import { SPEED_MODES } from '../../data/solar-system.js';

export function createControlsController({
  document,
  window,
  state,
  planets,
  comets,
  j2000,
  cometOrbitPos,
  THREE,
  bloomEnabledRef,
  setBloomEnabled,
  initAudio,
  disableAudio,
  soundApi,
  applyScaleMode,
  rebuildOrbits,
  resetCamera,
  resetTrailsAndRevs,
  disposeEventVisuals,
  scanEvents,
  clearEvents,
  exitEventView,
  flyTo,
  flyToPlanet,
  flyToSun,
  showInfo,
  showSunInfo,
  closeInfoPanel,
  updatePlanetListUI,
  setRenderQuality,
}) {
  const layerBindings = [
    { key: 'showOrbits', button: 'orbits-btn', checkbox: 'layer-orbits' },
    { key: 'showEcliptic', button: 'ecliptic-btn', checkbox: 'layer-ecliptic' },
    { key: 'showLabels', button: 'labels-btn', checkbox: 'layer-labels' },
    { key: 'showTrails', button: 'trail-btn', checkbox: 'layer-trails' },
    { key: 'showBelts', button: 'belts-btn', checkbox: 'layer-belts' },
    { key: 'showComets', button: 'comets-btn', checkbox: 'layer-comets' },
    { key: 'showDwarfs', button: 'dwarfs-btn', checkbox: 'layer-dwarfs' },
    { key: 'showEvents', checkbox: 'layer-events' },
    { key: 'rotateAroundCursor', checkbox: 'layer-rotate-cursor' },
    { key: 'showAxis', checkbox: 'layer-axis' },
  ];

  function getLayerValue(key) {
    return key === 'bloomEnabled' ? bloomEnabledRef() : state[key];
  }

  function setLayerState(key, enabled) {
    if (key === 'bloomEnabled') setBloomEnabled(enabled);
    else if (key === 'soundOn') {
      state.soundOn = enabled;
      if (state.soundOn) initAudio(); else disableAudio();
      const soundBtn = document.getElementById('sound-btn');
      if (soundBtn) soundBtn.textContent = state.soundOn ? '🔊' : '🔇';
    } else if (key === 'showEvents') {
      state.showEvents = enabled;
      if (enabled) scanEvents(); else clearEvents();
    } else {
      state[key] = enabled;
      soundApi.uiTick();
    }
    syncLayerMenu();
  }

  function toggleLayerState(key) {
    setLayerState(key, !getLayerValue(key));
  }

  function syncLayerMenu() {
    for (const binding of layerBindings) {
      const value = !!state[binding.key];
      const button = document.getElementById(binding.button);
      const checkbox = document.getElementById(binding.checkbox);
      if (button) button.classList.toggle('on', value);
      if (checkbox) checkbox.checked = value;
    }
    const bloomButton = document.getElementById('bloom-btn');
    const bloomCheckbox = document.getElementById('layer-bloom');
    const bloomAllowed = state.renderQuality === 'quality';
    if (bloomButton) {
      bloomButton.classList.toggle('on', bloomEnabledRef());
      bloomButton.disabled = !bloomAllowed;
    }
    if (bloomCheckbox) {
      bloomCheckbox.checked = bloomEnabledRef();
      bloomCheckbox.disabled = !bloomAllowed;
      bloomCheckbox.closest('.layer-row')?.classList.toggle('disabled', !bloomAllowed);
    }
    const soundButton = document.getElementById('sound-btn');
    const soundCheckbox = document.getElementById('layer-sound');
    if (soundButton) soundButton.classList.toggle('on', state.soundOn);
    if (soundCheckbox) soundCheckbox.checked = state.soundOn;
    const themeSelect = document.getElementById('audio-theme');
    if (themeSelect) themeSelect.value = state.audioTheme;
  }

  let qualityMSelect = null;
  function syncQualityControls() {
    document.querySelectorAll('#quality-seg button').forEach(button => {
      button.classList.toggle('active', button.dataset.quality === state.renderQuality);
    });
    if (qualityMSelect) qualityMSelect.sync();
  }

  function updateSoloStatus() {
    const chip = document.getElementById('solo-status');
    const soloBtn = document.getElementById('solo-btn');
    if (!chip) return;
    if (state.soloSun) {
      chip.textContent = '独显：太阳';
      chip.classList.add('active');
      if (soloBtn) soloBtn.classList.add('on');
    } else if (state.soloIndex >= 0) {
      const p = planets[state.soloIndex];
      chip.textContent = `独显：${p.name}`;
      chip.classList.add('active');
      if (soloBtn) soloBtn.classList.add('on');
    } else {
      chip.textContent = '全景';
      chip.classList.remove('active');
      if (soloBtn) soloBtn.classList.remove('on');
    }
  }

  function clearSoloMode() {
    state.soloSun = false;
    state.soloIndex = -1;
    state.focusIndex = -1;
    state.cometFocusIndex = -1;
    showInfo(-1);
    updatePlanetListUI();
    updateSoloStatus();
    resetCamera();
  }

  function setSoloPlanet(index) {
    state.soloSun = false;
    state.soloIndex = index;
    state.focusIndex = index;
    soundApi.select(index);
    flyToPlanet(index);
    showInfo(index);
    updatePlanetListUI();
    updateSoloStatus();
  }

  // Solo the Sun: fly in close, show its info card, hide the planets (mirrors setSoloPlanet).
  function setSoloSun() {
    state.soloSun = true;
    state.soloIndex = -1;
    state.focusIndex = -1;
    state.cometFocusIndex = -1;
    soundApi.uiTick();
    flyToSun();
    showSunInfo();
    updatePlanetListUI();
    updateSoloStatus();
  }

  function openHelpPanel() {
    document.getElementById('help-panel')?.classList.remove('hidden');
  }

  function closeHelpPanel() {
    document.getElementById('help-panel')?.classList.add('hidden');
  }

  function toggleHelpPanel() {
    document.getElementById('help-panel')?.classList.toggle('hidden');
  }

  function toggleLayersMenu() {
    const menu = document.getElementById('layers-menu');
    if (!menu) return;
    // Mobile: anchor the drawer just below the top bar's actual bottom edge so it never overlaps
    // the top-bar frame (top-bar height varies with safe-area inset + content). Desktop keeps its
    // CSS top:76px — clear the inline style so the media-query value applies.
    if (window.matchMedia?.('(max-width: 720px)').matches) {
      const tb = document.getElementById('top-bar');
      if (tb) menu.style.top = (tb.getBoundingClientRect().bottom + 8) + 'px';
    } else {
      menu.style.top = '';
    }
    menu.classList.toggle('hidden');
  }

  // Mobile-only: when a card transitions from hidden→shown on a narrow screen, start it
  // collapsed (header peek) so the central 3D area stays visible. No-op on desktop.
  function watchCardPeek(cardId) {
    const card = document.getElementById(cardId);
    if (!card || typeof MutationObserver === 'undefined') return;
    let wasHidden = card.classList.contains('hidden');
    new MutationObserver(() => {
      const isHidden = card.classList.contains('hidden');
      if (wasHidden && !isHidden && window.matchMedia?.('(max-width: 720px)').matches) {
        card.classList.add('collapsed');
      }
      wasHidden = isHidden;
    }).observe(card, { attributes: true, attributeFilter: ['class'] });
  }

  // Custom inline dropdowns (mobile). Native <select> pops an OS picker modal; this opens in
  // place below the trigger and closes on selection. .mselect is display:none on desktop, so
  // the triggers never receive clicks there — desktop is unaffected.
  const mselects = [];
  function closeAllMSelects() { for (const m of mselects) m.close(); }
  function setupMSelect(root, opts) {
    if (!root) return { sync() {}, close() {} };
    const trigger = root.querySelector('.mselect-trigger');
    const label = root.querySelector('.mselect-label');
    const menu = root.querySelector('.mselect-menu');
    const options = root.querySelectorAll('.mselect-option');
    const getValue = opts.getValue, onChange = opts.onChange;
    function sync() {
      const v = getValue();
      options.forEach(o => o.classList.toggle('active', o.dataset.value === v));
      const cur = menu.querySelector('.mselect-option[data-value="' + v + '"]');
      if (label && cur) label.textContent = cur.textContent;
    }
    function close() { menu.classList.remove('open'); }
    function open() {
      closeAllMSelects();
      // Portal the menu to <body> so position:fixed resolves against the viewport. #top-bar
      // carries transform + backdrop-filter (from .panel), which makes it the containing block
      // for fixed descendants — that both mispositions the menu and lets top-bar's overflow-x
      // clip it. body has neither, so a fixed child positions/escapes correctly.
      if (menu.parentNode !== document.body) document.body.appendChild(menu);
      menu.classList.add('open');
      const r = trigger.getBoundingClientRect();
      menu.style.top = (r.bottom + 6) + 'px';
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
    }
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      if (menu.classList.contains('open')) close(); else open();
    });
    options.forEach(o => o.addEventListener('click', e => {
      e.stopPropagation();
      onChange(o.dataset.value);
      sync();
      close();
    }));
    sync();
    return { sync, close };
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
  }

  function bindControls() {
    document.querySelectorAll('#speed-seg button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#speed-seg button').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); state.speedMode = b.dataset.speed;
        soundApi.timeSpeed(state.speedMode);
        // Manual scrubber nudge speed follows the active 时/日/月/年 unit.
        const sc = document.getElementById('scrubber');
        if (sc) sc.step = String(SPEED_MODES[state.speedMode].value);
      });
    });
    document.querySelectorAll('#scale-seg button').forEach(b => {
      b.addEventListener('click', () => {
        if (state.scaleMode === b.dataset.scale) return;
        document.querySelectorAll('#scale-seg button').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); state.scaleMode = b.dataset.scale;
        soundApi.scaleMorph();
        applyScaleMode();
        rebuildOrbits();
        resetCamera();
      });
    });
    document.querySelectorAll('#quality-seg button').forEach(b => {
      b.addEventListener('click', () => {
        const mode = b.dataset.quality;
        if (!mode || state.renderQuality === mode) return;
        setRenderQuality(mode);
        syncQualityControls();
        syncLayerMenu();
      });
    });
    // Mobile custom dropdowns (inline, no native picker popup). Hidden on desktop.
    document.addEventListener('click', closeAllMSelects);
    document.getElementById('top-bar')?.addEventListener('scroll', closeAllMSelects, { passive: true });
    mselects.push(setupMSelect(document.getElementById('speed-mselect'), {
      getValue: () => state.speedMode,
      onChange: v => {
        state.speedMode = v;
        soundApi.timeSpeed(state.speedMode);
        const sc = document.getElementById('scrubber');
        if (sc) sc.step = String(SPEED_MODES[state.speedMode].value);
        document.querySelectorAll('#speed-seg button').forEach(x => x.classList.toggle('active', x.dataset.speed === state.speedMode));
      },
    }));
    mselects.push(setupMSelect(document.getElementById('scale-mselect'), {
      getValue: () => state.scaleMode,
      onChange: v => {
        if (state.scaleMode === v) return;
        state.scaleMode = v;
        soundApi.scaleMorph();
        applyScaleMode();
        rebuildOrbits();
        resetCamera();
        document.querySelectorAll('#scale-seg button').forEach(x => x.classList.toggle('active', x.dataset.scale === state.scaleMode));
      },
    }));
    qualityMSelect = setupMSelect(document.getElementById('quality-mselect'), {
      getValue: () => state.renderQuality,
      onChange: v => {
        if (!v || state.renderQuality === v) return;
        setRenderQuality(v);
        syncQualityControls();
        syncLayerMenu();
      },
    });
    mselects.push(qualityMSelect);
    document.getElementById('play-btn').addEventListener('click', e => {
      state.playing = !state.playing;
      e.target.textContent = state.playing ? '⏸' : '▶';
      soundApi.playPause(state.playing);
    });
    document.getElementById('reset-btn').addEventListener('click', resetCamera);
    document.getElementById('today-btn').addEventListener('click', () => {
      const days = (Date.now() - j2000.getTime()) / 86400000;
      state.simDays = days;
      const sc = document.getElementById('scrubber');
      if (days < +sc.min || days > +sc.max) {
        sc.min = String(Math.floor(days - 30000));
        sc.max = String(Math.ceil(days + 30000));
      }
      sc.value = Math.round(days);
      resetTrailsAndRevs();
      disposeEventVisuals();
      state.cometFocusIndex = -1;
    });

    for (const binding of layerBindings) {
      document.getElementById(binding.button)?.addEventListener('click', () => toggleLayerState(binding.key));
      document.getElementById(binding.checkbox)?.addEventListener('change', e => setLayerState(binding.key, e.target.checked));
    }
    document.getElementById('bloom-btn')?.addEventListener('click', () => toggleLayerState('bloomEnabled'));
    document.getElementById('layer-bloom')?.addEventListener('change', e => setLayerState('bloomEnabled', e.target.checked));
    document.getElementById('sound-btn')?.addEventListener('click', () => toggleLayerState('soundOn'));
    document.getElementById('layer-sound')?.addEventListener('change', e => setLayerState('soundOn', e.target.checked));

    // Ambient bed theme selector + custom audio file loader.
    const themeSelect = document.getElementById('audio-theme');
    const fileInput = document.getElementById('audio-file');
    themeSelect?.addEventListener('change', () => {
      const v = themeSelect.value;
      if (v === 'custom') {
        // Reuse an already-loaded file, otherwise open the picker.
        if (soundApi.hasCustom()) { state.audioTheme = 'custom'; soundApi.setTheme('custom'); }
        else { fileInput && fileInput.click(); }
      } else {
        state.audioTheme = v;
        soundApi.setTheme(v);
      }
    });
    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) { if (themeSelect) themeSelect.value = state.audioTheme; return; }
      const ok = await soundApi.loadCustom(file);
      if (ok) { state.audioTheme = 'custom'; if (themeSelect) themeSelect.value = 'custom'; }
      else { if (themeSelect) themeSelect.value = state.audioTheme; }
      fileInput.value = ''; // allow re-picking the same file later
    });
    document.getElementById('solo-btn').addEventListener('click', clearSoloMode);
    document.getElementById('scrubber').addEventListener('input', e => {
      state.simDays = +e.target.value;
      resetTrailsAndRevs();
      disposeEventVisuals();
      state.cometFocusIndex = -1;
    });
    document.getElementById('layers-btn')?.addEventListener('click', toggleLayersMenu);
    document.getElementById('layers-close')?.addEventListener('click', () => {
      document.getElementById('layers-menu')?.classList.add('hidden');
    });
    document.getElementById('help-btn')?.addEventListener('click', toggleHelpPanel);
    document.getElementById('help-close')?.addEventListener('click', closeHelpPanel);
    document.getElementById('info-close')?.addEventListener('click', () => {
      if (state.eventFocus) exitEventView();
      else closeInfoPanel();
    });
    document.getElementById('event-exit')?.addEventListener('click', exitEventView);

    // Mobile card collapse: chevron toggles a header-only peek; cards open collapsed so the
    // 3D scene stays visible. The chevron buttons are display:none on desktop (see styles.css),
    // so these handlers never fire there — desktop behaviour is unchanged.
    document.getElementById('info-collapse')?.addEventListener('click', () => {
      document.getElementById('info')?.classList.toggle('collapsed');
    });
    document.getElementById('ec-collapse')?.addEventListener('click', () => {
      document.getElementById('event-card')?.classList.toggle('collapsed');
    });
    watchCardPeek('info');
    watchCardPeek('event-card');

    window.addEventListener('keydown', e => {
      if (isTypingTarget(e.target)) return;
      if (e.code === 'Space') { e.preventDefault(); document.getElementById('play-btn').click(); return; }
      const key = e.key.toLowerCase();
      if (e.key === 'Escape' || key === '0') { e.preventDefault(); closeHelpPanel(); clearSoloMode(); return; }
      if (key >= '1' && key <= '8') { e.preventDefault(); setSoloPlanet(Number(key) - 1); return; }
      if (key === 'r') { e.preventDefault(); resetCamera(); return; }
      if (key === 'o') { e.preventDefault(); toggleLayerState('showOrbits'); return; }
      if (key === 'l') { e.preventDefault(); toggleLayerState('showLabels'); return; }
      if (key === 'b') { e.preventDefault(); toggleLayerState('showBelts'); return; }
      if (key === 'c') { e.preventDefault(); toggleLayerState('showComets'); return; }
      if (key === 't') { e.preventDefault(); toggleLayerState('showTrails'); return; }
      if (key === 'e') { e.preventDefault(); toggleLayerState('showEcliptic'); return; }
      if (key === 'v') { e.preventDefault(); toggleLayerState('rotateAroundCursor'); return; }
      if (key === '?' || key === 'h') { e.preventDefault(); toggleHelpPanel(); }
    });

    syncLayerMenu();
    syncQualityControls();
    updateSoloStatus();
  }

  return {
    bindControls,
    updateSoloStatus,
    clearSoloMode,
    setSoloPlanet,
    setSoloSun,
    closeHelpPanel,
    toggleHelpPanel,
    syncLayerMenu,
  };
}
