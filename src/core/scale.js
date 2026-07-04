// Pure scale helpers for the "真比例" (true-scale) mode.
// In true mode, 1 scene unit = 1 Earth diameter, so planet/sun/moon sizes
// and orbits are derived from real-world kilometres.

export const EARTH_DIAMETER_KM = 12742;
export const KM_PER_AU = 149597870.7;
// How many Earth diameters span 1 AU (≈ 11740.5). Neptune's orbit ≈ 30 * this.
export const AU_IN_EARTH_DIAMETERS = KM_PER_AU / EARTH_DIAMETER_KM;

// Scene-unit radius for a body of the given real diameter (km).
export function trueRadiusFromDiameterKm(km) {
  return km / EARTH_DIAMETER_KM / 2;
}

// Scene-unit orbital distance for a real separation given in km.
export function trueOrbitFromKm(km) {
  return km / EARTH_DIAMETER_KM;
}

// How many scene units equal 1 AU under each scale mode (used by the on-screen scale bar).
export function sceneUnitsPerAU(scaleMode) {
  if (scaleMode === 'true') return AU_IN_EARTH_DIAMETERS; // 1 unit = 1 Earth diameter
  if (scaleMode === 'real') return 1;                     // 1 unit = 1 AU
  // schematic: Neptune orbit (5.3) ≈ 30.1 AU → 1 AU ≈ 0.176 units; but Earth sits at 1.15.
  // Use Earth's laid-out orbit as the 1 AU reference for a readable bar.
  return 1.15;
}


// Centralised semi-major axis for a planet under each scale mode.
// - schematic: pretty laid-out catalog orbit
// - real: 1 scene unit = 1 AU
// - true: 1 scene unit = 1 Earth diameter (real AU * Earth-diameters-per-AU)
export function semiMajorFor(scaleMode, p) {
  if (scaleMode === 'real') return p.realAU;
  if (scaleMode === 'true') return p.realAU * AU_IN_EARTH_DIAMETERS;
  return p.orbit;
}
