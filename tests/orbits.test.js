import { describe, expect, it } from 'vitest';
import { EPHEM, J2000 } from '../src/data/solar-system.js';
import {
  EPHEMERIS_RECOMMENDED_YEAR_RANGE,
  ephemerisCoordsAU,
  formatDateFromJ2000,
  getUtcYearFromJ2000Days,
  isWithinEphemerisRecommendedRange,
  solveKepler,
} from '../src/core/orbits.js';

function daysFromUtcNoon(year, month = 0, day = 1) {
  return (Date.UTC(year, month, day, 12, 0, 0) - J2000.getTime()) / 86400000;
}

describe('orbit helpers', () => {
  it('solves circular orbits without changing the mean anomaly', () => {
    const M = 1.234;
    expect(solveKepler(M, 0)).toBeCloseTo(M, 10);
  });

  it('solves Kepler equation with a small residual', () => {
    const M = 2.1;
    const e = 0.206;
    const E = solveKepler(M, e);
    const residual = E - e * Math.sin(E) - M;
    expect(Math.abs(residual)).toBeLessThan(1e-7);
  });

  it('formats J2000 day zero as the current UI date', () => {
    expect(formatDateFromJ2000(0, J2000)).toBe('2000-01-01');
  });

  it('returns finite Earth ephemeris coordinates near 1 AU at J2000', () => {
    const earth = ephemerisCoordsAU('Earth', 0, EPHEM);
    expect(earth).not.toBeNull();
    expect(Number.isFinite(earth.x)).toBe(true);
    expect(Number.isFinite(earth.y)).toBe(true);
    expect(Number.isFinite(earth.z)).toBe(true);
    const distance = Math.hypot(earth.x, earth.y, earth.z);
    expect(distance).toBeGreaterThan(0.95);
    expect(distance).toBeLessThan(1.05);
  });

  it('exports the recommended approximate ephemeris year range', () => {
    expect(EPHEMERIS_RECOMMENDED_YEAR_RANGE).toEqual({ min: 1800, max: 2050 });
  });

  it('converts simulation days to UTC years', () => {
    expect(getUtcYearFromJ2000Days(daysFromUtcNoon(1800), J2000)).toBe(1800);
    expect(getUtcYearFromJ2000Days(daysFromUtcNoon(2051), J2000)).toBe(2051);
  });

  it('flags dates outside the recommended approximate ephemeris range', () => {
    expect(isWithinEphemerisRecommendedRange(daysFromUtcNoon(1799), J2000)).toBe(false);
    expect(isWithinEphemerisRecommendedRange(daysFromUtcNoon(1800), J2000)).toBe(true);
    expect(isWithinEphemerisRecommendedRange(daysFromUtcNoon(2050), J2000)).toBe(true);
    expect(isWithinEphemerisRecommendedRange(daysFromUtcNoon(2051), J2000)).toBe(false);
  });
});
