// ════════════════════════════════════════════════════════════════
// sididy-govern · the resource gate — the SECOND witness (the heat sink, translated honestly).
//
// An autonomous loop that runs on its own output ([[si-didy-loop]], the wisp) has a CORRECTNESS gate
// (κ / witness / assessor) but NO RESOURCE gate — nothing stops it burning an unbounded bill. That is the
// real "thermal runaway" in software: not temperature, but resource burn (compute / tokens / cost / time).
// The heat sink is that runaway's gate, so this governs burn the way a sink governs heat:
//
//     budget ≥ κ · burn         (sink ≥ κ · core, at κ = 1/φ)
//     · ceiling too high → burn runs hot toward the cap (the melt / runaway bill)
//     · ceiling too low  → over-throttled, the loop can't do work (the stall / flatline)
//     · at κ             → runs hot enough to work, bounded enough to survive (the held band)
//
// The sink pulls HARDER as the core heats: throttle is zero below κ·ceiling and rises as the burn-rate
// climbs. The budget is the hard circuit-breaker — spend can NEVER exceed it (the melt is prevented, not
// merely discouraged). Self-contained, zero-dep, deterministic. Wrap any autonomous step with it.
// ════════════════════════════════════════════════════════════════

export const KAPPA = (Math.sqrt(5) - 1) / 2;             // 1/φ ≈ 0.618 — the stability threshold

export class Governor {
  // budget  = total resource the loop may ever spend (hard cap → halt).
  // ceiling = the sustainable burn-rate per cycle (the sink's capacity).
  // window  = cycles over which the burn-rate is measured.
  constructor({ budget = Infinity, ceiling = 4, window = 8 } = {}) {
    this.budget = budget; this.ceiling = ceiling; this.window = window;
    this.spent = 0; this.recent = []; this.halted = false;
  }

  // charge the loop `cost` for one step. Returns the gate decision. If the charge would break the budget,
  // it is REFUSED (spend unchanged) and the governor halts — the circuit-breaker, so spend ≤ budget always.
  charge(cost = 1) {
    if (this.halted || this.spent + cost > this.budget) {
      this.halted = true;
      return { ok: false, halted: true, spent: this.spent, remaining: Math.max(0, this.budget - this.spent), throttle: Infinity, status: 'halted' };
    }
    this.spent += cost;
    this.recent.push(cost); if (this.recent.length > this.window) this.recent.shift();
    const rate = this.recent.reduce((s, x) => s + x, 0) / this.window;    // burn per cycle over the window
    const heat = rate / this.ceiling;                                     // ≥1 ⇒ over the sink's capacity
    const throttle = heat <= KAPPA ? 0 : Math.round(1000 * (heat - KAPPA)); // sink pulls harder as it heats
    const status = heat <= KAPPA ? 'cool' : heat < 1 ? 'throttling' : 'melt-guard';
    return { ok: true, halted: false, spent: this.spent, remaining: this.budget - this.spent, rate, heat, throttle, status };
  }

  state() {
    const rate = this.recent.reduce((s, x) => s + x, 0) / this.window;
    return { spent: this.spent, remaining: Math.max(0, this.budget - this.spent), rate, halted: this.halted };
  }

  // wrap an autonomous step: run it only while the budget holds, charging `cost` each cycle. Returns the
  // number of steps actually run before the governor halted it. This is the loop's second gate.
  run(step, { cost = () => 1, maxCycles = Infinity } = {}) {
    let n = 0;
    while (n < maxCycles) {
      const c = typeof cost === 'function' ? cost(n) : cost;
      const gate = this.charge(c);
      if (!gate.ok) break;                                                // budget spent — halt
      step(n, gate);
      n++;
    }
    return { ran: n, spent: this.spent, halted: this.halted };
  }
}

export default Governor;
