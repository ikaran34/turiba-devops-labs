# Lab 5 · Your first CI pipeline

GitHub user: <ikaran34> · Reference files used (Lab 2 fallback): no

![ci](https://github.com/<you>/turiba-devops-labs/actions/workflows/ci.yml/badge.svg?branch=main)

<!-- Keep every heading as it is: the grader finds the sections by name. Replace every blank (four underscores), and your user name placeholder in the first line and in the badge URL: write your GitHub user name exactly as GitHub shows it. -->

## 1 · Graph predictions

Part 1, step 1.2: fill in this section **before** you run `lab05 graph`. A wrong prediction that you explain earns full marks.

My drawing of the `lab05 graph` jobs, before the first run (boxes and arrows in text are fine):

```text
____
```

| # | Question | I predicted, and why | What the run showed |
|---|----------|----------------------|---------------------|
**P1 — What the run showed:** graph-build ran first. Once it finished, graph-lint, graph-test, graph-package, and graph-report started at the same time.

**P2 — What the run showed:** No. graph-test printed "version from graph-build: 1.0.1". graph-package printed "build.txt: not here: jobs don't share files".

**P3 — What the run showed:** graph-build failed. graph-test and graph-package were skipped. graph-report still ran and succeeded.
## 2 · Pipeline

- B5, before I filled it in: `localhost` or `db`? I predicted ____ because ____
- My first red run in Part 2 (the job, the first red step, the error line copied from the log): ____
- What I changed to make it green: ____
- My lint findings, and how I fixed them (fixed, not silenced): ____
- Part 2 pull request (URL): ____
- Part 3: will the PR run push an image? I predicted ____. What happened: ____
- My image on GHCR, from the `main` run: `ghcr.io/____/turiba-devops-labs/api:____`

## 3 · Red PR

## 3 · Red, then green

**PR URL:** https://github.com/ikaran34/turiba-devops-labs/pull/12

**First push (red):**
- `ci / integration` failed with: `Expected: 404 / Received: 500`
- `ci / image` was skipped (it needs `integration`)
- Merge button: "Some checks were not successful" (greyed out)

**Cause from the API log:**
`DELETE /api/todos/abc failed: invalid input syntax for type integer: "abc"`

**Fix:**
Added `if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'todo not found' });` at the top of the `DELETE /api/todos/:id` handler in `api/server.js`. The subsequent lint and integration failures showed additional bugs, which were fixed as well.

**Which commit did the red check test?**
The first commit on the branch (`db0c79f test: DELETE /api/todos/abc must answer 404`), before any fix was applied. The run's summary page shows the commit hash. Because a PR's checks run on the merge of the PR branch into `main`, the red check tested the branch state with the failing test, and the green check tested the same branch with the fix applied.
## 4 · Answers

**A1.** ____

**A2.** ____

**A3.** ____

**A4.** ____
