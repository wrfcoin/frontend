// pr-gate.mjs — decide which path-filtered PR workflows SHOULD have run for this
// PR's changed files, then require every one of them to have succeeded.
//
// Why: test.yml, typecheck.yml and fabrication-ratchet.yml carry `paths:` filters,
// so a docs-only PR never gets them. Marking them "required" would block such PRs
// forever. `pr-gate.yml` has no filter, so its single job reports on every PR and
// is the one check to require.
//
// The path lists are NOT copied here: they are read from the workflow files in the
// checkout at run time, so editing a `paths:` list in a workflow changes what this
// gate expects with no second edit. If a list cannot be parsed the workflow is
// treated as "should have run" (fail closed).
//
// Needs: GITHUB_TOKEN (contents/checks/actions: read), GITHUB_REPOSITORY,
// PR_NUMBER, PR_HEAD_SHA. Pure functions are exported for pr-gate.test.mjs.

import { readFileSync } from "node:fs";

export const GATED_WORKFLOWS = [
  "test.yml",
  "typecheck.yml",
  "fabrication-ratchet.yml",
];

// Returns { paths: string[] | null } for the `pull_request` trigger.
// null  = trigger present but no `paths:` filter (always runs)
// undefined return = no pull_request trigger at all (never runs on PRs)
export function parsePullRequestPaths(yaml) {
  const lines = yaml.split(/\r?\n/);
  const indentOf = (l) => l.length - l.trimStart().length;
  const meaningful = (l) => l.trim() !== "" && !l.trim().startsWith("#");

  const prIdx = lines.findIndex((l) => /^\s+pull_request\s*:\s*(#.*)?$/.test(l));
  if (prIdx === -1) {
    // `on: [pull_request]` / `on: pull_request` inline forms carry no filter.
    const inline = lines.some((l) => /^on\s*:.*\bpull_request\b/.test(l));
    return inline ? { paths: null } : undefined;
  }
  const prIndent = indentOf(lines[prIdx]);
  let pathsIdx = -1;
  for (let i = prIdx + 1; i < lines.length; i++) {
    if (!meaningful(lines[i])) continue;
    if (indentOf(lines[i]) <= prIndent) break;
    if (/^\s+paths\s*:\s*(#.*)?$/.test(lines[i])) {
      pathsIdx = i;
      break;
    }
    if (/^\s+paths-ignore\s*:/.test(lines[i])) {
      throw new Error("paths-ignore is not supported by pr-gate; treat as always-run");
    }
  }
  if (pathsIdx === -1) return { paths: null };

  const pathsIndent = indentOf(lines[pathsIdx]);
  const paths = [];
  for (let i = pathsIdx + 1; i < lines.length; i++) {
    if (!meaningful(lines[i])) continue;
    if (indentOf(lines[i]) < pathsIndent) break;
    const m = lines[i].match(/^\s*-\s*(?:"([^"]*)"|'([^']*)'|([^#\s][^#]*?))\s*(?:#.*)?$/);
    if (!m) break;
    paths.push(m[1] ?? m[2] ?? m[3]);
  }
  if (paths.length === 0) throw new Error("empty paths list");
  return { paths };
}

export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

// GitHub semantics: a file is selected if the last pattern matching it is positive.
export function matchesPaths(file, patterns) {
  let selected = false;
  for (const p of patterns) {
    const neg = p.startsWith("!");
    if (globToRegExp(neg ? p.slice(1) : p).test(file)) selected = !neg;
  }
  return selected;
}

export function shouldRun(yaml, changedFiles) {
  let parsed;
  try {
    parsed = parsePullRequestPaths(yaml);
  } catch {
    return { run: true, why: "paths filter unparseable (fail closed)" };
  }
  if (parsed === undefined) return { run: false, why: "no pull_request trigger" };
  if (parsed.paths === null) return { run: true, why: "no paths filter" };
  const hit = changedFiles.find((f) => matchesPaths(f, parsed.paths));
  return hit
    ? { run: true, why: `matched ${hit}` }
    : { run: false, why: "no changed file matches its paths filter" };
}

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function changedFiles(repo, pr) {
  const files = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/repos/${repo}/pulls/${pr}/files?per_page=100&page=${page}`);
    for (const f of batch) {
      files.push(f.filename);
      if (f.previous_filename) files.push(f.previous_filename);
    }
    if (batch.length < 100) break;
  }
  return files;
}

// Latest pull_request run of `workflow` on `sha`, or undefined.
async function latestRun(repo, workflow, sha) {
  const { workflow_runs } = await api(
    `/repos/${repo}/actions/workflows/${workflow}/runs?head_sha=${sha}&event=pull_request&per_page=30`,
  );
  return workflow_runs.sort((a, b) => b.run_number - a.run_number || b.run_attempt - a.run_attempt)[0];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(repo, workflow, sha, { appearMs, doneMs }) {
  const start = Date.now();
  for (;;) {
    const run = await latestRun(repo, workflow, sha);
    if (run?.status === "completed") return run;
    const elapsed = Date.now() - start;
    if (!run && elapsed > appearMs) return undefined;
    if (elapsed > doneMs) return run;
    await sleep(15_000);
  }
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const pr = process.env.PR_NUMBER;
  const sha = process.env.PR_HEAD_SHA;
  const files = await changedFiles(repo, pr);
  console.log(`PR #${pr} head ${sha}: ${files.length} changed file(s)`);

  const expected = [];
  for (const wf of GATED_WORKFLOWS) {
    const yaml = readFileSync(`.github/workflows/${wf}`, "utf8");
    const d = shouldRun(yaml, files);
    console.log(`${d.run ? "EXPECT" : "skip  "} ${wf}: ${d.why}`);
    if (d.run) expected.push(wf);
  }
  if (expected.length === 0) {
    console.log("No path-filtered workflow applies to this PR; gate passes.");
    return;
  }

  const failures = [];
  const results = await Promise.all(
    expected.map(async (wf) => [
      wf,
      await waitFor(repo, wf, sha, { appearMs: 10 * 60_000, doneMs: 30 * 60_000 }),
    ]),
  );
  for (const [wf, run] of results) {
    if (!run) failures.push(`${wf}: expected but no run appeared for ${sha}`);
    else if (run.status !== "completed") failures.push(`${wf}: still ${run.status} after timeout (${run.html_url})`);
    else if (run.conclusion !== "success") failures.push(`${wf}: ${run.conclusion} (${run.html_url})`);
    else console.log(`ok     ${wf}: success (${run.html_url})`);
  }
  if (failures.length) {
    for (const f of failures) console.error(`::error::${f}`);
    process.exit(1);
  }
  console.log("All expected workflows succeeded; gate passes.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
