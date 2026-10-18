// An original, state-driven floor plan. It is a schematic, not a 3D screenshot.
export function roomDiagram(state) {
  const brightness = Math.max(0, Math.min(100, Number(state.brightness) || 0));
  const strength = brightness / 100;
  const day = !!state.day;
  const lights = state.lights || {};
  const lamp = (id, x, y, name, radius) => {
    const on = !!lights[id] && brightness > 0;
    return `<g data-light="${id}" data-on="${on}" data-brightness="${brightness}"><circle cx="${x}" cy="${y}" r="${radius}" fill="url(#warm-light)" opacity="${on ? (.3 + strength * .7).toFixed(2) : 0}"/><circle cx="${x}" cy="${y}" r="11" fill="${on ? '#ffe6ab' : '#6b6e63'}" stroke="${on ? '#f3c16b' : '#8a8e80'}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4" fill="${on ? '#fff8de' : '#42483d'}"/><text x="${x}" y="${y + 27}" fill="${on ? '#f9dfaa' : '#b0b8a3'}" text-anchor="middle" font-size="11">${name} · ${on ? brightness + '%' : 'выкл.'}</text></g>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="130 0 460 480" font-family="Arial,sans-serif" role="img" aria-label="Схема гостиной сверху. Яркость ${brightness} процентов, ${day ? 'дневное' : 'вечернее'} освещение" data-day="${day}">
  <defs><linearGradient id="room-back" x2="0" y2="1"><stop stop-color="${day ? '#e8e9dd' : '#c6caba'}"/><stop offset="1" stop-color="${day ? '#d8deca' : '#aab5a0'}"/></linearGradient><linearGradient id="floor-shade" x2="1" y2="1"><stop stop-color="${day ? '#af9472' : '#6b6250'}"/><stop offset="1" stop-color="${day ? '#998160' : '#494e40'}"/></linearGradient><radialGradient id="warm-light"><stop stop-color="#ffdb88" stop-opacity=".75"/><stop offset="1" stop-color="#ffd176" stop-opacity="0"/></radialGradient><pattern id="boards" width="52" height="30" patternUnits="userSpaceOnUse"><path d="M0 0H52M0 30H52M26 0V30" stroke="#2d3828" stroke-opacity=".18" fill="none"/></pattern><filter id="room-shadow"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#263522" flood-opacity=".18"/></filter></defs>
  <rect width="720" height="480" fill="url(#room-back)"/><g filter="url(#room-shadow)"><rect x="153" y="38" width="414" height="402" rx="11" fill="#e5e3d6"/><rect x="169" y="54" width="382" height="370" fill="url(#floor-shade)"/><rect x="169" y="54" width="382" height="370" fill="url(#boards)"/>
  <path d="M169 176V54H551V424H462M169 260V424H386" fill="none" stroke="#f2f0e4" stroke-width="8"/>
  <rect x="191" y="48" width="108" height="12" rx="3" fill="${day ? '#d9eee1' : '#778b80'}" stroke="#c0c6b3"/><path d="M245 49V59" stroke="#f1f4e5"/>
  <rect x="322" y="65" width="169" height="34" rx="5" fill="#775b40"/><rect x="348" y="68" width="117" height="18" rx="3" fill="#283e3d"/><rect x="358" y="71" width="97" height="10" rx="2" fill="${state.scene === 'cinema' ? '#77b3ba' : '#3f5550'}"/>
  <rect x="220" y="135" width="249" height="139" rx="13" fill="#b8ae8d" opacity=".8"/><path d="M232 147H457M232 263H457" stroke="#d4c9a8" stroke-width="2"/>
  <rect x="180" y="129" width="76" height="161" rx="12" fill="#737d65" stroke="#b9c1a4" stroke-width="2"/><rect x="193" y="141" width="52" height="62" rx="7" fill="#a4ab8b"/><rect x="193" y="209" width="52" height="62" rx="7" fill="#a4ab8b"/><rect x="193" y="150" width="17" height="35" rx="6" fill="#d3c8a7"/><rect x="193" y="222" width="17" height="35" rx="6" fill="#c7bd9e"/>
  <ellipse cx="332" cy="206" rx="50" ry="37" fill="#5c4b36" stroke="#92754e" stroke-width="3"/><rect x="309" y="188" width="31" height="22" rx="2" fill="#d8d5bb" transform="rotate(-9 324 199)"/><circle cx="352" cy="214" r="7" fill="#e8dcc0"/>
  <g fill="#7c886e" stroke="#aeb59c" stroke-width="2"><rect x="395" y="291" width="36" height="30" rx="8"/><rect x="395" y="389" width="36" height="25" rx="8"/><rect x="346" y="337" width="28" height="38" rx="8"/><rect x="451" y="337" width="28" height="38" rx="8"/></g><circle cx="413" cy="354" r="45" fill="#ac8b5e" stroke="#c2a479" stroke-width="3"/><circle cx="413" cy="354" r="12" fill="#d8d4bb"/>
  <circle cx="510" cy="111" r="22" fill="#586d47"/><ellipse cx="502" cy="101" rx="10" ry="24" fill="#7d9564" transform="rotate(-38 502 101)"/><ellipse cx="518" cy="110" rx="10" ry="25" fill="#79925f" transform="rotate(35 518 110)"/>
  <rect x="189" y="337" width="39" height="66" rx="4" fill="#7d6546"/><path d="M195 351H222M195 363H222M195 375H222M195 387H222" stroke="#c6b394" stroke-width="5"/>
  <path d="M386 424V350A74 74 0 0 1 460 424" fill="none" stroke="#d0d5c0" stroke-width="2" stroke-dasharray="4 5"/>
  </g>
  ${lamp('accent', 407, 110, 'Контур', 90)}${lamp('floor', 282, 299, 'Торшер', 94)}${lamp('pendant', 413, 354, 'Подвес', 100)}
  <g font-family="Arial,sans-serif"><text x="360" y="23" text-anchor="middle" font-size="10" letter-spacing="2" fill="#4f624b">ГОСТИНАЯ · СХЕМА СВЕРХУ</text><rect x="504" y="186" width="35" height="96" rx="7" fill="#d9dfcb"/><text x="522" y="219" text-anchor="middle" font-size="19" fill="#607751">≋</text><text x="522" y="239" text-anchor="middle" font-size="10" fill="#56694d">${state.ac ? state.temperature + '°' : 'выкл.'}</text><circle cx="522" cy="256" r="4" fill="${state.ac ? '#7fa857' : '#a5af9a'}"/><text x="360" y="462" text-anchor="middle" font-size="10" fill="#4b6046">${day ? 'Дневной свет' : 'Вечерний свет'} · ${Object.values(lights).filter(Boolean).length} из 3 ламп включено · общая яркость ${brightness}%</text></g></svg>`;
}
