import { NOTES } from '../data/solar-system.js';

// ============================================================================
// Solar-system sound engine
// ----------------------------------------------------------------------------
// Two layers:
//   1. A themeable ambient "bed" — the space-immersion music that plays while
//      sound is on. Four original LFO-driven ambient themes (Deep Void, Nebula,
//      Orbit, Solar Wind) plus a Custom-file slot for the user's own track.
//   2. A vocabulary of short interaction sounds (select, hover, revolution
//      chime, fly-in whoosh, time-speed glide, comet shimmer, etc.).
//
// Planet-tied sounds are stereo-panned to the body's projected screen position;
// a synthesized reverb tail gives every transient spatial depth.
//
// All tuning lives in the constants below. The engine is fully defensive: it
// never throws if Web Audio is absent or the context is suspended (e.g. headless
// browsers), so callers may invoke any method unconditionally.
// ============================================================================

// --- master levels ---
const MASTER = 0.5;       // overall loudness
const REVERB_WET = 0.35;  // reverb return level
const BED_GAIN = 0.09;    // ambient bed base level (procedural themes)
const BED_FILE_GAIN = 0.12; // level for file-based beds (bundled/custom)
const FADE = 0.6;         // bed fade-in seconds

// --- reverb impulse response ---
const REVERB_SECONDS = 3.2;
const REVERB_DECAY = 2.6;

// --- per-speed-mode pitch for the time-speed glide ---
const SPEED_PITCH = { hour: 200, day: 260, month: 392, year: 523 };

// Path to the bundled space-ambient background track (served from public/).
// MP3 (192kbps) instead of WAV — ~4MB vs ~33MB, much faster first load.
const SPACE_TRACK = '/audio/space-ambient-1.mp3';

// Ambient theme catalogue (key -> label), surfaced for the UI.
// 'space1' is the bundled background track and the default bed.
export const THEMES = [
  { key: 'space1', label: '太空音效1' },
  { key: 'deep',   label: '深空' },
  { key: 'nebula', label: '星云' },
  { key: 'orbit',  label: '轨道' },
  { key: 'solar',  label: '太阳风' },
];

let audioCtx = null;
let master = null;
let reverb = null;
let noiseBuffer = null;
let enabled = false;
let lastSpeedPitch = SPEED_PITCH.day;

// ambient bed state
let currentTheme = 'space1';
let bed = null;          // { stop() }
let customBuffer = null; // decoded AudioBuffer for the Custom-file theme
let spaceBuffer = null;  // decoded AudioBuffer for the bundled space-ambient track
let spacePromise = null; // in-flight fetch+decode of the bundled track

// throttle for hover blips
let lastHover = 0;

// refs for spatialization (set via attach)
let THREE_ = null;
let camera_ = null;
let planetObjs_ = null;

function resolveAC() {
  const g = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
  return g && (g.AudioContext || g.webkitAudioContext);
}

function ready() {
  return enabled && audioCtx;
}

// --- impulse response: smooth exponentially-decaying stereo noise ---
function makeImpulse(ctx) {
  const len = Math.floor(ctx.sampleRate * REVERB_SECONDS);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, REVERB_DECAY);
    }
  }
  return buf;
}

// --- looping brown-noise buffer for the "void wind" and whoosh ---
function makeNoiseBuffer(ctx) {
  const len = Math.floor(ctx.sampleRate * 4);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3.2;
  }
  return buf;
}

// Shared master chain + reverb + noise buffer. Built once on first enable.
function buildInfra() {
  const ctx = audioCtx;
  master = ctx.createGain();
  master.gain.value = 0; // ramped up on enable
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 24; comp.ratio.value = 4;
  comp.attack.value = 0.005; comp.release.value = 0.2;
  master.connect(comp).connect(ctx.destination);

  reverb = ctx.createConvolver();
  reverb.buffer = makeImpulse(ctx);
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = REVERB_WET;
  reverb.connect(reverbReturn).connect(master);

  noiseBuffer = makeNoiseBuffer(ctx);
}

// Send `src` into the reverb at a given amount (0..1 of its level).
function reverbSend(src, amount) {
  if (!reverb || amount <= 0) return;
  const s = audioCtx.createGain();
  s.gain.value = amount;
  src.connect(s);
  s.connect(reverb);
}

// A sustained oscillator voice.
function voice(freq, type, dest, detune = 0) {
  const o = audioCtx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  if (detune) o.detune.value = detune;
  o.connect(dest);
  o.start();
  return o;
}

// --- ambient bed themes -----------------------------------------------------
// Each builder returns { stop() } that stops its oscillators/sources. All are
// LFO-driven (no scheduler), so they loop seamlessly and leak nothing.

// 深空 Deep Void — dark, vast drone: root + fifth + pad + void wind through a
// slowly breathing low-pass filter.
function bedDeep() {
  const ctx = audioCtx;
  const stoppables = [];
  const out = ctx.createGain(); out.gain.value = BED_GAIN; out.connect(master);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 320; filter.Q.value = 0.6;
  filter.connect(out);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
  const lfoG = ctx.createGain(); lfoG.gain.value = 140;
  lfo.connect(lfoG).connect(filter.frequency); lfo.start(); stoppables.push(lfo);
  stoppables.push(voice(55.00, 'sine', filter, 0));
  stoppables.push(voice(82.41, 'sine', filter, 0));
  stoppables.push(voice(110.00, 'triangle', filter, 4));
  const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 280;
  const ng = ctx.createGain(); ng.gain.value = 0.5;
  noise.connect(nf).connect(ng).connect(filter); noise.start(); stoppables.push(noise);
  reverbSend(out, 0.15);
  return { stop() { for (const n of stoppables) { try { n.stop(); } catch (e) {} } try { out.disconnect(); } catch (e) {} } };
}

// 星云 Nebula — warm, lush Amaj7 pad with a soft tremolo and a high shimmer.
function bedNebula() {
  const ctx = audioCtx;
  const stoppables = [];
  const out = ctx.createGain(); out.gain.value = 0.08; out.connect(master);
  // tremolo
  const trem = ctx.createOscillator(); trem.frequency.value = 0.12;
  const tremG = ctx.createGain(); tremG.gain.value = 0.03;
  trem.connect(tremG).connect(out.gain); trem.start(); stoppables.push(trem);
  // warm Amaj7 voicing: A2 E3 A3 C#4 E4
  const chord = [110.00, 164.81, 220.00, 277.18, 329.63];
  for (let k = 0; k < chord.length; k++) stoppables.push(voice(chord[k], k % 2 ? 'sine' : 'triangle', out, (k - 2) * 2));
  // faint high shimmer
  stoppables.push(voice(880.00, 'sine', out, 0));
  reverbSend(out, 0.3);
  return { stop() { for (const n of stoppables) { try { n.stop(); } catch (e) {} } try { out.disconnect(); } catch (e) {} } };
}

// 轨道 Orbit — Am ↔ C chord crossfade (minor ↔ relative major) over an A pedal,
// with a gentle orbital pulse. Cinematic, harmonic motion.
function bedOrbit() {
  const ctx = audioCtx;
  const stoppables = [];
  const out = ctx.createGain(); out.gain.value = 0.08; out.connect(master);
  // orbital pulse
  const pulse = ctx.createOscillator(); pulse.frequency.value = 0.5;
  const pulseG = ctx.createGain(); pulseG.gain.value = 0.015;
  pulse.connect(pulseG).connect(out.gain); pulse.start(); stoppables.push(pulse);
  // crossfade LFO: chordA (Am) ↔ chordB (C)
  const xfade = ctx.createOscillator(); xfade.frequency.value = 0.06; xfade.start(); stoppables.push(xfade);
  const gainA = ctx.createGain(); gainA.gain.value = 0.02; gainA.connect(out);
  const gainB = ctx.createGain(); gainB.gain.value = 0.02; gainB.connect(out);
  const depthA = ctx.createGain(); depthA.gain.value = 0.02; xfade.connect(depthA).connect(gainA.gain);
  const depthB = ctx.createGain(); depthB.gain.value = -0.02; xfade.connect(depthB).connect(gainB.gain);
  // Am: A3 C4 E4 ; C: C4 E4 G4
  const chordA = [220.00, 261.63, 329.63];
  const chordB = [261.63, 329.63, 392.00];
  for (const f of chordA) stoppables.push(voice(f, 'sine', gainA, 3));
  for (const f of chordB) stoppables.push(voice(f, 'sine', gainB, 3));
  // A2 pedal
  stoppables.push(voice(110.00, 'triangle', out, 0));
  reverbSend(out, 0.35);
  return { stop() { for (const n of stoppables) { try { n.stop(); } catch (e) {} } try { out.disconnect(); } catch (e) {} } };
}

// 太阳风 Solar Wind — bright high partials that twinkle independently over a
// soft pedal, with a slow swell. Airy and radiant.
function bedSolar() {
  const ctx = audioCtx;
  const stoppables = [];
  const out = ctx.createGain(); out.gain.value = 0.06; out.connect(master);
  // slow swell
  const swell = ctx.createOscillator(); swell.frequency.value = 0.04;
  const swellG = ctx.createGain(); swellG.gain.value = 0.03;
  swell.connect(swellG).connect(out.gain); swell.start(); stoppables.push(swell);
  // soft pedal
  stoppables.push(voice(220.00, 'sine', out, 0));
  // twinkling partials, each with its own gain LFO
  const partials = [784, 988, 1175, 1568, 1976];
  const rates = [0.07, 0.11, 0.13, 0.09, 0.05];
  for (let k = 0; k < partials.length; k++) {
    const pg = ctx.createGain(); pg.gain.value = 0.006; pg.connect(out);
    const lfo = ctx.createOscillator(); lfo.frequency.value = rates[k];
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.006;
    lfo.connect(lfoG).connect(pg.gain); lfo.start(); stoppables.push(lfo);
    stoppables.push(voice(partials[k], 'sine', pg, 0));
  }
  reverbSend(out, 0.45);
  return { stop() { for (const n of stoppables) { try { n.stop(); } catch (e) {} } try { out.disconnect(); } catch (e) {} } };
}

// 自定义文件 Custom — loops a user-supplied decoded AudioBuffer.
function bedCustom() {
  if (!customBuffer) return { stop() {} };
  const ctx = audioCtx;
  const src = ctx.createBufferSource(); src.buffer = customBuffer; src.loop = true;
  const g = ctx.createGain(); g.gain.value = BED_FILE_GAIN;
  src.connect(g).connect(master);
  reverbSend(g, 0.2);
  src.start();
  return { stop() { try { src.stop(); } catch (e) {} try { g.disconnect(); } catch (e) {} } };
}

// 太空音效1 — the bundled space-ambient background track, looped.
function bedSpace() {
  if (!spaceBuffer) return { stop() {} };
  const ctx = audioCtx;
  const src = ctx.createBufferSource(); src.buffer = spaceBuffer; src.loop = true;
  const g = ctx.createGain(); g.gain.value = BED_FILE_GAIN;
  src.connect(g).connect(master); // keep the finished track clean (no reverb send)
  src.start();
  return { stop() { try { src.stop(); } catch (e) {} try { g.disconnect(); } catch (e) {} } };
}

// Lazily fetch + decode the bundled track. Resolves to the AudioBuffer or null.
// Idempotent: concurrent callers share one fetch.
function ensureSpaceBuffer() {
  if (spaceBuffer) return Promise.resolve(spaceBuffer);
  if (spacePromise) return spacePromise;
  if (typeof fetch !== 'function' || !audioCtx) return Promise.resolve(null);
  spacePromise = (async () => {
    try {
      const res = await fetch(SPACE_TRACK);
      if (!res.ok) return null;
      const data = await res.arrayBuffer();
      spaceBuffer = await audioCtx.decodeAudioData(data);
      return spaceBuffer;
    } catch (e) {
      return null;
    } finally {
      spacePromise = null;
    }
  })();
  return spacePromise;
}

function buildBed(theme) {
  teardownBed();
  if (theme === 'space1') bed = bedSpace();
  else if (theme === 'nebula') bed = bedNebula();
  else if (theme === 'orbit') bed = bedOrbit();
  else if (theme === 'solar') bed = bedSolar();
  else if (theme === 'custom') bed = bedCustom();
  else bed = bedDeep();
}

function teardownBed() {
  if (bed) { try { bed.stop(); } catch (e) {} bed = null; }
}

// Start the bed for a theme. The bundled 'space1' track is lazy: if not yet
// decoded, play 'deep' as an immediate fallback so there is no silence, then
// swap to the track once it has loaded.
function startBed(theme) {
  if (theme === 'space1') {
    if (spaceBuffer) {
      buildBed('space1');
    } else {
      buildBed('deep');
      ensureSpaceBuffer().then((buf) => {
        if (buf && enabled && currentTheme === 'space1') buildBed('space1');
      });
    }
  } else {
    buildBed(theme);
  }
}

// --- lifecycle ---

function enable() {
  const Ctor = resolveAC();
  if (!Ctor) return;
  if (!audioCtx) {
    try { audioCtx = new Ctor(); } catch (e) { audioCtx = null; return; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  if (!master) buildInfra();
  if (!bed) startBed(currentTheme);
  enabled = true;
  const t0 = audioCtx.currentTime;
  master.gain.cancelScheduledValues(t0);
  master.gain.setValueAtTime(master.gain.value, t0);
  master.gain.linearRampToValueAtTime(MASTER, t0 + FADE);
}

function disable() {
  enabled = false;
  if (!audioCtx || !master) return;
  const t0 = audioCtx.currentTime;
  master.gain.cancelScheduledValues(t0);
  master.gain.setValueAtTime(master.gain.value, t0);
  master.gain.linearRampToValueAtTime(0, t0 + 0.25);
  // Free the bed's nodes shortly after the fade completes.
  const old = bed; bed = null;
  setTimeout(() => { if (old) { try { old.stop(); } catch (e) {} } }, 300);
}

function setTheme(name) {
  currentTheme = name;
  if (audioCtx && master && enabled) startBed(name);
  // When not yet enabled, enable() will build currentTheme on first start.
}

async function loadCustom(file) {
  if (!audioCtx) enable();
  if (!audioCtx) return false;
  try {
    const data = await file.arrayBuffer();
    customBuffer = await audioCtx.decodeAudioData(data);
    currentTheme = 'custom';
    if (enabled) buildBed('custom');
    return true;
  } catch (e) {
    return false;
  }
}

function hasCustom() {
  return !!customBuffer;
}

function attach({ THREE, camera, planetObjs }) {
  THREE_ = THREE;
  camera_ = camera;
  planetObjs_ = planetObjs;
}

// --- generic short-lived tone with reverb send + stereo pan ---
function tone({
  freq, type = 'sine', dur = 1.0, attack = 0.02, gain = 0.18,
  pan = 0, wet = 0.4, detune = 0, glideTo = null, glideTime = null, delay = 0,
}) {
  if (!ready()) return;
  const ctx = audioCtx;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (detune) osc.detune.value = detune;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + (glideTime || dur * 0.6));
  }

  const panner = ctx.createStereoPanner();
  panner.pan.value = THREE_ ? THREE_.MathUtils.clamp(pan, -1, 1) : Math.max(-1, Math.min(1, pan));

  osc.connect(g).connect(panner);
  panner.connect(master);
  if (wet > 0 && reverb) {
    const send = ctx.createGain();
    send.gain.value = wet * gain;
    panner.connect(send);
    send.connect(reverb);
  }

  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Project a planet's world position to NDC and map X to a stereo pan.
function panForIndex(i) {
  if (!camera_ || !planetObjs_ || !planetObjs_[i] || !THREE_) return 0;
  const v = planetObjs_[i].group.position.clone().project(camera_);
  return THREE_.MathUtils.clamp(v.x, -1, 1);
}

// --- interaction vocabulary ---

function select(i) {
  const f = NOTES[i] || 440;
  const pan = panForIndex(i);
  tone({ freq: f, type: 'sine', dur: 1.4, attack: 0.01, gain: 0.16, wet: 0.5, pan });
  tone({ freq: f * 2, type: 'sine', dur: 0.9, attack: 0.015, gain: 0.05, wet: 0.4, pan, delay: 0.02 });
}

function hover(i) {
  const t = audioCtx ? audioCtx.currentTime : 0;
  if (t - lastHover < 0.08) return;
  lastHover = t;
  tone({ freq: (NOTES[i] || 440) * 4, type: 'sine', dur: 0.12, attack: 0.004, gain: 0.045, wet: 0.2, pan: panForIndex(i) * 0.6 });
}

function revChime(i) {
  const f = NOTES[i] || 440;
  const pan = panForIndex(i);
  tone({ freq: f, type: 'sine', dur: 1.8, attack: 0.005, gain: 0.12, wet: 0.55, pan });
  tone({ freq: f * 1.5, type: 'sine', dur: 1.4, attack: 0.008, gain: 0.05, wet: 0.5, pan });
  tone({ freq: f * 2, type: 'sine', dur: 1.0, attack: 0.01, gain: 0.03, wet: 0.45, pan });
}

function whoosh(dir = 'in') {
  if (!ready()) return;
  const ctx = audioCtx;
  const t0 = ctx.currentTime;
  const dur = 0.7;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  const f0 = dir === 'in' ? 380 : 1700;
  const f1 = dir === 'in' ? 1700 : 380;
  bp.frequency.setValueAtTime(f0, t0);
  bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(bp).connect(g).connect(master);
  if (reverb) {
    const send = ctx.createGain();
    send.gain.value = 0.5;
    g.connect(send);
    send.connect(reverb);
  }
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

function timeSpeed(mode) {
  const target = SPEED_PITCH[mode] || SPEED_PITCH.day;
  tone({ freq: lastSpeedPitch, glideTo: target, glideTime: 0.22, type: 'sine', dur: 0.45, attack: 0.01, gain: 0.1, wet: 0.3 });
  lastSpeedPitch = target;
}

function playPause(playing) {
  if (playing) {
    tone({ freq: 330, glideTo: 440, glideTime: 0.12, type: 'sine', dur: 0.4, attack: 0.01, gain: 0.1, wet: 0.3 });
  } else {
    tone({ freq: 440, glideTo: 294, glideTime: 0.14, type: 'sine', dur: 0.45, attack: 0.01, gain: 0.1, wet: 0.3 });
  }
}

function scaleMorph() {
  tone({ freq: 130, glideTo: 65, glideTime: 0.7, type: 'sine', dur: 1.0, attack: 0.01, gain: 0.14, wet: 0.5 });
  tone({ freq: 520, glideTo: 260, glideTime: 0.7, type: 'sine', dur: 0.9, attack: 0.02, gain: 0.04, wet: 0.4, delay: 0.03 });
}

function comet() {
  const parts = [1568, 2093, 2637, 3136];
  for (let k = 0; k < parts.length; k++) {
    tone({ freq: parts[k], type: 'sine', dur: 1.1 + k * 0.1, attack: 0.006, gain: 0.05, wet: 0.6, pan: (k - 1.5) * 0.18, delay: k * 0.04 });
  }
}

function event() {
  tone({ freq: 196, type: 'sine', dur: 1.4, attack: 0.01, gain: 0.1, wet: 0.5 });
  comet();
}

function uiTick() {
  tone({ freq: 660, type: 'triangle', dur: 0.08, attack: 0.003, gain: 0.05, wet: 0.12 });
}

export const sound = {
  attach, enable, disable, setTheme, loadCustom, hasCustom,
  select, hover, revChime, whoosh, timeSpeed, playPause, scaleMorph, comet, event, uiTick,
};

// Backwards-compatible wrappers used by the layer/sound toggle wiring.
export const initAudio = () => sound.enable();
export const disableAudio = () => sound.disable();
