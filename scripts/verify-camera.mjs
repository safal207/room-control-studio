// Controller regressions with mocked DOM and renderer. No browser/GPU claim.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const project = path.resolve(process.argv[2] || new URL('../', import.meta.url).pathname);
async function boot({ firstUpdateFails = false } = {}) {
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) {
      const classes = new Set();
      const listeners = new Map();
      elements.set(selector, {
        value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
        dataset: {}, style: {}, attributes: {},
        classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } },
        setAttribute(key, value) { this.attributes[key] = String(value); },
        addEventListener(name, fn) { listeners.set(name, fn); },
        fire(name, event = {}) { listeners.get(name)?.(event); },
        scrollIntoView() {}
      });
    }
    return elements.get(selector);
  }
  const scenes = ['morning', 'evening', 'cinema', 'away'].map(scene => Object.assign(element('scene-' + scene), { dataset: { scene } }));
  const devices = ['pendant', 'floor', 'accent'].map(device => Object.assign(element('device-' + device), { dataset: { device } }));
  const steps = ['away', 'evening', 'custom'].map(step => Object.assign(element('step-' + step), { dataset: { step } }));
  const events = new Map();
  const control = { cameraView: 'default', factories: 0, disposals: 0, updates: 0, failNextUpdate: false, errorHandler: null };
  const context = vm.createContext({
    document: {
      querySelector: element,
      querySelectorAll: selector => selector === '[data-scene]' ? scenes : selector === '[data-device]' ? devices : selector === '[data-step]' ? steps : [],
      createElement: () => ({ click() {} })
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    window: { addEventListener(name, fn) { events.set(name, fn); } },
    console: { ...console, error() {} }, URL, Blob, setTimeout
  });
  const modules = new Map();
  for (const name of ['state', 'diagram']) {
    const module = new vm.SourceTextModule(fs.readFileSync(path.join(project, 'dist', name + '.js'), 'utf8'), { context });
    await module.link(() => { throw new Error('Unexpected static dependency'); });
    await module.evaluate(); modules.set(name, module);
  }
  let releaseImport;
  const gate = new Promise(resolve => { releaseImport = resolve; });
  const room = new vm.SyntheticModule(['createRoom'], function () {
    this.setExport('createRoom', canvas => {
      assert.equal(canvas, element('#room'));
      control.factories++;
      const factory = control.factories;
      let updates = 0;
      return {
        update(state) {
          updates++; control.updates++;
          if ((firstUpdateFails && factory === 1 && updates === 1) || control.failNextUpdate) {
            control.failNextUpdate = false; throw new Error('injected state render failure');
          }
          control.state = JSON.parse(JSON.stringify(state));
        },
        resize() {},
        dispose() { control.disposals++; },
        view(top) { control.cameraView = top ? 'top' : 'default'; },
        setErrorHandler(handler) { control.errorHandler = handler; }
      };
    });
  }, { context });
  await room.link(() => {}); await room.evaluate();
  const app = new vm.SourceTextModule(fs.readFileSync(path.join(project, 'dist/app.js'), 'utf8'), {
    context,
    importModuleDynamically: async specifier => { assert.equal(specifier.split('?')[0], './room.js'); await gate; return room; }
  });
  await app.link(specifier => {
    const name = specifier.replace('./', '').split('.')[0];
    assert.ok(modules.has(name), 'Unexpected import ' + specifier); return modules.get(name);
  });
  const running = app.evaluate();
  await new Promise(resolve => setImmediate(resolve));
  return { element, scenes, devices, steps, control, releaseImport, running, events };
}
const normal = await boot();
const { element, scenes, control } = normal;
assert.equal(element('#fallback').hidden, false);
assert.match(element('#room-diagram').innerHTML, /data-light="floor" data-on="true"/);
element('#view-top').onclick();
normal.releaseImport(); await normal.running;
assert.equal(control.cameraView, 'top', 'Pending Top choice survives module loading');
assert.equal(element('#view-top').attributes['aria-pressed'], 'true');
assert.equal(element('#fallback').hidden, true);
assert.equal(element('.viewport').classList.contains('is-3d'), true);
element('#view-default').onclick(); assert.equal(control.cameraView, 'default');
scenes[3].onclick();
assert.equal(element('#watts').textContent, '0 Вт');
assert.equal(element('#ac').attributes['aria-checked'], 'false');
assert.equal(element('#cooler').disabled, true);
assert.equal((element('#room-diagram').innerHTML.match(/data-on="false"/g) || []).length, 3);
scenes[1].onclick(); assert.equal(element('#watts').textContent, '32 Вт');
for (let i = 0; i < 20; i++) element('#warmer').onclick();
assert.equal(element('#temperature').innerHTML, '30<span>°C</span>');
assert.equal(element('#warmer').disabled, true);
for (let i = 0; i < 30; i++) element('#cooler').onclick();
assert.equal(element('#temperature').innerHTML, '16<span>°C</span>');
assert.equal(element('#cooler').disabled, true);
normal.steps[2].onclick();
assert.equal(element('#watts').textContent, '4 Вт');
assert.equal(control.state.brightness, 50);
assert.deepEqual(control.state.lights, { pendant: false, floor: true, accent: false });
assert.match(element('#room-diagram').innerHTML, /data-light="floor" data-on="true" data-brightness="50"/);
assert.match(element('#result-live').textContent, /торшер.*50%.*4 Вт/);
element('#toggle-2d').onclick(); assert.equal(element('#fallback').hidden, false);
element('#toggle-2d').onclick(); assert.equal(element('#fallback').hidden, true);
console.log('PASS: delayed camera choice, shared SVG/3D state, scenarios, 3-step lesson and thermostat bounds.');

control.failNextUpdate = true;
scenes[0].onclick();
assert.equal(element('#fallback').hidden, false, 'A late render failure must show the scheme');
assert.notEqual(element('#fallback').style.display, 'none');
assert.equal(element('.viewport').classList.contains('is-3d'), false);
assert.equal(element('#retry-render').hidden, false);
assert.match(element('#room-diagram').innerHTML, /data-day="true"/);
await element('#retry-render').onclick();
assert.equal(control.factories, 2);
assert.equal(element('#fallback').hidden, true);
let prevented = false;
element('#room').fire('webglcontextlost', { preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(element('#fallback').hidden, false);
await element('#retry-render').onclick();
assert.equal(control.factories, 3);
control.errorHandler(new Error('injected drag render failure'));
assert.equal(element('#fallback').hidden, false);
assert.equal(element('#retry-render').hidden, false);
console.log('PASS: late update failure, context loss and internal drag-render failure restore the scheme; retry builds a fresh renderer.');

const failed = await boot({ firstUpdateFails: true });
failed.releaseImport(); await failed.running;
assert.equal(failed.element('#fallback').hidden, false, 'First state render failure must never hide the fallback');
assert.notEqual(failed.element('#fallback').style.display, 'none');
assert.equal(failed.element('.viewport').classList.contains('is-3d'), false);
assert.match(failed.element('#render-status').textContent, /Живая схема работает/);
failed.steps[0].onclick();
assert.equal(failed.element('#watts').textContent, '0 Вт');
assert.equal((failed.element('#room-diagram').innerHTML.match(/data-on="false"/g) || []).length, 3);
await failed.element('#retry-render').onclick();
assert.equal(failed.control.factories, 2);
assert.equal(failed.control.state.scene, 'away', 'Changes made during fallback survive retry');
assert.equal(failed.element('#fallback').hidden, true);
console.log('PASS: first-state render failure keeps the scheme and message visible; controls and state survive a successful retry.');
console.log('LIMIT: mocked DOM and renderer; no browser layout or actual WebGL execution.');
