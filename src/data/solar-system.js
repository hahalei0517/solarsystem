export const TEXTURES = {
  sun: new URL('../../textures/2k_sun.jpg', import.meta.url).href,
  skyMilkyWay: new URL('../../textures/2k_stars_milky_way.jpg', import.meta.url).href,
};

export const SUN = {
  name: "太阳", en: "Sun", color: 0xFDB813, radius: 0.18, realDiameterKm: 1392700,
  desc: "太阳系的中心恒星，占太阳系总质量约 99.86%。",
  stats: { "类型": "G2V 主序星", "直径": "1,392,700 km", "表面温度": "约 5,500 ℃", "年龄": "约 46 亿年" }
};

// orbit (schematic AU-equivalent), realAU, period (days),
// e, inc (deg), peri (deg, longitude of periapsis),
// rotPeriod (Earth days, sign = direction)
export const PLANETS = [
  {
    name:"水星", en:"Mercury", color:0xA6A6A6, radius:0.06,
    tex:new URL('../../textures/2k_mercury.jpg', import.meta.url).href,
    orbit:0.5, realAU:0.39, period:87.97, realDiameterKm:4879,
    e:0.206, inc:7.0, peri:77, rotPeriod:58.6,
    classification: 'terrestrial', massEarth: 0.055, gravity: 3.7, surfaceTemp: '-173 到 427 ℃',
    desc:"距离太阳最近的行星，昼夜温差极大，没有大气层。",
    fact:"水星表面有一处直径约 1,550 km的卡路里盆地，是太阳系最大的撞击坑之一。",
    stats:{"公转周期":"88 天","自转周期":"59 天","直径":"4,879 km","距日":"0.39 AU","偏心率":"0.206","轨道倾角":"7.00°"},
    moons:[]
  },
  {
    name:"金星", en:"Venus", color:0xE8C07D, radius:0.10,
    tex:new URL('../../textures/2k_venus_surface.jpg', import.meta.url).href,
    orbit:0.8, realAU:0.72, period:224.7, realDiameterKm:12104,
    e:0.007, inc:3.4, peri:132, rotPeriod:-243, axialTilt:177.4,
    classification: 'terrestrial', massEarth: 0.815, gravity: 8.87, surfaceTemp: '约 464 ℃',
    desc:"最炽热的行星，浓密的二氧化碳大气产生强烈温室效应。",
    fact:"金星自转方向与多数行星相反，在金星上太阳从西边升起、东边落下。",
    stats:{"公转周期":"225 天","自转周期":"243 天 (逆向)","直径":"12,104 km","距日":"0.72 AU","偏心率":"0.007","轨道倾角":"3.39°"},
    moons:[]
  },
  {
    name:"地球", en:"Earth", color:0x4A90E2, radius:0.11,
    tex:new URL('../../textures/2k_earth_daymap.jpg', import.meta.url).href,
    orbit:1.15, realAU:1.00, period:365.25, realDiameterKm:12742,
    e:0.017, inc:0.0, peri:103, rotPeriod:0.997, axialTilt:23.5,
    classification: 'terrestrial', massEarth: 1.000, gravity: 9.81, surfaceTemp: '约 15 ℃ (均温)',
    desc:"目前已知唯一孕育生命的行星，表面 71% 被液态水覆盖。",
    fact:"地球的大气层中约 78% 是氮气，21% 是氧气，其余气体不足 1%。",
    stats:{"公转周期":"365.25 天","自转周期":"23.93 小时","直径":"12,742 km","距日":"1.00 AU","偏心率":"0.017","轨道倾角":"0° (基准面)"},
    moons:[{
      name:"月球", en:"Moon", color:0xD0D0D0, radius:0.03, orbit:0.18, period:27.3, realDiameterKm:3474, realOrbitKm:384400,
      tex:new URL('../../textures/2k_moon.jpg', import.meta.url).href,
      desc:"地球唯一的天然卫星，是太阳系第五大卫星。被认为由 45 亿年前一次撞击形成，潮汐锁定使我们永远只能看见同一面。",
      stats:{ "直径":"3,474 km", "公转周期":"27.3 天", "距母星":"384,400 km", "重力":"1.62 m/s²" }
    }]
  },
  {
    name:"火星", en:"Mars", color:0xD45D3F, radius:0.08,
    tex:new URL('../../textures/2k_mars.jpg', import.meta.url).href,
    orbit:1.6, realAU:1.52, period:686.97, realDiameterKm:6779,
    e:0.094, inc:1.85, peri:336, rotPeriod:1.026, axialTilt:25.2,
    classification: 'terrestrial', massEarth: 0.107, gravity: 3.71, surfaceTemp: '-140 到 20 ℃',
    desc:"红色星球，存在最高的奥林帕斯山，曾有液态水流动痕迹。",
    fact:"火星的奥林帕斯山高约 22 km，是地球珠峰的近 2.5 倍，为太阳系最高山。",
    stats:{"公转周期":"687 天","自转周期":"24.6 小时","直径":"6,779 km","距日":"1.52 AU","偏心率":"0.094","轨道倾角":"1.85°"},
    moons:[
      {
        name:"火卫一 Phobos", en:"Phobos", color:0x9C8674, radius:0.015, orbit:0.13, period:0.32, realDiameterKm:22.4, realOrbitKm:9376,
        desc:"火星较大的卫星，形状不规则，正以每年 2 cm 速度螺旋坠向火星，预计 5,000 万年内将解体形成环。",
        stats:{ "直径":"22.4 km", "公转周期":"7.7 小时", "距母星":"9,376 km" }
      },
      {
        name:"火卫二 Deimos", en:"Deimos", color:0xA89888, radius:0.012, orbit:0.18, period:1.26, realDiameterKm:12.4, realOrbitKm:23463,
        desc:"火星较小的卫星，表面比火卫一更平滑。可能与火卫一一样，是被火星俘获的小行星。",
        stats:{ "直径":"12.4 km", "公转周期":"30.3 小时", "距母星":"23,463 km" }
      }
    ]
  },
  {
    name:"木星", en:"Jupiter", color:0xE0AE6F, radius:0.32,
    tex:new URL('../../textures/2k_jupiter.jpg', import.meta.url).href,
    orbit:2.6, realAU:5.20, period:4332.59, realDiameterKm:139820,
    e:0.049, inc:1.3, peri:14, rotPeriod:0.414, axialTilt:3.1,
    classification: 'gasGiant', massEarth: 317.8, gravity: 24.79, surfaceTemp: '约 -145 ℃ (云顶)',
    desc:"太阳系最大的行星，气态巨行星，著名的大红斑已持续数百年。",
    fact:"木星的大红斑是一个已持续至少 350 年的反气旋风暴，曾大到能装下三个地球。",
    stats:{"公转周期":"11.86 年","自转周期":"9.93 小时","直径":"139,820 km","距日":"5.20 AU","偏心率":"0.049","轨道倾角":"1.30°"},
    moons:[
      {
        name:"木卫一 Io", en:"Io", color:0xF5D572, radius:0.022, orbit:0.45, period:1.77, realDiameterKm:3643, realOrbitKm:421800,
        desc:"太阳系火山活动最强烈的天体，表面有 400 余座活火山。受木星潮汐力加热，硫磺让表面呈黄橘色。",
        stats:{ "直径":"3,643 km", "公转周期":"1.77 天", "距母星":"421,800 km" }
      },
      {
        name:"木卫二 Europa", en:"Europa", color:0xC2B49A, radius:0.020, orbit:0.55, period:3.55, realDiameterKm:3122, realOrbitKm:671000,
        desc:"冰壳之下藏着比地球还多的液态水海洋，被认为是太阳系中最有可能存在地外生命的地方之一。",
        stats:{ "直径":"3,122 km", "公转周期":"3.55 天", "距母星":"671,000 km" }
      },
      {
        name:"木卫三 Ganymede", en:"Ganymede", color:0x9C8C72, radius:0.026, orbit:0.68, period:7.15, realDiameterKm:5268, realOrbitKm:1070000,
        desc:"太阳系最大的卫星，比水星还大，是唯一拥有自身磁场的卫星。",
        stats:{ "直径":"5,268 km", "公转周期":"7.15 天", "距母星":"1,070,000 km" }
      },
      {
        name:"木卫四 Callisto", en:"Callisto", color:0x6F6453, radius:0.024, orbit:0.85, period:16.69, realDiameterKm:4821, realOrbitKm:1883000,
        desc:"太阳系撞击坑最密集的天体之一，表面 40 亿年几乎未变。受木星辐射影响最小，是未来载人探测候选地。",
        stats:{ "直径":"4,821 km", "公转周期":"16.7 天", "距母星":"1,883,000 km" }
      }
    ],
    bands:["#D9A268","#E8B978","#C99258","#EBC290","#B0824B","#D4A370","#BC9258"],
    redSpot:true
  },
  {
    name:"土星", en:"Saturn", color:0xE5C28F, radius:0.27,
    tex:new URL('../../textures/2k_saturn.jpg', import.meta.url).href,
    ringTex:new URL('../../textures/2k_saturn_ring_alpha.png', import.meta.url).href,
    orbit:3.6, realAU:9.54, period:10759.22, realDiameterKm:116460,
    e:0.057, inc:2.49, peri:93, rotPeriod:0.444,
    classification: 'gasGiant', massEarth: 95.16, gravity: 10.44, surfaceTemp: '约 -178 ℃ (云顶)',
    desc:"拥有最壮观的行星环系统，主要由冰和岩石组成。",
    fact:"土星的平均密度只有 0.69 g/cm³，比水还轻——理论上能浮在足够大的水面上。",
    stats:{"公转周期":"29.46 年","自转周期":"10.7 小时","直径":"116,460 km","距日":"9.54 AU","偏心率":"0.057","轨道倾角":"2.49°"},
    moons:[
      {
        name:"土卫六 Titan", en:"Titan", color:0xC9A06A, radius:0.024, orbit:0.55, period:15.95, realDiameterKm:5150, realOrbitKm:1221870,
        desc:"太阳系唯一拥有浓厚大气层的卫星，表面有液态甲烷湖泊。比水星还大，是寻找外星生命的重点目标。",
        stats:{ "直径":"5,150 km", "公转周期":"15.95 天", "距母星":"1,221,870 km" }
      },
      {
        name:"土卫五 Rhea", en:"Rhea", color:0xB5B0A8, radius:0.016, orbit:0.72, period:4.52, realDiameterKm:1527, realOrbitKm:527108,
        desc:"土星第二大卫星，由冰和岩石组成，表面布满古老的撞击坑。可能拥有稀薄的氧气-二氧化碳大气。",
        stats:{ "直径":"1,527 km", "公转周期":"4.52 天", "距母星":"527,108 km" }
      },
      {
        name:"土卫二 Enceladus", en:"Enceladus", color:0xE8E8F0, radius:0.013, orbit:0.90, period:1.37, realDiameterKm:504, realOrbitKm:237948,
        desc:"南极喷射含盐冰水羽流，冰壳下有全球性海洋，是生命存在的另一大候选地。其喷发物质形成土星 E 环。",
        stats:{ "直径":"504 km", "公转周期":"1.37 天", "距母星":"237,948 km" }
      },
      {
        name:"土卫三 Tethys", en:"Tethys", color:0xE0E0E8, radius:0.013, orbit:0.50, period:1.89, realDiameterKm:1062, realOrbitKm:294619,
        desc:"主要由水冰构成，表面有一道横贯全球的巨大峡谷——伊萨卡峡谷，以及一个直径约 400 km 的巨型撞击坑奥德修斯。",
        stats:{ "直径":"1,062 km", "公转周期":"1.89 天", "距母星":"294,619 km" }
      },
      {
        name:"土卫四 Dione", en:"Dione", color:0xD8D8DE, radius:0.014, orbit:0.62, period:2.74, realDiameterKm:1123, realOrbitKm:377400,
        desc:"表面反差强烈：一面布满明亮悬崖（冰火山活动的痕迹），另一面则较暗。与土卫二保持 2:1 轨道共振。",
        stats:{ "直径":"1,123 km", "公转周期":"2.74 天", "距母星":"377,400 km" }
      },
      {
        name:"土卫八 Iapetus", en:"Iapetus", color:0x9A8A78, radius:0.014, orbit:1.05, period:79.3, realDiameterKm:1469, realOrbitKm:3560820,
        desc:"土星最外侧的大卫星，阴阳两面色调极端：一面如雪明亮，一面如沥青黝黑。赤道还有一道奇特的山脊。",
        stats:{ "直径":"1,469 km", "公转周期":"79.3 天", "距母星":"3,560,820 km" }
      }
    ],
    hasRing:true, axialTilt:26.7,
    bands:["#E5C28F","#D4AC72","#EBCFA0","#C99E60","#DAB682"]
  },
  {
    name:"天王星", en:"Uranus", color:0x8FD3D8, radius:0.18,
    tex:new URL('../../textures/2k_uranus.jpg', import.meta.url).href,
    orbit:4.5, realAU:19.2, period:30688.5, realDiameterKm:50724,
    e:0.046, inc:0.77, peri:173, rotPeriod:-0.718,
    classification: 'iceGiant', massEarth: 14.54, gravity: 8.87, surfaceTemp: '约 -216 ℃ (云顶)',
    desc:"侧躺自转的冰巨星，大气富含甲烷使其呈青蓝色。",
    fact:"天王星自转轴倾斜近 98°，几乎'躺着'绕日公转，每极有长达 42 年的极昼或极夜。",
    stats:{"公转周期":"84 年","自转周期":"17.2 小时 (倾斜97°)","直径":"50,724 km","距日":"19.2 AU","偏心率":"0.046","轨道倾角":"0.77°"},
    moons:[
      {
        name:"天卫一 Ariel", en:"Ariel", color:0xC4CCD0, radius:0.012, orbit:0.30, period:2.52, realDiameterKm:1158, realOrbitKm:191020,
        desc:"天王星最亮的卫星，表面相对年轻光滑，纵横交错的峡谷与断层显示曾经历冰火山活动。",
        stats:{ "直径":"1,158 km", "公转周期":"2.52 天", "距母星":"191,020 km" }
      },
      {
        name:"天卫五 Miranda", en:"Miranda", color:0xA8B5BC, radius:0.012, orbit:0.36, period:1.41, realDiameterKm:472, realOrbitKm:129390,
        desc:"地貌最奇特的卫星之一，拥有 20 km 高的悬崖（太阳系最高），表面似被打碎又重组而成。",
        stats:{ "直径":"472 km", "公转周期":"1.41 天", "距母星":"129,390 km" }
      },
      {
        name:"天卫二 Umbriel", en:"Umbriel", color:0x8A8E92, radius:0.012, orbit:0.44, period:4.14, realDiameterKm:1169, realOrbitKm:266000,
        desc:"天王星最暗的大卫星，表面布满古老撞击坑，反射率低，被认为含有较多暗色有机物质。",
        stats:{ "直径":"1,169 km", "公转周期":"4.14 天", "距母星":"266,000 km" }
      },
      {
        name:"天卫三 Titania", en:"Titania", color:0x9CA8AE, radius:0.018, orbit:0.52, period:8.71, realDiameterKm:1578, realOrbitKm:435910,
        desc:"天王星最大的卫星，表面有巨大的峡谷和断层，暗示曾发生地质活动。",
        stats:{ "直径":"1,578 km", "公转周期":"8.71 天", "距母星":"435,910 km" }
      },
      {
        name:"天卫四 Oberon", en:"Oberon", color:0x8F9BA0, radius:0.017, orbit:0.66, period:13.46, realDiameterKm:1523, realOrbitKm:583520,
        desc:"天王星第二大卫星，表面分布大量陨石坑和暗色物质，可能是有机化合物。",
        stats:{ "直径":"1,523 km", "公转周期":"13.46 天", "距母星":"583,520 km" }
      }
    ],
    axialTilt:97.8, hasRing:true, ringColor:0x7FA0A8, ringAlpha:0.3
  },
  {
    name:"海王星", en:"Neptune", color:0x3F6CD4, radius:0.17,
    tex:new URL('../../textures/2k_neptune.jpg', import.meta.url).href,
    orbit:5.3, realAU:30.1, period:60182, realDiameterKm:49244,
    e:0.011, inc:1.77, peri:48, rotPeriod:0.671, axialTilt:28.3,
    classification: 'iceGiant', massEarth: 17.15, gravity: 11.15, surfaceTemp: '约 -214 ℃ (云顶)',
    desc:"最远的行星，风速可达 2,100 km/h，是太阳系风暴最剧烈的世界。",
    fact:"海王星是用数学算出来的行星：天文学家先由天王星轨道异常推算其位置，之后才用望远镜确认。",
    stats:{"公转周期":"165 年","自转周期":"16.1 小时","直径":"49,244 km","距日":"30.1 AU","偏心率":"0.011","轨道倾角":"1.77°"},
    moons:[
      {
        name:"海卫一 Triton", en:"Triton", color:0xC0BCD0, radius:0.019, orbit:0.42, period:5.88, realDiameterKm:2707, realOrbitKm:354759,
        desc:"海王星最大卫星，唯一逆行（与行星自转反向）的大型卫星，可能是被海王星俘获的柯伊伯带天体。南极有氮气冰火山喷发。",
        stats:{ "直径":"2,707 km", "公转周期":"5.88 天 (逆行)", "距母星":"354,759 km" }
      },
      {
        name:"海卫二 Nereid", en:"Nereid", color:0xA0A4A8, radius:0.010, orbit:0.78, period:360, realDiameterKm:340, realOrbitKm:5513400,
        desc:"海王星轨道偏心率最大的卫星，距海王星远近变化悬殊（近日约 130 万 km，远日约 970 万 km），可能同样是俘获天体。",
        stats:{ "直径":"约 340 km", "公转周期":"约 360 天", "距母星":"约 5,513,400 km (平均)" }
      }
    ],
    hasRing:true, ringColor:0x8CA0B4, ringAlpha:0.22
  }
];

export const SPEED_MODES = {
  hour:  { value: 1/24, label: "1 小时/秒" },
  day:   { value: 1,    label: "1 天/秒" },
  month: { value: 30,   label: "30 天/秒 (≈月)" },
  year:  { value: 365,  label: "365 天/秒 (≈年)" }
};
export const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
export const J2000 = new Date(Date.UTC(2000,0,1,12,0,0));

// ---------- Comets ----------
// Perihelion distance q (AU), eccentricity e, inclination i (deg), argument of perihelion w (deg),
// longitude of ascending node Om (deg), period T (years), time of perihelion passage tp (days since J2000)
export const COMETS = [
  {
    name: "哈雷彗星", en: "Halley", color: 0x66ccff,
    q: 0.586, e: 0.967, i: 162.3, w: 111.3, Om: 58.4, T: 76.0, headRadius: 0.045,
    tp: -5074,  // 1986-02-09 (days since J2000)
    desc: "哈雷彗星是人类最早确认周期性的彗星，约每 76 年回归一次。它上一次近日点在 1986 年，下一次预计在 2061 年。哈雷彗星的远日点位于柯伊伯带内（约 35 AU），靠近太阳时冰和尘埃升华，形成彗发与彗尾。",
    stats: { "类型": "短周期彗星", "周期": "约 76 年", "近日点": "0.586 AU", "远日点": "约 35 AU", "轨道倾角": "162.3° (逆行)", "上次近日点": "1986-02-09", "下次近日点": "约 2061 年" }
  },
  {
    name: "恩克彗星", en: "Encke", color: 0x8de0a3,
    q: 0.336, e: 0.848, i: 11.78, w: 186.6, Om: 334.6, T: 3.30, headRadius: 0.03,
    tp: 8679,  // 2023-10-05
    desc: "恩克彗星是已知周期最短的彗星，约每 3.3 年回归一次，是金牛座流星雨的母彗星。它因不断损失物质，自转加快、分裂加剧，最终可能在数万年内解体消散。",
    stats: { "类型": "短周期彗星", "周期": "约 3.3 年", "近日点": "0.336 AU", "远日点": "约 4.1 AU", "轨道倾角": "11.78°", "上次近日点": "2023-10-05", "下次近日点": "约 2026 年" }
  },
  {
    name: "坦普尔-塔特尔彗星", en: "Tempel-Tuttle", color: 0xe0c28a,
    q: 0.976, e: 0.905, i: 162.49, w: 194.7, Om: 235.3, T: 33.3, headRadius: 0.03,
    tp: -672,  // 1998-02-28
    desc: "坦普尔-塔特尔彗星是狮子座流星雨的母彗星，约每 33 年回归一次。其逆行轨道与地球轨道相交，每次回归后都会留下密集尘埃流，可能引发壮观的流星暴。",
    stats: { "类型": "短周期彗星", "周期": "约 33.3 年", "近日点": "0.976 AU", "远日点": "约 19 AU", "轨道倾角": "162.49° (逆行)", "上次近日点": "1998-02-28", "下次近日点": "约 2031 年" }
  },
  {
    name: "斯威夫特-塔特尔彗星", en: "Swift-Tuttle", color: 0xf0a060,
    q: 0.960, e: 0.963, i: 113.45, w: 61.0, Om: 139.4, T: 133.0, headRadius: 0.05,
    tp: -2577,  // 1992-12-11
    desc: "斯威夫特-塔特尔彗星是英仙座流星雨的母彗星，约每 133 年回归一次，是太阳系已知最大的周期彗星之一。其轨道与地球相交，被列为潜在近地威胁天体之一。",
    stats: { "类型": "短周期彗星", "周期": "约 133 年", "近日点": "0.960 AU", "远日点": "约 51 AU", "轨道倾角": "113.45° (逆行)", "上次近日点": "1992-12-11", "下次近日点": "约 2126 年" }
  },
  {
    name: "霍尔姆斯彗星", en: "Holmes", color: 0xf2d96b,
    q: 2.053, e: 0.432, i: 19.19, w: 24.3, Om: 327.2, T: 6.89, headRadius: 0.03,
    tp: 2680,  // 2007-05-04
    desc: "霍尔姆斯彗星平时暗弱难见，但 2007 年 10 月发生剧烈爆发，亮度在两天内从 17 等暴增至 2.5 等，肉眼可见，彗发一度膨胀成太阳系最大天体。爆发机制至今未完全明了。",
    stats: { "类型": "短周期彗星", "周期": "约 6.9 年", "近日点": "2.053 AU", "远日点": "约 5.2 AU", "轨道倾角": "19.19°", "上次近日点": "2007-05-04", "下次近日点": "约 2014 年" }
  },
  {
    name: "丘留莫夫-格拉西缅科彗星", en: "Churyumov-Gerasimenko", color: 0xb0a890,
    q: 1.238, e: 0.640, i: 7.04, w: 12.8, Om: 311.3, T: 6.45, headRadius: 0.03,
    tp: 7976,  // 2021-11-02
    desc: "丘留莫夫-格拉西缅科彗星是欧洲空间局“罗塞塔号”探测器的目标，人类首次环绕并登陆彗星的天体。其外形酷似一只橡皮鸭，由两块不规则岩体经低速撞击粘合而成。",
    stats: { "类型": "木星族彗星", "周期": "约 6.45 年", "近日点": "1.238 AU", "远日点": "约 5.7 AU", "轨道倾角": "7.04°", "上次近日点": "2021-11-02", "下次近日点": "约 2028 年" }
  }
];

// ---------- Comet → meteor shower associations ----------
// Parent comets of major annual meteor showers. Keyed by comet `en` name.
export const COMET_SHOWERS = {
  Halley:         [{ name: "猎户座流星雨", month: "10月" }, { name: "宝瓶座 η 流星雨", month: "5月" }],
  Encke:          [{ name: "金牛座流星雨", month: "11月" }],
  "Tempel-Tuttle":[{ name: "狮子座流星雨", month: "11月" }],
  "Swift-Tuttle": [{ name: "英仙座流星雨", month: "8月" }],
};

// ---------- Dwarf planets ----------
// Modeled as comet-style bodies (q, e, i, w, Om, T, tp) so they reuse the
// comet orbit/position functions. tp = days since J2000 of a recent perihelion.
export const DWARFS = [
  {
    name: "冥王星", en: "Pluto", color: 0xC9A98A, radius: 0.05, realDiameterKm: 2376,
    classification: 'dwarf', gravity: 0.62, surfaceTemp: '约 -230 ℃',
    q: 29.66, e: 0.248, i: 17.16, w: 113.96, Om: 110.30, T: 248.0, tp: -3770,  // 1989-09-05 perihelion (29.7 AU); now outbound toward 2114 aphelion
    desc: "冥王星曾是第九大行星，2006 年被重新归类为矮行星。它位于柯伊伯带，自转轴倾斜约 120°，拥有稀薄大气和 5 颗卫星，最大卫星冥卫一几乎与它大小相当，二者互相潮汐锁定。",
    fact:"冥王星表面有一片心形冰原（汤博区），由冻结的氮、甲烷和一氧化碳组成。",
    stats: { "类型": "矮行星", "直径": "2,376 km", "公转周期": "约 248 年", "近日点": "29.66 AU", "远日点": "约 49.3 AU", "轨道倾角": "17.16°", "卫星数": "5" }
  },
  {
    name: "谷神星", en: "Ceres", color: 0x9C8E78, radius: 0.035, realDiameterKm: 940,
    classification: 'dwarf', gravity: 0.27, surfaceTemp: '约 -105 ℃',
    q: 2.558, e: 0.076, i: 10.59, w: 73.7, Om: 80.3, T: 4.60, tp: 6669, orbit: 1.95,  // schematic a anchors in the asteroid belt (Mars 1.6 / Jupiter 2.6); real a≈2.7675 AU
    desc: "谷神星是小行星带中最大的天体，也是唯一的矮行星，1801 年发现时曾被视为行星。其表面有冰火山和神秘亮斑（Occator 撞击坑内的盐类沉积），冰壳之下可能存在含盐海洋。",
    fact:"谷神星占小行星带总质量的约三分之一。",
    stats: { "类型": "矮行星", "直径": "约 940 km", "公转周期": "约 4.6 年", "近日点": "约 2.56 AU", "远日点": "约 2.98 AU", "轨道倾角": "10.59°" }
  },
  {
    name: "阋神星", en: "Eris", color: 0xD6D6DC, radius: 0.05, realDiameterKm: 2326,
    classification: 'dwarf', gravity: 0.83, surfaceTemp: '约 -230 ℃',
    q: 38.3, e: 0.436, i: 44.04, w: 151.0, Om: 35.9, T: 558.0, tp: -92200,  // last perihelion ~mid-18th century; currently near aphelion (~96 AU)
    desc: "阋神星的发现直接促成冥王星被降级为矮行星——它的质量比冥王星还大约 27%。位于离散盘，轨道高度倾斜偏心，有一颗卫星阋卫一（Dysnomia）。",
    fact:"阋神星质量比冥王星大，但因其轨道未清空邻近天体而同样被归为矮行星。",
    stats: { "类型": "矮行星", "直径": "约 2,326 km", "公转周期": "约 558 年", "近日点": "38.3 AU", "远日点": "约 97.6 AU", "轨道倾角": "44.04°" }
  }
];

// Approximate Schwabe sunspot cycle (~11 years). Used for an educational
// "sun activity" indicator on the Sun info card.
export const SUN_SPOT_CYCLE = { years: 11, referencePeak: 2001.0 };
/* ----------- NASA-derived ephemeris (Standish 1992) -----------
 * 6 mean orbital elements + linear secular rates per century.
 * Element order: [a (AU), e, I (deg), L (deg), w_bar (deg, longitude of perihelion), Omega (deg, longitude of ascending node)]
 * Rates per Julian century from J2000 (36525 days).
 * Valid 1800-2050 to ~0.1°, degrades slowly outside.
 * Source: Standish, "Keplerian Elements for Approximate Positions of the Major Planets"
 * https://ssd.jpl.nasa.gov/planets/approx_pos.html
 */
export const EPHEM = {
  Mercury: { el:[0.38709927, 0.20563593,  7.00497902,   252.25032350,  77.45779628,  48.33076593],
             dt:[0.00000037, 0.00001906, -0.00594749, 149472.67411175,   0.16047689,  -0.12534081] },
  Venus:   { el:[0.72333566, 0.00677672,  3.39467605,   181.97909950, 131.60246718,  76.67984255],
             dt:[0.00000390,-0.00004107, -0.00078890,  58517.81538729,   0.00268329,  -0.27769418] },
  Earth:   { el:[1.00000261, 0.01671123, -0.00001531,   100.46457166, 102.93768193,   0.0      ],
             dt:[0.00000562,-0.00004392, -0.01294668,  35999.37244981,   0.32327364,   0.0      ] },
  Mars:    { el:[1.52371034, 0.09339410,  1.84969142,    -4.55343205, -23.94362959,  49.55953891],
             dt:[0.00001847, 0.00007882, -0.00813131,  19140.30268499,   0.44441088,  -0.29257343] },
  Jupiter: { el:[5.20288700, 0.04838624,  1.30439695,    34.39644051,  14.72847983, 100.47390909],
             dt:[-0.00011607,-0.00013253,-0.00183714,   3034.74612775,   0.21252668,   0.20469106] },
  Saturn:  { el:[9.53667594, 0.05386179,  2.48599187,    49.95424423,  92.59887831, 113.66242448],
             dt:[-0.00125060,-0.00050991, 0.00193609,   1222.49362201,  -0.41897216,  -0.28867794] },
  Uranus:  { el:[19.18916464,0.04725744,  0.77263783,   313.23810451, 170.95427630,  74.01692503],
             dt:[-0.00196176,-0.00004397,-0.00242939,    428.48202785,   0.40805281,   0.04240589] },
  Neptune: { el:[30.06992276,0.00859048,  1.77004347,  -55.12002969,  44.96476227, 131.78422574],
             dt:[ 0.00026291, 0.00005105, 0.00035372,    218.45945325,  -0.32241464,  -0.00508664] }
};
