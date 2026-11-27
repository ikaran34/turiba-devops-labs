kcat > capstone/README.md <<'EOF'
# Capstone — Course App on kind

## What this is

A full DevOps pipeline for a small Node.js course API plus PostgreSQL:
local Docker Compose, CI on every PR, a tagged release to GHCR,
a Helm chart, and a kind cluster provisioned with OpenTofu.

## Architecture

```mermaid
flowchart LR
  L["Your laptop<br/>docker compose up"] --> PR["Pull request"]
  PR --> CI["CI: lint, unit,<br/>integration, image and smoke"]
  CI --> M["main"]
  M --> T["tag v1.0.0"]
  T --> R["release.yml<br/>api:1.0.0 on GHCR<br/>and GitHub Release"]
  R --> H["helm upgrade --install<br/>charts/course-app"]
  H --> K["kind cluster<br/>API and PostgreSQL on a PVC"]


What is where
Path	What it is
api/	The Node.js course API (routes, DB, validation, tests)
api/Dockerfile	Multi-stage, non-root, with HEALTHCHECK
charts/course-app/	Helm chart (API, DB, Secret ref, PVC)
.github/workflows/ci.yml	lint, unit, integration, image (with smoke test)
.github/workflows/release.yml	Tag-triggered release to GHCR and GitHub Release
infra/	OpenTofu code (kind cluster, namespace, secret, chart)
compose.yaml	Local dev: web, api, db
Quick start
bash
docker compose up --build
curl http://localhost:8080/healthz

tofu -chdir=infra init
tofu -chdir=infra apply -auto-approve
kubectl get pods -n course
Evidence
M1 — Container: api/Dockerfile multi-stage, non-root, HEALTHCHECK. Compose works.

M2 — Branching: main protected, every change via PR.

M3 — CI: ci.yml runs lint, unit, integration, image build with smoke test. Green on main.

M4 — Release: v1.0.0 tag from github-actions, image at ghcr.io/ikaran34/turiba-devops-labs/api:1.0.0, GitHub Release published.

M5 — Cluster: helm install course-app charts/course-app -n course gives 3 API Pods and 1 DB Pod. Data survives a DB Pod restart.

M6 — Secrets: No secrets in Git. .env.example documents the shape; real values from a Secret.

M7 — This README.
EOF


