export function createPlanetListController({ document, state, planets, dwarfs, onPlanetClick, onDwarfClick }) {
  function initPlanetList() {
    const root = document.getElementById('planet-rows');
    const toggle = document.getElementById('toggle-list');
    toggle.addEventListener('click', e => {
      const panel = document.getElementById('planet-list');
      panel.classList.toggle('collapsed');
      e.target.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
    });
    planets.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'planet-row';
      row.innerHTML = `
        <span class="swatch" style="background:#${p.color.toString(16).padStart(6,'0')};color:#${p.color.toString(16).padStart(6,'0')};"></span>
        <span class="name">${p.name}</span>
        <input type="checkbox" checked />`;
      const cb = row.querySelector('input');
      cb.addEventListener('change', e => {
        e.stopPropagation();
        if (cb.checked) state.visible.add(i); else state.visible.delete(i);
      });
      row.addEventListener('click', e => {
        if (e.target === cb) return;
        onPlanetClick(i);
      });
      root.appendChild(row);
    });
    // Dwarf planets section (informational shortcuts; visibility toggled via 图层 menu).
    if (dwarfs && dwarfs.length) {
      const hdr = document.createElement('div');
      hdr.className = 'list-section';
      hdr.textContent = '矮行星';
      root.appendChild(hdr);
      dwarfs.forEach((d, i) => {
        const row = document.createElement('div');
        row.className = 'planet-row dwarf-row';
        row.innerHTML = `
          <span class="swatch" style="background:#${d.color.toString(16).padStart(6,'0')};color:#${d.color.toString(16).padStart(6,'0')};"></span>
          <span class="name">${d.name}</span>
          <span class="hint">→</span>`;
        row.addEventListener('click', () => onDwarfClick(i));
        root.appendChild(row);
      });
    }
    updatePlanetListUI();
  }

  function updatePlanetListUI() {
    document.querySelectorAll('.planet-row:not(.dwarf-row)').forEach((r, i) => {
      r.classList.toggle('focused', state.soloIndex === i || state.focusIndex === i);
      r.classList.toggle('solo', state.soloIndex === i);
    });
  }

  return { initPlanetList, updatePlanetListUI };
}
