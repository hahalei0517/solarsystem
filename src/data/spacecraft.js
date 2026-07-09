// Human-made interplanetary / interstellar spacecraft.
// These bodies are on hyperbolic escape trajectories, so they cannot use the closed Kepler
// orbit model shared by comets and dwarf planets. Instead we store a reference epoch
// (days since J2000) together with heliocentric ecliptic coordinates at that epoch and a
// constant radial speed, then extrapolate linearly along the fixed direction. Direction
// changes by only fractions of a degree per decade, so this is accurate enough for an
// educational visualization.

import { J2000 } from './solar-system.js';
import { AU_IN_EARTH_DIAMETERS } from '../core/scale.js';

// Reference epoch used by all spacecraft entries: 2026-07-09 12:00 UTC.
export const SPACECRAFT_REFERENCE_DATE =
  (Date.UTC(2026, 6, 9, 12, 0, 0) - J2000.getTime()) / 86400000;

// Approximate current positions and radial speeds for well-known deep-space missions.
// Distances are heliocentric; speeds are the outward radial component used for linear
// extrapolation. Values are rounded from publicly available NASA mission status reports
// and JPL Horizons ephemerides (educational precision, not operations-grade).
export const SPACECRAFT = [
  {
    name: '旅行者 1 号',
    en: 'Voyager 1',
    color: 0x66ccff,
    launchDate: '1977-09-05',
    status: '正常运行，已飞出日球层，进入星际空间',
    referenceDate: SPACECRAFT_REFERENCE_DATE,
    referenceDistanceAU: 164.2,
    longitudeDeg: 255.0,
    latitudeDeg: 34.9,
    radialSpeedAUperDay: 0.00976, // ~16.9 km/s
    desc: '旅行者 1 号是人类飞得最远的探测器，1977 年发射，2012 年成为首个穿越日球层顶、进入星际空间的人造物体。它携带的金唱片记录着地球文明的信息，正朝向蛇夫座方向飞去。',
    fact: '截至 2026 年，旅行者 1 号距离太阳已超过 160 AU，无线电信号以光速传回地球需要约 22 小时。',
    stats: {
      '类型': '外行星 / 星际探测器',
      '发射日期': '1977-09-05',
      '发射载具': '泰坦三号E / 半人马座',
      '任务目标': '木星、土星、外太阳系及星际空间',
      '状态': '正常运行',
      '速度': '约 17 km/s',
    },
  },
  {
    name: '旅行者 2 号',
    en: 'Voyager 2',
    color: 0x8de0a3,
    launchDate: '1977-08-20',
    status: '正常运行，已飞出日球层，进入星际空间',
    referenceDate: SPACECRAFT_REFERENCE_DATE,
    referenceDistanceAU: 137.0,
    longitudeDeg: 15.5,
    latitudeDeg: -55.3,
    radialSpeedAUperDay: 0.00861, // ~14.9 km/s
    desc: '旅行者 2 号是唯一曾近距离飞掠木星、土星、天王星和海王星四大行星的探测器。它于 2018 年穿越日球层顶，朝望远镜座方向进入星际空间。',
    fact: '旅行者 2 号发现的冰巨星磁场与自转轴高度倾斜，是太阳系中最不对称的行星磁场之一。',
    stats: {
      '类型': '外行星 / 星际探测器',
      '发射日期': '1977-08-20',
      '发射载具': '泰坦三号E / 半人马座',
      '任务目标': '木星、土星、天王星、海王星及星际空间',
      '状态': '正常运行',
      '速度': '约 15 km/s',
    },
  },
  {
    name: '先驱者 10 号',
    en: 'Pioneer 10',
    color: 0xe0c28a,
    launchDate: '1972-03-03',
    status: '任务已结束，最后信号 2003 年收到',
    referenceDate: SPACECRAFT_REFERENCE_DATE,
    referenceDistanceAU: 135.5,
    longitudeDeg: 5.2,
    latitudeDeg: -3.2,
    radialSpeedAUperDay: 0.00689, // ~11.9 km/s
    desc: '先驱者 10 号是首个穿越小行星带、首次近距离飞掠木星的探测器。2003 年因电力耗尽与地面失联，目前正以沉默姿态朝向金牛座方向飞出太阳系。',
    fact: '先驱者 10 号携带了著名的"先驱者镀金铝板"，上面刻画着人类形象与太阳系相对位置。',
    stats: {
      '类型': '外行星 / 星际探测器',
      '发射日期': '1972-03-03',
      '发射载具': '擎天神-半人马座',
      '任务目标': '木星、外太阳系及星际空间',
      '状态': '任务已结束',
      '速度': '约 12 km/s',
    },
  },
  {
    name: '先驱者 11 号',
    en: 'Pioneer 11',
    color: 0xf0a060,
    launchDate: '1973-04-06',
    status: '任务已结束，最后信号 1995 年收到',
    referenceDate: SPACECRAFT_REFERENCE_DATE,
    referenceDistanceAU: 112.3,
    longitudeDeg: 75.8,
    latitudeDeg: -14.6,
    radialSpeedAUperDay: 0.00632, // ~10.9 km/s
    desc: '先驱者 11 号是人类首个飞掠土星的探测器，也是第二个穿越小行星带的人造物体。它朝向盾牌座方向飞出太阳系，1995 年因电力不足失联。',
    fact: '先驱者 11 号确认了土星 F 环的存在，并为后来旅行者号对土星的详细探测奠定了基础。',
    stats: {
      '类型': '外行星 / 星际探测器',
      '发射日期': '1973-04-06',
      '发射载具': '擎天神-半人马座',
      '任务目标': '木星、土星及星际空间',
      '状态': '任务已结束',
      '速度': '约 11 km/s',
    },
  },
  {
    name: '新视野号',
    en: 'New Horizons',
    color: 0xf2d96b,
    launchDate: '2006-01-19',
    status: '正常运行，前往柯伊伯带腹地',
    referenceDate: SPACECRAFT_REFERENCE_DATE,
    referenceDistanceAU: 58.6,
    longitudeDeg: 295.4,
    latitudeDeg: -20.6,
    radialSpeedAUperDay: 0.00804, // ~13.9 km/s
    desc: '新视野号是飞掠冥王星的首个探测器，2015 年传回了冥王星高清影像与心形冰原"汤博区"。2019 年它近距离飞掠柯伊伯带天体"天涯海角"（Arrokoth），继续向太阳系边缘进发。',
    fact: '新视野号发射时是有史以来离开地球大气层速度最快的航天器，仅 9 小时后就飞越了月球轨道。',
    stats: {
      '类型': '柯伊伯带 / 外太阳系探测器',
      '发射日期': '2006-01-19',
      '发射载具': '擎天神 V',
      '任务目标': '冥王星、柯伊伯带天体',
      '状态': '正常运行',
      '速度': '约 14 km/s',
    },
  },
];

// Compute heliocentric ecliptic position in AU for the given spacecraft and simulation date.
// Returns a Vector3 in the scene's ecliptic frame: ecliptic XZ plane, Y up.
export function spacecraftPositionAU(sp, simDays) {
  const deltaDays = simDays - sp.referenceDate;
  const distanceAU = sp.referenceDistanceAU + sp.radialSpeedAUperDay * deltaDays;
  const lon = sp.longitudeDeg * Math.PI / 180;
  const lat = sp.latitudeDeg * Math.PI / 180;
  const cosLat = Math.cos(lat);
  const xEcl = distanceAU * cosLat * Math.cos(lon);
  const yEcl = distanceAU * cosLat * Math.sin(lon);
  const zEcl = distanceAU * Math.sin(lat);
  // Match the existing ephemeris convention used by planets: (x_ecl, z_ecl, -y_ecl).
  return new THREE.Vector3(xEcl, zEcl, -yEcl);
}

// Compute scene-unit position in true-scale mode (1 unit = 1 Earth diameter).
export function spacecraftPositionTrueScale(sp, simDays) {
  return spacecraftPositionAU(sp, simDays).multiplyScalar(AU_IN_EARTH_DIAMETERS);
}
