Lab 7 · Run it on a cluster

GitHub user: ikaran34    |    Fallback image used: No

1. Deploy

Prediction: number of Pods and names

I expected 3 Pods named api-<hash>-<suffix>. The hash changes when the Pod template changes.

Observed output

Command: kubectl -n course get deploy,rs,pods

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

Application response (curl -s localhost:8080/):

{"name":"course-api","version":"0.2.0"}

2. Heal and scale

Prediction: delete one Pod

When I delete one of the three Pods, kubectl get pods will show a new Pod within 1–2 seconds. The new Pod will have the same ReplicaSet hash prefix but a different random suffix.

Prediction: scale to 5

Kubernetes will create two new Pods, and the Deployment will show 5/5 ready within approximately 30 seconds.

Observed output: scale to 5

NAME                   READY   STATUS              RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running             0          47m
api-7747fbf6fb-bv688   1/1     Running             0          47m
api-7747fbf6fb-c5frr   0/1     ContainerCreating   0          0s
api-7747fbf6fb-s5jr7   1/1     Running             0          47m
api-7747fbf6fb-zjxkz   0/1     ContainerCreating   0          0s

Observed output: scale back to 3

NAME                   READY   STATUS        RESTARTS   AGE
api-7747fbf6fb-9jw7v   1/1     Running       0          47m
api-7747fbf6fb-bv688   1/1     Running       0          47m
api-7747fbf6fb-c5frr   1/1     Terminating   0          28s
api-7747fbf6fb-s5jr7   1/1     Running       0          47m
api-7747fbf6fb-zjxkz   0/1     Terminating   0          28s

Self-healing confirmation: When I deleted a Pod earlier, Kubernetes immediately recreated it, as shown by the AGE of 6s on the newly scaled Pods.

3. Roll forward and roll back

3a. Roll forward

From: ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0

To: ghcr.io/ikaran34/turiba-devops-labs/api:ca0bada079aa9af85eb483f6c22ec2ae75494914

Rollout status:

deployment "api" successfully rolled out

Pods after the rollout:

NAME                 READY   STATUS    RESTARTS   AGE
api-6bbbb64b-kv55q   1/1     Running   0          24s
api-6bbbb64b-m8m2c   1/1     Running   0          25s
api-6bbbb64b-qqs6c   1/1     Running   0          23s

3b. Roll back

Prediction: With 3 replicas and the default rolling update strategy, the old Pods stay running because the new Pods cannot pull the image. The rollout stalls.

Pods observed during the stalled rollout:

NAME                   READY   STATUS         RESTARTS   AGE
api-6bbbb64b-kv55q     1/1     Running        0          9m8s
api-6bbbb64b-m8m2c     1/1     Running        0          9m9s
api-6bbbb64b-qqs6c     1/1     Running        0          9m7s
api-76457864fd-6p94s   0/1     ErrImagePull   0          31s

Rollout undo output:

deployment.apps/api rolled back

What the undo did: It rolled the cluster back to the previous ReplicaSet (ca0bada), but did not change my local YAML file (which still said 9.9.9). To make the cluster and Git agree, I restored the YAML with git restore and re-applied it.

4. What broke and how I found it

Fault 1. Image tag typo (0.2.O instead of 0.2.0)

What I saw: kubectl -n course get pods showed a Pod in ErrImagePull.

Command used: kubectl -n course describe pod <name> | grep -A 5 Events

The Events output showed: Back-off pulling image "...api:0.2.O".

Fix: Changed 0.2.O (letter O) to 0.2.0 (zero) in k8s/api-deployment.yaml.

Fault 2. Service selector mismatch

What I saw: Pods were running, but kubectl -n course get endpointslices showed <unset> endpoints.

Command used: kubectl -n course get svc api -o jsonpath='{.spec.selector}'

The command returned {"app.kubernetes.io/name":"api"}, while kubectl get pods --show-labels showed that the Pods were labelled app=api.

Fix: Changed the Service selector from app.kubernetes.io/name: api back to app: api in k8s/api-service.yaml.

Fault 3. Wrong targetPort

What I saw: kubectl port-forward service/api 8080:80 failed with connection refused, and the EndpointSlices showed PORTS: 8080.

Command used: kubectl -n course get endpointslices -l kubernetes.io/service-name=api

The command showed PORTS 8080.

Fix: Changed targetPort: 8080 back to targetPort: 5000 in k8s/api-service.yaml.

