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

3.1 Inside `lab`: `cat /etc/os-release` shows Ubuntu 24.04 (the userland); `uname -r` shows the host VM's kernel. Ubuntu is the distro; the kernel is shared with the host WSL2 VM.

3.2 `cat /lab/newtools.txt`:

chef tools
ansible tools
docker tools


3.3 The count from `docker logs web | grep -c '" 404 '` is 20.

3.4 `ls -l /lab/f` → `-rwxr-x--- 1 root root … /lab/f`. `su - student -c 'cat /lab/f'` → `Permission denied`. The `750` mode gives read+execute to the owner (root) and execute-only to the group, so a non-owner cannot read it.

3.5 `APP_ENV=staging; sh -c 'echo "child sees: $APP_ENV"'` → `child sees: ` (empty). After `export APP_ENV=staging`, the same command → `child sees: staging`. Environment variables are not inherited by a child shell unless exported.

3.6 `cat /proc/1/cmdline` inside `lab` → `bash`. `time docker stop lab` → ~10 s because bash as PID 1 has no SIGTERM handler, so Docker has to send SIGKILL after the grace period.

3.7 `getent hosts web` inside `lab` → the container's internal IP on the `labnet` network. `curl -sI http://web/ | head -1` → `HTTP/1.1 200 OK`. From the host: `docker exec web netstat -ltn` shows nginx listening on `0.0.0.0:80`; `curl -sI http://localhost:8081/ | head -1` → `HTTP/1.1 200 OK`. Two different addresses reach the same nginx: one is the internal network address, the other is the host-published port.

## Part 4 · Broken containers

### lab2-broken:1
- Symptom: exits immediately, `Exited (127)`, log `sh: nodemon: not found`
- Cause: `CMD ["npm","run","dev"]` runs the `dev` script, which uses `nodemon`, a devDependency omitted by `npm ci --omit=dev`
- Fix: `CMD ["node", "server.js"]` — production images run the app directly, not the dev script

### lab2-broken:2
- Symptom: `exec /entrypoint.sh: no such file or directory`, though the file exists
- Cause: `cat -A /entrypoint.sh` shows `^M$` — CRLF line endings. The kernel reads the shebang as `/bin/sh^M` and cannot find that interpreter
- Fix: rewrite the entrypoint with LF line endings (`sed -i 's/\r$//' entrypoint.sh`, `dos2unix`, or set the correct line endings in Git)

### lab2-broken:3
- Symptom: runs, but `curl localhost:8082` → `Empty reply from server`
- Cause: `netstat -ltn` shows the app listening on `127.0.0.1:5000` — bound to container-local loopback, unreachable through the published port
- Fix: bind to `0.0.0.0` (`app.listen(PORT, '0.0.0.0')`)

### lab2-broken:4
- Symptom: `Database not reachable (connect ECONNREFUSED … 127.0.0.1:5432)`
- Cause: `DB_HOST=127.0.0.1` inside the container — that's the container itself, not the database
- Fix: `DB_HOST=db` (the service name on the compose network)

### lab2-broken:5
- Symptom: exits at once, `EACCES: permission denied, open '/app/data/todos.log'`
- Cause: `/app/data` is owned by root, but the container runs as non-root
- Fix: `COPY --chown=node:node . .` plus `RUN mkdir -p /app/data && chown node:node /app/data` — or write to `/tmp`

### lab2-broken:6
- Symptom: `docker stop` takes 10 s, exit 137
- Cause: PID 1 has no SIGTERM handler, so the kernel ignores SIGTERM and Docker sends SIGKILL
- Fix: add `process.on('SIGTERM', () => server.close(() => process.exit(0)))`

### lab2-broken:7
- Symptom: `Up (unhealthy)` forever, but the app answers normally
- Cause: the HEALTHCHECK itself is broken (wrong port, wrong path, or missing tool)
- Fix: correct the HEALTHCHECK — use a tool that exists in the base image, or use Node's http module to probe `/healthz`

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
