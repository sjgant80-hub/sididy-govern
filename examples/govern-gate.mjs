// ════════════════════════════════════════════════════════════════
// The gate — does the governor hold burn in the κ band? Three proofs:
//   1. CIRCUIT-BREAKER — a runaway loop's spend NEVER exceeds the budget (the melt is prevented, not
//      merely discouraged). This is the thing the autonomous specs lacked.
//   2. SELF-REGULATING  — throttle is zero while cool (rate ≤ κ·ceiling) and RISES as burn heats up.
//   3. THE BAND         — a loop sized at κ runs free and unthrottled; above it is throttled; the budget halts.
// Run:  node examples/govern-gate.mjs
// ════════════════════════════════════════════════════════════════

import { Governor, KAPPA } from '../sididy-govern.mjs';

console.log('sididy-govern · RESOURCE GATE\n');

// 1 · circuit-breaker: a greedy loop that wants to burn forever is capped at the budget
const g1 = new Governor({ budget: 100, ceiling: 4 });
const r1 = g1.run((n) => {}, { cost: () => 3, maxCycles: 10000 });   // wants to burn 3/cycle, unbounded
const capped = g1.spent <= 100;
console.log(`  1 · circuit-breaker : ran ${r1.ran} steps, spent ${g1.spent}/100 → ${capped ? '✓ spend never exceeds budget' : '✗ OVERSPENT'}`);

// 2 · self-regulating throttle: sweep the burn-rate, throttle must rise monotonically past κ·ceiling
const ceiling = 4;
const throttleAt = (ratePerCycle) => { const g = new Governor({ budget: Infinity, ceiling }); let last; for (let i = 0; i < 20; i++) last = g.charge(ratePerCycle); return last.throttle; };
const cool = throttleAt(1), warm = throttleAt(3), hot = throttleAt(6);
const regulates = cool === 0 && warm > cool && hot > warm;
console.log(`  2 · self-regulating : throttle @rate1=${cool}ms  @rate3=${warm}ms  @rate6=${hot}ms → ${regulates ? '✓ zero when cool, rises as it heats' : '✗ not monotone'}`);

// 3 · the band: a loop at κ·ceiling runs free; a loop above it is throttled
const atKappa = throttleAt(KAPPA * ceiling);           // exactly at the threshold
const above = throttleAt(0.9 * ceiling);
const band = atKappa === 0 && above > 0;
console.log(`  3 · the κ band      : @κ·ceiling throttle=${atKappa}ms (free), @0.9·ceiling throttle=${above}ms (throttled) → ${band ? '✓ holds at κ' : '✗'}`);

console.log('');
console.log(capped && regulates && band
  ? '✓ PASS — the resource gate holds. A runaway loop is capped at its budget (no runaway bill), the sink\n' +
    '  pulls harder as burn heats up, and a κ-sized loop runs free. The second witness: correctness-gate\n' +
    '  keeps the fold RIGHT, resource-gate keeps it AFFORDABLE. Both, or an autonomous loop cooks itself.'
  : '✗ the governor did not hold the band — fix before wiring it as the loop\'s second gate.');
