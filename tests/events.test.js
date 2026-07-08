import { describe, expect, it } from 'vitest';
import { EPHEM, PLANETS } from '../src/data/solar-system.js';
import { describeSkyEvent, elongationFromSun, geocentricLongitude, refineMaximum, refineMinimum, scanSkyEvents, separationFromEarth } from '../src/core/events.js';

describe('sky event helpers', () => {
  it('refines a minimum near a known quadratic minimum', () => {
    const result = refineMinimum((x) => (x - 3) ** 2, 0, 8);
    expect(result.t).toBeCloseTo(3, 5);
    expect(result.v).toBeCloseTo(0, 5);
  });

  it('refines a maximum near a known quadratic maximum', () => {
    const result = refineMaximum((x) => -((x - 4) ** 2), 0, 8);
    expect(result.t).toBeCloseTo(4, 5);
    expect(result.v).toBeCloseTo(0, 5);
  });

  it('computes a finite elongation angle', () => {
    const angle = elongationFromSun('Mars', 0, EPHEM);
    expect(Number.isFinite(angle)).toBe(true);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThanOrEqual(180);
  });

  it('scans sorted bounded sky events', () => {
    const events = scanSkyEvents({ min: -3650, max: 3650, planets: PLANETS, ephem: EPHEM });
    expect(events.length).toBeGreaterThan(0);
    expect(events.map((event) => event.days)).toEqual([...events.map((event) => event.days)].sort((a, b) => a - b));

    const counts = new Map();
    for (const event of events) {
      expect(event).toEqual(expect.objectContaining({
        days: expect.any(Number),
        label: expect.any(String),
        typeCode: expect.any(String),
        bodyA: expect.any(Number),
        bodyB: expect.any(Number),
        angle: expect.any(Number),
        score: expect.any(Number),
      }));
      counts.set(event.typeCode, (counts.get(event.typeCode) || 0) + 1);
    }
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('describes transit events with geometry and approximation context', () => {
    const text = describeSkyEvent({ typeCode: 'transit', bodyA: 0, angle: 0.12 }, PLANETS);
    expect(text).toContain('地球与太阳之间');
    expect(text).toContain('太阳盘面');
    expect(text).toContain('0.12°');
    expect(text).toContain('近似星历');
  });

  it('describes conjunction events as poor observing targets near the Sun', () => {
    const text = describeSkyEvent({ typeCode: 'conjunction', subType: 'inferior', bodyA: 1, angle: 0.55 }, PLANETS);
    expect(text).toContain('太阳');
    expect(text).toContain('眩光');
    expect(text).toContain('不适合观测');
    expect(text).toContain('0.55°');
  });

  it('describes opposition events as favorable outer-planet observing geometry', () => {
    const text = describeSkyEvent({ typeCode: 'opposition', bodyA: 3, angle: 179.3 }, PLANETS);
    expect(text).toContain('太阳');
    expect(text).toContain('相对');
    expect(text).toContain('整夜可见');
    expect(text).toContain('179.3°');
  });

  it('describes greatest-elongation events with observing timing', () => {
    const text = describeSkyEvent({ typeCode: 'elongation', subType: 'east', bodyA: 0, angle: 26.4 }, PLANETS);
    expect(text).toContain('东大距');
    expect(text).toContain('昏星');
    expect(text).toContain('26.4°');
  });

  it('describes planet–planet conjunctions naming both bodies', () => {
    const text = describeSkyEvent({ typeCode: 'planetConjunction', bodyA: 4, bodyB: 5, angle: 0.12 }, PLANETS);
    expect(text).toContain(PLANETS[4].name);
    expect(text).toContain(PLANETS[5].name);
    expect(text).toContain('相合');
  });

  it('computes finite geocentric longitude and planet separation', () => {
    const sunLon = geocentricLongitude('Earth', 0, EPHEM);
    expect(Number.isFinite(sunLon)).toBe(true);
    expect(sunLon).toBeGreaterThanOrEqual(0);
    expect(sunLon).toBeLessThan(360);
    const sep = separationFromEarth('Earth', 'Mars', 0, EPHEM);
    expect(Number.isFinite(sep)).toBe(true);
    expect(sep).toBeGreaterThanOrEqual(0);
    expect(sep).toBeLessThanOrEqual(180);
  });
});
