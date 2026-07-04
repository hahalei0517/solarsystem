import { describe, expect, it } from 'vitest';
import {
  AU_IN_EARTH_DIAMETERS,
  EARTH_DIAMETER_KM,
  KM_PER_AU,
  sceneUnitsPerAU,
  semiMajorFor,
  trueOrbitFromKm,
  trueRadiusFromDiameterKm,
} from '../src/core/scale.js';
import { PLANETS } from '../src/data/solar-system.js';

describe('true-scale helpers', () => {
  it('derives AU_IN_EARTH_DIAMETERS from the constants', () => {
    expect(AU_IN_EARTH_DIAMETERS).toBeCloseTo(KM_PER_AU / EARTH_DIAMETER_KM, 5);
    expect(AU_IN_EARTH_DIAMETERS).toBeGreaterThan(11737);
    expect(AU_IN_EARTH_DIAMETERS).toBeLessThan(11748);
  });

  it('maps the Earth diameter to a 0.5-unit radius', () => {
    expect(trueRadiusFromDiameterKm(EARTH_DIAMETER_KM)).toBeCloseTo(0.5, 10);
  });

  it('maps the Moon orbital distance to ~30 Earth diameters', () => {
    expect(trueOrbitFromKm(384400)).toBeCloseTo(30.17, 1);
  });

  it('selects the right semi-major axis per scale mode', () => {
    const earth = PLANETS.find((p) => p.en === 'Earth');
    expect(semiMajorFor('schematic', earth)).toBe(earth.orbit);
    expect(semiMajorFor('real', earth)).toBe(earth.realAU);
    expect(semiMajorFor('true', earth)).toBeCloseTo(earth.realAU * AU_IN_EARTH_DIAMETERS, 5);
  });

  it('reports scene units per AU for the scale bar', () => {
    expect(sceneUnitsPerAU('real')).toBe(1);
    expect(sceneUnitsPerAU('true')).toBe(AU_IN_EARTH_DIAMETERS);
    expect(sceneUnitsPerAU('schematic')).toBeGreaterThan(0);
  });
});
