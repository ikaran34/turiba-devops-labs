# Capstone · Ship it, run it, explain it

## Run it from zero

# 1. Clone the repo
git clone https://github.com/ikaran34/turiba-devops-labs
cd turiba-devops-labs

# 2. Local Compose
cp .env.example .env
docker compose up -d
# Open http://localhost:8080

# 3. Kubernetes
kind create cluster
kubectl create namespace course
kubectl -n course create secret generic db-secret --from-literal=password='<practice-password>'
helm install course-app charts/course-app -n course
kubectl -n course get pods
kubectl -n course port-forward service/api 8080:80


## Architecture

```mermaid
flowchart LR
  L["Your laptop<br/>docker compose up"] --> PR["Pull request"]
  PR --> CI["CI: lint · unit ·<br/>integration · image + smoke"]
  CI --> M["main"]
  M --> T["tag v1.0.0"]
  T --> R["release.yml<br/>api:1.0.0 on GHCR<br/>+ GitHub Release"]
  R --> H["helm upgrade --install<br/>charts/course-app"]
  H --> K["kind cluster<br/>API + PostgreSQL on a PVC"]


## What is where

| Path | What it is |
|---|---|
| `api/` | The Node.js course API (routes, DB, validation, tests) |
| `api/Dockerfile` | Multi-stage, non-root, with HEALTHCHECK |
| `charts/course-app/` | Helm chart (API + DB + Secret ref + PVC) |
| `.github/workflows/ci.yml` | lint, unit, integration, image (with smoke test) |
| `.github/workflows/release.yml` | Tag-triggered release to GHCR + GitHub Release |
| `infra/` | OpenTofu code (kind cluster + namespace + secret + chart) |
| `compose.yaml` | Local dev: web + api + db |


## Level and evidence

I am submitting for **Minimum** (or **Target** if you did OpenTofu).

- **M1:** `api/Dockerfile` — multi-stage, non-root. Compose works.
- **M2:** `main` is protected. PRs merged for each change.
- **M3:** `ci.yml` — lint, unit, integration, image (with smoke) green on `main`.
- **M4:** Release `v1.0.0` created by `github-actions`.
- **M5:** `helm install course-app charts/course-app -n course` — 3 API Pods + 1 DB Pod, data survives a db Pod restart.
- **M6:** No secrets in Git.
- **M7:** This file.


