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
pod/api-7747fbf6fb-s5jr7   1/1     Running   0          44scurl -s localhost:8080/ output:

text
{"name":"course-api","version":"0.2.0"}
2 · Heal and scale
Prediction (delete one Pod): When I delete one of the three Pods, kubectl get pods will show a new Pod within 1-2 seconds. The new Pod will have the same ReplicaSet hash prefix but a different random suffix.

Prediction (scale to 5): Kubernetes will create two new Pods, and the Deployment will show 5/5 ready within ~30 seconds.

What I saw (scale to 5):

text
NAME                   READY   STATUS              RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running             0          47m
api-7747fbf6fb-bv688   1/1     Running             0          47m
api-7747fbf6fb-c5frr   0/1     ContainerCreating   0          0s
api-7747fbf6fb-s5jr7   1/1     Running             0          47m
api-7747fbf6fb-zjxkz   0/1     ContainerCreating   0          0s
What I saw (scale back to 3):

text
NAME                   READY   STATUS        RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running       0          47m
api-7747fbf6fb-bv688   1/1     Running       0          47m
api-7747fbf6fb-c5frr   1/1     Terminating   0          28s
api-7747fbf6fb-s5jr7   1/1     Running       0          47m
api-7747fbf6fb-zjxkz   0/1     Terminating   0          28s
3 · Roll and roll back
3a — Roll forward:

From: ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0
To: ghcr.io/ikaran34/turiba-devops-labs/api:ca0bada079aa9af85eb483f6c22ec2ae75494914

rollout status output:

text
deployment "api" successfully rolled out
get pods output:

text
NAME                 READY   STATUS    RESTARTS   AGE
api-6bbbb64b-kv55q   1/1     Running   0          24s
api-6bbbb64b-m8m2c   1/1     Running   0          25s
api-6bbbb64b-qqs6c   1/1     Running   0          23s
3b — Roll back:

Prediction: With 3 replicas and default rolling update, the old Pods stay running because the new Pods can't pull the image. The rollout stalls.

get pods during the stall:

text
NAME                   READY   STATUS         RESTARTS   AGE
api-6bbbb64b-kv55q     1/1     Running        0          9m8s
api-6bbbb64b-m8m2c     1/1     Running        0          9m9s
api-6bbbb64b-qqs6c     1/1     Running        0          9m7s
api-76457864fd-6p94s   0/1     ErrImagePull   0          31s
rollout undo output:

text
deployment.apps/api rolled back
What the undo did: It rolled the cluster back to the previous ReplicaSet (ca0bada), but did not change my local YAML file. I restored the YAML with git restore and re-applied it.

4 · What broke and how I found it
Fault 1 — Image tag typo (0.2.O instead of 0.2.0):

What I saw: kubectl -n course get pods showed a Pod in ErrImagePull.

Command to find it: kubectl -n course describe pod <name> | grep -A 5 Events printed Back-off pulling image "...api:0.2.O".

Fix: changed 0.2.O (letter O) to 0.2.0 (zero) in k8s/api-deployment.yaml.

Fault 2 — Service selector mismatch:

What I saw: Pods were running but kubectl -n course get endpointslices showed <unset> endpoints.

Command to find it: kubectl -n course get svc api -o jsonpath='{.spec.selector}' returned {"app.kubernetes.io/name":"api"}, while kubectl get pods --show-labels showed the Pods were labelled app=api.

Fix: changed the Service selector from app.kubernetes.io/name: api back to app: api in k8s/api-service.yaml.

Fault 3 — Wrong targetPort:curl -s localhost:8080/ output:

text
{"name":"course-api","version":"0.2.0"}
2 · Heal and scale
Prediction (delete one Pod): When I delete one of the three Pods, kubectl get pods will show a new Pod within 1-2 seconds. The new Pod will have the same ReplicaSet hash prefix but a different random suffix.

Prediction (scale to 5): Kubernetes will create two new Pods, and the Deployment will show 5/5 ready within ~30 seconds.

What I saw (scale to 5):

text
NAME                   READY   STATUS              RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running             0          47m
api-7747fbf6fb-bv688   1/1     Running             0          47m
api-7747fbf6fb-c5frr   0/1     ContainerCreating   0          0s
api-7747fbf6fb-s5jr7   1/1     Running             0          47m
api-7747fbf6fb-zjxkz   0/1     ContainerCreating   0          0s
What I saw (scale back to 3):

text
NAME                   READY   STATUS        RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running       0          47m
api-7747fbf6fb-bv688   1/1     Running       0          47m
api-7747fbf6fb-c5frr   1/1     Terminating   0          28s
api-7747fbf6fb-s5jr7   1/1     Running       0          47m
api-7747fbf6fb-zjxkz   0/1     Terminating   0          28s
3 · Roll and roll back
3a — Roll forward:

From: ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0
To: ghcr.io/ikaran34/turiba-devops-labs/api:ca0bada079aa9af85eb483f6c22ec2ae75494914

rollout status output:

text
deployment "api" successfully rolled out
get pods output:

text
NAME                 READY   STATUS    RESTARTS   AGE
api-6bbbb64b-kv55q   1/1     Running   0          24s
api-6bbbb64b-m8m2c   1/1     Running   0          25s
api-6bbbb64b-qqs6c   1/1     Running   0          23s
3b — Roll back:

Prediction: With 3 replicas and default rolling update, the old Pods stay running because the new Pods can't pull the image. The rollout stalls.

get pods during the stall:

text
NAME                   READY   STATUS         RESTARTS   AGE
api-6bbbb64b-kv55q     1/1     Running        0          9m8s
api-6bbbb64b-m8m2c     1/1     Running        0          9m9s
api-6bbbb64b-qqs6c     1/1     Running        0          9m7s
api-76457864fd-6p94s   0/1     ErrImagePull   0          31s
rollout undo output:

text
deployment.apps/api rolled back
What the undo did: It rolled the cluster back to the previous ReplicaSet (ca0bada), but did not change my local YAML file. I restored the YAML with git restore and re-applied it.

4 · What broke and how I found it
Fault 1 — Image tag typo (0.2.O instead of 0.2.0):

What I saw: kubectl -n course get pods showed a Pod in ErrImagePull.

Command to find it: kubectl -n course describe pod <name> | grep -A 5 Events printed Back-off pulling image "...api:0.2.O".

Fix: changed 0.2.O (letter O) to 0.2.0 (zero) in k8s/api-deployment.yaml.

Fault 2 — Service selector mismatch:

What I saw: Pods were running but kubectl -n course get endpointslices showed <unset> endpoints.

Command to find it: kubectl -n course get svc api -o jsonpath='{.spec.selector}' returned {"app.kubernetes.io/name":"api"}, while kubectl get pods --show-labels showed the Pods were labelled app=api.

Fix: changed the Service selector from app.kubernetes.io/name: api back to app: api in k8s/api-service.yaml.

Fault 3 — Wrong targetPort:

What I saw: kubectl port-forward service/api 8080:80 failed with connection refused, and the endpointslices showed PORTS: 8080.

Command to find it: kubectl -n course get endpointslices -l kubernetes.io/service-name=api showed PORTS 8080.

