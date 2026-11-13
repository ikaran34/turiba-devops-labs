# Lab 8 · Run the whole app

GitHub user: ikaran34 · Fallback image used: no · Fallback Mission 7 files used: no

<!-- Keep every heading as it is: the grader finds the sections by name. Replace every blank (four underscores). Paste command output inside the ```text blocks. Never paste your password, not even the base64 form. -->

## 1 · Database with storage

**Prediction (PVC right after `apply`, before the db Pod starts):** I expected the PVC to be `Pending` until the db Pod was scheduled, then `Bound` right after. What I saw: the PVC stayed `Pending` for about 3 minutes until I deleted and re-applied the db Deployment — a chicken-and-egg race on the fresh cluster. After that it bound instantly.

**What I saw (`kubectl -n course get pods,pvc`):**
```text
NAME                      READY   STATUS    RESTARTS   AGE
pod/db-6cffc655cc-zms44   1/1     Running   1 (7m13s ago)   45h

NAME                            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
persistentvolumeclaim/db-data   Bound    pvc-167ea174-405d-4880-ba38-aebd2808ec8e   1Gi        RWO            standard       45h

pg_isready output:

localhost:5432 - accepting connections
GET /api/todos before deleting the db Pod:

[{"id":1,"title":"survive a restart","done":false,"created_at":"..."},{"id":2,...}]

Prediction (delete the db Pod, does the todo survive?): I expected the todo to survive because the PVC keeps the data on disk.

What I saw: I deleted the db Pod, the new one came up 1/1 Running in 3 seconds, and curl -s localhost:8080/api/todos still returned both todos. Data survived.

## 2 · Connect the API

kubectl -n course logs deployment/api -c wait-for-db:

db:5432 - accepting connections
kubectl -n course logs deployment/api -c api:

API listening on port 5000
Database ready
Prediction (does the Secret show my password in base64?): I expected to see it in base64, which is trivially decodable — that's why the Secret is never committed to Git.

What I saw: kubectl -n course get secret db-secret -o yaml showed the password in base64 under .data.password. Decoding with base64 -d revealed the plaintext practice password.


## 3 · Health and resources

- 🔮 On my working copy only, I pointed the **liveness** probe of the API at `/nope` and applied it. Will those Pods get traffic? Will they be restarted? I predicted **the Pods would keep serving traffic because readiness was still passing on `/healthz`, but liveness would fail after about 30 seconds and the container would be restarted in a loop. RESTARTS would climb and the Pods would eventually enter CrashLoopBackOff** because **the liveness probe is the one that kills a container that looks stuck — readiness only removes it from the Service.** What happened: **after applying, the Pods kept accepting requests through the port-forward for about 30 seconds, then RESTARTS jumped from 0 to 3 within a minute. `kubectl -n course describe pod` showed `Liveness probe failed: HTTP probe failed with statuscode: 404` followed by `Container api failed liveness probe, will be restarted`. The Pods stayed 1/1 Running between restarts, so traffic kept flowing. I then ran `git restore k8s/ && kubectl apply -f k8s/` to bring Git and the cluster back in sync.**

```text
$ kubectl -n course get pods -l app=api       (about a minute later)

$ kubectl -n course describe pod <api-pod>         (only the Events)

- How I made Git and the cluster agree again afterwards: git restore k8s/ && kubectl apply -f k8s/. git diff

## 4 · What broke and how I found it

**Fault 1 — ConfigMap `DB_HOST` was `database` instead of `db`**
- **What I saw:** `kubectl -n course get pods` showed a new `api` Pod stuck in `Init:0/1`.
- **Command and line:** `kubectl -n course logs <pod> -c wait-for-db` → `database:5432 - no response`, repeating.
- **Fix:** `k8s/app-config.yaml`: `DB_HOST: database` → `DB_HOST: db`.
- Commit: `fix(k8s): correct DB_HOST in ConfigMap`.

**Fault 2 — Secret key was misspelled as `pasword`**
- **What I saw:** After Fault 1, `api` Pods went to `CreateContainerConfigError`.
- **Command and line:** `kubectl -n course describe pod <pod>` → `couldn't find key pasword in Secret course/db-secret`.
- **Fix:** `k8s/api-deployment.yaml`: `key: pasword` → `key: password`.
- Commit: `fix(k8s): correct Secret key name in api Deployment`.

**Fault 3 — Readiness probe used port `5001`**
- **What I saw:** After Fault 2, `api` Pods stayed `0/1 Running` and never became Ready.
- **Command and line:** `kubectl -n course describe pod <pod>` → `Readiness probe failed: ... :5001/healthz ... connection refused`.
- **Fix:** `k8s/api-deployment.yaml`: `port: 5001` → `port: 5000`.
- Commit: `fix(k8s): correct readiness probe port`.
