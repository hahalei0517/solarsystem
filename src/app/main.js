import { SUN, PLANETS, SPEED_MODES, J2000, COMETS, EPHEM, TEXTURES, DWARFS, COMET_SHOWERS, SUN_SPOT_CYCLE } from '../data/solar-system.js';
import {
  solveKepler,
  ephemerisCoordsAU,
  formatDateFromJ2000,
  getUtcYearFromJ2000Days,
} from '../core/orbits.js';
import { describeSkyEvent, getEventColor, scanSkyEvents } from '../core/events.js';
import {
  AU_IN_EARTH_DIAMETERS,
  semiMajorFor,
  trueOrbitFromKm,
  trueRadiusFromDiameterKm,
  sceneUnitsPerAU,
} from '../core/scale.js';
import { createSimulationState } from './state.js';
import { createInfoPanelController } from './ui/info-panel.js';
import { createPlanetListController } from './ui/planet-list.js';
import { createControlsController } from './ui/controls.js';
import { installSelectionHandlers } from './input-selection.js';
import { sound, initAudio, disableAudio } from './audio.js';

const THREE = window.THREE;
if (!THREE) throw new Error('three.min.js 加载失败，检查文件是否与 index.html 同目录');
const OrbitControls = THREE.OrbitControls;
if (!OrbitControls) throw new Error('OrbitControls.js 加载失败');

/* =========================================================
 *  Solar System 3D (Three.js)
 *
 *  Units: 1 scene unit = 1 AU (real mode) or arbitrary (schematic).
 *  Time: days since J2000 (2000-01-01 12:00 UTC).
 *  Orbits use Kepler's equation with real e, inclination, argument of periapsis.
 * ========================================================= */

// ---------- Data ----------
function prefersPerformanceMode() {
  return window.matchMedia?.('(max-width: 720px)').matches || window.innerWidth <= 720;
}

const QUALITY_PRESETS = {
  quality: {
    maxPixelRatio: 2,
    shadows: true,
    starDrawCount: 4000,
    asteroidDrawCount: 800,
    kuiperDrawCount: 500,
  },
  performance: {
    maxPixelRatio: 1,
    shadows: false,
    starDrawCount: 1500,
    asteroidDrawCount: 250,
    kuiperDrawCount: 150,
  },
};

const state = createSimulationState({
  renderQuality: prefersPerformanceMode() ? 'performance' : 'quality',
});

function currentQuality() {
  return QUALITY_PRESETS[state.renderQuality] || QUALITY_PRESETS.quality;
}

function renderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, currentQuality().maxPixelRatio);
}

// ---------- Three.js setup ----------
const canvas = document.getElementById('stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

// ---------- Texture loader + manager with progress ----------
const loadingManager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(loadingManager);
const TEX_CACHE = {};
function loadTex(path, sRGB=true) {
  if (TEX_CACHE[path]) return TEX_CACHE[path];
  const t = texLoader.load(path);
  if (sRGB) t.encoding = THREE.sRGBEncoding;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  TEX_CACHE[path] = t;
  return t;
}
loadingManager.onProgress = (url, loaded, total) => {
  const l = document.getElementById('loader');
  if (!l || !total) return;
  const pct = Math.round((loaded / total) * 100);
  l.innerHTML = `<span>加载 NASA 贴图 ${loaded}/${total} · ${pct}%<span class="dot">...</span></span>`;
};
loadingManager.onError = (url) => {
  console.warn('texture failed:', url);
};

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.001, 5000);
camera.position.set(0, 13, 17);  // start further out so the boot-time fly-in is a cinematic approach

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(renderPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = currentQuality().shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.05;
controls.maxDistance = 600;
controls.zoomSpeed = 1.1;
controls.screenSpacePanning = true;
controls.enableZoom = false;  // we handle wheel ourselves (zoom-to-cursor below)

// ----- Zoom-to-cursor wheel handler -----
// Correct r150+ zoomToCursor: dolly the camera toward the target (changing the camera–target
// distance, clamped to min/maxDistance), THEN shift target+camera together so the world point
// under the cursor stays fixed. The previous port moved both by the same vector *instead* of
// changing the distance, which left the distance unchanged and drifted the target — making the
// zoom feel like an erratic pan and the rotation pivot wander (especially in real/true scale).
// The per-tick ratio is adaptive: full step when far, finer when close to the target body so
// positioning near the Sun stays precise instead of jumping ~10% at a time.
(function installZoomToCursor() {
  const _mouse = new THREE.Vector2();
  const _ray = new THREE.Raycaster();
  const _plane = new THREE.Plane();
  const _planeN = new THREE.Vector3();
  const _anchor = new THREE.Vector3();
  const _offset = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  function currentSunRadius() {
    return state.scaleMode === 'true' ? trueRadiusFromDiameterKm(SUN.realDiameterKm) : SUN.radius;
  }

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    e.stopPropagation();

    _mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    _mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Anchor: world point under the cursor on the plane through the target (⊥ to the view dir).
    _planeN.subVectors(camera.position, controls.target).normalize();
    _plane.setFromNormalAndCoplanarPoint(_planeN, controls.target);
    _ray.setFromCamera(_mouse, camera);
    const hasAnchor = _ray.ray.intersectPlane(_plane, _anchor);

    // Dolly: change the camera–target distance by an adaptive ratio.
    const camDist = camera.position.distanceTo(controls.target);
    const sunR = currentSunRadius();
    const proximity = sunR / (camDist + sunR);   // 0 far → ~0.5 at camDist=sunR → ~1 touching
    const ratio = 0.10 - 0.07 * proximity;       // 10% far → ~3% near the body
    const zoomIn = e.deltaY < 0;
    let newDist = camDist * (zoomIn ? (1 - ratio) : (1 + ratio));
    newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, newDist));
    if (Math.abs(newDist - camDist) < 1e-9) return;

    // Move the camera along the target line to the new distance (target stays for the moment).
    _offset.copy(camera.position).sub(controls.target).multiplyScalar(newDist / camDist);
    camera.position.copy(controls.target).add(_offset);

    // Keep the cursor's world point fixed: shift target+camera together (rigid → preserves the
    // new distance) so the anchor projects back under the cursor.
    if (hasAnchor) {
      camera.lookAt(controls.target);
      camera.updateMatrixWorld();
      _tmp.copy(_anchor).project(camera);                       // anchor NDC z after dolly
      _offset.set(_mouse.x, _mouse.y, _tmp.z).unproject(camera); // point on cursor ray at that depth
      _offset.subVectors(_anchor, _offset);                     // shift = anchor − that point
      camera.position.add(_offset);
      controls.target.add(_offset);
    }
  }, { passive: false });
})();

// ----- Pinch-to-zoom (touch only) -----
// Two-finger pinch zooms toward the pinch midpoint, mirroring the wheel zoom-to-cursor
// dolly math above. Independent of OrbitControls, which (with enableZoom=false) handles
// one-finger rotate + two-finger pan; pinch adds zoom on top — the three are orthogonal,
// composing like the native DOLLY_PAN gesture.
//
// Desktop guarantee: the IIFE bails out (attaches no listeners) on devices without touch,
// and each handler ignores non-touch pointers. Mouse/wheel behaviour is byte-identical to
// before; the wheel handler above is not touched.
(function installPinchZoom() {
  const hasTouch = window.matchMedia?.('(pointer: coarse)').matches || ('ontouchstart' in window);
  if (!hasTouch) return;

  const _mid = new THREE.Vector2();
  const _ray = new THREE.Raycaster();
  const _plane = new THREE.Plane();
  const _planeN = new THREE.Vector3();
  const _anchor = new THREE.Vector3();
  const _offset = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  function currentSunRadius() {
    return state.scaleMode === 'true' ? trueRadiusFromDiameterKm(SUN.realDiameterKm) : SUN.radius;
  }

  // Same dolly math as the wheel handler: anchor the world point under the screen point,
  // change the camera–target distance, then shift camera+target together to keep the anchor
  // fixed. `pinchScale` = current finger distance / last finger distance (>1 spread → zoom in).
  function dollyAt(ndcX, ndcY, pinchScale) {
    _mid.set(ndcX, ndcY);
    _planeN.subVectors(camera.position, controls.target).normalize();
    _plane.setFromNormalAndCoplanarPoint(_planeN, controls.target);
    _ray.setFromCamera(_mid, camera);
    const hasAnchor = _ray.ray.intersectPlane(_plane, _anchor);

    const camDist = camera.position.distanceTo(controls.target);
    const sunR = currentSunRadius();
    const proximity = sunR / (camDist + sunR);
    const ratio = 0.10 - 0.07 * proximity;
    let newDist = camDist / pinchScale;
    // Clamp the per-frame change to the same ±ratio band as wheel zoom so one pinch frame
    // can't jump further than one wheel tick.
    newDist = Math.max(camDist * (1 - ratio), Math.min(camDist * (1 + ratio), newDist));
    newDist = Math.max(controls.minDistance, Math.min(controls.maxDistance, newDist));
    if (Math.abs(newDist - camDist) < 1e-9) return;

    _offset.copy(camera.position).sub(controls.target).multiplyScalar(newDist / camDist);
    camera.position.copy(controls.target).add(_offset);

    if (hasAnchor) {
      camera.lookAt(controls.target);
      camera.updateMatrixWorld();
      _tmp.copy(_anchor).project(camera);
      _offset.set(_mid.x, _mid.y, _tmp.z).unproject(camera);
      _offset.subVectors(_anchor, _offset);
      camera.position.add(_offset);
      controls.target.add(_offset);
    }
  }

  const pointers = new Map(); // pointerId -> {x,y}
  let lastDist = 0;

  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      lastDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch') return;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size !== 2) return;
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastDist > 0 && dist > 0 && Math.abs(dist - lastDist) > 0.5) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ndcX = (mx / window.innerWidth) * 2 - 1;
      const ndcY = -(my / window.innerHeight) * 2 + 1;
      dollyAt(ndcX, ndcY, dist / lastDist);
    }
    lastDist = dist;
  });
  function endPointer(e) {
    if (e.pointerType !== 'touch') return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastDist = 0;
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', endPointer);
})();

// ---------- Post-processing (Bloom) ----------
const composer = new THREE.EffectComposer(renderer);
composer.setPixelRatio(renderPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);
// strength, radius, threshold — tuned so only the sun + bright planets glow
const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85,   // strength
  0.6,    // radius
  0.18    // threshold (lower = more pixels bloom)
);
composer.addPass(bloomPass);
let bloomEnabled = state.renderQuality === 'quality';

// Cinematic vignette + subtle film grain (quality mode only). Final pass → renders to screen.
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 1.0 },
    uGrain: { value: 1.0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float vig = smoothstep(0.85, 0.30, length(vUv - 0.5));
      c.rgb *= mix(1.0, vig, 0.55 * uVignette);
      float g = (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 60.0) - 0.5) * 0.05 * uGrain;
      c.rgb += g;
      gl_FragColor = c;
    }
  `,
};
const cinematicPass = new THREE.ShaderPass(CinematicShader);
composer.addPass(cinematicPass);

// ---------- Texture procedural generation ----------
function makeNoiseTexture(w, h, baseColor, bands) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cc = c.getContext('2d');

  // base color
  cc.fillStyle = baseColor;
  cc.fillRect(0,0,w,h);

  // gradient lighting
  const grad = cc.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, 'rgba(255,255,255,0.10)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  cc.fillStyle = grad; cc.fillRect(0,0,w,h);

  // bands (gas giants)
  if (bands && bands.length) {
    for (let i = 0; i < bands.length; i++) {
      const yc = (i + 0.5) / bands.length * h + (Math.sin(i*1.7) * h * 0.01);
      const bh = h / bands.length * (0.6 + Math.random()*0.7);
      cc.fillStyle = bands[i] + 'CC';
      cc.fillRect(0, yc - bh/2, w, bh);
      // wavy turbulence
      cc.globalAlpha = 0.25;
      for (let k = 0; k < 6; k++) {
        const yy = yc - bh/2 + Math.random()*bh;
        cc.fillStyle = bands[(i+1) % bands.length];
        cc.fillRect(Math.random()*w, yy, w*0.4, 1.5);
      }
      cc.globalAlpha = 1;
    }
  }

  // Speckle noise to add texture
  const img = cc.getImageData(0,0,w,h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    d[i]   = Math.max(0, Math.min(255, d[i]   + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  cc.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function makeEarthTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const cc = c.getContext('2d');
  // ocean
  const og = cc.createLinearGradient(0,0,0,512);
  og.addColorStop(0, '#1B3B6F'); og.addColorStop(0.5, '#2E6FB3'); og.addColorStop(1, '#1B3B6F');
  cc.fillStyle = og; cc.fillRect(0,0,1024,512);
  // continents — random blobs
  const greens = ['#3D7C4F', '#5A9C5F', '#2E6440', '#6FA070', '#80664A'];
  cc.globalAlpha = 0.9;
  for (let i = 0; i < 80; i++) {
    cc.fillStyle = greens[i % greens.length];
    const cx = Math.random()*1024, cy = 60 + Math.random()*392;
    const rx = 30 + Math.random()*120, ry = 20 + Math.random()*60;
    cc.beginPath(); cc.ellipse(cx, cy, rx, ry, Math.random()*Math.PI, 0, Math.PI*2); cc.fill();
  }
  cc.globalAlpha = 1;
  // ice caps
  cc.fillStyle = 'rgba(240,250,255,0.85)';
  cc.fillRect(0,0,1024,28); cc.fillRect(0,484,1024,28);
  // clouds (lighter overlay)
  cc.globalAlpha = 0.35; cc.fillStyle = '#FFFFFF';
  for (let i = 0; i < 40; i++) {
    cc.beginPath();
    cc.ellipse(Math.random()*1024, Math.random()*512, 40+Math.random()*80, 10+Math.random()*20, Math.random()*Math.PI, 0, Math.PI*2);
    cc.fill();
  }
  cc.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// Procedural Earth cloud layer (white clumps on transparent canvas).
function makeEarthCloudsTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const cc = c.getContext('2d');
  cc.clearRect(0, 0, 1024, 512);
  cc.globalAlpha = 0.55; cc.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    const cx = Math.random()*1024, cy = Math.random()*512;
    const rx = 30 + Math.random()*90, ry = 12 + Math.random()*30;
    cc.beginPath(); cc.ellipse(cx, cy, rx, ry, Math.random()*Math.PI, 0, Math.PI*2); cc.fill();
  }
  // swirl bands
  cc.globalAlpha = 0.25;
  for (let i = 0; i < 6; i++) {
    const y = Math.random()*512;
    cc.fillRect(0, y, 1024, 6 + Math.random()*10);
  }
  cc.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// Procedural Earth night-lights map (black ocean/land with scattered warm "city" specks).
function makeEarthNightTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const cc = c.getContext('2d');
  cc.fillStyle = '#05060a'; cc.fillRect(0, 0, 1024, 512);
  // clusters of city lights, denser where landmasses roughly sit (mid-latitudes)
  for (let i = 0; i < 1400; i++) {
    const cx = Math.random()*1024;
    const cy = 80 + Math.random()*352; // avoid poles
    const a = 0.4 + Math.random()*0.6;
    cc.fillStyle = `rgba(255,${200 + Math.random()*40|0},${120 + Math.random()*60|0},${a})`;
    cc.fillRect(cx, cy, 1.2, 1.2);
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function makeSunTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const cc = c.getContext('2d');
  const g = cc.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#FFD56B'); g.addColorStop(0.5,'#FDB813'); g.addColorStop(1,'#E07A14');
  cc.fillStyle = g; cc.fillRect(0,0,512,256);
  // granulation
  for (let i = 0; i < 1200; i++) {
    const x = Math.random()*512, y = Math.random()*256;
    cc.fillStyle = `rgba(${255-Math.random()*60|0},${180-Math.random()*40|0},${30+Math.random()*20|0},${Math.random()*0.5})`;
    cc.beginPath(); cc.arc(x,y, Math.random()*4+1, 0, Math.PI*2); cc.fill();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

function makeRingTexture(inner=1.5, outer=2.4, alpha=0.7) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const cc = c.getContext('2d');
  for (let x = 0; x < 512; x++) {
    const t = x / 512; // 0..1 inside..outside
    const r = Math.sin(t*40) * 0.5 + 0.5;
    const r2 = Math.sin(t*120 + 1.3) * 0.4 + 0.6;
    const a = (r*0.6 + r2*0.4) * alpha * (1 - Math.abs(t-0.5)*0.4);
    // Cassini-style gap
    const gap = Math.exp(-Math.pow((t-0.62)/0.02, 2)) * 0.9;
    const aa = Math.max(0, a - gap);
    cc.fillStyle = `rgba(225,205,165,${aa})`;
    cc.fillRect(x, 0, 1, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// ---------- Light & stars ----------
const sunLight = new THREE.PointLight(0xfff0c0, 3.2, 0, 1.0); // real lighting: radiates from the Sun
sunLight.position.set(0,0,0);
sunLight.castShadow = currentQuality().shadows;
sunLight.shadow.mapSize.set(1024, 1024); // point light uses cube shadows; keep this moderate for performance
sunLight.shadow.camera.near = 0.05;
sunLight.shadow.camera.far = 80;
sunLight.shadow.bias = -0.0003;
scene.add(sunLight);
// A very soft ambient term keeps night sides readable without changing the sun-facing logic.
scene.add(new THREE.AmbientLight(0x0a1020, 0.16));

// Starfield
function buildStarfield() {
  const N = 4000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N*3);
  const col = new Float32Array(N*3);
  for (let i = 0; i < N; i++) {
    const r = 200 + Math.random()*200;
    const u = Math.random()*2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u*u);
    pos[i*3]   = r * s * Math.cos(th);
    pos[i*3+1] = r * u;
    pos[i*3+2] = r * s * Math.sin(th);
    // Spectral-type tinting: most stars yellow-white, a few hot blue or cool red.
    function spectralColor() {
      const r = Math.random();
      if (r < 0.06) return [0.62, 0.72, 1.00]; // O/B blue-white
      if (r < 0.20) return [0.82, 0.88, 1.00]; // A white-blue
      if (r < 0.55) return [1.00, 1.00, 0.94]; // F/G yellow-white (Sun-like)
      if (r < 0.85) return [1.00, 0.90, 0.76]; // K orange
      return [1.00, 0.72, 0.58];               // M red-orange
    }
    const base = 0.55 + Math.random()*0.45;
    const sc = spectralColor();
    col[i*3]   = sc[0] * base;
    col[i*3+1] = sc[1] * base;
    col[i*3+2] = sc[2] * base;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}
const starfield = buildStarfield();
starfield.geometry.setDrawRange(0, currentQuality().starDrawCount);
scene.add(starfield);

// Milky-way sky sphere as background
const skyTex = loadTex(TEXTURES.skyMilkyWay);
const skyGeo = new THREE.SphereGeometry(450, 40, 40);
const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, toneMapped: false });
const skySphere = new THREE.Mesh(skyGeo, skyMat);
skySphere.material.opacity = 0.55;
skySphere.material.transparent = true;
skySphere.material.depthWrite = false; // pure backdrop: never competes with stars in the depth buffer
skySphere.renderOrder = -1;
scene.add(skySphere);

// ---------- Named bright stars (ambient reference, not a real catalog) ----------
// A handful of famous stars placed at fixed directions on the sky sphere, with
// labels, to give the starfield recognizable anchors. Positions are illustrative.
const BRIGHT_STARS = [
  { name: "天狼星 Sirius",     dir: [0.50, -0.20, 0.84] },
  { name: "织女星 Vega",       dir: [0.30,  0.80, -0.50] },
  { name: "北极星 Polaris",    dir: [0.00,  0.95, 0.30] },
  { name: "参宿四 Betelgeuse", dir: [-0.60, 0.10, 0.80] },
  { name: "参宿七 Rigel",      dir: [-0.50, -0.30, 0.80] },
  { name: "大角星 Arcturus",   dir: [0.70,  0.20, 0.70] },
  { name: "牛郎星 Altair",     dir: [0.20,  0.10, -0.97] },
  { name: "天津四 Deneb",      dir: [-0.20, 0.60, -0.77] },
];
const BRIGHT_STAR_RADIUS = 430;
function makeStarDotTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const cc = c.getContext('2d');
  const g = cc.createRadialGradient(32, 32, 1, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(220,230,255,0.9)');
  g.addColorStop(1, 'rgba(180,200,255,0)');
  cc.fillStyle = g; cc.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const brightStarsGroup = new THREE.Group();
const brightStarLabels = [];
(function buildBrightStars() {
  const dotTex = makeStarDotTexture();
  for (const s of BRIGHT_STARS) {
    const mat = new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sp = new THREE.Sprite(mat);
    sp.position.set(s.dir[0]*BRIGHT_STAR_RADIUS, s.dir[1]*BRIGHT_STAR_RADIUS, s.dir[2]*BRIGHT_STAR_RADIUS);
    sp.scale.set(6, 6, 1);
    brightStarsGroup.add(sp);
    const lab = document.createElement('div');
    lab.className = 'pl-label star-label';
    lab.textContent = s.name;
    document.getElementById('planet-labels').appendChild(lab);
    brightStarLabels.push({ label: lab, sprite: sp });
  }
  scene.add(brightStarsGroup);
})();

// ---------- Ecliptic reference plane (Earth's orbital plane) ----------
function buildEclipticPlane() {
  const group = new THREE.Group();
  // Main disc
  const disc = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 35, 128),
    new THREE.MeshBasicMaterial({ color: 0x4a90e2, side: THREE.DoubleSide, transparent: true, opacity: 0.04, depthWrite: false })
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);
  // Radial guidelines every 1 AU
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.10 });
  for (let r = 1; r <= 30; r += 1) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  // Axis cross: X = vernal equinox direction
  const axisMat = new THREE.LineBasicMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.25 });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-32,0,0), new THREE.Vector3(32,0,0)]), axisMat));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-32), new THREE.Vector3(0,0,32)]), axisMat));
  // Zodiac sector ticks every 30° (12 sectors) along the outer rim, like a celestial-longitude dial.
  const tickMat = new THREE.LineBasicMaterial({ color: 0x6aa6e8, transparent: true, opacity: 0.30 });
  for (let s = 0; s < 12; s++) {
    const ang = (s / 12) * Math.PI * 2;
    const inner = 33.5, outer = 36;
    const cx = Math.cos(ang), sz = Math.sin(ang);
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx*inner, 0, sz*inner), new THREE.Vector3(cx*outer, 0, sz*outer)]),
      tickMat
    ));
  }
  group.visible = false;
  return group;
}
const eclipticPlane = buildEclipticPlane();
scene.add(eclipticPlane);

// ---------- Sun ----------
const sunTex = loadTex(TEXTURES.sun);
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, toneMapped: false });
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius, 48, 48), sunMat);
scene.add(sunMesh);

// Sun glow billboard (sprite)
function makeGlowSprite() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const cc = c.getContext('2d');
  const g = cc.createRadialGradient(128,128, 10, 128,128, 128);
  g.addColorStop(0, 'rgba(255,220,140,0.9)');
  g.addColorStop(0.3,'rgba(255,180,80,0.35)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  cc.fillStyle = g; cc.fillRect(0,0,256,256);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(mat);
  s.scale.set(SUN.radius*3.2, SUN.radius*3.2, 1);
  return s;
}
const sunGlow = makeGlowSprite();
scene.add(sunGlow);

// Sun corona — a larger, softer additive sprite that gently pulses to suggest
// the dynamic solar atmosphere. Animated in tick().
const coronaSprite = makeGlowSprite();
coronaSprite.material = coronaSprite.material.clone();
coronaSprite.material.opacity = 0.5;
const coronaBaseScale = SUN.radius * 7.5;
coronaSprite.scale.set(coronaBaseScale, coronaBaseScale, 1);
scene.add(coronaSprite);

// (Cross-spike diffraction-ray lens-flare billboard removed on request;
//  the round glow + pulsing corona + prominences are retained.)

// Solar prominences — a few small reddish arcs anchored to the Sun's limb, slowly
// rotating to suggest erupting plasma loops. Children of sunMesh so they scale with it.
const sunProminences = new THREE.Group();
(function buildSunProminences() {
  const arcGeo = new THREE.TorusGeometry(SUN.radius * 1.06, SUN.radius * 0.035, 8, 24, Math.PI * 0.5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff6a3d, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  for (let k = 0; k < 4; k++) {
    const arc = new THREE.Mesh(arcGeo, mat.clone());
    arc.rotation.z = (k / 4) * Math.PI * 2;
    arc.rotation.x = (k % 2) * 0.6;
    arc.material.opacity = 0.35 + (k % 2) * 0.2;
    sunProminences.add(arc);
  }
  sunMesh.add(sunProminences);
})();
sunMesh.userData = { isSun: true }; // tag for raycast click

// ---------- Planets ----------
const planetObjs = []; // { group, mesh, orbitLine, moons:[{mesh,orbitLine}], data }
const cometObjs = [];  // { group, head, tail, orbitLine, data }
const dwarfObjs = [];  // { group, mesh, orbitLine, label, data }
const labelEls = [];

// ---------- State (declared early — used by semiMajor/buildOrbit during construction) ----------

function semiMajor(p) {
  return semiMajorFor(state.scaleMode, p);
}

// returns heliocentric ecliptic position in AU
function ephemerisAU(name, simDays) {
  const coords = ephemerisCoordsAU(name, simDays, EPHEM);
  if (!coords) return null;
  // Heliocentric ecliptic: x toward vernal equinox, y in ecliptic plane 90° east, z to ecliptic north pole.
  // Three.js scene uses Y up; map (x_ecl, y_ecl, z_ecl) → (x, z_ecl, -y_ecl) so the ecliptic lies in XZ plane.
  return new THREE.Vector3(coords.x, coords.z, -coords.y);
}

// returns Vector3 in heliocentric ecliptic frame (Y up).
// In "real" scale mode we use the Standish ephemeris (true positions); in schematic mode we keep the
// pretty laid-out orbits with each planet's catalog e/inc/peri.
function keplerPos(p, simDays, a) {
  // Always use the real ephemeris when available, scaled to the current scene mode
  // (schematic compresses by p.orbit/p.realAU, real = 1 AU/unit, true = Earth diameters).
  // This keeps planet positions date-accurate and consistent with sky-event detection
  // in every mode, so e.g. a Mercury transit actually places Mercury between Sun and Earth.
  if (EPHEM[p.en]) {
    return ephemerisAU(p.en, simDays).multiplyScalar(a / p.realAU);
  }
  const e = p.e, T = p.period;
  const M = ((simDays % T) / T) * Math.PI * 2;
  const E = solveKepler(M, e);
  const xo = a * (Math.cos(E) - e);
  const yo = a * Math.sqrt(1 - e*e) * Math.sin(E);
  // Apply argument of periapsis (rotation in orbital plane)
  const w = p.peri * Math.PI / 180;
  const xr = xo*Math.cos(w) - yo*Math.sin(w);
  const yr = xo*Math.sin(w) + yo*Math.cos(w);
  // Inclination tilt
  const inc = p.inc * Math.PI / 180;
  const x = xr;
  const z = yr * Math.cos(inc); // map orbital y → ecliptic z
  const y = yr * Math.sin(inc); // out-of-plane → ecliptic y
  return new THREE.Vector3(x, y, z);
}

function buildOrbitLine(p, segments=512) {
  const pts = [];
  const a = semiMajor(p);
  // Sample one full orbital period from the ephemeris so the line follows the true
  // precessing orbit, scaled to the current scene mode (works for all three modes).
  if (EPHEM[p.en]) {
    const T = p.period; // days
    const t0 = state.simDays;
    for (let i = 0; i <= segments; i++) {
      const v = ephemerisAU(p.en, t0 + (i/segments)*T);
      pts.push(v.multiplyScalar(a / p.realAU));
    }
  } else {
    const e = p.e;
    const w = p.peri * Math.PI / 180;
    const inc = p.inc * Math.PI / 180;
    for (let i = 0; i <= segments; i++) {
      const E = (i / segments) * Math.PI * 2;
      const xo = a*(Math.cos(E)-e);
      const yo = a*Math.sqrt(1-e*e)*Math.sin(E);
      const xr = xo*Math.cos(w) - yo*Math.sin(w);
      const yr = xo*Math.sin(w) + yo*Math.cos(w);
      pts.push(new THREE.Vector3(xr, yr*Math.sin(inc), yr*Math.cos(inc)));
    }
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  // Vertex-color gradient: perihelion (closest to Sun) brightest, aphelion dimmest.
  let rMin = Infinity, rMax = -Infinity;
  for (const pt of pts) {
    const r = pt.length();
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
  }
  const base = new THREE.Color(p.color);
  const colors = new Float32Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    const r = pts[i].length();
    const span = (rMax - rMin) || 1;
    const intensity = 0.32 + 0.68 * (1 - (r - rMin) / span); // 1 at perihelion, 0.32 at aphelion
    colors[i*3]   = base.r * intensity;
    colors[i*3+1] = base.g * intensity;
    colors[i*3+2] = base.b * intensity;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  return new THREE.Line(geo, mat);
}

// ---------- Comet helpers ----------
function cometScenePosFromOrbitalXY(c, xo, yo) {
  const w = c.w * Math.PI/180, inc = c.i * Math.PI/180, Om = c.Om * Math.PI/180;
  const xr = xo*Math.cos(w) - yo*Math.sin(w);
  const yr = xo*Math.sin(w) + yo*Math.cos(w);
  const x = xr*Math.cos(Om) - yr*Math.cos(inc)*Math.sin(Om);
  const y = xr*Math.sin(Om) + yr*Math.cos(inc)*Math.cos(Om);
  const z = yr*Math.sin(inc);
  if (state.scaleMode === 'true') {
    return new THREE.Vector3(x, z, -y).multiplyScalar(AU_IN_EARTH_DIAMETERS);
  }
  if (state.scaleMode === 'real') {
    return new THREE.Vector3(x, z, -y); // AU = scene units
  }
  const a = c.q / (1 - c.e);  // semi-major axis (AU)
  // Dwarfs with a hand-tuned schematic `orbit` (e.g. Ceres → asteroid belt) anchor their
  // semi-major axis at that scene-unit distance, preserving eccentricity shape. Other
  // comets/dwarfs share Neptune's AU→scene ratio so the outer system stays to scale.
  const scale = c.orbit != null
    ? c.orbit / a
    : Math.max(PLANETS[7].orbit / PLANETS[7].realAU, (SUN.radius * 2.35) / c.q);
  return new THREE.Vector3(x, z, -y).multiplyScalar(scale);
}

function cometOrbitPos(c, simDays) {
  const a = c.q / (1 - c.e);  // semi-major axis (AU)
  let T = c.T;
  if (!isFinite(T)) {
    // For parabolic/hyperbolic use Kepler's 3rd law with a proxy; here we just linearize near perihelion
    // by treating it as a very long-period ellipse for motion visualization.
    T = 2 * Math.PI * Math.sqrt(Math.abs(a*a*a) / 0.000296);  // years
  }
  T *= 365.25;  // days
  let M = ((simDays - c.tp) % T) / T * 2 * Math.PI;
  M = ((M + Math.PI) % (2*Math.PI)) - Math.PI;
  const e = c.e;
  let E;
  if (e < 1) {
    E = solveKepler(M, e);
  } else {
    // hyperbolic anomaly Newton solve
    E = M;
    for (let i = 0; i < 8; i++) {
      const f = e*Math.sinh(E) - E - M;
      const fp = e*Math.cosh(E) - 1;
      E -= f/fp;
    }
  }
  const xo = a * (Math.cos(E) - e);
  const yo = a * Math.sqrt(Math.abs(1 - e*e)) * Math.sin(E);
  return cometScenePosFromOrbitalXY(c, xo, yo);
}

function buildCometOrbitLine(c, segments=1440) {
  const pts = [];
  const a = c.q / (1 - c.e);
  const e = c.e;
  // Sample uniformly by eccentric anomaly instead of time. Time-uniform sampling is sparse near perihelion
  // because Halley moves fastest there, which made the curve look polygonal around the Sun.
  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * Math.PI * 2;
    const xo = a * (Math.cos(E) - e);
    const yo = a * Math.sqrt(1 - e*e) * Math.sin(E);
    pts.push(cometScenePosFromOrbitalXY(c, xo, yo));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: c.color,
    transparent: true,
    opacity: 0.26,
    depthWrite: false
  });
  return new THREE.Line(geo, mat);
}

// Soft radial glow texture for the coma (greenish-white, like a real cometary coma).
function makeComaTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const cc = c.getContext('2d');
  const g = cc.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0,   'rgba(225,255,238,0.95)');
  g.addColorStop(0.35,'rgba(180,245,225,0.40)');
  g.addColorStop(1,   'rgba(160,235,210,0)');
  cc.fillStyle = g; cc.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

function buildComet(c, idx) {
  const group = new THREE.Group();
  // Halley & Swift-Tuttle (headRadius set in data) scale up uniformly so nucleus, coma and
  // tails stay proportional while the click target grows ~1.7×.
  if (c.headRadius) group.scale.setScalar(c.headRadius / 0.07);
  // Nucleus: lit rocky sphere (MeshStandardMaterial) with a faint emissive tint of the comet's
  // color so it stays visible even far from the Sun. Enlarged from 0.035 → 0.07 for easier
  // click capture (the head mesh is the raycast target).
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x6b6256, roughness: 0.95, metalness: 0.0, emissive: c.color, emissiveIntensity: 0.14
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20), headMat);
  head.userData = { cometIdx: idx };
  head.castShadow = false;
  group.add(head);

  // Coma: soft additive halo around the nucleus that swells as the comet approaches the Sun.
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeComaTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5
  }));
  coma.scale.set(0.22, 0.22, 1);
  group.add(coma);

  // Ion (plasma) tail — blue-white, driven straight away from the Sun by the solar wind.
  const ionGeo = new THREE.CylinderGeometry(0.002, 0.018, 1, 14, 1, true);
  ionGeo.translate(0, 0.5, 0); // base near nucleus, extends along +Y
  const ionMat = new THREE.MeshBasicMaterial({
    color: 0xbfefff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false
  });
  const tail = new THREE.Mesh(ionGeo, ionMat);
  group.add(tail);

  // Dust tail — warm, broader, and curved: lags behind the motion because heavier
  // dust grains retain orbital velocity and drift opposite to the comet's velocity.
  const dustGeo = new THREE.CylinderGeometry(0.005, 0.030, 1, 14, 1, true);
  dustGeo.translate(0, 0.5, 0);
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0xffe2a8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false
  });
  const dustTail = new THREE.Mesh(dustGeo, dustMat);
  group.add(dustTail);

  group.visible = false;
  scene.add(group);

  const orbitLine = buildCometOrbitLine(c);
  orbitLine.visible = false;
  scene.add(orbitLine);

  const lab = document.createElement('div');
  lab.className = 'pl-label';
  lab.textContent = c.name;
  document.getElementById('planet-labels').appendChild(lab);

  return { group, head, tail, dustTail, coma, orbitLine, label: lab, data: c };
}

// Thin atmospheric halo via a BackSide shell with a Fresnel-like rim glow.
// Adds a believable limb-lighting edge to planets with atmospheres.
const ATMOSPHERE_COLORS = {
  Earth:   0x6fb4ff,
  Venus:   0xe8d9a8,
  Uranus:  0x9fe6ec,
  Neptune: 0x5b8cff,
  Mars:    0xe89a6b,
  Jupiter: 0xe8c9a0,
  Saturn:  0xe8d6a8,
};
function buildAtmosphereShell(radius, colorHex) {
  const geo = new THREE.SphereGeometry(radius * 1.025, 48, 48);
  const mat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(colorHex) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float rim = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
        gl_FragColor = vec4(glowColor, rim * 0.9);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

// Ring marker shown in true-scale mode so sub-pixel planets stay locatable.
// Sized each frame to a fixed apparent radius regardless of camera distance.
function makeRingMarkerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const cc = c.getContext('2d');
  cc.clearRect(0, 0, 128, 128);
  cc.lineWidth = 6;
  cc.strokeStyle = 'rgba(255,255,255,0.95)';
  cc.beginPath(); cc.arc(64, 64, 50, 0, Math.PI * 2); cc.stroke();
  cc.lineWidth = 2;
  cc.strokeStyle = 'rgba(255,255,255,0.5)';
  cc.beginPath(); cc.arc(64, 64, 38, 0, Math.PI * 2); cc.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const ringMarkerTex = makeRingMarkerTexture();

// ---------- Planet motion trails ----------
// A rolling polyline of recent heliocentric positions, fading from dark (oldest)
// to the planet's color (newest). Realizes the previously-declared showTrails flag.
const TRAIL_LEN = 180;
function makeTrail(colorHex) {
  const positions = new Float32Array(TRAIL_LEN * 3);
  const colors = new Float32Array(TRAIL_LEN * 3);
  const col = new THREE.Color(colorHex);
  for (let i = 0; i < TRAIL_LEN; i++) {
    const f = i / (TRAIL_LEN - 1); // 0 = oldest (faint) .. 1 = newest (bright)
    colors[i*3]   = col.r * f;
    colors[i*3+1] = col.g * f;
    colors[i*3+2] = col.b * f;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  return { line, points: [], positions, geo };
}
function advanceTrail(trail, pos) {
  trail.points.push(pos.x, pos.y, pos.z);
  while (trail.points.length > TRAIL_LEN * 3) trail.points.splice(0, 3);
  const n = trail.points.length / 3;
  for (let i = 0; i < n; i++) {
    trail.positions[i*3]   = trail.points[i*3];
    trail.positions[i*3+1] = trail.points[i*3+1];
    trail.positions[i*3+2] = trail.points[i*3+2];
  }
  trail.geo.attributes.position.needsUpdate = true;
  trail.geo.setDrawRange(0, n);
}
function clearTrail(trail) {
  if (!trail) return;
  trail.points.length = 0;
  trail.geo.setDrawRange(0, 0);
}

function buildPlanet(p, idx) {
  const group = new THREE.Group();

  // Real NASA texture (procedural fallback if not provided)
  let map;
  if (p.tex) map = loadTex(p.tex);
  else if (p.en === 'Earth') map = makeEarthTexture();
  else map = makeNoiseTexture(512, 256, '#' + p.color.toString(16).padStart(6,'0'),
                              p.bands ? p.bands : null);

  const mat = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.92,
    metalness: 0.0,
    emissive: 0x000000
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.radius, 64, 64), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // Axial tilt: tilt the planet mesh around Z so its local Y axis becomes the rotation axis.
  if (p.axialTilt) mesh.rotation.z = p.axialTilt * Math.PI/180;
  group.add(mesh);

  // Rotation-axis indicator: a thin pole along local Y (the spin axis), tilted with the mesh.
  // Shown only when this planet is soloed/focused, to visualize axial tilt (e.g. Uranus on its side).
  const axisLen = p.radius * 1.7;
  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-axisLen,0), new THREE.Vector3(0,axisLen,0)]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })
  );
  axisLine.visible = false;
  mesh.add(axisLine);

  // Jupiter great red spot — only when no real texture (real Jupiter texture already has it)
  if (p.redSpot && !p.tex) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const cc = c.getContext('2d');
    const g = cc.createRadialGradient(32,32,2,32,32,30);
    g.addColorStop(0,'rgba(220,80,50,0.95)'); g.addColorStop(1,'rgba(180,60,40,0)');
    cc.fillStyle = g; cc.fillRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(p.radius*0.6, p.radius*0.3, 1);
    sp.position.set(p.radius*1.01, p.radius*0.25, 0);
    mesh.add(sp);
  }

  // Atmospheric rim glow (child of mesh so it shares tilt + scale)
  if (ATMOSPHERE_COLORS[p.en]) {
    mesh.add(buildAtmosphereShell(p.radius, ATMOSPHERE_COLORS[p.en]));
  }

  // Earth extras: a faster-spinning cloud layer and a night-lights layer whose
  // brightness fades in on the unlit hemisphere. Both are children of the spinning
  // mesh. The night layer's sun direction is updated each frame in tick().
  let cloudMesh = null, nightMesh = null;
  if (p.en === 'Earth') {
    cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.012, 48, 48),
      new THREE.MeshStandardMaterial({
        map: makeEarthCloudsTexture(), transparent: true, opacity: 0.55,
        depthWrite: false, roughness: 1.0, metalness: 0.0
      })
    );
    mesh.add(cloudMesh);
    nightMesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.004, 48, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uNight: { value: makeEarthNightTexture() },
          uSunDir: { value: new THREE.Vector3(1, 0, 0) },
        },
        vertexShader: `
          varying vec2 vUv; varying vec3 vWorldNormal;
          void main(){
            vUv = uv;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uNight; uniform vec3 uSunDir;
          varying vec2 vUv; varying vec3 vWorldNormal;
          void main(){
            float lit = dot(normalize(vWorldNormal), normalize(uSunDir));
            float nightAmt = smoothstep(0.1, -0.15, lit); // 1 on dark side, 0 on lit side
            vec3 lights = texture2D(uNight, vUv).rgb;
            gl_FragColor = vec4(lights, nightAmt * 0.95);
          }
        `,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    mesh.add(nightMesh);
  }

  // Ring (real texture for Saturn, procedural for Uranus)
  let ring;
  if (p.hasRing) {
    const inner = p.radius * 1.4, outer = p.radius * 2.3;
    const ringGeo = new THREE.RingGeometry(inner, outer, 96, 4);
    const uv = ringGeo.attributes.uv;
    const pos = ringGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x*x + y*y);
      uv.setXY(i, (r - inner) / (outer - inner), 1);
    }
    let ringMat;
    if (p.ringTex) {
      const rTex = loadTex(p.ringTex);
      rTex.wrapS = THREE.ClampToEdgeWrapping;
      ringMat = new THREE.MeshBasicMaterial({
        map: rTex, side: THREE.DoubleSide, transparent: true,
        color: p.ringColor || 0xffffff, depthWrite: false, opacity: 0.95
      });
    } else {
      const ringTex = makeRingTexture(inner, outer, p.ringAlpha || 0.7);
      ringMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true,
                                              color: p.ringColor || 0xffffff, depthWrite: false });
    }
    ring = new THREE.Mesh(ringGeo, ringMat);
    ring.castShadow = true;
    ring.receiveShadow = true;
    // Ring lies in the planet's equatorial plane. We attach it to the planet GROUP (not the spinning mesh)
    // so it keeps a fixed orientation while the planet rotates beneath it.
    // mesh local Y is the rotation axis (after mesh.rotation.z = axialTilt).
    // Rotate ring X=90° to make it perpendicular to local Y, i.e. in the equatorial plane.
    ring.rotation.x = Math.PI/2;
    if (p.axialTilt) {
      // Tilt the whole ring system by the axial tilt around Z, matching the planet's rotation axis.
      ring.rotation.z = p.axialTilt * Math.PI/180;
    }
    group.add(ring);

    // Cassini division — a thin dark band overlaid on Saturn's ring for detail.
    // Attached to `ring` so it inherits the ring's orientation AND scale (true-scale mode).
    if (p.en === 'Saturn') {
      const gapR = inner + (outer - inner) * 0.62;
      const gapW = (outer - inner) * 0.05;
      const gapMesh = new THREE.Mesh(
        new THREE.RingGeometry(gapR - gapW, gapR + gapW, 96, 1),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.add(gapMesh);
    }
  }

  // Moons — direct children of the planet group (so they orbit with it)
  const moons = [];
  for (let mi = 0; mi < p.moons.length; mi++) {
    const m = p.moons[mi];
    const mGeo = new THREE.SphereGeometry(m.radius, 24, 24);
    const mMat = m.tex
      ? new THREE.MeshStandardMaterial({ map: loadTex(m.tex), roughness: 0.95 })
      : new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.95 });
    const mMesh = new THREE.Mesh(mGeo, mMat);
    mMesh.castShadow = true;
    mMesh.receiveShadow = true;
    // tag for raycast click — identifies parent planet + moon index
    mMesh.userData = { planetIdx: idx, moonIdx: mi };
    group.add(mMesh);
    // moon orbit line
    const mpts = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i/96)*Math.PI*2;
      mpts.push(new THREE.Vector3(Math.cos(a)*m.orbit, 0, Math.sin(a)*m.orbit));
    }
    const mLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(mpts),
      new THREE.LineBasicMaterial({ color: 0xb4c8e6, transparent: true, opacity: 0.14, depthWrite: false })
    );
    group.add(mLine);
    moons.push({ mesh: mMesh, orbitLine: mLine, data: m });
  }

  scene.add(group);

  // Orbit line lives at scene root
  const orbitLine = buildOrbitLine(p);
  scene.add(orbitLine);

  // Motion trail lives at scene root (positions are heliocentric scene coords).
  const trail = makeTrail(p.color);
  trail.line.visible = false;
  scene.add(trail.line);

  // HTML label
  const lab = document.createElement('div');
  lab.className = 'pl-label';
  lab.textContent = p.name;
  document.getElementById('planet-labels').appendChild(lab);

  // True-scale locatability marker (child of group → follows planet)
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: ringMarkerTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }));
  marker.scale.set(1, 1, 1);
  marker.visible = false;
  group.add(marker);

  return {
    group, mesh, ring, cloudMesh, nightMesh, orbitLine, trail, marker, axisLine,
    moons, label: lab, data: p, lastRev: 0
  };
}

for (let i = 0; i < PLANETS.length; i++) {
  planetObjs.push(buildPlanet(PLANETS[i], i));
}
for (let i = 0; i < COMETS.length; i++) {
  cometObjs.push(buildComet(COMETS[i], i));
}

// ---------- Dwarf planets ----------
// Built like comets (same q/e/i/w/Om/T/tp orbital elements) so they reuse
// cometOrbitPos / buildCometOrbitLine, but rendered as solid textured spheres
// with a slightly thicker, brighter orbit line to read as a body, not a comet.
// Dwarf-planet surface texture: base color + top-lit gradient + mottled darker blotches and
// faint highlights, giving an airless rocky/icy body more surface detail than a flat fill.
function makeDwarfTexture(colorHex) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const cc = c.getContext('2d');
  cc.fillStyle = colorHex; cc.fillRect(0, 0, 256, 128);
  const grad = cc.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255,255,255,0.10)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  cc.fillStyle = grad; cc.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256, y = Math.random() * 128, r = 2 + Math.random() * 8;
    cc.fillStyle = `rgba(0,0,0,${(0.04 + Math.random() * 0.10).toFixed(3)})`;
    cc.beginPath(); cc.arc(x, y, r, 0, Math.PI * 2); cc.fill();
  }
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * 256, y = Math.random() * 128, r = 1 + Math.random() * 4;
    cc.fillStyle = `rgba(255,255,255,${(0.03 + Math.random() * 0.06).toFixed(3)})`;
    cc.beginPath(); cc.arc(x, y, r, 0, Math.PI * 2); cc.fill();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
function buildDwarf(d, idx) {
  const group = new THREE.Group();
  let map;
  if (d.tex) map = loadTex(d.tex);
  else map = makeDwarfTexture('#' + d.color.toString(16).padStart(6,'0'));
  const r = Math.max(d.radius, 0.07); // floor smaller dwarfs so they stay clickable
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32),
    new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0.0 })
  );
  mesh.userData = { dwarfIdx: idx };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  group.visible = false;
  scene.add(group);

  const orbitLine = buildCometOrbitLine(d);
  orbitLine.material.opacity = 0.4;
  orbitLine.visible = false;
  scene.add(orbitLine);

  const lab = document.createElement('div');
  lab.className = 'pl-label';
  lab.textContent = d.name;
  document.getElementById('planet-labels').appendChild(lab);

  return { group, mesh, orbitLine, label: lab, data: d };
}
for (let i = 0; i < DWARFS.length; i++) {
  dwarfObjs.push(buildDwarf(DWARFS[i], i));
}

// ---------- Asteroid + Kuiper belts (InstancedMesh) ----------
function genBelt(n, aMin, aMax) {
  return new Array(n).fill(0).map(() => ({
    a: aMin + Math.random()*(aMax-aMin),
    e: Math.random()*0.12,
    peri: Math.random()*Math.PI*2,
    inc: (Math.random()-0.5)*0.18,
    phase: Math.random()*Math.PI*2,
    size: 0.4 + Math.random()*0.8
  }));
}
const asteroidData = genBelt(QUALITY_PRESETS.quality.asteroidDrawCount, 2.1, 3.3);
const kuiperData = genBelt(QUALITY_PRESETS.quality.kuiperDrawCount, 30, 50);

function buildBelt(data, color, sizeScale) {
  const geo = new THREE.SphereGeometry(0.01, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color });
  const im = new THREE.InstancedMesh(geo, mat, data.length);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return im;
}
const asteroidBelt = buildBelt(asteroidData, 0x7d6f5e, 1.0);
const kuiperBelt   = buildBelt(kuiperData,  0x7a8aa0, 1.2);
scene.add(asteroidBelt); scene.add(kuiperBelt);
const _mtx = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

function updateBelt(im, data, sizeScale) {
  const count = Math.min(data.length, im.count);
  for (let i = 0; i < count; i++) {
    const d = data[i];
    const aScale = state.scaleMode === 'true'
      ? AU_IN_EARTH_DIAMETERS
      : (state.scaleMode === 'real' ? 1 : (1.15 / 1.0)); // schematic: 1 AU ≈ Earth orbit @1.15
    const a = d.a * aScale;
    const T = Math.pow(d.a, 1.5) * 365.25;
    const M = ((state.simDays + d.phase*T/(Math.PI*2)) % T) / T * Math.PI * 2;
    const E = solveKepler(M, d.e);
    const xo = a*(Math.cos(E)-d.e);
    const yo = a*Math.sqrt(1-d.e*d.e)*Math.sin(E);
    const xr = xo*Math.cos(d.peri) - yo*Math.sin(d.peri);
    const yr = xo*Math.sin(d.peri) + yo*Math.cos(d.peri);
    _v.set(xr, yr*Math.sin(d.inc), yr*Math.cos(d.inc));
    _s.set(d.size, d.size, d.size).multiplyScalar(sizeScale);
    _mtx.compose(_v, _q, _s);
    im.setMatrixAt(i, _mtx);
  }
  im.instanceMatrix.needsUpdate = true;
}

function applyRenderQuality() {
  const quality = currentQuality();

  renderer.setPixelRatio(renderPixelRatio());
  composer.setPixelRatio(renderPixelRatio());

  renderer.shadowMap.enabled = quality.shadows;
  sunLight.castShadow = quality.shadows;
  renderer.shadowMap.needsUpdate = true;

  starfield.geometry.setDrawRange(0, quality.starDrawCount);
  asteroidBelt.count = quality.asteroidDrawCount;
  kuiperBelt.count = quality.kuiperDrawCount;

  if (state.renderQuality === 'performance') bloomEnabled = false;
  // Cinematic vignette + grain only in quality mode.
  const cinematic = state.renderQuality === 'quality';
  if (cinematicPass) {
    cinematicPass.enabled = cinematic;
    cinematicPass.uniforms.uVignette.value = cinematic ? 1.0 : 0.0;
    cinematicPass.uniforms.uGrain.value = cinematic ? 1.0 : 0.0;
  }
}

function setRenderQuality(mode) {
  if (!QUALITY_PRESETS[mode] || state.renderQuality === mode) return;
  state.renderQuality = mode;
  bloomEnabled = mode === 'quality';
  applyRenderQuality();
  resetTrailsAndRevs();
}

applyRenderQuality();

// ---------- Scale mode (schematic / real / true) ----------
// In true mode 1 scene unit = 1 Earth diameter: bodies sized by real diameter,
// orbits by real AU. We rescale the already-built meshes via scale transforms
// (no geometry rebuild/disposal) so textures/labels/listeners stay intact.
// Push sky/starfield beyond the outermost orbit in true mode. Eris reaches ~97.5 AU
// at aphelion (≈1.15M units), so the starfield shell must clear that. ×8000 puts
// stars at [1.6M, 3.2M], bright stars at 3.44M, sky sphere at 3.6M — all beyond Eris.
const BACKGROUND_TRUE_SCALE = 8000;

function moonOrbitRadius(m) {
  return state.scaleMode === 'true' ? trueOrbitFromKm(m.realOrbitKm) : m.orbit;
}

function applyScaleMode() {
  const isTrue = state.scaleMode === 'true';

  const sunR = isTrue ? trueRadiusFromDiameterKm(SUN.realDiameterKm) : SUN.radius;
  const sunRatio = sunR / SUN.radius;
  sunMesh.scale.setScalar(sunRatio);
  if (sunGlow) sunGlow.scale.set(SUN.radius * 3.2 * sunRatio, SUN.radius * 3.2 * sunRatio, 1);
  if (coronaSprite) coronaSprite.scale.set(coronaBaseScale * sunRatio, coronaBaseScale * sunRatio, 1);

  for (const po of planetObjs) {
    const r = isTrue ? trueRadiusFromDiameterKm(po.data.realDiameterKm) : po.data.radius;
    const ratio = r / po.data.radius;
    po.mesh.scale.setScalar(ratio);
    if (po.ring) po.ring.scale.setScalar(ratio);
    for (const m of po.moons) {
      const mr = isTrue ? trueRadiusFromDiameterKm(m.data.realDiameterKm) : m.data.radius;
      m.mesh.scale.setScalar(mr / m.data.radius);
      const mo = moonOrbitRadius(m.data);
      m.orbitLine.scale.setScalar(mo / m.data.orbit);
    }
  }
  // Dwarf planets: real-diameter scaling in true mode (orbits are AU-based via cometScenePos).
  for (const dwo of dwarfObjs) {
    const dr = isTrue ? trueRadiusFromDiameterKm(dwo.data.realDiameterKm) : dwo.data.radius;
    dwo.mesh.scale.setScalar(dr / dwo.data.radius);
  }

  const bg = isTrue ? BACKGROUND_TRUE_SCALE : 1;
  skySphere.scale.setScalar(bg);
  starfield.scale.setScalar(bg);
  brightStarsGroup.scale.setScalar(bg);
  skySphere.material.side = isTrue ? THREE.DoubleSide : THREE.BackSide;
  skySphere.material.opacity = isTrue ? 0.8 : 0.55;
  eclipticPlane.scale.setScalar(isTrue ? AU_IN_EARTH_DIAMETERS : 1);

  camera.near = isTrue ? 1 : 0.001;
  camera.far = isTrue ? 1.5e7 : 5000;       // covers the sky-sphere far side (~13.6M) when zoomed outside it
  controls.maxDistance = isTrue ? 1e7 : 600;  // zoom outside the 3.6M sky sphere to view the whole Milky Way ball
  camera.updateProjectionMatrix();
}

applyScaleMode();

// ---------- Build orbit lines for current scale ----------
function rebuildOrbits() {
  for (let i = 0; i < planetObjs.length; i++) {
    const po = planetObjs[i];
    scene.remove(po.orbitLine);
    po.orbitLine.geometry.dispose();
    po.orbitLine = buildOrbitLine(po.data);
    po.orbitLine.visible = state.showOrbits && (state.soloIndex === -1 || state.soloIndex === i) && state.visible.has(i) && !state.soloSun;
    scene.add(po.orbitLine);
  }
  for (const co of cometObjs) {
    scene.remove(co.orbitLine);
    co.orbitLine.geometry.dispose();
    co.orbitLine = buildCometOrbitLine(co.data);
    co.orbitLine.visible = state.showComets && state.showOrbits;
    scene.add(co.orbitLine);
  }
  for (const dwo of dwarfObjs) {
    scene.remove(dwo.orbitLine);
    dwo.orbitLine.geometry.dispose();
    dwo.orbitLine = buildCometOrbitLine(dwo.data);
    dwo.orbitLine.material.opacity = 0.4;
    dwo.orbitLine.visible = state.showDwarfs && state.showOrbits;
    scene.add(dwo.orbitLine);
  }
  if (state.eventFocus) focusEventVisual(state.eventFocus);
}

// ---------- Frame ----------
const clock = new THREE.Clock();
const tmpVec = new THREE.Vector3();

function updateLabels() {
  const labels = document.getElementById('planet-labels');
  labels.style.display = state.showLabels ? 'block' : 'none';
  if (!state.showLabels) return;
  for (let i = 0; i < planetObjs.length; i++) {
    const po = planetObjs[i];
    const visible = (state.soloIndex === -1 || state.soloIndex === i) && state.visible.has(i) && !state.soloSun;
    if (!visible) { po.label.style.display = 'none'; continue; }
    tmpVec.copy(po.mesh.getWorldPosition(new THREE.Vector3()));
    tmpVec.project(camera);
    const inFront = tmpVec.z < 1;
    if (!inFront) { po.label.style.display = 'none'; continue; }
    po.label.style.display = 'block';
    const x = (tmpVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-tmpVec.y * 0.5 + 0.5) * window.innerHeight;
    po.label.style.left = x + 'px';
    po.label.style.top  = y + 'px';
  }
  // Bright star labels
  const showStars = state.showLabels && state.soloIndex === -1;
  brightStarsGroup.visible = showStars;
  for (const bs of brightStarLabels) {
    if (!showStars) { bs.label.style.display = 'none'; continue; }
    tmpVec.copy(bs.sprite.getWorldPosition(new THREE.Vector3()));
    tmpVec.project(camera);
    if (tmpVec.z >= 1) { bs.label.style.display = 'none'; continue; }
    bs.label.style.display = 'block';
    bs.label.style.left = ((tmpVec.x * 0.5 + 0.5) * window.innerWidth) + 'px';
    bs.label.style.top  = ((-tmpVec.y * 0.5 + 0.5) * window.innerHeight) + 'px';
  }
}

// On-screen scale bar: pick a "nice" AU reference whose on-screen length stays readable.
const SCALE_NICE_AU = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 250];
const _scaleTmp = new THREE.Vector3();
function updateScaleBar() {
  const bar = document.getElementById('scale-bar');
  const label = document.getElementById('scale-label');
  const line = bar?.querySelector('.scale-line');
  if (!bar || !label || !line) return;
  const dist = camera.position.distanceTo(controls.target);
  if (!isFinite(dist) || dist <= 0) { bar.style.display = 'none'; return; }
  // world units visible vertically at the target distance
  const worldH = 2 * dist * Math.tan((camera.fov * Math.PI / 180) / 2);
  const pxPerUnit = window.innerHeight / worldH;
  const unitsPerAU = sceneUnitsPerAU(state.scaleMode);
  // choose the largest nice AU value whose bar stays under ~110px, else smallest over ~40px
  let chosen = SCALE_NICE_AU[0];
  for (const au of SCALE_NICE_AU) {
    const px = au * unitsPerAU * pxPerUnit;
    if (px <= 110) chosen = au;
  }
  let pxLen = chosen * unitsPerAU * pxPerUnit;
  if (pxLen < 40) { // all too small; force the smallest up to min width
    chosen = SCALE_NICE_AU[0];
    pxLen = 40;
  }
  pxLen = Math.max(30, Math.min(150, pxLen));
  line.style.width = pxLen + 'px';
  label.textContent = chosen >= 1 ? `${chosen} AU` : `${(chosen * 149.6).toFixed(chosen < 0.1 ? 1 : 0)} 百万 km`;
  bar.style.display = 'flex';
}

function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  if (state.playing) state.simDays += dt * SPEED_MODES[state.speedMode].value;
  // When paused, freeze all spin (planets, moons, sun) — only ambient glow keeps breathing.
  const spin = state.playing ? 1 : 0;

  // Sun pulse + corona breathing
  if (spin) sunMesh.rotation.y += dt * 0.02;
  if (coronaSprite) {
    const t = clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 0.8) * 0.06 + Math.sin(t * 2.3) * 0.02;
    const base = coronaBaseScale * (state.scaleMode === 'true' ? trueRadiusFromDiameterKm(SUN.realDiameterKm) / SUN.radius : 1);
    coronaSprite.scale.set(base * breathe, base * breathe, 1);
    coronaSprite.material.opacity = 0.42 + Math.sin(t * 0.8) * 0.08;
  }
  if (sunProminences) sunProminences.rotation.y += dt * 0.04;

  // Update planets
  for (let i = 0; i < planetObjs.length; i++) {
    const po = planetObjs[i];
    const visible = (state.soloIndex === -1 || state.soloIndex === i) && state.visible.has(i) && !state.soloSun;
    po.group.visible = visible;
    po.orbitLine.visible = state.showOrbits && visible;
    // Highlight the focused/soloed planet's orbit; dim the rest for contrast.
    const highlighted = (state.soloIndex === i || state.focusIndex === i);
    po.orbitLine.material.opacity = highlighted ? 0.85 : 0.24;
    if (po.axisLine) po.axisLine.visible = state.showAxis && highlighted;
    if (!visible) continue;

    const a = semiMajor(po.data);
    const pos = keplerPos(po.data, state.simDays, a);
    po.group.position.copy(pos);

    // Motion trail: record recent heliocentric positions for a fading arc.
    if (state.showTrails) {
      advanceTrail(po.trail, pos);
      po.trail.line.visible = true;
    } else {
      po.trail.line.visible = false;
      if (po.trail.points.length) clearTrail(po.trail); // avoid a stale streak on re-enable
    }

    // True-scale locatability marker: fixed apparent size regardless of distance.
    if (state.scaleMode === 'true') {
      const camDist = camera.position.distanceTo(pos);
      const k = 16 * 2 * Math.tan((camera.fov * Math.PI / 180) / 2) / window.innerHeight;
      const s = Math.max(1, camDist * k);
      po.marker.scale.set(s, s, 1);
      po.marker.visible = true;
    } else {
      po.marker.visible = false;
    }

    // self rotation
    if (spin) po.mesh.rotation.y += dt * SPEED_MODES[state.speedMode].value * (Math.PI*2 / Math.abs(po.data.rotPeriod)) * Math.sign(po.data.rotPeriod || 1);

    // Earth cloud layer drifts slightly faster than the surface.
    if (po.cloudMesh && spin) po.cloudMesh.rotation.y += dt * SPEED_MODES[state.speedMode].value * (Math.PI*2 / Math.abs(po.data.rotPeriod)) * 1.15;
    // Night-lights sun direction: world-space unit vector from Earth toward the Sun (origin).
    if (po.nightMesh) {
      po.nightMesh.material.uniforms.uSunDir.value.copy(po.group.position).multiplyScalar(-1).normalize();
    }

    // Moons (local to planet group)
    for (const m of po.moons) {
      const ang = (state.simDays / m.data.period) * Math.PI * 2;
      const mo = moonOrbitRadius(m.data);
      m.mesh.position.set(Math.cos(ang)*mo, 0, Math.sin(ang)*mo);
      if (spin) m.mesh.rotation.y += dt * 0.3;
      const showMoon = (state.soloIndex === i) || (camera.position.distanceTo(po.group.position) < a * 0.6 + 1);
      m.mesh.visible = showMoon;
      m.orbitLine.visible = showMoon && state.showOrbits;
    }

    // Sonification
    const rev = Math.floor(state.simDays / po.data.period);
    if (rev !== po.lastRev) {
      if (po.lastRev !== 0 && Math.abs(rev - po.lastRev) <= 4) sound.revChime(i);
      po.lastRev = rev;
    }
  }

  asteroidBelt.visible = state.showBelts;
  kuiperBelt.visible = state.showBelts;
  eclipticPlane.visible = state.showEcliptic;

  // Update Halley's comet
  for (let ci = 0; ci < cometObjs.length; ci++) {
    const co = cometObjs[ci];
    const c = co.data;
    const visible = state.showComets;
    co.group.visible = visible;
    const orbitOn = state.showComets && state.showOrbits;
    co.orbitLine.visible = orbitOn;
    // Highlight the focused comet's orbit; dim the rest for contrast.
    if (orbitOn) {
      const focused = state.cometFocusIndex === ci;
      co.orbitLine.material.opacity = focused ? 0.95 : (state.cometFocusIndex >= 0 ? 0.12 : 0.26);
    }
    co.label.style.display = 'none';
    if (!visible) continue;

    const pos = cometOrbitPos(c, state.simDays);
    co.group.position.copy(pos);
    const sunDir = pos.clone().normalize();   // unit vector Sun→comet = anti-sunward direction
    const dist = pos.length();
    const tailLen = Math.min(0.42, Math.max(0.04, 0.16 / Math.max(0.35, dist)));
    const ionAlpha = Math.min(0.16, Math.max(0.02, 0.09 / Math.max(1.0, dist)));

    // Velocity direction (finite difference) lets the dust tail curve back along the orbit.
    const posNext = cometOrbitPos(c, state.simDays + 0.5);
    const vel = posNext.clone().sub(pos);
    const velLen = vel.length();
    const velDir = velLen > 1e-6 ? vel.multiplyScalar(1 / velLen) : sunDir.clone();

    // Ion tail: strictly anti-sunward.
    co.tail.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), sunDir));
    co.tail.scale.set(1, tailLen, 1);
    co.tail.material.opacity = ionAlpha;

    // Dust tail: blend anti-sunward with the trailing direction (-vel) so it bows opposite the motion.
    const dustDir = sunDir.clone().multiplyScalar(0.8).addScaledVector(velDir, -0.55);
    if (dustDir.lengthSq() < 1e-6) dustDir.copy(sunDir);
    dustDir.normalize();
    co.dustTail.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dustDir));
    co.dustTail.scale.set(1.5, tailLen * 0.68, 1.5);
    co.dustTail.material.opacity = ionAlpha * 0.85;

    // Coma swells and brightens near the Sun.
    const comaScale = 0.10 + Math.min(0.55, 0.55 / Math.max(0.4, dist));
    co.coma.scale.set(comaScale, comaScale, 1);
    co.coma.material.opacity = Math.min(0.75, 0.6 / Math.max(0.5, dist));

    if (state.showLabels) {
      const tmp = pos.clone().project(camera);
      co.label.style.display = (tmp.z < 1) ? 'block' : 'none';
      co.label.style.left = ((tmp.x*0.5+0.5)*window.innerWidth) + 'px';
      co.label.style.top  = (( -tmp.y*0.5+0.5)*window.innerHeight) + 'px';
    }
  }
  if (state.showBelts) {
    updateBelt(asteroidBelt, asteroidData, 1.0);
    updateBelt(kuiperBelt, kuiperData, 1.2);
  }

  // Update dwarf planets (Pluto / Ceres / Eris)
  for (const dwo of dwarfObjs) {
    const visible = state.showDwarfs;
    dwo.group.visible = visible;
    const orbitOn = visible && state.showOrbits;
    dwo.orbitLine.visible = orbitOn;
    dwo.label.style.display = 'none';
    if (!visible) continue;
    const pos = cometOrbitPos(dwo.data, state.simDays);
    dwo.group.position.copy(pos);
    if (spin) dwo.mesh.rotation.y += dt * 0.05;
    if (state.showLabels) {
      const tmp = pos.clone().project(camera);
      dwo.label.style.display = (tmp.z < 1) ? 'block' : 'none';
      dwo.label.style.left = ((tmp.x*0.5+0.5)*window.innerWidth) + 'px';
      dwo.label.style.top  = ((-tmp.y*0.5+0.5)*window.innerHeight) + 'px';
    }
  }

  if (eventVisuals && state.eventFocus && state.eventFocus.type === '凌日') {
    eventVisuals.children.forEach(obj => {
      if (obj.geometry && obj.geometry.type === 'RingGeometry') obj.lookAt(camera.position);
    });
  }

  controls.update();
  updateScaleBar();
  if (cinematicPass) cinematicPass.uniforms.uTime.value = clock.elapsedTime;
  if (bloomEnabled) composer.render();
  else renderer.render(scene, camera);
  updateLabels();
  updateTimelineUI();
  document.getElementById('speed-info').textContent = SPEED_MODES[state.speedMode].label;
  requestAnimationFrame(tick);
}

let eventMarkers = []; // { days, label, type, bodyA, bodyB, angle, score, desc }
let eventVisuals = null;

// ---------- Historical astronomy event anchors on the timeline ----------
// days = (UTC noon of date − J2000) / 86400000
const HISTORICAL_EVENTS = [
  { name: '哈雷彗星近日点',     date: [1986, 2, 9],  desc: '哈雷彗星回归至近日点（距日约 0.59 AU），是 20 世纪最著名的彗星观测事件之一。' },
  { name: '木星-土星大合',       date: [2020, 12, 21], desc: '木星与土星角距仅约 0.1°，为 1623 年以来最近的一次"大合"，两星几乎并排可见。' },
].map((e) => ({ name: e.name, desc: e.desc, days: (Date.UTC(e.date[0], e.date[1] - 1, e.date[2], 12) - J2000.getTime()) / 86400000 }));

function jumpToDate(days) {
  state.simDays = days;
  const sc = document.getElementById('scrubber');
  if (days < +sc.min || days > +sc.max) {
    sc.min = String(Math.floor(days - 365));
    sc.max = String(Math.ceil(days + 365));
    renderHistoricalMarkers();
  }
  sc.value = Math.round(days);
  resetTrailsAndRevs();
  disposeEventVisuals();
  state.cometFocusIndex = -1;
  updateTimelineUI();
}

// Pixel left (relative to #timeline) for an event marker at `days`, mapped onto the
// scrubber's actual on-screen span — so markers align with the scrubber and never overflow.
function eventMarkerLeftPx(days) {
  const sc = document.getElementById('scrubber');
  if (!sc) return '0px';
  const min = +sc.min, max = +sc.max;
  const frac = max > min ? Math.max(0, Math.min(1, (days - min) / (max - min))) : 0;
  return (sc.offsetLeft + frac * sc.offsetWidth) + 'px';
}

function renderHistoricalMarkers() {
  document.querySelectorAll('.historic-marker').forEach(el => el.remove());
  const timeline = document.getElementById('timeline');
  const sc = document.getElementById('scrubber');
  const min = +sc.min, max = +sc.max;
  for (const ev of HISTORICAL_EVENTS) {
    if (ev.days < min || ev.days > max) continue;
    const el = document.createElement('div');
    el.className = 'event-marker historic-marker';
    el.title = `${ev.name} (${formatDate(ev.days)})`;
    el.style.left = eventMarkerLeftPx(ev.days);
    el.classList.toggle('active', state.eventFocus === ev);
    el.addEventListener('click', () => focusHistoricEvent(ev));
    timeline.appendChild(el);
  }
}

function focusHistoricEvent(ev) {
  // Historic anchors live above the timeline; clicking jumps to the date and
  // shows an info card (previously they only jumped, with no explanation).
  disposeEventVisuals({ keepFocus: true });
  state.eventFocus = ev;
  state.eventLink = null;
  state.soloIndex = -1;
  state.focusIndex = -1;
  state.cometFocusIndex = -1;
  jumpToDate(ev.days);
  showHistoricInfo(ev);
  updatePlanetListUI();
  renderEventMarkers();
}

function showHistoricInfo(ev) {
  const info = document.getElementById('info');
  info.classList.remove('hidden');
  const swatch = document.getElementById('info-swatch');
  swatch.style.background = '#ffd278';
  swatch.style.color = '#ffd278';
  document.getElementById('info-name').textContent = ev.name;
  document.getElementById('info-desc').textContent = ev.desc;
  const dl = document.getElementById('info-stats');
  dl.innerHTML = `<dt>类型</dt><dd>历史天象锚点</dd>`
    + `<dt>日期</dt><dd>${formatDate(ev.days)}</dd>`;
  document.getElementById('info-moons-wrap').style.display = 'none';
  const exit = document.getElementById('event-exit');
  if (exit) exit.style.display = 'block';
}

// Sun info card with an educational sunspot-cycle phase indicator.
function showSunInfo() {
  const info = document.getElementById('info');
  info.classList.remove('hidden');
  const exitBtn = document.getElementById('event-exit');
  if (exitBtn) exitBtn.style.display = 'none';
  const swatch = document.getElementById('info-swatch');
  swatch.style.background = '#' + SUN.color.toString(16).padStart(6,'0');
  swatch.style.color = swatch.style.background;
  document.getElementById('info-name').textContent = `${SUN.name} · ${SUN.en}`;
  document.getElementById('info-desc').textContent = SUN.desc;
  const factEl = document.getElementById('info-fact');
  if (factEl) { factEl.textContent = '💡 太阳每秒把约 400 万吨物质转化为能量，已持续约 46 亿年。'; factEl.style.display = 'block'; }
  const dl = document.getElementById('info-stats'); dl.innerHTML = '';
  // Sunspot (Schwabe) cycle phase ≈ 11 years, reference solar max 2001.
  const year = getUtcYearFromJ2000Days(state.simDays, J2000);
  const phase = (((year - SUN_SPOT_CYCLE.referencePeak) % SUN_SPOT_CYCLE.years) + SUN_SPOT_CYCLE.years) % SUN_SPOT_CYCLE.years;
  let activity;
  if (phase < 2) activity = '极大期（黑子数峰值，日冕物质抛射频繁）';
  else if (phase < 5) activity = '下降期（黑子数减少）';
  else if (phase < 7) activity = '极小期（黑子稀少，活动平静）';
  else activity = '上升期（黑子数增多，趋向极大）';
  dl.innerHTML += `<dt>☀️ 黑子活动</dt><dd>${activity}</dd>`
    + `<dt>📅 模拟年份</dt><dd>${year}</dd>`
    + `<dt>📡 黑子周期</dt><dd>约 ${SUN_SPOT_CYCLE.years} 年</dd>`;
  for (const [k,v] of Object.entries(SUN.stats)) dl.innerHTML += `<dt>${k}</dt><dd>${v}</dd>`;
  const bar = document.getElementById('info-compare');
  if (bar) {
    const ratio = SUN.realDiameterKm / 12742;
    const pct = Math.min(100, Math.log10(ratio + 1) / Math.log10(12) * 100);
    bar.innerHTML = `<div class="cmp"><span class="cmp-label">直径对比地球</span>`
      + `<span class="cmp-bar"><span class="cmp-fill" style="width:${pct}%"></span></span>`
      + `<span class="cmp-val">${ratio.toFixed(2)}× 地球</span></div>`;
  }
  document.getElementById('info-moons-wrap').style.display = 'none';
}

function disposeEventVisuals({ keepFocus = false } = {}) {
  if (!eventVisuals) {
    if (!keepFocus) {
      state.eventFocus = null;
      state.eventLink = null;
    }
    return;
  }
  scene.remove(eventVisuals);
  eventVisuals.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
  eventVisuals = null;
  if (!keepFocus) {
    state.eventFocus = null;
    state.eventLink = null;
  }
}

function eventColor(ev) {
  return getEventColor(ev.type);
}

function resetTrailsAndRevs() {
  for (const po of planetObjs) {
    po.lastRev = Math.floor(state.simDays / po.data.period);
    if (po.trail) clearTrail(po.trail);
  }
}

function focusEventVisual(ev) {
  disposeEventVisuals({ keepFocus: true });
  state.eventFocus = ev;
  sound.event();
  state.simDays = ev.days;
  const sc = document.getElementById('scrubber');
  if (state.simDays < +sc.min || state.simDays > +sc.max) {
    sc.min = String(Math.floor(state.simDays - 365));
    sc.max = String(Math.ceil(state.simDays + 365));
  }
  sc.value = Math.round(state.simDays);
  resetTrailsAndRevs();
  state.playing = false;
  document.getElementById('play-btn').textContent = '▶';
  // Stay in global (全景) view: do not solo or single out a planet.
  state.soloIndex = -1;
  state.focusIndex = -1;
  state.cometFocusIndex = -1;
  // Hide the event-card summary while the info-card shows the focused event details —
  // otherwise on mobile both would stack above the timeline and the info card would collide
  // with the timeline that lifted to make room for the summary.
  const ecard = document.getElementById('event-card');
  if (ecard) { ecard.classList.add('hidden'); layoutEventCard(); }
  showEventInfo(ev);
  updatePlanetListUI();

  const earthPos = keplerPos(PLANETS[2], state.simDays, semiMajor(PLANETS[2]));
  const bodyPos = keplerPos(PLANETS[ev.bodyA], state.simDays, semiMajor(PLANETS[ev.bodyA]));
  const group = new THREE.Group();
  const color = eventColor(ev);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78, depthWrite: false });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([earthPos, new THREE.Vector3(0,0,0)]), mat));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([earthPos, bodyPos]), mat.clone()));

  const markGeo = new THREE.SphereGeometry(Math.max(0.045, PLANETS[ev.bodyA].radius * 1.65), 24, 24);
  const marker = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.34, depthWrite: false }));
  marker.position.copy(bodyPos);
  group.add(marker);
  if (ev.type === '凌日') {
    const sunMark = new THREE.Mesh(
      new THREE.RingGeometry(SUN.radius*1.08, SUN.radius*1.25, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })
    );
    sunMark.lookAt(camera.position);
    group.add(sunMark);
  }
  scene.add(group);
  eventVisuals = group;
  state.eventLink = ev;

  // Global framing: pull back to show the whole Sun–Earth–body alignment at once,
  // instead of zooming onto the planet (which read as "solo mode").
  const maxR = Math.max(earthPos.length(), bodyPos.length(), 1);
  const d = maxR * 2.6;
  flyTo(new THREE.Vector3(0, d * 0.7, d * 1.3), new THREE.Vector3(0, 0, 0), 1.0);
  renderEventMarkers();
}

function eventDescription(ev) {
  return describeSkyEvent(ev, PLANETS);
}

function showEventInfo(ev) {
  const p = PLANETS[ev.bodyA];
  const info = document.getElementById('info');
  info.classList.remove('hidden');
  const swatch = document.getElementById('info-swatch');
  const cc = '#' + eventColor(ev).toString(16).padStart(6,'0');
  swatch.style.background = cc;
  swatch.style.color = cc;
  document.getElementById('info-name').textContent = `${ev.label} · ${ev.type}`;
  document.getElementById('info-desc').textContent = eventDescription(ev);
  const dl = document.getElementById('info-stats');
  const angleLabel = ev.type === '合行星' ? '两星角距' : '地球视角角距';
  const bodies = ev.type === '合行星'
    ? `${p.name} / ${PLANETS[ev.bodyB].name}`
    : p.name;
  const effect = {
    '凌日': '水星/金星位于日地之间，标出日-地-行星连线',
    '合日': '行星与太阳同向，淹没于日光',
    '冲日': '行星与太阳相对，整夜可见',
    '东大距': '内行星昏星，日落后西天',
    '西大距': '内行星晨星，日出前东天',
    '方照': '行星与太阳成 90° 角',
    '合行星': '两颗行星在视线方向上相合',
  }[ev.type] || '地球-太阳/行星连线';
  dl.innerHTML = `<dt>类型</dt><dd>${ev.type}</dd>`
    + `<dt>日期</dt><dd>${formatDate(ev.days)}</dd>`
    + `<dt>相关天体</dt><dd>${bodies}</dd>`
    + `<dt>${angleLabel}</dt><dd>${ev.angle.toFixed(ev.type === '冲日' || ev.type === '方照' ? 1 : 2)}°</dd>`
    + `<dt>展示效果</dt><dd>${effect}</dd>`;
  document.getElementById('info-moons-wrap').style.display = 'none';
  const exit = document.getElementById('event-exit');
  if (exit) exit.style.display = 'block';
}

function exitEventView() {
  // Leave an event/historic info view: drop the alignment visuals, clear focus
  // and close the info card. Bound to the in-card "退出事件视图" button.
  disposeEventVisuals();
  state.eventFocus = null;
  state.eventLink = null;
  state.cometFocusIndex = -1;
  closeInfoPanel();
  updatePlanetListUI();
  renderEventMarkers();
  // Restore the event-card summary iff the events layer is still enabled.
  if (state.showEvents) showEventCardSummary();
}

function scanEvents() {
  const sc = document.getElementById('scrubber');
  const min = +sc.min, max = +sc.max;
  eventMarkers = scanSkyEvents({ min, max, planets: PLANETS, ephem: EPHEM });
  state.eventFocus = null;
  disposeEventVisuals();
  renderEventMarkers();
  sound.event();
  showEventCardSummary();
}

// Event card (below the timeline) — replaces the old alert. Summary mode shows a hint +
// count; detail mode (focusEventVisual → showEventInfo) shows the focused event.
function showEventCardSummary() {
  const card = document.getElementById('event-card');
  if (!card) return;
  document.getElementById('ec-name').textContent = '重要天象';
  document.getElementById('ec-desc').textContent = `已扫描 ${eventMarkers.length} 个天象事件（每种最多 2 个）。点击时间轴上的事件点可在右侧查看详情；时间轴上另有历史天象锚点可直接点击跳转。`;
  document.getElementById('ec-stats').innerHTML = '';
  const sw = document.getElementById('ec-swatch'); if (sw) sw.style.display = 'none';
  card.classList.remove('hidden');
  layoutEventCard();
}

function clearEvents() {
  eventMarkers = [];
  state.eventFocus = null;
  state.eventLink = null;
  disposeEventVisuals();
  renderEventMarkers(); // removes DOM markers
  const card = document.getElementById('event-card');
  if (card) card.classList.add('hidden');
  document.getElementById('info').classList.add('hidden'); // close any open detail card
  layoutEventCard();
}

// Lift the timeline so it sits just above the event card; restore it when the card is hidden.
// Uses the card's live viewport rect so the offset auto-includes safe-area-inset-bottom on mobile,
// otherwise the fixed 22px gap only worked in the desktop layout and the timeline would land on
// top of the card on phones (bottom-sheet event card + safe-area push desktop math off).
function layoutEventCard() {
  const card = document.getElementById('event-card');
  const tl = document.getElementById('timeline');
  if (!card || !tl) return;
  if (card.classList.contains('hidden')) {
    tl.style.bottom = ''; // CSS default
  } else {
    const cardTop = card.getBoundingClientRect().top;
    const bottomFromViewport = window.innerHeight - cardTop + 8; // 8px gap above card
    tl.style.bottom = bottomFromViewport + 'px';
  }
}

function renderEventMarkers() {
  document.querySelectorAll('.event-marker').forEach(el => el.remove());
  const timeline = document.getElementById('timeline');
  const sc = document.getElementById('scrubber');
  const min = +sc.min, max = +sc.max;
  // Sort by time and split markers above/below the timeline so neighbours that are close in
  // time land on opposite sides — otherwise their hit areas overlap and can't be clicked.
  const sorted = [...eventMarkers].sort((a, b) => a.days - b.days);
  let lastAbove = -Infinity, lastBelow = -Infinity;
  for (const ev of sorted) {
    const el = document.createElement('div');
    el.className = 'event-marker';
    const color = '#' + eventColor(ev).toString(16).padStart(6,'0');
    el.title = `${ev.label} (${formatDate(ev.days)})`;
    const leftPx = eventMarkerLeftPx(ev.days);
    el.style.left = leftPx;
    el.style.background = color;
    el.style.color = color;
    // Place on the side whose last marker is farther away (least overlap).
    const leftNum = parseFloat(leftPx);
    if ((leftNum - lastAbove) > (leftNum - lastBelow)) {
      el.classList.add('above');
      lastAbove = leftNum;
    } else {
      lastBelow = leftNum;
    }
    el.classList.toggle('active', state.eventFocus === ev);
    el.addEventListener('click', () => focusEventVisual(ev));
    timeline.appendChild(el);
  }
  renderHistoricalMarkers();
}

function formatDate(simDays) {
  return formatDateFromJ2000(simDays, J2000);
}

function updateTimelineUI() {
  const d = new Date(J2000.getTime() + state.simDays * 86400000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  document.getElementById('sim-date').textContent = `${yyyy}-${mm}-${dd}`;
  const sc = document.getElementById('scrubber');
  if (document.activeElement !== sc) sc.value = Math.round(state.simDays);
  const min = +sc.min, max = +sc.max;
  sc.style.setProperty('--p', ((+sc.value - min)/(max-min))*100 + '%');
}

// ---------- UI Controllers ----------
let showInfo, showCometInfo, showDwarfInfo, showMoonDetail, closeInfoPanel;
let updatePlanetListUI;
let setSoloPlanet, setSoloSun, clearSoloMode, updateSoloStatus;

// Smooth camera fly-to. Wall-clock driven (not per-frame) so the duration stays ~constant
// regardless of FPS — important in real/true scale where the scene is heavy and a frame-count
// driven fly would drag on for several seconds, fighting any drag the user starts mid-flight.
let flyAnim = null;
let flyLast = 0;
function flyTo(target, lookAt, duration = 0.9) {
  // Whoosh direction: zooming closer to the target vs pulling away.
  const fromDist = camera.position.distanceTo(controls.target);
  const toDist = target.distanceTo(lookAt);
  sound.whoosh(toDist < fromDist ? 'in' : 'out');
  flyAnim = {
    fromPos: camera.position.clone(),
    toPos: target.clone(),
    fromTarget: controls.target.clone(),
    toTarget: lookAt.clone(),
    t: 0, dur: duration
  };
  flyLast = performance.now();
}
// Hand control back to the user the instant they grab the scene: cancel an in-progress fly
// so it stops overriding camera/target while they drag or zoom. Without this, dragging right
// after switching to real/true scale reads as "the view slides on its own / pans" because the
// fly is still repositioning the camera for a few seconds.
function cancelFly() { flyAnim = null; }
function flyToPlanet(i) {
  const po = planetObjs[i];
  const a = semiMajor(po.data);
  const pos = keplerPos(po.data, state.simDays, a);
  const bodyR = state.scaleMode === 'true'
    ? trueRadiusFromDiameterKm(po.data.realDiameterKm)
    : po.data.radius;
  const dist = state.scaleMode === 'true'
    ? bodyR * 15
    : Math.max(po.data.radius * 8, a * 0.08);
  const offset = new THREE.Vector3(dist*0.8, dist*0.5, dist*0.8);
  flyTo(pos.clone().add(offset), pos);
}
// Fly in close to the Sun (origin) at a distance just outside its corona, looking at the center.
function flyToSun() {
  const bodyR = state.scaleMode === 'true'
    ? trueRadiusFromDiameterKm(SUN.realDiameterKm)
    : SUN.radius;
  const dist = state.scaleMode === 'true' ? bodyR * 15 : bodyR * 10;
  const offset = new THREE.Vector3(dist*0.8, dist*0.5, dist*0.8);
  flyTo(offset, new THREE.Vector3(0, 0, 0));
}
function resetCamera() {
  const farthest = state.scaleMode === 'true'
    ? PLANETS[7].realAU * AU_IN_EARTH_DIAMETERS
    : (state.scaleMode === 'real' ? PLANETS[7].realAU : PLANETS[7].orbit);
  flyTo(new THREE.Vector3(0, farthest*0.7, farthest*1.4), new THREE.Vector3(0,0,0));
}

function tickFly() {
  if (!flyAnim) return;
  const now = performance.now();
  const dt = Math.min(0.05, (now - flyLast) / 1000);
  flyLast = now;
  flyAnim.t += dt;
  const k = Math.min(1, flyAnim.t / flyAnim.dur);
  const e = 1 - Math.pow(1-k, 3);
  camera.position.lerpVectors(flyAnim.fromPos, flyAnim.toPos, e);
  controls.target.lerpVectors(flyAnim.fromTarget, flyAnim.toTarget, e);
  if (k >= 1) flyAnim = null;
}
const oldUpdate = controls.update.bind(controls);
controls.update = function() { tickFly(); oldUpdate(); };
canvas.addEventListener('pointerdown', cancelFly);
canvas.addEventListener('wheel', cancelFly, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(renderPixelRatio());
  composer.setPixelRatio(renderPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
  layoutEventCard();
  renderEventMarkers();
});

// ---------- Boot ----------
const infoPanel = createInfoPanelController({
  document,
  state,
  planets: PLANETS,
  comets: COMETS,
  dwarfs: DWARFS,
  cometShowers: COMET_SHOWERS,
  ephem: EPHEM,
  ephemerisAU,
  cometOrbitPos,
  updatePlanetListUI: () => updatePlanetListUI(),
});
({ showInfo, showCometInfo, showDwarfInfo, showMoonDetail, closeInfoPanel } = infoPanel);

const planetList = createPlanetListController({
  document,
  state,
  planets: PLANETS,
  dwarfs: DWARFS,
  onPlanetClick: (i) => {
    if (state.soloIndex === i) {
      state.soloIndex = -1;
      state.focusIndex = i;
      resetCamera();
      updatePlanetListUI();
      showInfo(i);
      updateSoloStatus?.();
    } else setSoloPlanet(i);
  },
  onDwarfClick: (i) => {
    // Reveal the dwarf-planet layer if hidden, then show its info card.
    if (!state.showDwarfs) {
      state.showDwarfs = true;
      controlsController.syncLayerMenu();
    }
    state.cometFocusIndex = -1;
    state.soloIndex = -1;
    state.focusIndex = -1;
    showDwarfInfo(i);
    updatePlanetListUI();
  },
});
({ updatePlanetListUI } = planetList);

let controlsController;
sound.attach({ THREE, camera, planetObjs });
controlsController = createControlsController({
  document,
  window,
  state,
  planets: PLANETS,
  comets: COMETS,
  j2000: J2000,
  cometOrbitPos,
  THREE,
  bloomEnabledRef: () => bloomEnabled,
  setBloomEnabled: (value) => {
    bloomEnabled = state.renderQuality === 'quality' ? value : false;
  },
  setRenderQuality,
  initAudio,
  disableAudio,
  soundApi: sound,
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
});
({ setSoloPlanet, setSoloSun, clearSoloMode, updateSoloStatus } = controlsController);

planetList.initPlanetList();
controlsController.bindControls();
installSelectionHandlers({
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
  planets: PLANETS,
  comets: COMETS,
  dwarfs: DWARFS,
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
  soundApi: sound,
});
document.getElementById('ec-close')?.addEventListener('click', () => {
  state.showEvents = false;
  const cb = document.getElementById('layer-events'); if (cb) cb.checked = false;
  clearEvents();
});

showInfo(-1);
renderHistoricalMarkers();
resetCamera();
requestAnimationFrame(() => {
  document.getElementById('loader').classList.add('gone');
  tick();
});
