'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/tools.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'tip-calculator/index.html'), 'utf8');

function makeElement(value = '') {
  return {
    value: String(value), textContent: '', children: [], attributes: {},
    listeners: {}, active: false,
    classList: {
      toggle(name, selected) { if (name === 'active') this.owner.active = !!selected; }
    },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    replaceChildren() { this.children = []; },
    append(...nodes) { this.children.push(...nodes); },
    click() { if (typeof this.onclick === 'function') this.onclick(); }
  };
}

function createPage() {
  const form = {
    billAmount: 50, tipPercent: 20, peopleCount: 2,
    splitBillAmount: 73500, splitPeople: 3, roundUnit: 100
  };
  const ids = [
    ...Object.keys(form), 'tipBtn', 'splitBillBtn',
    'tipResult', 'tipResultDetail', 'tipResultFormula',
    'splitBillResult', 'splitBillResultDetail', 'splitBillResultFormula'
  ];
  const elements = Object.fromEntries(ids.map(id => [id, makeElement(form[id] ?? '')]));
  const percentages = [10, 15, 18, 20, 25];
  const presets = percentages.map(n => {
    const element = makeElement();
    element.dataset = { tipPreset: String(n) };
    element.classList.owner = element;
    return element;
  });
  const document = {
    body: { dataset: { tool: 'tip' } },
    querySelector(selector) {
      if (selector.startsWith('#')) return elements[selector.slice(1)] ?? null;
      return null; // No footer or app shell required for this behavior test.
    },
    querySelectorAll(selector) {
      if (selector === '[data-tip-preset]') return presets;
      if (selector === '.mode-tabs') return [];
      return [];
    },
    createElement() { return makeElement(); }
  };
  vm.runInNewContext(source, { document, module: { exports: {} }, console });
  return { elements, presets };
}

test('Tip page script initializes completely (no undefined selector helper)', () => {
  const { elements, presets } = createPage();
  assert.equal(typeof elements.tipBtn.onclick, 'function');
  assert.equal(typeof elements.splitBillBtn.onclick, 'function');
  assert.equal(presets.length, 5);
  assert.equal(presets[3].active, true);
  assert.equal(presets[3].attributes['aria-pressed'], 'true');
});

test('Clicking 15% visibly recalculates and updates the input and active state', () => {
  const { elements, presets } = createPage();
  presets[1].listeners.click();
  assert.equal(elements.tipPercent.value, '15');
  assert.equal(elements.tipResult.textContent, '28.75'); // ($50 + 15%) / 2
  assert.equal(presets[1].active, true);
  assert.equal(presets[3].active, false);
  assert.match(elements.tipResultFormula.textContent, /Tip = 50 × 15 ÷ 100 = 7.5/);
});

test('10% / 18% / 20% / 25% all compute correctly', () => {
  const { elements, presets } = createPage();
  const outputs = ['27.5', '28.75', '29.5', '30', '31.25'];
  presets.forEach((button, i) => {
    button.listeners.click();
    assert.equal(elements.tipResult.textContent, outputs[i]);
    assert.equal(button.active, true);
    assert.equal(presets.filter(p => p.active).length, 1);
  });
});

test('Typing a custom tip unselects presets without breaking Calculate', () => {
  const { elements, presets } = createPage();
  elements.tipPercent.value = '13';
  elements.tipPercent.listeners.input();
  assert.equal(presets.filter(p => p.active).length, 0);
  elements.tipBtn.click();
  assert.equal(elements.tipResult.textContent, '28.25');
});

test('Existing Split bill calculator still responds independently', () => {
  const { elements } = createPage();
  elements.splitBillBtn.click();
  assert.equal(elements.splitBillResult.textContent, '24,500');
});

test('Tip buttons share the existing calculator tab styling', () => {
  assert.match(styles, /\.mode-tabs button,\.tip-presets button\{/);
  assert.match(styles, /\.mode-tabs button\[aria-selected="true"\],\.tip-presets button\[aria-pressed="true"\]\{/);
  assert.match(styles, /\.tip-presets button:focus-visible\{/);
  for (const value of [10, 15, 18, 20, 25]) {
    assert.match(html, new RegExp('data-tip-preset="' + value + '"'));
  }
  assert.match(html, /assets\/tools\.js\?v=20261014-tip-preset-fix-2/);
  assert.match(html, /assets\/styles\.css\?v=20261014-tip-preset-fix-2/);
});
