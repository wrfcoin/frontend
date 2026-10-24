import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GATED_WORKFLOWS, globToRegExp, matchesPaths, parsePullRequestPaths, shouldRun } from "./pr-gate.mjs";

const wf = (n) => readFileSync(new URL(`../workflows/${n}`, import.meta.url), "utf8");

test("globs follow GitHub semantics", () => {
  assert.ok(globToRegExp("src/**").test("src/a/b.ts"));
  assert.ok(globToRegExp("src/**/*.ts").test("src/a.ts"));
  assert.ok(globToRegExp("src/**/*.ts").test("src/a/b/c.ts"));
  assert.ok(!globToRegExp("src/**/*.ts").test("src/a.tsx"));
  assert.ok(!globToRegExp("package.json").test("x/package.json"));
  assert.ok(!matchesPaths("src/a.ts", ["src/**", "!src/**/*.ts"]));
});

test("every gated workflow parses to a non-empty paths list from the real file", () => {
  for (const n of GATED_WORKFLOWS) {
    const p = parsePullRequestPaths(wf(n));
    assert.ok(p?.paths?.length > 0, `${n} should have a pull_request paths filter`);
    assert.ok(p.paths.includes(`.github/workflows/${n}`), `${n} should list itself`);
  }
});

test("docs-only change expects nothing; src change expects all three", () => {
  for (const n of GATED_WORKFLOWS) assert.equal(shouldRun(wf(n), ["README.md", "docs/x.md"]).run, false, n);
  for (const n of GATED_WORKFLOWS) assert.equal(shouldRun(wf(n), ["src/app/x.ts"]).run, true, n);
});

test("narrow filters are respected", () => {
  assert.equal(shouldRun(wf("test.yml"), ["jest.config.cjs"]).run, true);
  assert.equal(shouldRun(wf("typecheck.yml"), ["jest.config.cjs"]).run, false);
  assert.equal(shouldRun(wf("typecheck.yml"), ["tsconfig.test.json"]).run, true);
});

test("fail closed: unfiltered or unparseable triggers always expect a run", () => {
  assert.equal(shouldRun("on:\n  pull_request:\n    branches: [main]\n", ["README.md"]).run, true);
  assert.equal(shouldRun("on:\n  pull_request:\n    paths-ignore:\n      - a\n", ["README.md"]).run, true);
  assert.equal(shouldRun("on:\n  push:\n    branches: [main]\n", ["src/x.ts"]).run, false);
});
