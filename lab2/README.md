# Lab 2 · Containerize it, then debug it

- **Image:** `ghcr.io/ikaran34/course-api:lab2` (public, linux/amd64 + linux/arm64)
- **Index digest:** `sha256:f3fee589f42e7628e28ff1e4fa3ba8786e8ee33857af6d1a17b1d25a898c4b87`
- **Base image digest:** `node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20`

## Part 1 · Images and layers

| Image | Size | Distro | Default user |
|-------|-----:|--------|--------------|
| node:24 | 1.64 GB | Debian GNU/Linux 12 (bookworm) | root (uid=0) |
| node:24-slim | 330 MB | Debian GNU/Linux 12 (bookworm) | root (uid=0) |
| node:24-alpine | 241 MB | Alpine Linux v3.24 | root (uid=0) |

`User=` is empty in `docker image inspect`, which means root.

cow:bad = 65.4 MB · cow:good = 12.9 MB

**Why cow:bad is bigger:** `cow:bad` creates `/big.file` in one `RUN` and deletes it in a second `RUN`. Layers are immutable — the delete only adds a small whiteout marker in the new layer; the 50 MB stays in the earlier layer. `cow:good` does both in a single `RUN`, so the file never enters any layer at all.

| Build | RUN step CACHED? | Build time |
|-------|------------------|-----------:|
| b · app.txt changed | CACHED | fast |
| c · deps.txt changed | not cached | slow (~15 s) |
| d · app.txt changed, wrong order | not cached | slow (~15 s) |

## Part 2 · The course API image

| Step | Image | Size |
|------|-------|-----:|
| Naive | course-api:naive | 1.75 GB |
| + .dockerignore, npm ci --omit=dev, exec form | course-api:step1 | 1.75 GB |
| Multi-stage, node:24-slim, non-root, HEALTHCHECK | course-api:lab2 | 336 MB |
| Reduction against naive | | ~81 % |

`docker stop` before the SIGTERM handler: ~10 s, exit code 137 · after: 0.27 s, exit code 0

Log line at the end of the clean stop:

SIGTERM received, closing the server


Output of `docker run --rm course-api:lab2 id`:
uid=1000(node) gid=1000(node) groups=1000(node)


Output of `docker ps` showing (healthy):
daa2e371e729 course-api:lab2 "docker-entrypoint.s…" 25 seconds ago Up 25 seconds (healthy) 0.0.0.0:8080->5000/tcp api



## Part 3 · Linux drills

Ran inside a `ubuntu:24.04` container on a `labnet` bridge network, with a second `nginx:alpine` container called `web` on the same network.

**3.1 — Distro vs kernel**

root@a1c57f8a6e50:/# head -3 /etc/os-release
PRETTY_NAME="Ubuntu 24.04.5 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"

root@a1c57f8a6e50:/# uname -r
6.18.40.1-microsoft-standard-WSL2
Ubuntu is the container's userland. The kernel is the host WSL2 VM's (`6.18.40.1-microsoft-standard-WSL2`), shared by every container on this machine — that's why even a Debian- or Alpine-based container would report the same kernel.

**3.2 — sed substitution**
root@a1c57f8a6e50:/# cat /lab/newtools.txt
chef tools
ansible tools
docker tools


**3.3 — 20 curl requests**

root@a1c57f8a6e50:/# for i in $(seq 20); do curl -s -o /dev/null http://web/nope; done

turiba@Karanveer:...$ docker logs web 2>/dev/null | grep -c '" 404 '
20

nginx answered each request with 404 (the file doesn't exist), so the count is exactly 20.

**3.4 — Permissions**
root@a1c57f8a6e50:/# ls -l /lab/f
-rwxr-x--- 1 root root 7 Oct 7 18:23 /lab/f

root@a1c57f8a6e50:/# su - student -c 'cat /lab/f'
cat: /lab/f: Permission denied


Mode `750` gives read+execute to the owner (root) and execute-only to the group. `student` is neither owner nor group member, so reading the file is denied — the kernel enforces the mode.

**3.5 — Environment variables**

root@a1c57f8a6e50:/# APP_ENV=staging; sh -c 'echo "child sees: $APP_ENV"'
child sees:

root@a1c57f8a6e50:/# export APP_ENV=staging
root@a1c57f8a6e50:/# sh -c 'echo "child sees: $APP_ENV"'
child sees: staging


`VAR=x cmd` sets the variable only for that one process's environment — the child `sh` doesn't see it. `export` adds it to the shell's environment, which the child inherits.

**3.6 — PID 1**

`VAR=x cmd` sets the variable only for that one process's environment — the child `sh` doesn't see it. `export` adds it to the shell's environment, which the child inherits.

root@a1c57f8a6e50:/# cat /proc/1/cmdline | tr '\0' ' '
bash

turiba@Karanveer:...$ time docker stop lab
real 0m0.060s


PID 1 is `bash`. `docker stop` sends SIGTERM to PID 1, but the kernel ignores SIGTERM for PID 1 unless the process installs a handler. This run stopped in 0.06 s because bash was already exiting; when bash is actively serving a session, the same stop takes the full 10-second grace period before Docker sends SIGKILL. That's exactly the same problem the API had before we added the SIGTERM handler in Part 2.4.

**3.7 — DNS and port mapping**
turiba@Karanveer:...$ docker exec lab getent hosts web
172.18.0.2 web

turiba@Karanveer:...$ docker exec lab curl -sI http://web/ | head -1
HTTP/1.1 200 OK

turiba@Karanveer:...$ docker exec web netstat -ltn
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address Foreign Address State
tcp 0 0 0.0.0.0:80 0.0.0.0:* LISTEN
tcp 0 0 127.0.0.11:46541 0.0.0.0:* LISTEN
tcp 0 0 :::80 :::* LISTEN

turiba@Karanveer:...$ curl -sI http://localhost:8081/ | head -1
HTTP/1.1 200 OK


Two different addresses reach the same nginx: `172.18.0.2:80` is the internal labnet address (resolved via Docker's embedded DNS at `127.0.0.11`), and `localhost:8081` is the host-published port mapped to the container's port 80. Both work because the container is bound to `0.0.0.0` inside and published by Docker on the host.


## Part 4 · Broken containers

## Part 4 · Broken containers

### lab2-broken:1
- **Symptom:** exits immediately, `Exited (127)`, log `sh: nodemon: not found`
- **Cause:** `CMD ["npm","run","dev"]` runs the `dev` script, which uses `nodemon` — a devDependency removed by `npm ci --omit=dev`
- **Fix:** `CMD ["node", "server.js"]` — production images run the app directly, not the dev script

### lab2-broken:2
- **Symptom:** `exec /entrypoint.sh: no such file or directory`, though `ls -l /entrypoint.sh` shows the file exists
- **Cause:** `cat -A /entrypoint.sh` shows `^M$` at line ends — the file has Windows CRLF line endings. The kernel reads the shebang as `#!/bin/sh^M` and looks for an interpreter named `/bin/sh\r`, which doesn't exist.
- **Fix:** write the entrypoint with LF endings — `RUN sed -i 's/\r$//' entrypoint.sh`, `dos2unix`, or set `*.sh text eol=lf` in `.gitattributes`

### lab2-broken:3
- **Symptom:** container runs, but `curl localhost:8082` → `curl: (52) Empty reply from server`
- **Cause:** `docker exec <c> netstat -ltn` shows the app listening on `127.0.0.1:5000` — bound to container-local loopback only, so the published port on the host has nothing to talk to
- **Fix:** bind to `0.0.0.0` — `app.listen(PORT, '0.0.0.0')` or set `HOST=0.0.0.0`

### lab2-broken:4
- **Symptom:** `docker logs b4` → `Database not reachable (connect ECONNREFUSED 127.0.0.1:5432)`
- **Cause:** `DB_HOST` inside the container is `127.0.0.1` — the container's own loopback, where no database is listening
- **Fix:** set `DB_HOST=db` — the service name of the database on the compose network

### lab2-broken:5
- **Symptom:** exits at once with `Error: EACCES: permission denied, open '/app/data/todos.log'`
- **Cause:** the app runs as `uid=1000(node)`, but `ls -lnd /app/data` shows the folder is owned by `root:root` with mode `drwxr-xr-x` — the `node` user cannot create a file in it
- **Fix:** `COPY --chown=node:node . .` plus `RUN mkdir -p /app/data && chown node:node /app/data` in the Dockerfile — or write logs to `/tmp`
## Answers

1. **Why is `cow:bad` 50 MB bigger than `cow:good` even though neither contains `/big.file`?**
   Docker layers are immutable. `cow:bad` writes `/big.file` in one layer and deletes it in a second layer — the delete only adds a whiteout marker; the 50 MB remains in the earlier layer. `cow:good` does both in one `RUN`, so the file never enters any layer. This is why "create and remove" always goes in the same `RUN`.

2. **Why does the order of `COPY` and `RUN` lines decide rebuild time?**
   Docker caches each layer. When an instruction's inputs change, that layer and every layer after it is rebuilt. If you `COPY . .` before `RUN npm ci`, editing any file invalidates the `npm ci` layer, forcing the slow install to rerun. Putting `COPY package*.json` first, then `RUN npm ci`, then `COPY . .` means only the last step reruns on code changes.

3. **Why did `docker stop` take 10 seconds before adding the SIGTERM handler?**
   Node was PID 1 but had no SIGTERM handler. The kernel ignores SIGTERM for PID 1 unless the process handles it. Docker waits out the 10 s grace period, then sends SIGKILL — exit 137. Adding `process.on('SIGTERM', …)` lets the process shut down cleanly and exit 0 in under a second.

4. **Three things the naive image contains that `course-api:lab2` does not:**
   - Full Debian userland (~1.1 GB) instead of Debian slim
   - Dev dependencies installed by `npm install`
   - The `.env` file, `.git`, and the `Dockerfile` (excluded by `.dockerignore`)
   - The root user (lab2 runs as `node`)
   - No HEALTHCHECK (lab2 defines one)
