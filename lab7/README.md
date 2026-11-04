## 4 · What broke and how I found it
nano lab7/README.md# Lab 7 · Run it on a cluster
GitHub user: ikaran34 · Fallback image used: no

## 1 · Deploy
**Prediction:** I expected 3 Pods named `api-<hash>-<suffix>`.
**What I saw:**
```text
NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/api   3/3     3            3           8m18s
**curl output:**
```text
{"name":"course-api","version":"0.2.0"}



## 2 · Heal and scale
**Prediction (delete one Pod):** A new Pod appears within 1-2 seconds.
**Prediction (scale to 5):** Kubernetes creates 2 new Pods.
**What I saw (scale to 5):**
```text
api-7747fbf6fb-c5frr   0/1     ContainerCreating   0          0s
api-7747fbf6fb-zjxkz   0/1     ContainerCreating   0          0s


What I saw (scale back to 3):

api-7747fbf6fb-c5frr   1/1     Terminating   0          28s
api-7747fbf6fb-zjxkz   0/1     Terminating   0          28s


## 3 · Roll and roll back

From: `ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0`

To: `ghcr.io/ikaran34/turiba-devops-labs/api:ca0bada079aa9af85eb483f6c22ec2ae75494914`

**rollout status:**


```text
deployment "api" successfully rolled out


3b — Roll back:


Prediction: Old Pods stay running because the new image fails to pull.

get pods during the stall:

api-76457864fd-6p94s   0/1     ErrImagePull   0          31s

rollout undo:

deployment.apps/api rolled back

Why the warning: rollout undo changes the cluster but not the local YAML. I restored with git restore and re-applied.


## 4 · What broke and how I found it


**Fault 1 — Image tag typo:**
- Saw: Pod in `ErrImagePull`.
- Command: `kubectl describe pod <name> | grep -A 5 Events` → `Back-off pulling image "...api:0.2.O"`.
- Fix: changed `0.2.O` → `0.2.0` in `k8s/api-deployment.yaml`.

**Fault 2 — Service selector mismatch:**
- Saw: Endpoints `<unset>`.
- Command: `kubectl get svc api -o jsonpath='{.spec.selector}'` returned `{"app.kubernetes.io/name":"api"}`.
- Fix: changed selector to `app: api` in `k8s/api-service.yaml`.


**Fault 3 — Wrong targetPort:**
- Saw: Port-forward `connection refused`.
- Command: `kubectl get endpointslices -l kubernetes.io/service-name=api` showed `PORTS 8080`.
- Fix: changed `targetPort: 8080` → `5000` in `k8s/api-service.yaml`.


