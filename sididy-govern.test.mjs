import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Governor, KAPPA } from './sididy-govern.mjs';

test('the circuit-breaker: spend can never exceed the budget (the melt is prevented)', () => {
  const g = new Governor({ budget: 10, ceiling: 4 });
  let refused = 0;
  for (let i = 0; i < 100; i++) { const r = g.charge(3); if (!r.ok) refused++; }
  assert.ok(g.spent <= 10, `spent ${g.spent} ≤ budget 10`);
  assert.ok(refused > 0, 'over-budget charges are refused, not absorbed');
});

test('a refused charge leaves spend UNCHANGED (no partial overspend)', () => {
  const g = new Governor({ budget: 5, ceiling: 4 });
  assert.equal(g.charge(4).ok, true);
  const before = g.spent;
  const r = g.charge(4);                      // 4 + 4 = 8 > 5 → refused
  assert.equal(r.ok, false);
  assert.equal(r.halted, true);
  assert.equal(g.spent, before, 'the refused charge did not spend');
});

test('throttle is zero while cool and rises as the burn-rate heats up (self-regulating)', () => {
  const at = (rate) => { const g = new Governor({ ceiling: 4 }); let last; for (let i = 0; i < 16; i++) last = g.charge(rate); return last.throttle; };
  assert.equal(at(1), 0, 'well under κ·ceiling → no throttle');
  assert.ok(at(3) > at(1), 'hotter → more throttle');
  assert.ok(at(6) > at(3), 'hotter still → more throttle');
});

test('the κ band: at κ·ceiling the loop runs free; just above it is throttled', () => {
  const at = (rate) => { const g = new Governor({ ceiling: 4 }); let last; for (let i = 0; i < 16; i++) last = g.charge(rate); return last; };
  assert.equal(at(KAPPA * 4).throttle, 0, 'exactly at κ·ceiling → free');
  assert.equal(at(KAPPA * 4).status, 'cool');
  assert.ok(at(0.9 * 4).throttle > 0, 'above κ·ceiling → throttled');
  assert.equal(at(5).status, 'melt-guard', 'over the ceiling → melt-guard');
});

test('run() drives a step under the gate and stops at the budget', () => {
  const g = new Governor({ budget: 12, ceiling: 4 });
  let steps = 0;
  const out = g.run(() => { steps++; }, { cost: () => 3, maxCycles: 1000 });
  assert.equal(out.ran, 4, '12 budget / 3 per step = 4 steps');
  assert.equal(steps, 4, 'the step ran exactly as many times as the gate allowed');
  assert.ok(g.spent <= 12);
});

test('the rolling window holds exactly `window` samples; maxCycles bounds run()', () => {
  const g = new Governor({ window: 5, ceiling: 4, budget: Infinity });
  for (let i = 0; i < 12; i++) g.charge(1);
  assert.equal(g.recent.length, 5, 'the burn window is exactly `window` samples');
  let steps = 0;
  const out = new Governor({ budget: Infinity, ceiling: 4 }).run(() => { steps++; }, { cost: () => 1, maxCycles: 5 });
  assert.equal(out.ran, 5, 'run stops at exactly maxCycles');
  assert.equal(steps, 5);
});

test('status boundary: exactly at the ceiling (heat = 1) is melt-guard, not throttling', () => {
  const g = new Governor({ ceiling: 4, window: 8 });
  let last; for (let i = 0; i < 16; i++) last = g.charge(4);    // rate → 4, heat → 1 exactly
  assert.equal(last.status, 'melt-guard', 'heat == 1 is melt-guard (the top boundary is closed)');
});

test('state() reports spend, remaining, and the current rate', () => {
  const g = new Governor({ budget: 20, ceiling: 4, window: 4 });
  g.charge(2); g.charge(2);
  const s = g.state();
  assert.equal(s.spent, 4);
  assert.equal(s.remaining, 16);
  assert.equal(s.rate, (2 + 2) / 4, 'rate is burn over the window');
});

test('KAPPA is 1/φ', () => { assert.ok(Math.abs(KAPPA - 0.6180339887) < 1e-9); });
