export function installSelectionHandlers({
  canvas,
  window,
  document,
  THREE,
  camera,
  controls,
  state,
  sunMesh,
  planetObjs,
  cometObjs,
  dwarfObjs,
  planets,
  comets,
  dwarfs,
  setSoloPlanet,
  setSoloSun,
  clearSoloMode,
  flyToPlanet,
  showInfo,
  showMoonDetail,
  showCometInfo,
  showDwarfInfo,
  showSunInfo,
  updatePlanetListUI,
  soundApi,
}) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downAt = null;
  let hoveredObj = null; // last hovered mesh, for hover-blip debouncing

  function clickableMeshes() {
    const list = [];
    list.push(sunMesh);
    if (!state.soloSun) {
      for (let i = 0; i < planetObjs.length; i++) {
        const po = planetObjs[i];
        if (!state.visible.has(i)) continue;
        if (state.soloIndex !== -1 && state.soloIndex !== i) continue;
        list.push(po.mesh);
        for (const m of po.moons) if (m.mesh.visible) list.push(m.mesh);
      }
    }
    if (state.showComets) for (const co of cometObjs) if (co.group.visible) list.push(co.head);
    if (state.showDwarfs) for (const dwo of dwarfObjs) if (dwo.group.visible) list.push(dwo.mesh);
    return list;
  }

  // ---------- Rotate-around-cursor (opt-in) ----------
  // When state.rotateAroundCursor is on, a left-drag that starts on the Sun or a planet orbits
  // that body instead of the controls.target: the rigid (camera, target) pair is rotated around
  // the body's current position, so the body stays under the cursor and the scene swings around
  // it. There is no view jump on grab (the rotation starts at identity) and the pivot tracks the
  // body's orbital motion. Left-drags on empty space (or with the option off) fall through to
  // OrbitControls' normal rotate.
  const _up = new THREE.Vector3(0, 1, 0);
  const _fwd = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _qTheta = new THREE.Quaternion();
  const _qPhi = new THREE.Quaternion();
  const _q = new THREE.Quaternion();
  const _v = new THREE.Vector3();
  let rotPivot = null; // { kind:'sun'|'planet', idx?, startPx, active, P0, camRel0, tgtRel0, right0, phi0 }

  function pivotWorldPos(p) {
    return p.kind === 'sun' ? sunMesh.position : planetObjs[p.idx].group.position;
  }

  function ndcFromEvent(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    return mouse;
  }

  function tryStartRotate(e) {
    if (!state.rotateAroundCursor || e.button !== 0) return;
    raycaster.setFromCamera(ndcFromEvent(e), camera);
    const hits = raycaster.intersectObjects(clickableMeshes(), false);
    if (!hits.length) return;
    const obj = hits[0].object;
    let pivot = null;
    if (obj.userData && obj.userData.isSun) {
      pivot = { kind: 'sun' };
    } else {
      const idx = planetObjs.findIndex(po => po.mesh === obj);
      if (idx >= 0) pivot = { kind: 'planet', idx };
    }
    if (!pivot) return; // moons / dwarfs / comets: fall back to normal rotate
    pivot.startPx = { x: e.clientX, y: e.clientY };
    pivot.active = false;
    rotPivot = pivot;
    controls.enableRotate = false; // OrbitControls must not also rotate while we do
  }

  function activateRotate() {
    const P0 = pivotWorldPos(rotPivot).clone();
    rotPivot.P0 = P0;
    rotPivot.camRel0 = camera.position.clone().sub(P0);
    rotPivot.tgtRel0 = controls.target.clone().sub(P0);
    _fwd.copy(controls.target).sub(camera.position).normalize();
    _right.copy(_fwd).cross(_up).normalize();
    rotPivot.right0 = _right.clone();
    const r = rotPivot.camRel0.length();
    rotPivot.phi0 = Math.acos(THREE.MathUtils.clamp(r > 1e-9 ? rotPivot.camRel0.y / r : 0, -1, 1));
    rotPivot.active = true;
  }

  function applyRotate(e) {
    const dx = e.clientX - rotPivot.startPx.x;
    const dy = e.clientY - rotPivot.startPx.y;
    if (!rotPivot.active) {
      if (Math.hypot(dx, dy) < 6) return; // still a potential click — let picking handle it
      activateRotate();
    }
    const h = canvas.clientHeight || 800;
    const speed = controls.rotateSpeed || 1;
    const deltaTheta = -2 * Math.PI * dx / h * speed;
    const deltaPhi = -2 * Math.PI * dy / h * speed;
    const newPhi = THREE.MathUtils.clamp(rotPivot.phi0 + deltaPhi, 0.1, Math.PI - 0.1);
    const effDPhi = newPhi - rotPivot.phi0;
    _qTheta.setFromAxisAngle(_up, deltaTheta);
    _qPhi.setFromAxisAngle(rotPivot.right0, effDPhi);
    _q.copy(_qPhi).multiply(_qTheta);
    const Pcur = pivotWorldPos(rotPivot); // live: tracks the body's orbital motion
    camera.position.copy(Pcur).add(_v.copy(rotPivot.camRel0).applyQuaternion(_q));
    controls.target.copy(Pcur).add(_v.copy(rotPivot.tgtRel0).applyQuaternion(_q));
  }

  function endRotate() {
    if (!rotPivot) return;
    rotPivot = null;
    controls.enableRotate = true;
  }

  canvas.addEventListener('pointerdown', e => {
    downAt = {x:e.clientX, y:e.clientY};
    tryStartRotate(e);
  });
  canvas.addEventListener('pointerup', e => {
    const wasRotating = rotPivot && rotPivot.active;
    endRotate();
    if (!downAt) return;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    if (wasRotating) return; // it was a drag-orbit, not a click
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = clickableMeshes();
    const hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return;
    const obj = hits[0].object;
    if (obj.userData && obj.userData.isSun) {
      // Toggle: clicking the Sun solo-zooms in (like a planet); clicking again exits.
      if (state.soloSun) clearSoloMode();
      else setSoloSun();
      return;
    }
    if (obj.userData && typeof obj.userData.moonIdx === 'number') {
      const { planetIdx, moonIdx } = obj.userData;
      if (state.soloIndex !== planetIdx) {
        state.soloIndex = planetIdx; state.focusIndex = planetIdx;
        soundApi.select(planetIdx);
        flyToPlanet(planetIdx); showInfo(planetIdx); updatePlanetListUI();
      } else {
        soundApi.uiTick();
      }
      showMoonDetail(planetIdx, moonIdx);
      return;
    }
    if (obj.userData && typeof obj.userData.cometIdx === 'number') {
      const cidx = obj.userData.cometIdx;
      // Toggle: clicking the already-focused comet clears the highlight.
      state.cometFocusIndex = state.cometFocusIndex === cidx ? -1 : cidx;
      soundApi.comet();
      showCometInfo(cidx);
      return;
    }
    if (obj.userData && typeof obj.userData.dwarfIdx === 'number') {
      const didx = obj.userData.dwarfIdx;
      state.cometFocusIndex = -1;
      state.focusIndex = -1;
      state.soloIndex = -1;
      soundApi.uiTick();
      showDwarfInfo(didx);
      return;
    }
    // Clicking a planet/moon clears any comet focus.
    state.cometFocusIndex = -1;
    const idx = planetObjs.findIndex(po => po.mesh === obj);
    if (idx >= 0) {
      // Mobile: tap the already-soloed planet again to exit solo (the top-bar solo buttons are
      // hidden on mobile, so tapping the same planet is the way out). Desktop keeps the buttons
      // and the original non-toggle click.
      if (window.matchMedia?.('(max-width: 720px)').matches && state.soloIndex === idx) {
        clearSoloMode();
      } else {
        setSoloPlanet(idx);
      }
    }
  });

  canvas.addEventListener('pointermove', e => {
    if (rotPivot) { applyRotate(e); return; }
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = clickableMeshes();
    const hits = raycaster.intersectObjects(meshes, false);
    const tip = document.getElementById('tip');
    if (hits.length) {
      const obj = hits[0].object;
      if (obj !== hoveredObj) {
        hoveredObj = obj;
        const idx = planetObjs.findIndex(po => po.mesh === obj);
        if (idx >= 0) soundApi.hover(idx); // tuned blip only for planets
      }
      let label;
      if (obj.userData && obj.userData.isSun) {
        label = '太阳';
      } else if (obj.userData && typeof obj.userData.moonIdx === 'number') {
        label = planets[obj.userData.planetIdx].moons[obj.userData.moonIdx].name;
      } else if (obj.userData && typeof obj.userData.cometIdx === 'number') {
        label = comets[obj.userData.cometIdx].name;
      } else if (obj.userData && typeof obj.userData.dwarfIdx === 'number') {
        label = dwarfs[obj.userData.dwarfIdx].name;
      } else {
        const idx = planetObjs.findIndex(po => po.mesh === obj);
        label = idx >= 0 ? planets[idx].name : '';
      }
      tip.textContent = label;
      tip.style.left = (e.clientX + 12) + 'px';
      tip.style.top  = (e.clientY + 12) + 'px';
      tip.style.opacity = 1;
      canvas.style.cursor = 'pointer';
    } else {
      tip.style.opacity = 0;
      canvas.style.cursor = '';
      hoveredObj = null;
    }
  });

  // If the pointer leaves the canvas mid-drag, release the rotate lock so enableRotate is restored.
  canvas.addEventListener('pointerleave', () => { if (rotPivot && !rotPivot.active) endRotate(); });
  window.addEventListener('pointerup', endRotate);
}
