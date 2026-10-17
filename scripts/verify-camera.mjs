// Run with: node --experimental-vm-modules room-camera-regression.mjs [project-dir]
// A bounded controller regression. The DOM and 3D renderer are mocked; this
// deliberately does not claim browser layout or actual WebGL verification.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const project = path.resolve(process.argv[2] || new URL('../',import.meta.url).pathname);
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
    dataset: {}, style: {}, attributes: {},
    classList: { add() {}, remove() {} },
    setAttribute(key, value) { this.attributes[key] = String(value); }
  });
  return elements.get(selector);
}
const scenes = ['morning', 'evening', 'cinema', 'away'].map(scene =>
  Object.assign(element('scene-' + scene), { dataset: { scene } }));
const devices = ['pendant', 'floor', 'accent'].map(device =>
  Object.assign(element('device-' + device), { dataset: { device } }));
const context = vm.createContext({
  document: {
    querySelector: element,
    querySelectorAll: selector => selector === '[data-scene]' ? scenes :
      selector === '[data-device]' ? devices : [],
    createElement: () => ({ click() {} })
  },
  localStorage: { getItem() { return null; }, setItem() {} },
  window: { addEventListener() {} }, console, URL, Blob, setTimeout
});
const state = new vm.SourceTextModule(fs.readFileSync(path.join(project, 'dist/state.js'), 'utf8'), { context });
await state.link(() => { throw new Error('Unexpected state dependency'); });
await state.evaluate();

let cameraView = 'default';
let releaseImport;
const gate = new Promise(resolve => { releaseImport = resolve; });
const room = new vm.SyntheticModule(['createRoom'], function () {
  this.setExport('createRoom', canvas => {
    assert.equal(canvas, element('#room'), 'createRoom must receive the room canvas');
    return {
      update() {}, resize() {}, dispose() {},
      view(top) { cameraView = top ? 'top' : 'default'; }
    };
  });
}, { context });
await room.link(() => {});
await room.evaluate();
const app = new vm.SourceTextModule(fs.readFileSync(path.join(project, 'dist/app.js'), 'utf8'), {
  context,
  importModuleDynamically: async specifier => {
    assert.equal(specifier, './room.js');
    await gate;
    return room;
  }
});
await app.link(specifier => {
  assert.equal(specifier, './state.js');
  return state;
});
const running = app.evaluate();
await new Promise(resolve => setImmediate(resolve));
assert.equal(typeof element('#view-top').onclick, 'function');
element('#view-top').onclick();
releaseImport();
await running;
assert.equal(element('#view-top').attributes['aria-pressed'], 'true');
assert.equal(element('#view-default').attributes['aria-pressed'], 'false');
assert.equal(cameraView, 'top', 'A Top selection made during import must be applied after createRoom initializes');
element('#view-default').onclick();
assert.equal(cameraView, 'default');
assert.equal(element('#view-default').attributes['aria-pressed'], 'true');
console.log('PASS: pending Top selection survives renderer initialization; Default remains selectable.');

scenes[3].onclick();
assert.equal(element('#watts').textContent, '0 Вт');
assert.equal(element('#ac').attributes['aria-checked'], 'false');
assert.equal(element('#cooler').disabled, true);
assert.equal(element('#warmer').disabled, true);
scenes[1].onclick();
assert.equal(element('#watts').textContent, '32 Вт');
for (let i = 0; i < 20; i++) element('#warmer').onclick();
assert.equal(element('#temperature').innerHTML, '30<span>°C</span>');
assert.equal(element('#warmer').disabled, true);
for (let i = 0; i < 30; i++) element('#cooler').onclick();
assert.equal(element('#temperature').innerHTML, '16<span>°C</span>');
assert.equal(element('#cooler').disabled, true);
console.log('PASS: Away, Evening and both thermostat bounds.');
console.log('LIMIT: mocked DOM and renderer; no browser layout or actual WebGL execution.');
