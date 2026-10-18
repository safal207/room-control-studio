import { devices, preset, validate, estimatedWatts } from './state.js';
import { roomDiagram } from './diagram.js?v=3';
const q = selector => document.querySelector(selector);
const key = 'safonov-room-control-v1';
let state = preset('evening'), world = null, desiredView = false, loading = false, schemeOnly = false;
try { const saved = localStorage.getItem(key); if (saved) state = validate(JSON.parse(saved)); } catch {}
const names = { morning: 'Светлое утро', evening: 'Тёплый вечер', cinema: 'Время кино', away: 'Всё выключено', custom: 'Ваш сценарий' };
q('#devices').innerHTML = devices.map(d => `<div class="device-row"><span class="device-icon">${d.icon}</span><div class="device-info"><h3>${d.name}</h3><p>${d.type}</p></div><button role="switch" data-device="${d.id}" aria-label="${d.name}" aria-checked="true"><span></span></button></div>`).join('');
function showScheme() {
  q('#fallback').hidden = false;
  q('#fallback').style.display = '';
  q('.viewport').classList.remove('is-3d');
}
function showWorld() {
  q('#fallback').hidden = true;
  q('#fallback').style.display = 'none';
  q('.viewport').classList.add('is-3d');
}
function fail(error) {
  const failed = world;
  world = null;
  showScheme();
  q('#retry-render').hidden = false;
  q('#render-status').textContent = '3D недоступно. Живая схема работает: меняйте свет и сравнивайте результат.';
  q('.room-hint').textContent = 'Схема сверху · каждый светильник связан с переключателем';
  try { failed?.dispose(); } catch {}
  console.error('Room Control: using the interactive scheme', error);
}
function guard(action) {
  if (!world) return false;
  const active = world;
  try { action(active); return world === active; } catch (error) { fail(error); return false; }
}
function draw() {
  q('#brightness').value = state.brightness;
  q('#brightness-value').textContent = state.brightness + '%';
  q('#temperature').innerHTML = state.temperature + '<span>°C</span>';
  q('#climate-note').textContent = state.ac ? `Установлено ${state.temperature} °C · симуляция` : 'Климат выключен · симуляция';
  q('#ac').setAttribute('aria-checked', state.ac);
  q('#cooler').disabled = !state.ac || state.temperature <= 16;
  q('#warmer').disabled = !state.ac || state.temperature >= 30;
  q('#watts').textContent = estimatedWatts(state) + ' Вт';
  q('#scene-label').textContent = names[state.scene] || names.custom;
  document.querySelectorAll('[data-device]').forEach(button => button.setAttribute('aria-checked', state.lights[button.dataset.device]));
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', button.dataset.scene === state.scene));
  q('#room-diagram').innerHTML = roomDiagram(state);
  const enabled = devices.filter(device => state.lights[device.id]).map(device => device.name.toLowerCase());
  q('#result-live').textContent = `${names[state.scene] || names.custom}: ${enabled.length ? 'включены ' + enabled.join(', ') : 'все лампы выключены'}. Яркость ${state.brightness}%. Расчётная мощность ${estimatedWatts(state)} Вт.`;
  const exactStep = state.scene === 'away' || state.scene === 'evening' ? state.scene : state.brightness === 50 && state.lights.floor && !state.lights.pendant && !state.lights.accent ? 'custom' : null;
  document.querySelectorAll('[data-step]').forEach(button => button.setAttribute('aria-pressed', button.dataset.step === exactStep));
  guard(renderer => renderer.update(state));
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { q('.saved-note p').textContent = 'Сохранение в браузере недоступно. Можно скачать сценарий.'; }
}
function applyScene(name) { state = preset(name); draw(); }
document.querySelectorAll('[data-scene]').forEach(button => button.onclick = () => applyScene(button.dataset.scene));
document.querySelectorAll('[data-device]').forEach(button => button.onclick = () => { state.lights[button.dataset.device] = !state.lights[button.dataset.device]; state.scene = 'custom'; draw(); });
q('#brightness').oninput = event => { state.brightness = Number(event.target.value); state.scene = 'custom'; draw(); };
q('#ac').onclick = () => { state.ac = !state.ac; state.scene = 'custom'; draw(); };
q('#cooler').onclick = () => { if (state.ac) { state.temperature = Math.max(16, state.temperature - 1); state.scene = 'custom'; draw(); } };
q('#warmer').onclick = () => { if (state.ac) { state.temperature = Math.min(30, state.temperature + 1); state.scene = 'custom'; draw(); } };
function setView(top) {
  desiredView = top;
  guard(renderer => renderer.view(top));
  q('#view-top').setAttribute('aria-pressed', top);
  q('#view-default').setAttribute('aria-pressed', !top);
  if (!world || schemeOnly) q('#render-status').textContent = 'Схема всегда показана сверху. Выбранный ракурс применится при запуске 3D.';
}
q('#view-top').onclick = () => setView(true);
q('#view-default').onclick = () => setView(false);
q('#reset-view').onclick = () => setView(false);
q('#reset').onclick = () => { state = preset('evening'); draw(); setView(false); };
document.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
  if (button.dataset.step === 'custom') {
    state = preset('evening'); state.scene = 'custom'; state.brightness = 50;
    state.lights = { pendant: false, floor: true, accent: false };
  } else state = preset(button.dataset.step);
  draw();
  q('#room-result').scrollIntoView({ behavior: 'auto', block: 'center' });
});
q('#export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ application: 'Room Control', version: 1, simulation: true, settings: state, estimatedLightingWatts: estimatedWatts(state) }, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'room-control-scene.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  q('#toast').textContent = 'Сценарий сохранён в JSON'; q('#toast').classList.add('show');
  setTimeout(() => q('#toast').classList.remove('show'), 3000);
};
async function start3D() {
  if (loading || world) return;
  loading = true; q('#retry-render').disabled = true;
  q('#render-status').textContent = 'Загружаем 3D. Пока можно менять свет на живой схеме.';
  try {
    const { createRoom } = await import('./room.js?v=3');
    world = createRoom(q('#room'));
    world.view(desiredView);
    // The fallback stays visible until the first frame with the real state succeeds.
    world.update(state);
    world.setErrorHandler?.(fail);
    if (!schemeOnly) showWorld();
    q('#retry-render').hidden = true;
    q('#render-status').textContent = schemeOnly ? 'Живая схема. Те же настройки применены в 3D.' : '3D готово. Смена сценария меняет освещение комнаты.';
    q('.room-hint').textContent = schemeOnly ? 'Схема сверху · свет связан с переключателями' : 'Потяните, чтобы повернуть комнату';
  } catch (error) { fail(error); }
  finally { loading = false; q('#retry-render').disabled = false; }
}
q('#retry-render').onclick = () => start3D();
q('#toggle-2d').onclick = () => {
  schemeOnly = !schemeOnly;
  q('#toggle-2d').setAttribute('aria-pressed', schemeOnly);
  q('#toggle-2d').textContent = schemeOnly ? 'Показать 3D' : 'Показать схему';
  if (schemeOnly) {
    showScheme();
    q('#render-status').textContent = 'Живая схема: состояние ламп и их яркость совпадают с 3D.';
    q('.room-hint').textContent = 'Схема сверху · каждый светильник связан с переключателем';
  } else if (guard(renderer => { renderer.resize(); renderer.update(state); })) {
    showWorld(); q('#render-status').textContent = '3D готово. Настройки сохранены.';
    q('.room-hint').textContent = 'Потяните, чтобы повернуть комнату';
  } else if (!world) start3D();
};
q('#room').addEventListener('webglcontextlost', event => { event.preventDefault(); fail(new Error('WebGL context lost')); });
q('#room').addEventListener('webglcontextrestored', () => { if (!world) { q('#retry-render').hidden = false; q('#render-status').textContent = '3D снова доступно. Можно повторить запуск; схема и настройки сохранены.'; } });
window.addEventListener('resize', () => guard(renderer => renderer.resize()));
window.addEventListener('pagehide', event => { if (!event.persisted) { try { world?.dispose(); } catch {} world = null; } });
draw();
await start3D();
