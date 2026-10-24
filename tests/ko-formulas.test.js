'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/tools-ko.js'), 'utf8');
const cases = {
  percentage: ['percentOfBtn', 'percentOfResult', '30'],
  age: ['ageBtn', 'ageResult', /년/],
  discount: ['discountBtn', 'discountResult', '36,000'],
  date: ['offsetBtn', 'offsetResult', /년/],
  average: ['averageBtn', 'averageResult', '25'],
  tip: ['tipBtn', 'tipResult', '30'],
  time: ['durationBtn', 'durationResult', /시간/],
  ratio: ['simplifyRatioBtn', 'ratioResult', '2 : 3'],
  vat: ['vatBtn', 'vatResult', '110,000']
};
// Read actual page IDs/defaults so the test crosses the HTML/script boundary.
function createPage(tool) {
  const html = fs.readFileSync(path.join(root, 'ko', tool + '-calculator/index.html'), 'utf8');
  const elements = {};
  for (const match of html.matchAll(/<([\w-]+)\b([^>]*\bid="[^"]+"[^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    elements[attrs.id] = { value: attrs.value ?? '', textContent: '', checked: /\bchecked\b/.test(match[2]),
      replaceChildren() {}, append() {}, addEventListener() {} };
  }
  for (const match of html.matchAll(/<(select|textarea)\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    elements[match[2]].value = match[1] === 'textarea' ? match[3] : match[3].match(/value="([^"]*)"/)[1];
  }
  if (tool === 'age') elements.dob.value = '2000-01-01';
  const document = {
    body: { dataset: { tool } },
    querySelector(s) { return s.startsWith('#') ? elements[s.slice(1)] ?? null : null; },
    querySelectorAll() { return []; },
    createElement() { return { textContent: '', append() {} }; }
  };
  vm.runInNewContext(source, { document });
  return elements;
}
for (const [tool, [button, result, expected]] of Object.entries(cases)) {
  test(`${tool}: Korean calculation displays its formula in the real HTML target`, () => {
    const elements = createPage(tool);
    elements[button].onclick();
    const value = elements[result].textContent;
    if (expected instanceof RegExp) assert.match(value, expected);
    else assert.equal(value, expected);
    assert.match(elements[result + 'Formula'].textContent, /^계산식\n.+/s);
    assert.match(elements[result + 'Formula'].textContent, /=/);
  });
}
test('Invalid input clears the previous formula instead of showing stale reasoning', () => {
  const elements = createPage('percentage');
  elements.percentOfBtn.onclick();
  assert.ok(elements.percentOfResultFormula.textContent);
  elements.percent.value = '';
  elements.percentOfBtn.onclick();
  assert.equal(elements.percentOfResultFormula.textContent, '');
  assert.match(elements.percentOfResult.textContent, /올바른/);
});
