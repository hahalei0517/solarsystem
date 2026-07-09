export function createSimulationState({ renderQuality = 'quality' } = {}) {
  return {
    simDays: 0,
    speedMode: 'day',
    scaleMode: 'schematic',
    renderQuality,
    playing: true,
    showOrbits: true,
    showEcliptic: false,
    showLabels: true,
    showTrails: true,
    showBelts: true,
    showComets: false,
    showDwarfs: false,
    showSpacecraft: false,
    showEvents: false,
    showAxis: true, // show the spin-axis pole for the focused/soloed planet
    rotateAroundCursor: true, // when on, left-drag orbits the body under the cursor
    soundOn: false,
    audioTheme: 'space1', // ambient bed theme: space1 (bundled) | deep | nebula | orbit | solar | custom
    focusIndex: -1,
    soloIndex: -1,
    soloSun: false,
    cometFocusIndex: -1,
    dwarfFocusIndex: -1,
    spacecraftFocusIndex: -1,
    soloCometIndex: -1,
    soloDwarfIndex: -1,
    soloSpacecraftIndex: -1,
    visible: new Set([0,1,2,3,4,5,6,7]),
    eventFocus: null,
    eventLink: null,
  };
}
