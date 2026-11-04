# Lab 7 · Run it on a cluster

GitHub user: ikaran34 · Fallback image used: no

## 1 · Deploy

**Prediction (how many Pods, names):** I expected 3 Pods named `api-<hash>-<suffix>`. The hash changes when the Pod template changes.

**What I saw (`kubectl -n course get deploy,rs,pods`):**
```text
NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/api   3/3     3            3           8m18s

NAME                             DESIRED   CURRENT   READY   AGE
replicaset.apps/api-6d5d485ddf   0         0         0       8m18s
replicaset.apps/api-7747fbf6fb   3         3         3       44s
replicaset.apps/api-78696db45b   0         0         0       83s

NAME                       READY   STATUS    RESTARTS   AGE
pod/api-7747fbf6fb-9jw7v   1/1     Running   0          43s
pod/api-7747fbf6fb-bv688   1/1     Running   0          42s
pod/api-7747fbf6fb-s5jr7   1/1     Running   0          44s
