# Capstone · Ship it, run it, explain it

## Run it from zero

```bash
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
