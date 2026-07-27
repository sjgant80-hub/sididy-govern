# sididy-govern — specification

## Purpose

The resource gate — the second witness. Meters an autonomous loop's burn (compute/tokens/cost) and holds it in the kappa band: a runaway is capped at its budget, throttle rises as burn heats up.

## Contract

- **Governor** — part of the sididy-govern public surface; deterministic, total (never throws).
- **default** — part of the sididy-govern public surface; deterministic, total (never throws).

## Guarantees

- **Deterministic** — the same input yields the same output on any machine, any run.
- **Total** — hostile or malformed input returns a defined value, never an exception.
- **Zero-dependency** — no third-party runtime code inside the trust boundary.

## Verification

The suite exercises the public surface directly and is mutation-checked: a change to any guarded line makes a
test fail. konomify admits sididy-govern only when both the structure rubric (acg-assessor) and the behaviour gate
(witness) pass.
