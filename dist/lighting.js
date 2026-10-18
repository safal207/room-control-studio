// One light-state contract for the room renderer. Values describe an artistic
// teaching scene, not measured illuminance or a building lighting calculation.
export const lampSettings = Object.freeze({
  pendant: Object.freeze({ intensity: 18, distance: 8, angle: Math.PI / 3, target: [1.45, .1, 2.4] }),
  floor: Object.freeze({ intensity: 10, distance: 6, angle: Math.PI / 3, target: [-1.3, .1, .25] }),
  accent: Object.freeze({ intensity: 4, distance: 3.5, angle: Math.PI / 3, target: [.7, 1.8, -4.25] })
});
export function lightingState(state = {}) {
  const brightness = Math.max(0, Math.min(100, Number(state.brightness) || 0));
  const strength = brightness / 100;
  const day = !!state.day;
  const lamps = Object.fromEntries(Object.entries(lampSettings).map(([id, settings]) => {
    const active = !!state.lights?.[id] && brightness > 0;
    return [id, { active, intensity: active ? settings.intensity * strength : 0,
      emission: active ? 1.5 * strength : 0, color: active ? '#f3d69f' : '#8c897c' }];
  }));
  return { brightness, lamps,
    // A small, explicit night fill keeps furniture legible when every lamp is off.
    // Exposure stays fixed: dimming lamps must not make the renderer brighten them again.
    exposure: 1.05, ambient: day ? .65 : .13, sun: day ? 1.9 : .04, fill: day ? .3 : .07,
    background: day ? '#e2dfd5' : '#bcb7ab',
    windowEmission: day ? .22 : .015, windowColor: day ? '#c5d2b9' : '#67796c',
    televisionEmission: state.scene === 'away' ? 0 : state.scene === 'cinema' ? .45 : .025
  };
}
