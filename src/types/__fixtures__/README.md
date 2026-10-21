ForecastAccuracyMetrics provenance
=================================

The snapshot body was compared byte for byte with backend commit
`880bc51b7cf37d7fd11c8945daad2cdf958acdc6`, path
`shared/generated-types/ForecastAccuracyMetrics.ts`. Its SHA-256 is
`5c4d91377aba4022188fe46bb768000d09f2fd59b80da91d5908cfb676e22abc`.
The Jest shim test pins both the complete provenance line and body digest.

With a refreshed local backend checkout, check current drift offline:

```
node scripts/check-forecast-accuracy-snapshot.mjs /path/to/backend origin/main
```

This command requires the named provenance commit and current source. Missing
objects, a changed provenance line, byte edits, or source drift return nonzero.
It performs no fetch. The caller supplies the checkout and ref, so freshness is
the caller's responsibility. Run its negative controls with:

```
node --test scripts/__tests__/forecast-accuracy-snapshot.test.mjs
```

To refresh, review the backend wire contract, update the fixture and ambient
alias together, and deliberately update the commit/hash pins in both checks.
The source's ts-rs banner is copied verbatim; a working core4 exporter is not
established. Canonical generator ownership remains an owner decision.
