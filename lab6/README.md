# Lab 6 · Mission: test what you ship, ship a release

GitHub user: ikaran34 · Reference pipeline used (Part 0 fallback): no

<!-- Keep every heading as it is: the grader finds the sections by name. -->

## 1 · Smoke test and predictions

- The names of my smoke-test steps in the `image` job: **Build for the smoke test (amd64, kept on the runner)** and **Smoke test the image**.
- What my smoke test asks, and what makes it fail: It runs the container and then asks `GET /` using `curl` with retries. It fails if `curl` cannot connect or gets a non-200 response, which happens if the container crashes on startup (e.g., a missing file).
- 🔮 Part 1, before my first run: will my code pass the smoke test? I predicted **yes** because **`GET /` does not touch the database, and the Lab 2 code is already working**. What happened: **the smoke test passed on the first try and `curl` printed `{"name":"course-api","version":"0.1.0"}`**.

## 2 · What broke and how I found it

- **The check and step that went red:** `ci / image`, in the step **Smoke test the image**.
- **The log line (copied):** `Error: Cannot find module './banner'`
- **The cause, in my own words:** The teammate's commit added `banner.js` to `api/.dockerignore`. Because of this, the image was built without the file. When the container started, `server.js` tried to `require('./banner')` and crashed.
- **Why lint, unit and integration stayed green:** Those three jobs run the source code directly on the runner, where `banner.js` exists. The image is the only place affected by `.dockerignore`.
- **My fix:** I deleted the `banner.js` line from `api/.dockerignore` so the file would be included in the image again.

## 3 · Release

*(You will fill this in after Part 3)*
- Release page: https://github.com/ikaran34/turiba-devops-labs/releases/tag/v0.2.0
- Image: `ghcr.io/ikaran34/turiba-devops-labs/api:0.2.0`, platforms: **linux/amd64, linux/arm64**
- One thing in Part 3 that didn't work the first time, and how I fixed it: **I will describe this after completing Part 3.**
