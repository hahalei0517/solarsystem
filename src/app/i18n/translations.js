export const TRANSLATIONS = {
  'zh-CN': {
    'top.speed': '速度',
    'top.scale': '尺度',
    'top.quality': '画质',
    'speed.hour': '时',
    'speed.day': '日',
    'speed.month': '月',
    'speed.year': '年',
    'scale.schematic': '示意',
    'scale.real': '真实',
    'scale.true': '真比例',
    'quality.quality': '高清',
    'quality.performance': '性能',
    'action.reset': '↺ 视角',
    'action.layers': '图层',
    'action.help': '?',
    'action.panorama': '全景',
    'action.exitSolo': '退出独显',
    'adaptive.demoted': '⚡ 已自动切换为性能模式',
    'mobile.speedLabel': '时间速率',
    'mobile.scaleLabel': '尺度',
    'mobile.qualityLabel': '画质',
    'lang.toggleLabel': '切换语言',
    'lang.button': '中/EN',

    'layer.title': '图层',
    'layer.closeTitle': '收起',
    'layer.closeAria': '收起图层菜单',
    'layer.orbits': '轨道',
    'layer.ecliptic': '黄道面',
    'layer.labels': '标签',
    'layer.trails': '轨迹',
    'layer.belts': '小行星',
    'layer.oort': '奥尔特云',
    'layer.comets': '彗星',
    'layer.dwarfs': '矮行星',
    'layer.spacecraft': '航天器',
    'layer.events': '天象事件',
    'layer.rotateCursor': '随光标旋转',
    'layer.axis': '地轴',
    'layer.bloom': '辉光',
    'layer.sound': '声音',
    'layer.audioTheme': '基底主题',
    'theme.space1': '太空音效1',
    'theme.deep': '深空',
    'theme.nebula': '星云',
    'theme.orbit': '轨道',
    'theme.solar': '太阳风',
    'theme.custom': '自定义文件…',

    'info.collapseTitle': '折叠/展开',
    'info.collapseAria': '折叠或展开',
    'info.closeTitle': '关闭信息卡',
    'info.exitEvent': '退出事件视图',
    'info.majorMoons': '主要卫星',

    'events.title': '重要天象',
    'events.collapseTitle': '折叠/展开',
    'events.closeTitle': '关闭',
    'events.summary': '已扫描 {{count}} 个天象事件（每种最多 2 个）。点击时间轴上的事件点可在右侧查看详情；时间轴上另有历史天象锚点可直接点击跳转。',

    'timeline.today': '今天',
    'timeline.speedLabel': '速度',
    'speedInfo.hour': '1 小时/秒',
    'speedInfo.day': '1 天/秒',
    'speedInfo.month': '30 天/秒 (≈月)',
    'speedInfo.year': '365 天/秒 (≈年)',

    'help.title': '操作帮助',
    'help.closeTitle': '关闭帮助',
    'help.noteTitle': '科学精度说明',
    'help.noteBody': '本项目用于教育可视化，不是精密天文软件。示意模式会夸张距离和大小；真实模式使用近似日心轨道元素，推荐在 1800–2050 年附近查看。卫星、彗星、小行星带和辉光均为视觉简化。真比例模式以 1 地球直径为单位，行星、太阳、卫星按真实尺寸、轨道按真实 AU 显示；由于尺度悬殊，外行星视野下行星几乎不可见，切换时镜头会自动拉远，用于直观感受太空之空旷。',

    'help.desktop.drag': '拖拽',
    'help.desktop.dragDesc': '旋转视角',
    'help.desktop.scroll': '滚轮',
    'help.desktop.scrollDesc': '缩放到光标',
    'help.desktop.clickPlanet': '点击行星',
    'help.desktop.clickPlanetDesc': '聚焦并独显',
    'help.desktop.keys1-8': '1-8',
    'help.desktop.keys1-8Desc': '快速聚焦八大行星',
    'help.desktop.space': 'Space',
    'help.desktop.spaceDesc': '播放 / 暂停',
    'help.desktop.esc': 'Esc / 0',
    'help.desktop.escDesc': '退出独显',
    'help.desktop.olbcet': 'O L B C E T',
    'help.desktop.olbcetDesc': '轨道 / 标签 / 小行星 / 彗星 / 黄道面 / 轨迹',
    'help.desktop.v': 'V',
    'help.desktop.vDesc': '随光标旋转（左键拖拽以所指天体为中心）',
    'help.desktop.clickBody': '点击天体',
    'help.desktop.clickBodyDesc': '行星独显 / 彗星·矮行星·太阳信息卡',
    'help.desktop.r': 'R',
    'help.desktop.rDesc': '重置视角',
    'help.desktop.sound': '图层▸声音',
    'help.desktop.soundDesc': '开启音效；可在「基底主题」切换深空 / 星云 / 轨道 / 太阳风，或加载自定义音频文件',

    'help.mobile.dragOne': '单指拖动',
    'help.mobile.dragOneDesc': '旋转视角',
    'help.mobile.pinch': '双指捏合',
    'help.mobile.pinchDesc': '缩放（缩放到捏合点）',
    'help.mobile.twoDrag': '双指拖动',
    'help.mobile.twoDragDesc': '平移视角',
    'help.mobile.tapPlanet': '点击行星',
    'help.mobile.tapPlanetDesc': '独显该行星；再次点击同一颗退出独显',
    'help.mobile.topDropdown': '顶栏下拉',
    'help.mobile.topDropdownDesc': '切换时间速率 / 尺度 / 画质',
    'help.mobile.pause': '暂停键',
    'help.mobile.pauseDesc': '播放 / 暂停',
    'help.mobile.layers': '图层按钮',
    'help.mobile.layersDesc': '打开图层菜单（左上 ◀ 收起）',
    'help.mobile.cardCollapse': '信息卡 ▾',
    'help.mobile.cardCollapseDesc': '展开 / 收起详情',
    'help.mobile.sound': '图层▸声音',
    'help.mobile.soundDesc': '开启音效；可切换基底主题或加载自定义音频',

    'label.currentDistance': '📡 当前距日',
    'label.longitude': '📡 黄经',
    'label.latitude': '📡 黄纬',
    'label.orbitProgress': '🛰️ 公转进度',
    'label.earthDistance': '🌍 与地球距离',
    'label.zodiac': '🔭 视方向星座',
    'label.season': '🍂 北半球季节',
    'label.nextPerihelion': '⏳ 距下次近日点',
    'label.showers': '☄️ 关联流星雨',
    'label.diameterCompare': '直径对比地球',
    'label.sunActivity': '☀️ 黑子活动',
    'label.simYear': '📅 模拟年份',
    'label.sunspotCycle': '📡 黑子周期',
    'label.type': '类型',
    'label.date': '日期',
    'label.bodies': '相关天体',
    'label.angle': '两星角距',
    'label.earthAngle': '地球视角角距',
    'label.effect': '展示效果',
    'label.factPrefix': '💡',
    'label.launchDate': '🚀 发射日期',
    'label.status': '📡 任务状态',
    'label.speed': '⚡ 速度',
    'label.classification': '🏷️ 分类',
    'label.gravity': '⚖️ 表面重力',
    'label.mass': '🪐 质量对比',
    'label.surfaceTemp': '🌡️ 表面温度',

    'class.terrestrial': '类地行星',
    'class.gasGiant': '气态巨行星',
    'class.iceGiant': '冰巨星',
    'class.dwarf': '矮行星',

    'compare.label': '直径对比地球',
    'compare.less': '< 0.1× 地球',
    'compare.unit': '× 地球',

    'unit.approx': '约',
    'unit.years': '年',

    'countdown.unknown': '未知',
    'countdown.days': '约 {{days}} 天',
    'countdown.years': '约 {{years}} 年 ({{days}} 天)',

    'sun.fact': '太阳每秒把约 400 万吨物质转化为能量，已持续约 46 亿年。',
    'sun.activity.peak': '极大期（黑子数峰值，日冕物质抛射频繁）',
    'sun.activity.declining': '下降期（黑子数减少）',
    'sun.activity.minimum': '极小期（黑子稀少，活动平静）',
    'sun.activity.rising': '上升期（黑子数增多，趋向极大）',

    'scale.millionKm': '{{n}} 百万 km',
    'scale.au': '{{n}} AU',

    'loader.init': '初始化 3D 引擎…',
    'loader.texture': '加载 NASA 贴图 {{loaded}}/{{total}} · {{pct}}%',
    'loader.error': '初始化失败',
    'loader.threeError': 'three.min.js 加载失败，检查文件是否与 index.html 同目录',
    'loader.orbitError': 'OrbitControls.js 加载失败',

    'planetList.title': '行星',
    'planetList.toggleTitle': '收起/展开',
    'planetList.dwarfs': '矮行星',

    'tooltip.sun': '太阳',

    'solo.sun': '独显：太阳',
    'solo.planet': '独显：{{name}}',
    'solo.comet': '独显：{{name}}',
    'solo.dwarf': '独显：{{name}}',
    'solo.spacecraft': '独显：{{name}}',

    'stats.类型': '类型',
    'stats.直径': '直径',
    'stats.表面温度': '表面温度',
    'stats.年龄': '年龄',
    'stats.公转周期': '公转周期',
    'stats.自转周期': '自转周期',
    'stats.距日': '距日',
    'stats.偏心率': '偏心率',
    'stats.轨道倾角': '轨道倾角',
    'stats.近日点': '近日点',
    'stats.远日点': '远日点',
    'stats.卫星数': '卫星数',
    'stats.距母星': '距母星',
    'stats.重力': '重力',
    'stats.上次近日点': '上次近日点',
    'stats.下次近日点': '下次近日点',

    'zodiac.aries': '白羊座', 'zodiac.taurus': '金牛座', 'zodiac.gemini': '双子座',
    'zodiac.cancer': '巨蟹座', 'zodiac.leo': '狮子座', 'zodiac.virgo': '处女座',
    'zodiac.libra': '天秤座', 'zodiac.scorpio': '天蝎座', 'zodiac.sagittarius': '射手座',
    'zodiac.capricorn': '摩羯座', 'zodiac.aquarius': '水瓶座', 'zodiac.pisces': '双鱼座',

    'season.winter': '冬季', 'season.spring': '春季', 'season.summer': '夏季', 'season.autumn': '秋季',

    'event.type.transit': '凌日',
    'event.type.conjunction.inferior': '下合日',
    'event.type.conjunction.superior': '上合日',
    'event.type.opposition': '冲日',
    'event.type.elongation.east': '东大距',
    'event.type.elongation.west': '西大距',
    'event.type.quadrature.east': '东方照',
    'event.type.quadrature.west': '西方照',
    'event.type.planetConjunction': '合行星',

    'event.label.transit': '{{name}}凌日',
    'event.label.conjunction.inferior': '{{name}}下合日',
    'event.label.conjunction.superior': '{{name}}上合日',
    'event.label.opposition': '{{name}}冲日',
    'event.label.elongation.east': '{{name}}东大距',
    'event.label.elongation.west': '{{name}}西大距',
    'event.label.quadrature.east': '{{name}}东方照',
    'event.label.quadrature.west': '{{name}}西方照',
    'event.label.planetConjunction': '{{a}}合{{b}}',

    'event.effect.transit': '水星/金星位于日地之间，标出日-地-行星连线',
    'event.effect.conjunction.inferior': '行星位于地球与太阳之间（下合日）',
    'event.effect.conjunction.superior': '行星位于太阳远侧（上合日）',
    'event.effect.opposition': '行星与太阳相对，整夜可见',
    'event.effect.elongation.east': '内行星昏星，日落后西天',
    'event.effect.elongation.west': '内行星晨星，日出前东天',
    'event.effect.quadrature.east': '行星与太阳成 90° 角，日落后位于南方高位',
    'event.effect.quadrature.west': '行星与太阳成 90° 角，日出前位于南方高位',
    'event.effect.planetConjunction': '两颗行星在视线方向上相合',

    'event.desc.transit': '地球视角下，{{name}}位于地球与太阳之间附近，几乎从太阳盘面前方经过，角距约 {{angle}}°。本模型用近似星历和放大的可视标记提示几何关系，真实凌日还取决于太阳视直径、轨道倾角和观测条件。',
    'event.desc.conjunction.inferior': '{{name}}位于地球与太阳之间（下合日），角距约 {{angle}}°，此时通常淹没在太阳眩光中，不适合观测；本模型只标出地球视角的近似同向关系。',
    'event.desc.conjunction.superior': '{{name}}位于太阳远侧（上合日），角距约 {{angle}}°，此时通常淹没在太阳眩光中，不适合观测；本模型只标出地球视角的近似同向关系。',
    'event.desc.opposition': '{{name}}与太阳在天空中接近相对，角距约 {{angle}}°。外行星冲日前后通常日落时升起、接近整夜可见，也往往更接近地球；实际亮度和可见性仍受距离、地平高度和天气影响。',
    'event.desc.elongation.east': '{{name}}到达东大距，与太阳角距约 {{angle}}°，是内行星离太阳视距最大的时刻，此时日落后西边天空（昏星）观测条件较佳。',
    'event.desc.elongation.west': '{{name}}到达西大距，与太阳角距约 {{angle}}°，是内行星离太阳视距最大的时刻，此时日出前东边天空（晨星）观测条件较佳。',
    'event.desc.quadrature.east': '{{name}}与太阳角距约 90°（东方照），此时它相对太阳成直角，是观察外行星相位与阴影的好时机，日落后位于南方高位。',
    'event.desc.quadrature.west': '{{name}}与太阳角距约 90°（西方照），此时它相对太阳成直角，是观察外行星相位与阴影的好时机，日出前位于南方高位。',
    'event.desc.planetConjunction': '{{a}}与{{b}}在天空中非常接近，角距约 {{angle}}°。行星相合是较罕见的天象，两颗行星在视线方向上靠近，但实际空间距离仍可能很远。',

    'brightStars.sirius': '天狼星 Sirius',
    'brightStars.vega': '织女星 Vega',
    'brightStars.polaris': '北极星 Polaris',
    'brightStars.betelgeuse': '参宿四 Betelgeuse',
    'brightStars.rigel': '参宿七 Rigel',
    'brightStars.arcturus': '大角星 Arcturus',
    'brightStars.altair': '牛郎星 Altair',
    'brightStars.deneb': '天津四 Deneb',

    'historic.type.anchor': '历史天象锚点',
    'historic.halley.name': '哈雷彗星近日点',
    'historic.halley.desc': '哈雷彗星回归至近日点（距日约 0.59 AU），是 20 世纪最著名的彗星观测事件之一。',
    'historic.greatConjunction.name': '木星-土星大合',
    'historic.greatConjunction.desc': '木星与土星角距仅约 0.1°，为 1623 年以来最近的一次“大合”，两星几乎并排可见。',
  },
  'en': {
    'top.speed': 'Speed',
    'top.scale': 'Scale',
    'top.quality': 'Quality',
    'speed.hour': 'Hr',
    'speed.day': 'Day',
    'speed.month': 'Mo',
    'speed.year': 'Yr',
    'scale.schematic': 'Schematic',
    'scale.real': 'Real',
    'scale.true': 'True',
    'quality.quality': 'Quality',
    'quality.performance': 'Performance',
    'action.reset': '↺ View',
    'action.layers': 'Layers',
    'action.help': '?',
    'action.panorama': 'Panorama',
    'action.exitSolo': 'Exit Solo',
    'adaptive.demoted': '⚡ Auto-switched to performance mode',
    'mobile.speedLabel': 'Time Rate',
    'mobile.scaleLabel': 'Scale',
    'mobile.qualityLabel': 'Quality',
    'lang.toggleLabel': 'Switch Language',
    'lang.button': '中/EN',

    'layer.title': 'Layers',
    'layer.closeTitle': 'Collapse',
    'layer.closeAria': 'Collapse layers menu',
    'layer.orbits': 'Orbits',
    'layer.ecliptic': 'Ecliptic',
    'layer.labels': 'Labels',
    'layer.trails': 'Trails',
    'layer.belts': 'Asteroids',
    'layer.oort': 'Oort Cloud',
    'layer.comets': 'Comets',
    'layer.dwarfs': 'Dwarf Planets',
    'layer.spacecraft': 'Spacecraft',
    'layer.events': 'Sky Events',
    'layer.rotateCursor': 'Rotate around cursor',
    'layer.axis': 'Spin axis',
    'layer.bloom': 'Bloom',
    'layer.sound': 'Sound',
    'layer.audioTheme': 'Ambient Theme',
    'theme.space1': 'Space Sound 1',
    'theme.deep': 'Deep Void',
    'theme.nebula': 'Nebula',
    'theme.orbit': 'Orbit',
    'theme.solar': 'Solar Wind',
    'theme.custom': 'Custom File…',

    'info.collapseTitle': 'Collapse/Expand',
    'info.collapseAria': 'Collapse or expand',
    'info.closeTitle': 'Close info card',
    'info.exitEvent': 'Exit Event View',
    'info.majorMoons': 'Major Moons',

    'events.title': 'Notable Sky Events',
    'events.collapseTitle': 'Collapse/Expand',
    'events.closeTitle': 'Close',
    'events.summary': '{{count}} sky events scanned (up to 2 of each type). Click an event dot on the timeline for details; historical anchors on the timeline are also clickable.',

    'timeline.today': 'Today',
    'timeline.speedLabel': 'Speed',
    'speedInfo.hour': '1 hour/sec',
    'speedInfo.day': '1 day/sec',
    'speedInfo.month': '30 days/sec (≈month)',
    'speedInfo.year': '365 days/sec (≈year)',

    'help.title': 'Help',
    'help.closeTitle': 'Close help',
    'help.noteTitle': 'Scientific Accuracy Note',
    'help.noteBody': 'This project is for educational visualization, not precision astronomy software. Schematic mode exaggerates distances and sizes; real mode uses approximate heliocentric orbital elements and is best viewed near 1800–2050. Moons, comets, the asteroid belt, and bloom are all visual simplifications. True-scale mode uses one Earth diameter as the unit, showing planets, the Sun, and moons at real sizes and orbits at real AU; because the scale differences are enormous, outer planets are almost invisible in this view, and the camera automatically pulls back to convey the vast emptiness of space.',

    'help.desktop.drag': 'Drag',
    'help.desktop.dragDesc': 'Rotate view',
    'help.desktop.scroll': 'Scroll',
    'help.desktop.scrollDesc': 'Zoom to cursor',
    'help.desktop.clickPlanet': 'Click planet',
    'help.desktop.clickPlanetDesc': 'Focus and solo',
    'help.desktop.keys1-8': '1-8',
    'help.desktop.keys1-8Desc': 'Quick-focus the eight planets',
    'help.desktop.space': 'Space',
    'help.desktop.spaceDesc': 'Play / Pause',
    'help.desktop.esc': 'Esc / 0',
    'help.desktop.escDesc': 'Exit solo',
    'help.desktop.olbcet': 'O L B C E T',
    'help.desktop.olbcetDesc': 'Orbits / Labels / Asteroids / Comets / Ecliptic / Trails',
    'help.desktop.v': 'V',
    'help.desktop.vDesc': 'Rotate around cursor (left-drag orbits the body under the cursor)',
    'help.desktop.clickBody': 'Click body',
    'help.desktop.clickBodyDesc': 'Planet solo / info cards for comets, dwarfs and the Sun',
    'help.desktop.r': 'R',
    'help.desktop.rDesc': 'Reset view',
    'help.desktop.sound': 'Layers▸Sound',
    'help.desktop.soundDesc': 'Enable sound; switch between Deep Void / Nebula / Orbit / Solar Wind, or load a custom audio file',

    'help.mobile.dragOne': 'One-finger drag',
    'help.mobile.dragOneDesc': 'Rotate view',
    'help.mobile.pinch': 'Two-finger pinch',
    'help.mobile.pinchDesc': 'Zoom (to the pinch point)',
    'help.mobile.twoDrag': 'Two-finger drag',
    'help.mobile.twoDragDesc': 'Pan view',
    'help.mobile.tapPlanet': 'Tap planet',
    'help.mobile.tapPlanetDesc': 'Solo that planet; tap again to exit solo',
    'help.mobile.topDropdown': 'Top-bar dropdown',
    'help.mobile.topDropdownDesc': 'Switch time rate / scale / quality',
    'help.mobile.pause': 'Pause button',
    'help.mobile.pauseDesc': 'Play / Pause',
    'help.mobile.layers': 'Layers button',
    'help.mobile.layersDesc': 'Open layers menu (◀ to collapse)',
    'help.mobile.cardCollapse': 'Info card ▾',
    'help.mobile.cardCollapseDesc': 'Expand / collapse details',
    'help.mobile.sound': 'Layers▸Sound',
    'help.mobile.soundDesc': 'Enable sound; switch theme or load custom audio',

    'label.currentDistance': '📡 Distance from Sun',
    'label.longitude': '📡 Ecliptic Longitude',
    'label.latitude': '📡 Ecliptic Latitude',
    'label.orbitProgress': '🛰️ Orbit Progress',
    'label.earthDistance': '🌍 Distance from Earth',
    'label.zodiac': '🔭 Constellation',
    'label.season': '🍂 Northern Season',
    'label.nextPerihelion': '⏳ Next Perihelion',
    'label.showers': '☄️ Associated Showers',
    'label.diameterCompare': 'Diameter vs Earth',
    'label.sunActivity': '☀️ Sunspot Activity',
    'label.simYear': '📅 Simulated Year',
    'label.sunspotCycle': '📡 Sunspot Cycle',
    'label.type': 'Type',
    'label.date': 'Date',
    'label.bodies': 'Bodies',
    'label.angle': 'Angular Separation',
    'label.earthAngle': 'Apparent Angle from Earth',
    'label.effect': 'Effect',
    'label.factPrefix': '💡',
    'label.launchDate': '🚀 Launch Date',
    'label.status': '📡 Mission Status',
    'label.speed': '⚡ Speed',
    'label.classification': '🏷️ Class',
    'label.gravity': '⚖️ Surface Gravity',
    'label.mass': '🪐 Mass vs Earth',
    'label.surfaceTemp': '🌡️ Surface Temperature',

    'class.terrestrial': 'Terrestrial planet',
    'class.gasGiant': 'Gas giant',
    'class.iceGiant': 'Ice giant',
    'class.dwarf': 'Dwarf planet',

    'compare.label': 'Diameter vs Earth',
    'compare.less': '< 0.1× Earth',
    'compare.unit': '× Earth',

    'unit.approx': '≈',
    'unit.years': 'years',

    'countdown.unknown': 'Unknown',
    'countdown.days': '≈ {{days}} days',
    'countdown.years': '≈ {{years}} years ({{days}} days)',

    'sun.fact': "Every second the Sun converts about 4 million tonnes of matter into energy, and has been doing so for about 4.6 billion years.",
    'sun.activity.peak': 'Maximum (peak sunspot count, frequent coronal mass ejections)',
    'sun.activity.declining': 'Declining (sunspot count decreasing)',
    'sun.activity.minimum': 'Minimum (few sunspots, quiet activity)',
    'sun.activity.rising': 'Rising (sunspot count increasing toward maximum)',

    'scale.millionKm': '{{n}} million km',
    'scale.au': '{{n}} AU',

    'loader.init': 'Initializing 3D engine…',
    'loader.texture': 'Loading NASA textures {{loaded}}/{{total}} · {{pct}}%',
    'loader.error': 'Initialization failed',
    'loader.threeError': 'three.min.js failed to load; check that the file is in the same directory as index.html',
    'loader.orbitError': 'OrbitControls.js failed to load',

    'planetList.title': 'Planets',
    'planetList.toggleTitle': 'Collapse/Expand',
    'planetList.dwarfs': 'Dwarf Planets',

    'tooltip.sun': 'Sun',

    'solo.sun': 'Solo: Sun',
    'solo.planet': 'Solo: {{name}}',
    'solo.comet': 'Solo: {{name}}',
    'solo.dwarf': 'Solo: {{name}}',
    'solo.spacecraft': 'Solo: {{name}}',

    'stats.类型': 'Type',
    'stats.直径': 'Diameter',
    'stats.表面温度': 'Surface Temperature',
    'stats.年龄': 'Age',
    'stats.公转周期': 'Orbital Period',
    'stats.自转周期': 'Rotation Period',
    'stats.距日': 'Distance from Sun',
    'stats.偏心率': 'Eccentricity',
    'stats.轨道倾角': 'Orbital Inclination',
    'stats.近日点': 'Perihelion',
    'stats.远日点': 'Aphelion',
    'stats.卫星数': 'Moons',
    'stats.距母星': 'Distance from Parent',
    'stats.重力': 'Gravity',
    'stats.上次近日点': 'Last Perihelion',
    'stats.下次近日点': 'Next Perihelion',

    'zodiac.aries': 'Aries', 'zodiac.taurus': 'Taurus', 'zodiac.gemini': 'Gemini',
    'zodiac.cancer': 'Cancer', 'zodiac.leo': 'Leo', 'zodiac.virgo': 'Virgo',
    'zodiac.libra': 'Libra', 'zodiac.scorpio': 'Scorpio', 'zodiac.sagittarius': 'Sagittarius',
    'zodiac.capricorn': 'Capricorn', 'zodiac.aquarius': 'Aquarius', 'zodiac.pisces': 'Pisces',

    'season.winter': 'Winter', 'season.spring': 'Spring', 'season.summer': 'Summer', 'season.autumn': 'Autumn',

    'event.type.transit': 'Transit',
    'event.type.conjunction.inferior': 'Inferior Conjunction',
    'event.type.conjunction.superior': 'Superior Conjunction',
    'event.type.opposition': 'Opposition',
    'event.type.elongation.east': 'Eastern Elongation',
    'event.type.elongation.west': 'Western Elongation',
    'event.type.quadrature.east': 'Eastern Quadrature',
    'event.type.quadrature.west': 'Western Quadrature',
    'event.type.planetConjunction': 'Planetary Conjunction',

    'event.label.transit': '{{name}} transit',
    'event.label.conjunction.inferior': '{{name}} inferior conjunction',
    'event.label.conjunction.superior': '{{name}} superior conjunction',
    'event.label.opposition': '{{name}} opposition',
    'event.label.elongation.east': '{{name}} eastern elongation',
    'event.label.elongation.west': '{{name}} western elongation',
    'event.label.quadrature.east': '{{name}} eastern quadrature',
    'event.label.quadrature.west': '{{name}} western quadrature',
    'event.label.planetConjunction': '{{a}}–{{b}} conjunction',

    'event.effect.transit': 'Mercury/Venus passes between Earth and the Sun; the Sun-Earth-planet line is highlighted.',
    'event.effect.conjunction.inferior': 'The planet lies between Earth and the Sun (inferior conjunction).',
    'event.effect.conjunction.superior': 'The planet lies on the far side of the Sun (superior conjunction).',
    'event.effect.opposition': 'The planet is opposite the Sun in the sky and visible most of the night.',
    'event.effect.elongation.east': 'Inner planet as evening star, visible in the western sky after sunset.',
    'event.effect.elongation.west': 'Inner planet as morning star, visible in the eastern sky before sunrise.',
    'event.effect.quadrature.east': 'The planet forms a 90° angle with the Sun, high in the south after sunset.',
    'event.effect.quadrature.west': 'The planet forms a 90° angle with the Sun, high in the south before sunrise.',
    'event.effect.planetConjunction': 'Two planets appear very close together along the same line of sight.',

    'event.desc.transit': 'From Earth\'s perspective, {{name}} is near the line between Earth and the Sun, almost crossing the solar disk at an angular separation of about {{angle}}°. This model uses approximate ephemerides and enlarged visual markers to illustrate the geometry; a true transit also depends on solar apparent diameter, orbital inclination, and viewing conditions.',
    'event.desc.conjunction.inferior': '{{name}} lies between Earth and the Sun (inferior conjunction), with an angular separation of about {{angle}}°. It is usually lost in solar glare and not suitable for observation; this model only marks the approximate alignment as seen from Earth.',
    'event.desc.conjunction.superior': '{{name}} is on the far side of the Sun (superior conjunction), with an angular separation of about {{angle}}°. It is usually lost in solar glare and not suitable for observation; this model only marks the approximate alignment as seen from Earth.',
    'event.desc.opposition': '{{name}} is nearly opposite the Sun in the sky, with an angular separation of about {{angle}}°. Outer planets near opposition typically rise at sunset and remain visible through much of the night; actual brightness and visibility still depend on distance, altitude, and weather.',
    'event.desc.elongation.east': '{{name}} reaches eastern greatest elongation, about {{angle}}° from the Sun — the maximum apparent separation for an inner planet. It then appears as the evening star in the western sky after sunset, offering good observing conditions.',
    'event.desc.elongation.west': '{{name}} reaches western greatest elongation, about {{angle}}° from the Sun — the maximum apparent separation for an inner planet. It then appears as the morning star in the eastern sky before sunrise, offering good observing conditions.',
    'event.desc.quadrature.east': '{{name}} forms about a 90° angle with the Sun (eastern quadrature). This is a good time to observe the planet\'s phase and shadow; it stands high in the south after sunset.',
    'event.desc.quadrature.west': '{{name}} forms about a 90° angle with the Sun (western quadrature). This is a good time to observe the planet\'s phase and shadow; it stands high in the south before sunrise.',
    'event.desc.planetConjunction': '{{a}} and {{b}} are very close in the sky, separated by about {{angle}}°. Planetary conjunctions are relatively rare events when two planets appear near each other along the line of sight, though their actual distance in space may still be large.',

    'brightStars.sirius': 'Sirius',
    'brightStars.vega': 'Vega',
    'brightStars.polaris': 'Polaris',
    'brightStars.betelgeuse': 'Betelgeuse',
    'brightStars.rigel': 'Rigel',
    'brightStars.arcturus': 'Arcturus',
    'brightStars.altair': 'Altair',
    'brightStars.deneb': 'Deneb',

    'historic.type.anchor': 'Historical anchor',
    'historic.halley.name': "Halley\'s Comet Perihelion",
    'historic.halley.desc': 'Halley\'s Comet reached perihelion (about 0.59 AU from the Sun), one of the most famous comet observations of the 20th century.',
    'historic.greatConjunction.name': 'Great Conjunction of Jupiter & Saturn',
    'historic.greatConjunction.desc': 'Jupiter and Saturn appeared only about 0.1° apart — the closest "great conjunction" since 1623, with the two planets almost side by side.',
  }
};

export const BODY_TRANSLATIONS = {
  Sun: {
    name: 'Sun',
    desc: 'The star at the center of the solar system, accounting for about 99.86% of the system\'s total mass.',
    fact: 'Every second the Sun converts about 4 million tonnes of matter into energy, and has been doing so for about 4.6 billion years.',
    stats: { '类型': 'G2V main-sequence star', '直径': '1,392,700 km', '表面温度': '≈ 5,500 °C', '年龄': '≈ 4.6 billion years' }
  },
  Mercury: {
    name: 'Mercury',
    desc: 'The closest planet to the Sun, with extreme day-night temperature swings and almost no atmosphere.',
    fact: 'Mercury\'s Caloris Basin, about 1,550 km across, is one of the largest impact craters in the solar system.',
    stats: { '公转周期': '88 days', '自转周期': '59 days', '直径': '4,879 km', '距日': '0.39 AU', '偏心率': '0.206', '轨道倾角': '7.00°' }
  },
  Venus: {
    name: 'Venus',
    desc: 'The hottest planet, with a thick carbon-dioxide atmosphere that creates a strong greenhouse effect.',
    fact: 'Venus rotates in the opposite direction to most planets; from its surface the Sun rises in the west and sets in the east.',
    stats: { '公转周期': '225 days', '自转周期': '243 days (retrograde)', '直径': '12,104 km', '距日': '0.72 AU', '偏心率': '0.007', '轨道倾角': '3.39°' }
  },
  Earth: {
    name: 'Earth',
    desc: 'The only known planet to harbor life, with about 71% of its surface covered by liquid water.',
    fact: 'Earth\'s atmosphere is about 78% nitrogen and 21% oxygen; the remaining gases make up less than 1%.',
    stats: { '公转周期': '365.25 days', '自转周期': '23.93 hours', '直径': '12,742 km', '距日': '1.00 AU', '偏心率': '0.017', '轨道倾角': '0° (reference plane)' }
  },
  Mars: {
    name: 'Mars',
    desc: 'The Red Planet, home to the tallest Olympus Mons and evidence of ancient flowing water.',
    fact: 'Olympus Mons rises about 22 km, nearly 2.5 times the height of Earth\'s Everest — the tallest mountain in the solar system.',
    stats: { '公转周期': '687 days', '自转周期': '24.6 hours', '直径': '6,779 km', '距日': '1.52 AU', '偏心率': '0.094', '轨道倾角': '1.85°' }
  },
  Jupiter: {
    name: 'Jupiter',
    desc: 'The largest planet in the solar system, a gas giant whose Great Red Spot has raged for centuries.',
    fact: 'The Great Red Spot is an anticyclonic storm that has lasted at least 350 years and was once large enough to swallow three Earths.',
    stats: { '公转周期': '11.86 years', '自转周期': '9.93 hours', '直径': '139,820 km', '距日': '5.20 AU', '偏心率': '0.049', '轨道倾角': '1.30°' }
  },
  Saturn: {
    name: 'Saturn',
    desc: 'Famous for its spectacular ring system, composed mostly of ice and rock particles.',
    fact: 'Saturn\'s average density is only 0.69 g/cm³ — less than water — so it would theoretically float in a large enough ocean.',
    stats: { '公转周期': '29.46 years', '自转周期': '10.7 hours', '直径': '116,460 km', '距日': '9.54 AU', '偏心率': '0.057', '轨道倾角': '2.49°' }
  },
  Uranus: {
    name: 'Uranus',
    desc: 'An ice giant that lies on its side; methane in its atmosphere gives it a cyan-blue color.',
    fact: 'Uranus\'s rotation axis is tilted nearly 98°, so it essentially rolls around the Sun, giving each pole 42 years of continuous daylight or darkness.',
    stats: { '公转周期': '84 years', '自转周期': '17.2 hours (tilted 97°)', '直径': '50,724 km', '距日': '19.2 AU', '偏心率': '0.046', '轨道倾角': '0.77°' }
  },
  Neptune: {
    name: 'Neptune',
    desc: 'The most distant planet, with winds reaching 2,100 km/h — the most violent storms in the solar system.',
    fact: 'Neptune was discovered by mathematics: astronomers first predicted its position from anomalies in Uranus\'s orbit, then confirmed it by telescope.',
    stats: { '公转周期': '165 years', '自转周期': '16.1 hours', '直径': '49,244 km', '距日': '30.1 AU', '偏心率': '0.011', '轨道倾角': '1.77°' }
  },
  moons: {
    Moon: {
      name: 'Moon',
      desc: 'Earth\'s only natural satellite and the fifth largest moon in the solar system. Thought to have formed from a giant impact about 4.5 billion years ago, it is tidally locked so we always see the same face.',
      stats: { '直径': '3,474 km', '公转周期': '27.3 days', '距母星': '384,400 km', '重力': '1.62 m/s²' }
    },
    Phobos: {
      name: 'Phobos',
      desc: 'Mars\'s larger moon, irregularly shaped and spiraling toward Mars at about 2 cm per year. It is expected to break up within about 50 million years to form a ring.',
      stats: { '直径': '22.4 km', '公转周期': '7.7 hours', '距母星': '9,376 km' }
    },
    Deimos: {
      name: 'Deimos',
      desc: 'Mars\'s smaller moon, with a smoother surface than Phobos. Like Phobos, it may be a captured asteroid.',
      stats: { '直径': '12.4 km', '公转周期': '30.3 hours', '距母星': '23,463 km' }
    },
    Io: {
      name: 'Io',
      desc: 'The most volcanically active body in the solar system, with more than 400 active volcanoes. Tidal heating from Jupiter gives its surface a yellow-orange color.',
      stats: { '直径': '3,643 km', '公转周期': '1.77 days', '距母星': '421,800 km' }
    },
    Europa: {
      name: 'Europa',
      desc: 'Beneath its icy shell lies an ocean containing more liquid water than Earth. It is considered one of the most likely places to find extraterrestrial life.',
      stats: { '直径': '3,122 km', '公转周期': '3.55 days', '距母星': '671,000 km' }
    },
    Ganymede: {
      name: 'Ganymede',
      desc: 'The largest moon in the solar system, bigger than Mercury and the only moon known to have its own magnetic field.',
      stats: { '直径': '5,268 km', '公转周期': '7.15 days', '距母星': '1,070,000 km' }
    },
    Callisto: {
      name: 'Callisto',
      desc: 'One of the most heavily cratered bodies in the solar system, its surface has remained almost unchanged for 4 billion years. It receives the least radiation from Jupiter and is a candidate for future crewed exploration.',
      stats: { '直径': '4,821 km', '公转周期': '16.7 days', '距母星': '1,883,000 km' }
    },
    Titan: {
      name: 'Titan',
      desc: 'The only moon in the solar system with a dense atmosphere, featuring lakes of liquid methane on its surface. Larger than Mercury, it is a key target in the search for life.',
      stats: { '直径': '5,150 km', '公转周期': '15.95 days', '距母星': '1,221,870 km' }
    },
    Rhea: {
      name: 'Rhea',
      desc: 'Saturn\'s second-largest moon, made of ice and rock and covered with ancient impact craters. It may have a very thin oxygen-carbon-dioxide atmosphere.',
      stats: { '直径': '1,527 km', '公转周期': '4.52 days', '距母星': '527,108 km' }
    },
    Enceladus: {
      name: 'Enceladus',
      desc: 'Its south pole jets salty water ice into space, and a global ocean lies beneath its icy crust — another major candidate for life. Its ejecta forms Saturn\'s E ring.',
      stats: { '直径': '504 km', '公转周期': '1.37 days', '距母星': '237,948 km' }
    },
    Tethys: {
      name: 'Tethys',
      desc: 'Mainly composed of water ice, its surface features a huge global canyon, Ithaca Chasma, and a giant impact crater, Odysseus, about 400 km across.',
      stats: { '直径': '1,062 km', '公转周期': '1.89 days', '距母星': '294,619 km' }
    },
    Dione: {
      name: 'Dione',
      desc: 'A moon with a strongly contrasting surface: one side is bright with icy cliffs (signs of past cryovolcanism), the other darker. It is in a 2:1 orbital resonance with Enceladus.',
      stats: { '直径': '1,123 km', '公转周期': '2.74 days', '距母星': '377,400 km' }
    },
    Iapetus: {
      name: 'Iapetus',
      desc: 'Saturn\'s outermost large moon, with extreme two-tone coloring: one side bright as snow, the other dark as tar. It also has a strange equatorial ridge.',
      stats: { '直径': '1,469 km', '公转周期': '79.3 days', '距母星': '3,560,820 km' }
    },
    Ariel: {
      name: 'Ariel',
      desc: 'Uranus\'s brightest moon, with a relatively young, smooth surface crossed by canyons and faults that indicate past cryovolcanic activity.',
      stats: { '直径': '1,158 km', '公转周期': '2.52 days', '距母星': '191,020 km' }
    },
    Miranda: {
      name: 'Miranda',
      desc: 'One of the most geologically bizarre moons, with 20 km high cliffs — the tallest in the solar system — and a surface that looks as if it was shattered and reassembled.',
      stats: { '直径': '472 km', '公转周期': '1.41 days', '距母星': '129,390 km' }
    },
    Umbriel: {
      name: 'Umbriel',
      desc: 'Uranus\'s darkest large moon, covered with ancient impact craters and a low reflectivity thought to come from dark organic material.',
      stats: { '直径': '1,169 km', '公转周期': '4.14 days', '距母星': '266,000 km' }
    },
    Titania: {
      name: 'Titania',
      desc: 'The largest moon of Uranus, with huge canyons and faults that hint at past geological activity.',
      stats: { '直径': '1,578 km', '公转周期': '8.71 days', '距母星': '435,910 km' }
    },
    Oberon: {
      name: 'Oberon',
      desc: 'The second-largest moon of Uranus, its surface is dotted with impact craters and dark material that may be organic compounds.',
      stats: { '直径': '1,523 km', '公转周期': '13.46 days', '距母星': '583,520 km' }
    },
    Triton: {
      name: 'Triton',
      desc: 'Neptune\'s largest moon, the only large moon with a retrograde orbit (opposite to Neptune\'s rotation), probably a captured Kuiper Belt object. Nitrogen ice volcanoes erupt near its south pole.',
      stats: { '直径': '2,707 km', '公转周期': '5.88 days (retrograde)', '距母星': '354,759 km' }
    },
    Nereid: {
      name: 'Nereid',
      desc: 'Neptune\'s most eccentric moon, with a distance from Neptune that varies greatly (periapsis about 1.3 million km, apoapsis about 9.7 million km), probably also a captured body.',
      stats: { '直径': '≈ 340 km', '公转周期': '≈ 360 days', '距母星': '≈ 5,513,400 km (mean)' }
    }
  },
  comets: {
    Halley: {
      name: "Halley\'s Comet",
      desc: 'The first comet recognized as periodic, returning about every 76 years. Its last perihelion was in 1986 and the next is expected in 2061. Halley\'s aphelion lies inside the Kuiper Belt (about 35 AU); when near the Sun its ices and dust sublimate to form a coma and tail.',
      stats: { '类型': 'Short-period comet', '周期': '≈ 76 years', '近日点': '0.586 AU', '远日点': '≈ 35 AU', '轨道倾角': '162.3° (retrograde)', '上次近日点': '1986-02-09', '下次近日点': '≈ 2061' },
      showers: [{ name: 'Orionids', month: 'Oct' }, { name: 'Eta Aquariids', month: 'May' }]
    },
    Encke: {
      name: "Encke\'s Comet",
      desc: 'The comet with the shortest known period, returning about every 3.3 years and the parent body of the Taurid meteor shower. It is losing material and spinning faster, and may eventually break apart within tens of thousands of years.',
      stats: { '类型': 'Short-period comet', '周期': '≈ 3.3 years', '近日点': '0.336 AU', '远日点': '≈ 4.1 AU', '轨道倾角': '11.78°', '上次近日点': '2023-10-05', '下次近日点': '≈ 2026' },
      showers: [{ name: 'Taurids', month: 'Nov' }]
    },
    'Tempel-Tuttle': {
      name: 'Tempel–Tuttle',
      desc: 'The parent comet of the Leonid meteor shower, returning about every 33 years. Its retrograde orbit crosses Earth\'s path, and each return leaves dense dust streams that can produce spectacular meteor storms.',
      stats: { '类型': 'Short-period comet', '周期': '≈ 33.3 years', '近日点': '0.976 AU', '远日点': '≈ 19 AU', '轨道倾角': '162.49° (retrograde)', '上次近日点': '1998-02-28', '下次近日点': '≈ 2031' },
      showers: [{ name: 'Leonids', month: 'Nov' }]
    },
    'Swift-Tuttle': {
      name: 'Swift–Tuttle',
      desc: 'The parent comet of the Perseid meteor shower, returning about every 133 years and one of the largest known periodic comets. Its orbit crosses Earth\'s path and it is listed as a potential near-Earth hazard.',
      stats: { '类型': 'Short-period comet', '周期': '≈ 133 years', '近日点': '0.960 AU', '远日点': '≈ 51 AU', '轨道倾角': '113.45° (retrograde)', '上次近日点': '1992-12-11', '下次近日点': '≈ 2126' },
      showers: [{ name: 'Perseids', month: 'Aug' }]
    },
    Holmes: {
      name: 'Holmes',
      desc: 'Normally faint, Holmes underwent a massive outburst in October 2007, brightening from magnitude 17 to 2.5 in two days and becoming visible to the naked eye. Its coma briefly became the largest object in the solar system. The outburst mechanism is still not fully understood.',
      stats: { '类型': 'Short-period comet', '周期': '≈ 6.9 years', '近日点': '2.053 AU', '远日点': '≈ 5.2 AU', '轨道倾角': '19.19°', '上次近日点': '2007-05-04', '下次近日点': '≈ 2014' }
    },
    'Churyumov-Gerasimenko': {
      name: 'Churyumov–Gerasimenko',
      desc: 'The target of ESA\'s Rosetta mission, the first spacecraft to orbit and land on a comet. Its shape resembles a rubber duck, formed by the low-speed collision and merger of two irregular bodies.',
      stats: { '类型': 'Jupiter-family comet', '周期': '≈ 6.45 years', '近日点': '1.238 AU', '远日点': '≈ 5.7 AU', '轨道倾角': '7.04°', '上次近日点': '2021-11-02', '下次近日点': '≈ 2028' }
    }
  },
  dwarfs: {
    Pluto: {
      name: 'Pluto',
      desc: 'Once the ninth planet, Pluto was reclassified as a dwarf planet in 2006. It lies in the Kuiper Belt, with an axial tilt of about 120°, a thin atmosphere, and five moons. Its largest moon, Charon, is so similar in size that the two are mutually tidally locked.',
      fact: 'Pluto\'s surface contains a heart-shaped ice plain, Tombaugh Regio, made of frozen nitrogen, methane and carbon monoxide.',
      stats: { '类型': 'Dwarf planet', '直径': '2,376 km', '公转周期': '≈ 248 years', '近日点': '29.66 AU', '远日点': '≈ 49.3 AU', '轨道倾角': '17.16°', '卫星数': '5' }
    },
    Ceres: {
      name: 'Ceres',
      desc: 'The largest object in the asteroid belt and the only dwarf planet there. Discovered in 1801, it was initially considered a planet. Its surface has ice volcanoes and mysterious bright spots (salt deposits in Occator Crater), and a salty ocean may lie beneath its icy crust.',
      fact: 'Ceres makes up about one-third of the total mass of the asteroid belt.',
      stats: { '类型': 'Dwarf planet', '直径': '≈ 940 km', '公转周期': '≈ 4.6 years', '近日点': '≈ 2.56 AU', '远日点': '≈ 2.98 AU', '轨道倾角': '10.59°' }
    },
    Eris: {
      name: 'Eris',
      desc: 'Eris\'s discovery directly led to Pluto being reclassified as a dwarf planet — it is about 27% more massive than Pluto. It lies in the scattered disc with a highly inclined, eccentric orbit and has one moon, Dysnomia.',
      fact: 'Eris is more massive than Pluto, but like Pluto it is classified as a dwarf planet because it has not cleared its orbital neighborhood.',
      stats: { '类型': 'Dwarf planet', '直径': '≈ 2,326 km', '公转周期': '≈ 558 years', '近日点': '38.3 AU', '远日点': '≈ 97.6 AU', '轨道倾角': '44.04°' }
    }
  },
  spacecraft: {
    'Voyager 1': {
      name: 'Voyager 1',
      desc: ' humanity\'s most distant spacecraft, launched in 1977. In 2012 it became the first human-made object to cross the heliopause and enter interstellar space. It carries the Golden Record, a cultural time capsule of Earth, and is traveling toward the constellation Ophiuchus.',
      fact: 'As of 2026, Voyager 1 is more than 160 AU from the Sun; a radio signal takes about 22 hours one way at the speed of light.',
      stats: { '类型': 'Outer-planet / interstellar probe', '发射日期': '1977-09-05', '发射载具': 'Titan IIIE / Centaur', '任务目标': 'Jupiter, Saturn, outer solar system and interstellar space', '状态': 'Operating normally', '速度': '≈ 17 km/s' }
    },
    'Voyager 2': {
      name: 'Voyager 2',
      desc: 'The only spacecraft to have flown closely past all four giant planets — Jupiter, Saturn, Uranus and Neptune. It crossed the heliopause in 2018 and is heading into interstellar space toward the constellation Telescopium.',
      fact: 'Voyager 2 revealed that the magnetic fields of the ice giants are highly tilted and offset from the planets\' rotation axes — the most asymmetric planetary magnetic fields known.',
      stats: { '类型': 'Outer-planet / interstellar probe', '发射日期': '1977-08-20', '发射载具': 'Titan IIIE / Centaur', '任务目标': 'Jupiter, Saturn, Uranus, Neptune and interstellar space', '状态': 'Operating normally', '速度': '≈ 15 km/s' }
    },
    'Pioneer 10': {
      name: 'Pioneer 10',
      desc: 'The first spacecraft to traverse the asteroid belt and the first to make a close flyby of Jupiter. Contact was lost in 2003 as its power faded; it now drifts silently toward the constellation Taurus, leaving the solar system.',
      fact: 'Pioneer 10 carried the famous Pioneer plaque, a gold-anodized aluminum plate depicting humans and the location of the Sun within the galaxy.',
      stats: { '类型': 'Outer-planet / interstellar probe', '发射日期': '1972-03-03', '发射载具': 'Atlas-Centaur', '任务目标': 'Jupiter, outer solar system and interstellar space', '状态': 'Mission ended', '速度': '≈ 12 km/s' }
    },
    'Pioneer 11': {
      name: 'Pioneer 11',
      desc: 'The first spacecraft to fly by Saturn and the second to cross the asteroid belt. It is now traveling toward the constellation Scutum, having fallen silent in 1995 due to declining power.',
      fact: 'Pioneer 11\'s discovery of Saturn\'s F ring paved the way for the detailed studies later performed by the Voyager missions.',
      stats: { '类型': 'Outer-planet / interstellar probe', '发射日期': '1973-04-06', '发射载具': 'Atlas-Centaur', '任务目标': 'Jupiter, Saturn and interstellar space', '状态': 'Mission ended', '速度': '≈ 11 km/s' }
    },
    'New Horizons': {
      name: 'New Horizons',
      desc: 'The first spacecraft to fly by Pluto, returning high-resolution images of the heart-shaped ice plain Tombaugh Regio. In 2019 it flew by the Kuiper Belt object Arrokoth and continues its exploration of the outer solar system.',
      fact: 'New Horizons was launched at the highest ever escape velocity from Earth, reaching the Moon\'s orbit just nine hours after liftoff.',
      stats: { '类型': 'Kuiper Belt / outer solar system probe', '发射日期': '2006-01-19', '发射载具': 'Atlas V', '任务目标': 'Pluto and Kuiper Belt objects', '状态': 'Operating normally', '速度': '≈ 14 km/s' }
    }
  }
};
