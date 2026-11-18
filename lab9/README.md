# Lab 9 · Package it with Helm

GitHub user: ikaran34 · Fallback image used: no · Fallback Mission 8 files used: no

<!-- Keep every heading as it is: the grader finds the sections by name. Replace every blank (four underscores). Paste command output inside the ```text blocks. Never paste your password. -->

## 1 · From k8s/ to a chart

**Prediction (which lines change with `--set api.replicas=2`):** Only the `replicas:` line of the API Deployment changes (from 3 to 2). Without `--set`, the value comes from `charts/course-app/values.yaml` (`api.replicas: 3`).

**`helm lint`:** passes (`1 chart(s) linted, 0 chart(s) failed`).

**`helm template` output with `--set api.replicas=2`:**
```text
  replicas: 2
          image: postgres:17-alpine
          image: "ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0"
  replicas: 1
          image: postgres:17-alpine

## 2 · Install, upgrade, rollback

**3a — Prediction (upgrade to a non-existent tag):** `helm upgrade` will say `STATUS: deployed` because the cluster accepts the change. The new API Pods will show `ErrImagePull` because the tag doesn't exist. The 3 old Pods keep serving because the rolling update protects them. `GET /api/todos` still answers.

**3b — Prediction (rollback to revision 1):** `helm rollback course-app 1` will create revision 3 (not 2). Revision 3 will say `Rollback to 1`. The todo survives because the PVC isn't touched.

**4 — Prediction (uninstall and reinstall):** The todo is gone because `helm uninstall` deletes everything the release made — including the PVC and its data.

