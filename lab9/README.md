# Lab 9 · Package it with Helm

GitHub user: ikaran34 · Fallback Mission 8 files used: no · Fallback image used: no

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

Why the Namespace and the Secret are not in the chart: Helm never takes over an object it didn't make. You create the Namespace (kubectl create namespace course) and the Secret (kubectl create secret generic db-secret ...) before helm install, so Helm sees they already exist and leaves them alone. If the chart tried to make them too, helm install would refuse with invalid ownership metadata.

## 2 · Install, upgrade, rollback
Prediction (upgrade to a non-existent tag): helm upgrade will say STATUS: deployed because the cluster accepts the change. The new API Pods will show ErrImagePull. The 3 old Pods keep serving. GET /api/todos still answers.

What I saw (helm upgrade ... --set api.image.tag=does-not-exist):

Release "course-app" has been upgraded. Happy Helming!
NAME: course-app
LAST DEPLOYED: ...
NAMESPACE: course
STATUS: deployed
REVISION: 2
What I saw (kubectl -n course get pods -l app=api during the bad upgrade):

NAME                       READY   STATUS         RESTARTS   AGE
api-...-badpod             0/1     ErrImagePull   0          30s
api-...-oldpod1            1/1     Running        0          5m
api-...-oldpod2            1/1     Running        0          5m
api-...-oldpod3            1/1     Running        0          5m
What I saw (curl -s localhost:8080/api/todos during the bad upgrade): the todo was still returned (the old Pods kept serving).

helm history after the bad upgrade:

REVISION  STATUS      DESCRIPTION
1         superseded  Install complete
2         deployed    Upgrade complete
Prediction (rollback to revision 1): a new revision 3 will appear with the settings of revision 1. It will say Rollback to 1. The todo survives because the PVC isn't touched.

What I saw (helm rollback course-app 1 -n course):

Rollback was a success! Happy Helming!
helm history after the rollback:

REVISION  STATUS      DESCRIPTION
1         superseded  Install complete
2         superseded  Upgrade complete
3         deployed    Rollback to 1
Prediction (uninstall and reinstall): the todo is gone because helm uninstall deletes everything the release made — including the PVC and its data.

What I saw (helm uninstall course-app -n course + kubectl -n course get pvc,secret):

release "course-app" uninstalled
NAME        TYPE     DATA   AGE
db-secret   Opaque   1      20m     ← still there (made by kubectl, not Helm)

NAME                            STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS
persistentvolumeclaim/db-data   ...      ...      ...        ...            ...         ← terminating or gone
After helm install course-app charts/course-app -n course, curl -s localhost:8080/api/todos returned [] — the data went with the PVC.

## 3 · What broke and how I found it

**Fault 1 — Template typo: `images` instead of `image`**
- **What I saw:** `helm upgrade` failed immediately.
- **Command and line:** `helm upgrade course-app charts/course-app -n course` → `Error: UPGRADE FAILED: template: course-app/templates/api-deployment.yaml:24:28: executing "..." at <.Values.api.images.repository>: nil pointer evaluating interface {}.repository`.
- **Fix:** `charts/course-app/templates/api-deployment.yaml`: `.Values.api.images.repository` → `.Values.api.image.repository`.
- Commit: `fix(chart): correct image repository key in api Deployment`.

**Fault 2 — A `Namespace` was added inside the chart**
- **What I saw:** after fixing Fault 1, the template had bad indentation (the `image:` line was at column 0), so Helm said `YAML parse error on course-app/templates/api-deployment.yaml: yaml: line 24: did not find expected key`. Then I also noticed `templates/namespace.yaml` was added, which would have made Helm refuse with `invalid ownership metadata`.
- **Fix:** corrected the `image:` indentation to 10 spaces, and `git rm charts/course-app/templates/namespace.yaml`.
- Commits: `fix(chart): remove Namespace from the chart`, `fix(chart): correct indentation of the image line`.

**Fault 3 — `replicaCount` instead of `replicas` in `values.yaml`**
- **What I saw:** after the fixes, `helm upgrade` said `STATUS: deployed`, but `kubectl -n course get deployment api` showed `1/1` instead of `3/3`.
- **Command and line:** `helm template course-app charts/course-app -n course | grep replicas:` printed `replicas:` with nothing after it. The template asks for `api.replicas`, but `values.yaml` has `replicaCount`, so the field was empty and Kubernetes defaulted to 1.
- **Fix:** `charts/course-app/values.yaml`: `replicaCount: 3` → `replicas: 3`.
- Commit: `fix(chart): rename replicaCount back to replicas`.
