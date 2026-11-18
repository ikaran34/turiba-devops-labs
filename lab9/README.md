# Lab 9 · Package it with Helm

GitHub user: <you> · Fallback image used: no · Fallback Mission 8 files used: no

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

```text
$ helm install course-app charts/course-app -n course
____

$ helm upgrade course-app charts/course-app -n course --set api.image.tag=does-not-exist
____

$ kubectl -n course get pods -l app=api        (about 30 seconds later)
____

$ helm history course-app -n course            (before the rollback)
____

$ helm rollback course-app 1 -n course
____

$ helm history course-app -n course            (after the rollback)
____
```

- 🔮 Before the upgrade with a tag that doesn't exist: will `helm upgrade` say it failed? Will `GET /api/todos` still answer? I predicted ____ because ____. What happened: ____
- 🔮 Before the rollback: which revision number will `helm rollback course-app 1` create? I predicted ____ because ____. What happened: ____
- 🔮 Before `helm uninstall` and a new `helm install`: will your todo still be there? I predicted ____ because ____. What happened: ____

```text
$ curl -s localhost:8080/api/todos             (after uninstall and install)
____
```

## 3 · What broke and how I found it

- 🔮 Before upgrading with the teammate's branch, I expected this to go wrong first: ____

| # | What I saw | The command, and the line of output that showed it | My fix (commit) |
|--:|------------|-----------------------------------------------------|-----------------|
| 1 | ____ | ____ | ____ |
| 2 | ____ | ____ | ____ |
| 3 | ____ | ____ | ____ |
