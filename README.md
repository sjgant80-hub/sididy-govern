# sididy-govern

The resource gate — the second witness. Meters an autonomous loop's burn (compute/tokens/cost) and holds it in the kappa band: a runaway is capped at its budget, throttle rises as burn heats up.

## What it is

sididy-govern is a deterministic, zero-dependency estate tool. The resource gate — the second witness. Meters an autonomous loop's burn (compute/tokens/cost) and holds it in the kappa band: a runaway is capped at its budget, throttle rises as burn heats up. It never throws on hostile input and
produces the same result on every machine.

## API

- `Governor`
- `default`

## Verify

```bash
npm test
```

Every source line is guarded by a test (mutation-checked with witness). Structure and behaviour are gated by
konomify before this build joins the mesh.

## License

MIT © 2026 sjgant80-hub
