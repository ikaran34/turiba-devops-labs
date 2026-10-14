# Lab 3 · Branch, review, release

<!-- Copy this file to lab3/README.md (Lab 3, step 1.4) and fill it in as you go.
     Keep the headings exactly as they are: the grader looks for them by name.
     Put command output in the ```text blocks. -->

Fork: https://github.com/ikaran34/turiba-devops-labs
Release: https://github.com/ikaran34/turiba-devops-labs/releases/tag/v0.1.0
Reviewer: @mleitass

## Part 1 · Set up
ssh -T git@github.com:
Hi ikaran34! You've successfully authenticated, but GitHub does not provide shell access.

git remote -v:
origin    git@github.com:ikaran34/turiba-devops-labs.git (fetch)
origin    git@github.com:ikaran34/turiba-devops-labs.git (push)
upstream  https://github.com/mleitass/turiba-devops-labs.git (fetch)
upstream  https://github.com/mleitass/turiba-devops-labs.git (push)

Output of `ssh -T git@github.com` (or `gh auth status`):

```text

```

Output of `git remote -v`:

```text

```

## Part 2 · Playground

Playground section skipped due to time. This section is not part of the graded gates.
  GNU nano 8.7.1                  lab3/README.md *
# Lab 3 · Branch, review, release

<!-- Copy this file to lab3/README.md (Lab 3, step 1.4) and fill it in as y>
     Keep the headings exactly as they are: the grader looks for them by na>
     Put command output in the ```text blocks. -->

Fork: https://github.com/ikaran34/turiba-devops-labs
Release: https://github.com/ikaran34/turiba-devops-labs/releases/tag/v0.1.0
Reviewer: @mleitass

## Part 1 · Set up
ssh -T git@github.com:
Hi ikaran34! You've successfully authenticated, but GitHub does not provide>
The hash in `.git/refs/heads/main` (step 2.3):

The first line of `git cat-file -p HEAD` (step 2.3):

The conflict block you saw in `config/app.env` (step 2.6):

```text

```

Which value you kept, and why:

The final `git log --oneline --graph --all` (step 2.6):

```text

```

## Part 3 · Rescue missions

### m1 (worked example)
- `PASS m1 5da66fcb`
- Symptom: `deploy.sh` was edited with a typo and a wrong value; nothing staged or committed
- Command: `git restore deploy.sh`
- Why not something more dangerous: this resets just one file to the last commit. `git reset --hard` would discard every other uncommitted change too.

### m2
- `PASS m2 b3cd948b`
- Symptom: `.env` with a database password was staged together with a real change to `app.js`
- Command: `git restore --staged .env`, commit the app.js change, add `.env` to `.gitignore`, then `git add .gitignore && git commit`
- Why not something more dangerous: `git reset --hard` would also have discarded the app.js change. `git restore --staged` only removes the secret from the index.

### m3
- `PASS m3 e91b8b1c`
- Symptom: the last commit message was misspelled and the commit was missing `CONTRIBUTING.md`; nothing pushed
- Command: `git add CONTRIBUTING.md && git commit --amend -m "docs: add CONTRIBUTING.md"`
- Why not something more dangerous: `--amend` rewrites the last commit, safe because it hasn't been pushed. If it had been pushed, we would use `git revert` instead.

### m4
- `PASS m4 b3f6b643`
- Symptom: two commits on `main` belonged on a `feature/cache` branch
- Command: `git branch feature/cache && git reset --hard HEAD~2`
- Why not something more dangerous: `git reset --hard HEAD~2` looks dangerous, but the two commits are already saved under `feature/cache`, so nothing is lost.

### m6
- `PASS m6 cfa2e646`
- Symptom: three commits vanished after `git reset --hard HEAD~3`
- Command: `git reset --hard HEAD@{1}` (found via `git reflog`)
- Why not something more dangerous: without `reflog` the commits would be unreachable and eventually garbage-collected.
## Part 4 — Protected main and pull requests:

PR #1: https://github.com/ikaran34/turiba-devops-labs/pull/1  (merged, squash)
PR #2: https://github.com/ikaran34/turiba-devops-labs/pull/2  (merged, squash)

Push to main rejected:
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.

Conflict in PR #2: after PR #1 was merged, `docs/api-healthz` conflicted with `main`
on the last two lines of `CHANGELOG.md`. Fixed by keeping both lines and deleting the
three marker lines, then `git diff --check` (no output), `git add CHANGELOG.md`,
`git commit`, `git push`.

## Part 5 · Release

Release URL: https://github.com/ikaran34/turiba-devops-labs/releases/tag/v0.1.0

Annotated tag v0.1.0 on main, confirmed with:
git ls-remote --tags origin
f1089f37...  refs/tags/v0.1.0
f16b5e07...  refs/tags/v0.1.0^{}

Why 0.1.0 and not 1.0.0: the API works but its surface may still change — SemVer
treats 0.x as pre-stable, so 0.1.0 is the correct first release.

## Answers

1. What does git cat-file -p HEAD show, and what does the branch file contain?
It shows the commit object: a tree line (root folder contents), parent, author, committer and the message. The branch is a plain file like .git/refs/heads/main holding the 40-char SHA of that commit. Moving the branch = rewriting that file.

2. Fast-forward vs three-way merge — what's the difference?
Fast-forward: main simply moves forward to the branch's commit — no new commit. Three-way merge: branches diverged, so Git creates a new merge commit with two parents joining the histories.

3. Why git revert instead of git reset --hard for a pushed commit?
revert adds a new commit that undoes the change — history stays intact, and anyone who already pulled isn't broken. reset --hard + force-push rewrites public history and breaks everyone else's clones.

4. How would you recover commits deleted by git reset --hard HEAD~3?
git reflog — it records every HEAD movement. Find the pre-reset commit (HEAD@{1} or an explicit SHA) and git reset --hard <sha>, or git branch rescue <sha> to pin it on a new branch.
