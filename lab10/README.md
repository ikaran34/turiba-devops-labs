# Lab 10 · Build it from code with OpenTofu

GitHub user: <you> · Fallback chart used: no

<!-- Keep every heading as it is: the grader finds the sections by name. Replace every blank (four underscores). Paste command output inside the ```text blocks. Never paste the password, the state file or the kubeconfig. -->

## 1 · The cluster and the app from code

**Prediction:** The first plan will show 1 resource to add (`kind_cluster.course`) and one output `kube_context` as `known after apply`. All the cluster's certificates and endpoint will also be `known after apply`.

**`tofu plan` output:**

Plan: 1 to add, 0 to change, 0 to destroy.
ofu apply output:

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:
kube_context = "kind-course"
git status --short before commit: exactly seven files: .gitignore, .terraform.lock.hcl, main.tf, outputs.tf, providers.tf, variables.tf, versions.tf. No state or kubeconfig.


## 2 · Change, drift, rebuild

```text
$ tofu apply -var api_replicas=2               (the plan: the symbol and the value that changes)
____

$ helm history course-app -n course
____

$ tofu plan -var api_replicas=2                (after kubectl -n course delete secret db-secret)
____

$ tofu plan -var api_replicas=2                (after kubectl -n course scale deployment api --replicas=1)
____

$ tofu apply                                   (the plan, and how many API Pods run afterwards)
____

$ time tofu destroy -auto-approve / time tofu apply -auto-approve      (the last lines and the times)
____

$ curl -s localhost:8080/api/todos             (after the rebuild)
____
```

- 🔮 Step 1, `-var api_replicas=2`: which symbol, and which value changes? I predicted ____ because ____. What happened: ____
- 🔮 Step 2, the deleted Secret and the scaled Deployment: what will each plan show? I predicted ____ because ____. What happened: ____
- 🔮 Step 3, a plain `tofu apply`: what will the plan contain, and how many API Pods afterwards? I predicted ____ because ____. What happened: ____
- 🔮 Step 4, after `tofu destroy` and `tofu apply`: is the todo still there? I predicted ____ because ____. What happened: ____

## 3 · What broke and how I found it

- 🔮 Before `tofu plan` on the teammate's branch, I expected this to go wrong first: ____

| # | What I saw | The command, and the line of output that showed it | My fix (commit) |
|--:|------------|-----------------------------------------------------|-----------------|
| 1 | ____ | ____ | ____ |
| 2 | ____ | ____ | ____ |
| 3 | ____ | ____ | ____ |

## 4 · In my own words

- Why `.terraform.lock.hcl` goes into Git and `terraform.tfstate` doesn't: ____
- What `-/+ … # forces replacement` means, and what it would have cost me in Part 4: ____
- What I would lose by ending the day with `kind delete cluster` instead of `tofu destroy`: ____
