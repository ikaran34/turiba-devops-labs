\# Capstone · Ship it, run it, explain it



\## Run it from zero



From a fresh clone to a working app on your laptop.



\### 1. Local: Compose



```bash

git clone https://github.com/ikaran34/turiba-devops-labs.git

cd turiba-devops-labs

cp .env.example .env

\# Edit .env, set DB\_PASSWORD to any password you like

docker compose up -d

\# Open http://localhost:8080 — add a todo, it works.

### 2. Cluster: kind + Helm



kind create cluster --name capstone



kubectl create namespace course

kubectl create secret generic course-app-db \\

&#x20; --namespace course \\

&#x20; --from-literal=DB\_PASSWORD='<REPLACE\_WITH\_YOUR\_PASSWORD>'



helm upgrade --install course-app charts/course-app -n course



kubectl get pods -n course

kubectl port-forward -n course svc/course-app-api 5000:5000 \&

curl http://localhost:5000/healthz



kind delete cluster --name capstone



\## Architecture



```mermaid

flowchart LR

&#x20; L\["Your laptop<br/>docker compose up"] --> PR\["Pull request"]

&#x20; PR --> CI\["CI: lint, unit,<br/>integration, image and smoke"]

&#x20; CI --> M\["main"]

&#x20; M --> T\["tag v1.0.0"]

&#x20; T --> R\["release.yml<br/>api:1.0.0 on GHCR<br/>and GitHub Release"]

&#x20; R --> H\["helm upgrade --install<br/>charts/course-app"]

&#x20; H --> K\["kind cluster<br/>API and PostgreSQL on a PVC"]

```



\### Why does the brief want this?

The capstone brief says: \*"One diagram (Mermaid is fine) of the parts and how a commit reaches the cluster, \*\*plus 3–5 sentences\*\*."\*



The paragraph is exactly those 3–5 sentences. It explains in plain English how the diagram works: a PR triggers CI, CI pushes to GHCR, a tag creates a release, and Helm deploys it to the cluster.



