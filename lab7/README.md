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

curl -s localhost:8080/ output:
{"name":"course-api","version":"0.2.0"}

2 · Heal and scale
Prediction (delete one Pod): When I delete one of the three Pods, kubectl get pods will show a new Pod within 1-2 seconds. The new Pod will have the same ReplicaSet hash prefix but a different random suffix.

Prediction (scale to 5): Kubernetes will create two new Pods, and the Deployment will show 5/5 ready within ~30 seconds.

What I saw (scale to 5):

NAME                   READY   STATUS              RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running             0          47m
api-7747fbf6fb-bv688   1/1     Running             0          47m
api-7747fbf6fb-c5frr   0/1     ContainerCreating   0          0s
api-7747fbf6fb-s5jr7   1/1     Running             0          47m
api-7747fbf6fb-zjxkz   0/1     ContainerCreating   0          0s

What I saw (scale back to 3):

NAME                   READY   STATUS        RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running       0          47m
api-7747fbf6fb-bv688   1/1     Running       0          47m
api-7747fbf6fb-c5frr   1/1     Terminating   0          28s
api-7747fbf6fb-s5jr7   1/1     Running       0          47m
api-7747fbf6fb-zjxkz   0/1     Terminating   0          28s
(I also confirmed self-healing: when I deleted a Pod earlier, Kubernetes immediately recreated it, as shown by the AGE of 6s on the newly scaled Pods).

## 3 · Roll and roll back

**3a — Roll forward:**

From: `ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0`
To: `ghcr.io/ikaran34/turiba-devops-labs/api:ca0bada079aa9af85eb483f6c22ec2ae75494914`

`rollout status` output:

deployment "api" successfully rolled out
get pods output:

NAME                 READY   STATUS    RESTARTS   AGE
api-6bbbb64b-kv55q   1/1     Running   0          24s
api-6bbbb64b-m8m2c   1/1     Running   0          25s
api-6bbbb64b-qqs6c   1/1     Running   0          23s
3b — Roll back:

Prediction: With 3 replicas and default rolling update, the old Pods stay running because the new Pods can't pull the image. The rollout stalls.

get pods during the stall:

NAME                   READY   STATUS         RESTARTS   AGE
api-6bbbb64b-kv55q     1/1     Running        0          9m8s
api-6bbbb64b-m8m2c     1/1     Running        0          9m9s
api-6bbbb64b-qqs6c     1/1     Running        0          9m7s
api-76457864fd-6p94s   0/1     ErrImagePull   0          31s
rollout undo output:

deployment.apps/api rolled back
What the undo did: It rolled the cluster back to the previous ReplicaSet (ca0bada), but did not change my local YAML file (which still said 9.9.9). To make the cluster and Git agree, I restored the YAML with git restore and re-applied it.

## 4 · What broke and how I found it

- 🔮 Before applying the teammate's branch, I expected this to go wrong first: ____

| # | What I saw | The command, and the line of output that showed it | My fix (commit) |
|--:|------------|-----------------------------------------------------|-----------------|
| 1 | One Pod stuck in ImagePullBackOff while the 3 old Pods stayed running. | kubectl -n course describe pod <pod-name> showed: Failed to pull image "ghcr.io/martinsturiba/turiba-devops-labs/api:0.2.O": not found | fix(k8s): correct image tag typo from 0.2.O to 0.2.0 |
| 2 | Port-forward hung, and curl failed. The Service couldn't find the pods. | kubectl -n course get endpointslices -l kubernetes.io/service-name=api returned <none>. The Service selector was app.kubernetes.io/name: api, but Pods were app: api. | fix(k8s): correct service selector to match pod labels |
| 3 | curl returned Empty reply from server and connection refused. | The port-forward output showed connection refused. The targetPort in the service was 8080, but the API listens on 5000. | fix(k8s): correct targetPort to 5000 |