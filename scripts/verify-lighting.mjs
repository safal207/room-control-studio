// Real Three geometry, materials, lights and raycasting; only the GPU renderer is mocked.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as Three from '../dist/vendor/three.module.js';
import { lampSettings, lightingState } from '../dist/lighting.js';
import { preset } from '../dist/state.js';
import { roomDiagram } from '../dist/diagram.js';
let scene, renderer, camera;
class MockRenderer {
  constructor() { renderer = this; this.shadowMap = {}; }
  setPixelRatio() {} setSize() {} dispose() {}
  render(value, view) { scene = value; camera=view; }
}
const source = fs.readFileSync(new URL('../dist/room.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace('export function createRoom', 'function createRoom');
const createRoom = new Function('T', 'devicePixelRatio', 'lampSettings', 'lightingState', source + '\nreturn createRoom;')(
  { ...Three, WebGLRenderer: MockRenderer }, 1, lampSettings, lightingState);
let viewport={ width:800,height:500 };
const canvas = { getBoundingClientRect: () => viewport, addEventListener() {}, removeEventListener() {} };
const room = createRoom(canvas);
const ids = ['pendant', 'floor', 'accent'];
const lamp = id => scene.getObjectByName('lamp-' + id);
const bulb = id => scene.getObjectByName('bulb-' + id);
assert.equal(renderer.physicallyCorrectLights, true, 'Use distance attenuation explicitly');
assert.equal(Three.ColorManagement.legacyMode, false, 'Convert sRGB input to linear working colour');
assert.equal(renderer.outputEncoding, Three.sRGBEncoding);
for (const id of ids) {
  assert.equal(lamp(id).isSpotLight, true, 'Each light has a bounded direction');
  assert.equal(lamp(id).castShadow, true, 'Furniture must occlude light');
  assert.equal(bulb(id).castShadow, false, 'A bulb must not shadow its own source');
  assert.equal(bulb(id).receiveShadow, false);
  assert.ok(lamp(id).shadow.mapSize.x <= 512, 'Bound shadow-map cost');
  assert.ok(lamp(id).shadow.camera.near > 0);
  assert.ok(lamp(id).shadow.camera.far <= 8);
}
let cases = 0;
for (const day of [false, true]) for (let mask = 0; mask < 8; mask++) for (const brightness of [0, 25, 50, 75, 100]) {
  const state = { ...preset('evening'), day, brightness, lights: Object.fromEntries(ids.map((id, i) => [id, !!(mask & (1 << i))])) };
  room.update(state);
  const svg = roomDiagram(state);
  for (const id of ids) {
    const emitting = state.lights[id] && brightness > 0;
    assert.equal(lamp(id).intensity > 0, emitting);
    assert.equal(bulb(id).material.emissiveIntensity > 0, emitting);
    assert.equal(bulb(id).material.color.getHexString(), emitting ? 'f3d69f' : '8c897c');
    assert.match(svg, new RegExp(`data-light="${id}" data-on="${emitting}"`));
  }
  cases++;
}
console.log(`PASS R-L01: ${cases} switch/brightness/day combinations agree in actual Three lights/materials and SVG.`);

for (const id of ids) {
  const state = { ...preset('evening'), lights: Object.fromEntries(ids.map(name => [name, name === id])) };
  const intensities = [], emissions = [], exposures = [];
  for (const brightness of [0, 25, 50, 75, 100, 0]) {
    state.brightness = brightness; room.update(state);
    intensities.push(lamp(id).intensity); emissions.push(bulb(id).material.emissiveIntensity); exposures.push(renderer.toneMappingExposure);
  }
  assert.equal(intensities[0], 0); assert.equal(intensities[5], 0); assert.equal(emissions[5], 0);
  for (let i = 1; i < 5; i++) { assert.ok(intensities[i] > intensities[i - 1]); assert.ok(emissions[i] > emissions[i - 1]); }
  assert.equal(new Set(exposures).size, 1, 'Dimming must not trigger auto brightening');
}
console.log('PASS R-L03: each isolated lamp dims monotonically to zero with unchanged exposure.');

function snapshot() { return ids.map(id => [lamp(id).intensity, bulb(id).material.emissiveIntensity, bulb(id).material.color.getHexString()]); }
room.update(preset('evening')); const evening = snapshot();
for (const name of ['morning', 'cinema', 'away', 'evening']) room.update(preset(name));
assert.deepEqual(snapshot(), evening, 'Scene switching must fully restore materials and energy');
assert.equal(lightingState(preset('away')).televisionEmission, 0);
assert.ok(lightingState(preset('away')).ambient > 0, 'Night fill deliberately preserves readable silhouettes');
assert.ok(lightingState(preset('away')).sun < lightingState(preset('morning')).sun);
console.log('PASS R-L04: presets restore deterministically; Away has no lamp/TV emission and a small deliberate environment fill.');

scene.updateMatrixWorld(true);
const shadowCasters = [];
scene.traverse(object => { if (object.isMesh && object.castShadow) shadowCasters.push(object); });
for (const id of ids) {
  const origin = lamp(id).getWorldPosition(new Three.Vector3());
  const direction = lamp(id).target.getWorldPosition(new Three.Vector3()).sub(origin).normalize();
  const ray = new Three.Raycaster(origin, direction, 0, lamp(id).distance);
  const hits = ray.intersectObjects(shadowCasters, false);
  assert.ok(hits.length, `Light ${id} must reach real scene geometry`);
  assert.ok(hits[0].distance > .1, `${id} source must not sit inside a closed shade`);
}

const bounds=new Three.Box3().setFromObject(scene.children.find(object=>object.isGroup));
for(const [width,height] of [[1200,800],[390,520],[320,520]])for(const top of [false,true]){
 viewport={width,height};room.resize();room.view(top);camera.updateMatrixWorld(true);
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const point=new Three.Vector3(x,y,z).project(camera);
  assert.ok(Math.abs(point.x)<1 && Math.abs(point.y)<1,`Complete room bounds must fit ${width}x${height}, top=${top}: ${point.x},${point.y}`);
 }
}
console.log('PASS responsive camera: full room bounds remain inside 1200/390/320 canvases in model and top views.');

room.dispose();
console.log('PASS R-L02 geometry: each directed source reaches scene geometry without being enclosed by its own shade.');
console.log('LIMIT: GPU rendering, highlights, shadow acne and physical mobile performance require the visual matrix; this is not pixel-level certification.');
