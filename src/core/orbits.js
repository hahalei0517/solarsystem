import { EPHEM } from '../data/solar-system.js';

export function solveKepler(meanAnomalyRadians, eccentricity) {
  let eccentricAnomaly = meanAnomalyRadians + eccentricity * Math.sin(meanAnomalyRadians);
  for (let i = 0; i < 6; i++) {
    const delta = (
      eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomalyRadians
    ) / (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }
  return eccentricAnomaly;
}

export function ephemerisCoordsAU(name, simDays, ephem = EPHEM) {
  const elements = ephem[name];
  if (!elements) return null;

  const T = simDays / 36525.0;
  const a = elements.el[0] + elements.dt[0] * T;
  const e = elements.el[1] + elements.dt[1] * T;
  const I = (elements.el[2] + elements.dt[2] * T) * Math.PI / 180;
  const L = (elements.el[3] + elements.dt[3] * T) * Math.PI / 180;
  const wbar = (elements.el[4] + elements.dt[4] * T) * Math.PI / 180;
  const Om = (elements.el[5] + elements.dt[5] * T) * Math.PI / 180;
  const w = wbar - Om;

  let M = L - wbar;
  M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (M > Math.PI) M -= 2 * Math.PI;

  const E = solveKepler(M, e);
  const xo = a * (Math.cos(E) - e);
  const yo = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cw = Math.cos(w), sw = Math.sin(w);
  const cI = Math.cos(I), sI = Math.sin(I);
  const cO = Math.cos(Om), sO = Math.sin(Om);

  return {
    x: (cO * cw - sO * sw * cI) * xo + (-cO * sw - sO * cw * cI) * yo,
    y: (sO * cw + cO * sw * cI) * xo + (-sO * sw + cO * cw * cI) * yo,
    z: (sw * sI) * xo + (cw * sI) * yo,
  };
}

export const EPHEMERIS_RECOMMENDED_YEAR_RANGE = {
  min: 1800,
  max: 2050,
};

export function getUtcYearFromJ2000Days(simDays, j2000) {
  return new Date(j2000.getTime() + simDays * 86400000).getUTCFullYear();
}

export function isWithinEphemerisRecommendedRange(
  simDays,
  j2000,
  range = EPHEMERIS_RECOMMENDED_YEAR_RANGE,
) {
  const year = getUtcYearFromJ2000Days(simDays, j2000);
  return year >= range.min && year <= range.max;
}

export function formatDateFromJ2000(simDays, j2000) {
  const d = new Date(j2000.getTime() + simDays * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
