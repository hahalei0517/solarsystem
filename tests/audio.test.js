import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sound, initAudio, disableAudio, THEMES } from '../src/app/audio.js';

// A permissive mock AudioContext: every create* returns a node whose connect()
// returns a chainable stub, and every AudioParam records scheduling calls
// without doing anything. This lets us exercise the full engine graph in Node
// (which has no Web Audio) purely to guarantee nothing throws.
const chain = { connect() { return chain; } };
function param() {
  return {
    value: 0,
    setValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    setTargetAtTime() { return this; },
    cancelScheduledValues() { return this; },
  };
}
function node() {
  const n = { connect: () => chain, start() {}, stop() {}, loop: false, buffer: null, type: '' };
  n.gain = param(); n.frequency = param(); n.detune = param();
  n.pan = param(); n.Q = param();
  n.threshold = param(); n.knee = param(); n.ratio = param();
  n.attack = param(); n.release = param();
  return n;
}
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.sampleRate = 44100;
    this.destination = chain;
  }
  createGain() { return node(); }
  createOscillator() { return node(); }
  createConvolver() { return node(); }
  createBiquadFilter() { return node(); }
  createStereoPanner() { return node(); }
  createBufferSource() { return node(); }
  createDynamicsCompressor() { return node(); }
  createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
  decodeAudioData() { return Promise.resolve({ duration: 1, mockBuffer: true }); }
  resume() { return Promise.resolve(); }
}

describe('sound engine', () => {
  let original;

  beforeEach(() => {
    original = globalThis.AudioContext;
    globalThis.AudioContext = MockAudioContext;
    sound.attach({
      THREE: { MathUtils: { clamp: (v) => Math.max(-1, Math.min(1, v)) } },
      camera: {},
      planetObjs: [],
    });
  });

  afterEach(() => {
    disableAudio();
    globalThis.AudioContext = original;
  });

  it('exposes the theme catalogue and interaction vocabulary', () => {
    expect(THEMES.map((t) => t.key)).toEqual(['space1', 'deep', 'nebula', 'orbit', 'solar']);
    const methods = Object.keys(sound).sort();
    expect(methods).toEqual([
      'attach', 'comet', 'disable', 'enable', 'event', 'hasCustom', 'hover',
      'loadCustom', 'playPause', 'revChime', 'scaleMorph', 'select', 'setTheme',
      'timeSpeed', 'uiTick', 'whoosh',
    ]);
  });

  it('enables via initAudio and runs every interaction sound without throwing', () => {
    expect(() => initAudio()).not.toThrow();
    expect(() => {
      sound.select(2);
      sound.hover(2);
      sound.revChime(2);
      sound.whoosh('in');
      sound.whoosh('out');
      sound.timeSpeed('year');
      sound.timeSpeed('hour');
      sound.playPause(true);
      sound.playPause(false);
      sound.scaleMorph();
      sound.comet();
      sound.event();
      sound.uiTick();
    }).not.toThrow();
  });

  it('switches through every ambient bed theme without throwing', () => {
    initAudio();
    expect(() => {
      for (const t of THEMES) sound.setTheme(t.key);
      sound.setTheme('deep');
    }).not.toThrow();
  });

  it('loads a custom audio file as the bed', async () => {
    expect(sound.hasCustom()).toBe(false);
    const fakeFile = { arrayBuffer: () => Promise.resolve(new ArrayBuffer(64)) };
    const ok = await sound.loadCustom(fakeFile);
    expect(ok).toBe(true);
    expect(sound.hasCustom()).toBe(true);
  });

  it('no-ops gracefully when disabled', () => {
    disableAudio();
    expect(() => {
      sound.select(0);
      sound.revChime(0);
      sound.whoosh('in');
      sound.comet();
      sound.setTheme('orbit');
    }).not.toThrow();
  });

  it('no-ops gracefully when Web Audio is unavailable', () => {
    globalThis.AudioContext = undefined;
    disableAudio();
    expect(() => initAudio()).not.toThrow();
    expect(() => sound.select(0)).not.toThrow();
  });
});
