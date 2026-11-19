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

**Experiment 1 — Change with `-var api_replicas=2`:**
- **Prediction:** `~ update in-place` for the Helm release, `set.value` changes `"3" -> "2"`, Deployment shows `2/2`.
- **What I saw:**
```text
~ resource "helm_release" "course_app" {
    ~ set = [
        ~ { name = "api.replicas", value = "3" -> "2" },
      ]
  }
Plan: 0 to add, 1 to change, 0 to destroy.

helm history:

REVISION  STATUS      DESCRIPTION
1         superseded  Install complete
2         deployed    Upgrade complete
kubectl get deployment api: api 2/2 2 2 3m16s

Experiment 2 — Drift: delete the Secret:

Prediction: + create for kubernetes_secret_v1.db, Plan: 1 to add.

What I saw:

+ resource "kubernetes_secret_v1" "db" { ... }
Plan: 1 to add, 0 to change, 0 to destroy.
Experiment 3 — Drift: scale the Deployment:

Prediction: tofu plan shows no changes because the Deployment lives inside the Helm release.

What I saw: Plan: 1 to add (only the Secret from Experiment 2, not the Deployment).

Experiment 4 — Bring it back:

Prediction: + create Secret and ~ update release ("2" -> "3"). Deployment back to 3/3.

What I saw:

Plan: 1 to add, 1 to change, 0 to destroy.
Apply complete! Resources: 1 added, 1 changed, 0 destroyed.
Deployment: 3/3

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
