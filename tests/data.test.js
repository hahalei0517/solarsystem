import { describe, expect, it } from 'vitest';
import { COMETS, PLANETS, DWARFS, COMET_SHOWERS, SUN_SPOT_CYCLE } from '../src/data/solar-system.js';

describe('solar-system data', () => {
  it('contains the eight major planets', () => {
    expect(PLANETS).toHaveLength(8);
    expect(PLANETS.map((p) => p.en)).toEqual([
      'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
    ]);
  });

  it('defines required planet fields', () => {
    for (const planet of PLANETS) {
      expect(planet).toEqual(expect.objectContaining({
        name: expect.any(String),
        en: expect.any(String),
        radius: expect.any(Number),
        period: expect.any(Number),
        e: expect.any(Number),
        inc: expect.any(Number),
        peri: expect.any(Number),
        realAU: expect.any(Number),
        stats: expect.any(Object),
        moons: expect.any(Array),
      }));
    }
  });

  it('includes Earth moon data and Halley comet data', () => {
    const earth = PLANETS.find((planet) => planet.en === 'Earth');
    expect(earth?.moons.length).toBeGreaterThan(0);
    expect(COMETS.some((comet) => comet.en === 'Halley')).toBe(true);
  });

  it('provides real-size numeric fields for the true-scale mode', () => {
    for (const planet of PLANETS) {
      expect(planet.realDiameterKm).toEqual(expect.any(Number));
      expect(planet.realDiameterKm).toBeGreaterThan(0);
      for (const moon of planet.moons) {
        expect(moon.realDiameterKm).toEqual(expect.any(Number));
        expect(moon.realOrbitKm).toEqual(expect.any(Number));
        expect(moon.realDiameterKm).toBeGreaterThan(0);
        expect(moon.realOrbitKm).toBeGreaterThan(0);
      }
    }
  });

  it('gives every planet an educational "fact"', () => {
    for (const planet of PLANETS) {
      expect(typeof planet.fact).toBe('string');
      expect(planet.fact.length).toBeGreaterThan(5);
    }
  });

  it('defines dwarf planets with comet-style orbital elements', () => {
    expect(DWARFS.length).toBeGreaterThanOrEqual(3);
    expect(DWARFS.map((d) => d.en)).toEqual(
      expect.arrayContaining(['Pluto', 'Ceres', 'Eris'])
    );
    for (const d of DWARFS) {
      expect(d).toEqual(expect.objectContaining({
        name: expect.any(String),
        en: expect.any(String),
        color: expect.any(Number),
        radius: expect.any(Number),
        realDiameterKm: expect.any(Number),
        q: expect.any(Number),
        e: expect.any(Number),
        i: expect.any(Number),
        w: expect.any(Number),
        Om: expect.any(Number),
        T: expect.any(Number),
        tp: expect.any(Number),
        desc: expect.any(String),
        fact: expect.any(String),
        stats: expect.any(Object),
      }));
      expect(d.realDiameterKm).toBeGreaterThan(0);
    }
  });

  it('links parent comets to their meteor showers', () => {
    expect(COMET_SHOWERS.Halley).toBeDefined();
    expect(COMET_SHOWERS['Swift-Tuttle']).toBeDefined();
    for (const showers of Object.values(COMET_SHOWERS)) {
      for (const s of showers) {
        expect(s.name).toEqual(expect.any(String));
        expect(s.month).toEqual(expect.any(String));
      }
    }
  });

  it('defines a sunspot cycle reference for the Sun activity indicator', () => {
    expect(SUN_SPOT_CYCLE.years).toEqual(expect.any(Number));
    expect(SUN_SPOT_CYCLE.years).toBeGreaterThan(0);
    expect(SUN_SPOT_CYCLE.referencePeak).toEqual(expect.any(Number));
  });
});
