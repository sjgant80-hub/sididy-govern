# sididy-govern — agent instructions

The resource gate — the second witness. Meters an autonomous loop's burn (compute/tokens/cost) and holds it in the kappa band: a runaway is capped at its budget, throttle rises as burn heats up.

## Boundaries

- Keep sididy-govern zero-dependency and deterministic. Do not add runtime dependencies.
- Every change to a source line must be covered by a test that fails when the line changes (witness gate).
- Do not skip, disable, or weaken a test to make the suite green. Fix the code or the test's premise.
- Structure and behaviour are gated by konomify; a change ships only when it stays konomified.
