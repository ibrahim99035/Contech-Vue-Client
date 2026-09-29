# Open Concerns & Follow-Ups

Status as of 2026-09-29. Ordered by urgency. Nothing here is a blocker for the
app running today; these are the risks and gaps worth closing.

---

## 1. Server deploys are manual

The production API is deployed by hand:

```
ssh root@88.222.220.235
cd /opt/contech-smart-home-app
docker-compose pull api
docker-compose up -d --no-deps api
```

CI builds and pushes the image and reports `deploy: success`, but that job does
not touch the VPS. The container keeps running the previous image until someone
runs the commands above, so a green pipeline does **not** mean production has the
fix. This already bit us: commit `bde5e85` (room creation) and `df20030` (room
populate) were both merged and green before production was updated.

**Fix:** add a deploy step to `.github/workflows/` that runs the three commands
over SSH after `Build & Push` succeeds. Gate it on `main` only.

---

## 2. Repository is public

`ibrahim99035/Contech-Vue-Client` is `"private": false`, as is the public API
surface at `api-bridge.contech-iot.com`. The full client source, the admin
tooling routes, and `WEBAPP_SPECIFICATION.md` are world-readable.

Two real credentials were found in the client *before* the first push and
removed, so nothing leaked:

- production MQTT broker address + username/password
- a documented default admin password

Since the repo is public, treat anything committed to it as public. If the
visibility was not intentional:

```
gh repo edit ibrahim99035/Contech-Vue-Client --visibility private --accept-visibility-change-consequences
```

---

## 3. Provider credentials never rotated

Repository history is clean, but removing a secret from git does not revoke it.
These upstream credentials are still live and need rotation from the provider's
own console:

| Provider | Blocked on |
|---|---|
| Google OAuth | Google Cloud console access |
| Cloudinary | Cloudinary console access |
| Grafana | Grafana account access |
| Email (SMTP) | mail provider account access |

The MQTT broker credential in item 2 should also be rotated — it was sitting in
plaintext in a file, so anything that ever read that file should be considered
exposed.

---

## 4. `MONGO_EXPRESS_PASSWORD` unset on the VPS

`docker-compose` on the production host warns that this variable is not set, so
mongo-express runs with a blank admin password.

Not currently exposed: the service is bound to `127.0.0.1:8081` and is not
reachable from outside. It is a latent problem, not an active one. Set the
variable if that UI is ever meant to be used.

---

## 5. Vercel env vars not set

Neither variable is configured in the Vercel project, so it depends on the
`vercel.json` rewrite proxy to reach the API. That works, but it is implicit.

- `VITE_API_URL` — unset. The rewrite in `vercel.json` handles it instead.
  Setting it explicitly would make the client call the API cross-origin
  directly and remove the proxy from the path.
- `VITE_GOOGLE_CLIENT_ID` — unset. Google sign-in is therefore **not working** on
  the deployed site; it throws "Google Sign-In is not configured". Adding the
  origin in the Google console was necessary but not sufficient, the client ID
  also has to be in the Vercel env vars.

I have no Vercel credentials, so I could not set these.

---

## 6. No CI on the client repository

`Contech-Vue-Client` has no GitHub Actions workflow. `Contech-IoT-Server` has
`Lint`, `Integration Tests`, `Secret scan` and `Build & Push`, all green. The
client has nothing, so a regression like the response-shape bugs below would not
be caught before deploy.

Worth porting the server's `Secret scan` job across, at minimum. The client has
no test suite, so `Lint` + `npm run build` is the realistic starting point.

---

## 7. Test suites encode wrong assumptions

The room-creation bug shipped because all 17 existing tests passed a
`roomPassword`, matching a validator that wrongly required one. The suite was
green while the real UI path was broken.

The two regression tests added in `bde5e85` cover that specific case, but the
broader lesson stands: tests written to match current behaviour will happily
enforce a bug. The server's 158 REST / 73 gap / 53 socket assertions are strong
on paths, weaker on payload shapes.

---

## 8. Response shapes are not typed

Three separate bugs this session were the same root cause — client and server
disagreeing about JSON shape, with nothing catching it:

| Endpoint | Bug |
|---|---|
| `POST /rooms/create` | returns `data: { room }`, client read `data` |
| `GET /rooms/apartment/:id` | returns `data: { rooms, apartment }`, client assigned `data` to an array ref |
| `/admin/dashboard/*` | nests totals under `userGrowth` / `apartmentGrowth` / `analytics.tasksByStatus`, client read flat keys |

Axios does no runtime checking, so a wrong key is `undefined` rather than an
error. A shared types package, or generated clients from an OpenAPI spec, would
make these fail loudly. Without that, every new endpoint carries this risk.

---

## 9. Local dev stack state

`test/lib/devstack.js` was left running and went stale during this work,
returning `500` on login while CI and the deployed environment were both fine.
It has been restarted and is healthy, but two things to know:

- It is **not** under process supervision. If it dies it stays dead.
- The database it seeds into (`contech_devstack`) is not fully cleaned between
  runs. Old rooms and apartments accumulate, which makes count assertions
  against it unreliable. Currently ~24 rooms carry over.

Do not mistake devstack state for production state. Several confusing failures in
this session were local-stack artifacts, not real bugs.

Related: `pkill -f devstack.js` hangs the shell, because the pattern matches the
shell's own command line. Use `pkill -9 -f "devsta[c]k"`. The same self-match
trap killed the Playwright MCP server earlier in this session with
`pkill -9 -f "playwright"`.

---

## 10. Untested client flows

Verified in a real browser against a local stack and against the live Vercel
deployment: auth guard, invalid-login error toast, successful login, admin
dashboard, admin statistics, apartment detail, room creation end to end.

Never exercised:

- registration submit, and password-mismatch validation
- customer-role navigation (`dana@dev.test`) and admin-vs-customer nav differences
- logout
- responsive / mobile viewports
- Google sign-in, for the reason in item 5

---

## 11. OAuth origin was added before the client ID was deployed

The Vercel URL was added to the Google Cloud console, but the client ID it
belongs to is not in the Vercel env vars. Adding the origin is only half the
setup. Once the client ID lands, confirm the redirect URI and authorized
JavaScript origin both cover `https://contech-vue-client.vercel.app`.
