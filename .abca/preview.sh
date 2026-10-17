#!/usr/bin/env bash
# .abca/preview.sh up|test|restart|down: immich's pre-push check for ABCA on ECS (RepoTable prepush_command:
# `.abca/preview.sh test`). Runs in the agent's container, as the agent user, next to the task's service containers
# (ecs-services.immich.json): Postgres on 127.0.0.1:5435, Valkey on 6379, and `immich-runtime`, immich's official
# server image, which serves the AGENT'S OWN server build from the shared /workspace volume
# (.abca/preview-sidecar.sh). Same contract as the CI kit's preview + UI checks + e2e, so a green run here predicts
# the PR's checks.
#
#   up       install (when the lockfile changed) and build server and web (when their sources changed), start the
#            server, prepare a fresh instance (admin, onboarding done). Idempotent: a second `up` only rebuilds what
#            changed and restarts.
#   test     up, then the UI checks (.abca/ui-checks/*.spec.ts, the kit's Playwright config and env) 3 times, each on
#            a FRESH instance: a check must pass every run (UI_CHECK_REPEATS, default 3; CI runs it once), then the e2e specs this branch added or changed (e2e/src/specs/server/api; PREVIEW_E2E=all runs
#            the whole API suite, PREVIEW_E2E=none skips e2e). Exit 0 = everything passed.
#   restart  rebuild what changed, restart the server (the hot loop: web change ~40 s, server change ~30 s).
#   down     stop the server.
#
# Exit codes: 0 pass, 1 a check failed (the agent should fix its change), 127 the check cannot run here (no service
# containers, no browser, the kit's UI-check helper missing): ABCA does not hand that to the agent as a failure.
# Output: a summary on stdout; logs, screenshots and videos under /workspace/.abca-preview/.
set -uo pipefail
CMD="${1:-test}"
R=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
S=/workspace/.abca-preview          # on the shared workspace volume: the runtime sidecar sees the same files
URL=http://127.0.0.1:2285
ADMIN_EMAIL=admin@example.com; ADMIN_PASSWORD=abca-preview
PW=/opt/playwright                  # @playwright/test + Chromium in ABCA's ECS agent image
export CI=true COREPACK_ENABLE_DOWNLOAD_PROMPT=0
mkdir -p "$S/logs"
log() { echo "[preview $(date -u +%T)] $*"; }
cannot_run() { echo "preview: cannot run here: $*" >&2; exit 127; }

[[ ",${ABCA_SERVICE_CONTAINERS:-}," == *",immich-runtime,"* ]] \
  || cannot_run "this task has no immich service containers (ABCA_SERVICE_CONTAINERS='${ABCA_SERVICE_CONTAINERS:-}'; ECS with ecs-services.immich.json)"
[[ -w /workspace && -w /data ]] || cannot_run "the shared /workspace and /data volumes are not writable"

stamp() {  # content hash of paths (index + unstaged + untracked), so a commit elsewhere does not force a rebuild
  ( cd "$R" && { git ls-files -s -- "$@"; git diff -- "$@"; git ls-files -o --exclude-standard -z -- "$@" | xargs -0r sha1sum; } \
      | sha1sum | cut -c1-40 )
}
changed() { [[ "$(cat "$S/$1.stamp" 2>/dev/null)" != "$2" ]]; }
step() {  # step <name> <cmd...>: run quietly into logs/<name>.log, print the tail on failure
  local name=$1; shift; local t0=$SECONDS
  if "$@" > "$S/logs/$name.log" 2>&1; then log "$name ok ($((SECONDS - t0)) s)"; return 0; fi
  log "$name FAILED ($((SECONDS - t0)) s), last lines of $S/logs/$name.log:"; tail -n 60 "$S/logs/$name.log"; return 1
}

test_assets() {  # e2e/test-assets at the commit the submodule pins (public), in the background; ignored by git status
  [[ -d "$R/e2e/test-assets/albums" ]] && return 0
  git -C "$R" config submodule.e2e/test-assets.ignore all
  ( git -C "$R" submodule update --init --depth 1 e2e/test-assets > "$S/logs/test-assets.log" 2>&1; echo $? > "$S/test-assets.rc" ) &
}

install() {
  local s; s=$(stamp pnpm-lock.yaml package.json '*/package.json')
  changed deps "$s" || [[ ! -d "$R/node_modules" ]] || return 0
  step install bash -c "cd '$R' && pnpm install --frozen-lockfile --filter 'immich...' --filter 'immich-web...' --filter 'immich-e2e...'" \
    && echo "$s" > "$S/deps.stamp"
}

build() {
  local srv web; srv=$(stamp server open-api packages); web=$(stamp web open-api packages i18n)
  if changed server "$srv" || [[ ! -f "$R/server/dist/main.js" ]]; then
    step build-server bash -c "cd '$R' && pnpm --filter 'immich^...' --filter @immich/sdk run build && cd server && pnpm build" || return 1
    echo "$srv" > "$S/server.stamp"
  fi
  if changed web "$web" || [[ ! -d "$S/build-data/www" ]]; then
    step build-web bash -c "cd '$R' && pnpm --filter immich-web build" || return 1
    mkdir -p "$S/build-data"; rm -rf "$S/build-data/www"; cp -a "$R/web/build" "$S/build-data/www"
    echo "$web" > "$S/web.stamp"
  fi
}

server_start() {  # (re)start the server in the sidecar and wait for immich's own readiness line
  local before; before=$(grep -ac 'Immich Microservices is running' "$S/server.log" 2>/dev/null); before=${before:-0}
  cp "$R/.abca/preview-sidecar.sh" "$S/sidecar.sh.tmp" && mv "$S/sidecar.sh.tmp" "$S/sidecar.sh"
  echo "$R" > "$S/repo"; date +%s%N > "$S/run"
  for i in $(seq 1 180); do
    if curl -sf "$URL/api/server/ping" > /dev/null \
      && [[ $(grep -ac 'Immich Microservices is running' "$S/server.log" 2>/dev/null) -gt $before ]]; then
      log "server ready ($i s)"; return 0
    fi
    if (( i == 60 )) && ! grep -q 'supervisor up' "$S/server.log" 2>/dev/null; then
      cannot_run "the immich-runtime sidecar did not pick up $S/sidecar.sh"
    fi
    sleep 1
  done
  log "server did not become ready; last lines of $S/server.log:"; tail -n 60 "$S/server.log"; return 1
}

prep() {  # the admin, onboarding done, no new-version check (the CI kit's preview-prep); keeps an existing admin
  IMM_URL="$URL/api" EMAIL=$ADMIN_EMAIL PASSWORD=$ADMIN_PASSWORD node --input-type=module -e '
    const U = process.env.IMM_URL;
    const api = async (method, path, { token, body } = {}) => {
      const h = {}; if (token) h.Authorization = `Bearer ${token}`; if (body !== undefined) h["Content-Type"] = "application/json";
      const r = await fetch(U + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
      const t = await r.text(); if (r.status >= 300) throw new Error(`${method} ${path} -> ${r.status} ${t.slice(0, 300)}`);
      try { return JSON.parse(t); } catch { return t; }
    };
    const { EMAIL: email, PASSWORD: password } = process.env;
    await api("POST", "/auth/admin-sign-up", { body: { email, password, name: "Preview Admin" } })
      .catch((e) => { if (!/already has an admin/.test(e.message)) throw e; });
    const { accessToken: T } = await api("POST", "/auth/login", { body: { email, password } });
    await api("POST", "/system-metadata/admin-onboarding", { token: T, body: { isOnboarded: true } });
    await api("PUT", "/users/me/onboarding", { token: T, body: { isOnboarded: true } });
    const cfg = await api("GET", "/system-config", { token: T }); cfg.newVersionCheck.enabled = false;
    await api("PUT", "/system-config", { token: T, body: cfg });'
}

fresh() {  # drop + recreate the database, empty /data, restart (migrations), prepare
  rm -f "$S/run"
  for _ in $(seq 1 40); do curl -sf -o /dev/null "$URL/api/server/ping" || break; sleep 0.5; done
  ( cd "$R/e2e" && node -e '
    const { Client } = require("pg");
    (async () => { const c = new Client("postgres://postgres:postgres@127.0.0.1:5435/postgres"); await c.connect();
      await c.query("DROP DATABASE IF EXISTS immich WITH (FORCE)"); await c.query("CREATE DATABASE immich"); await c.end(); })()
      .catch((e) => { console.error(e); process.exit(1); });' ) || return 1
  find /data -mindepth 1 -delete 2>/dev/null
  # and the job queues: jobs a previous run left in Valkey would keep the new instance busy
  { exec 3<>/dev/tcp/127.0.0.1/6379 && printf 'FLUSHALL\r\n' >&3 && read -r -t 5 reply <&3 && exec 3>&-; } \
    || { log "could not flush Valkey"; return 1; }
  [[ $reply == +OK* ]] || { log "Valkey FLUSHALL: $reply"; return 1; }
  server_start && prep
}

up() {
  test_assets
  install && build && server_start && prep
}

ui_assets() {  # the kit's UI_CHECK_ASSETS: photo-1.jpg .. photo-8.jpg, distinct colours, EXIF 2026-01-01 12:00..12:07
  local d=$S/ui-assets; [[ -f $d/photo-8.jpg ]] && return 0
  uv run -q --no-project --with 'pillow==11.*' python - "$d" <<'PY'
import os, sys, time
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; os.makedirs(d, exist_ok=True)
colours = [(31, 119, 180), (255, 127, 14), (44, 160, 44), (214, 39, 40), (148, 103, 189), (140, 86, 75), (227, 119, 194), (23, 190, 207)]
font = ImageFont.load_default(size=150)
for i, rgb in enumerate(colours):
    im = Image.new("RGB", (600, 400), rgb)
    ImageDraw.Draw(im).text((300, 200), f"P{i + 1}", fill="white", font=font, anchor="mm")
    ex = Image.Exif(); stamp = f"2026:01:01 12:{i:02d}:00"; ex[0x0132] = stamp; ex.get_ifd(0x8769)[0x9003] = stamp
    p = os.path.join(d, f"photo-{i + 1}.jpg"); im.save(p, "JPEG", quality=85, exif=ex)
    t = time.mktime(time.strptime(stamp, "%Y:%m:%d %H:%M:%S")); os.utime(p, (t, t))
PY
}

UI_REPEATS=${UI_CHECK_REPEATS:-3}   # burn-in: a check must pass every run (CI runs it once)

ui_checks() {  # the kit's contract: CI's playwright config, env, and its feval-annotate helper next to the specs.
  # Runs the checks UI_REPEATS times, each on a FRESH instance (a check may assume an empty instance, so
  # Playwright's --repeat-each on one instance would report false flakes). Run 1 is on the instance the caller made.
  shopt -s nullglob; local specs=("$R"/.abca/ui-checks/*.spec.ts); shopt -u nullglob
  [[ ${#specs[@]} -gt 0 ]] || { log "no UI checks in .abca/ui-checks"; UI_SUMMARY="none"; return 0; }
  [[ -d $PW/node_modules/@playwright/test ]] || cannot_run "no Playwright in $PW (ABCA's ECS agent image has it)"
  local helper; for helper in "$R/.abca/feval-annotate.ts" "$R/.abca/ui-checks/feval-annotate.ts" ""; do [[ -f $helper ]] && break; done
  [[ -n $helper ]] || cannot_run "the CI kit's UI-check helper .abca/feval-annotate.ts is missing"
  ui_assets || return 1
  local W=$S/ui n rc=0; rm -rf "$W"; mkdir -p "$W"
  cp -a "$R/.abca/ui-checks" "$W/tests"; cp "$helper" "$W/tests/feval-annotate.ts"; ln -s "$PW/node_modules" "$W/node_modules"
  cat > "$W/playwright.config.ts" <<'TS'
import { defineConfig } from '@playwright/test';
const run = process.env.UI_CHECK_RUN_DIR!;
export default defineConfig({
  testDir: './tests', outputDir: `${run}/results`, timeout: 120_000, workers: 1, retries: 0, fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: `${run}/report.json` }]],
  use: { baseURL: process.env.PREVIEW_URL, video: 'on', trace: 'retain-on-failure', screenshot: 'only-on-failure',
         viewport: { width: 1280, height: 800 } },
});
TS
  for n in $(seq 1 "$UI_REPEATS"); do
    if (( n > 1 )); then fresh || return 1; fi
    local D=$W/run$n; rm -rf "$S/import"; mkdir -p "$D/shots" "$S/import"
    log "UI checks: ${#specs[@]} spec file(s), run $n/$UI_REPEATS"
    ( cd "$W" && UI_CHECK_RUN_DIR=$D PREVIEW_URL=$URL PREVIEW_API_URL=$URL/api PREVIEW_ADMIN_EMAIL=$ADMIN_EMAIL \
        PREVIEW_ADMIN_PASSWORD=$ADMIN_PASSWORD UI_CHECK_ASSETS=$S/ui-assets PREVIEW_IMPORT_DIR=$S/import UI_CHECK_SHOTS=$D/shots \
        timeout 900 node "$PW/node_modules/@playwright/test/cli.js" test -c "$W/playwright.config.ts" ) > "$S/logs/ui-checks-run$n.log" 2>&1
    local r=$?; (( r == 0 )) || { rc=1; tail -n 40 "$S/logs/ui-checks-run$n.log"; }
  done
  # per test: passed runs / runs (from each run's JSON report)
  UI_SUMMARY=$(node -e '
    const fs = require("fs"); const counts = {};
    const walk = (suite, file) => { for (const s of suite.suites || []) walk(s, s.file || file);
      for (const sp of suite.specs || []) { const k = `${sp.file || file} › ${sp.title}`; counts[k] ??= [0, 0];
        for (const t of sp.tests) for (const r of t.results) { counts[k][1]++; if (r.status === "passed") counts[k][0]++; } } };
    for (const f of process.argv.slice(1)) { try { walk(JSON.parse(fs.readFileSync(f, "utf8"))); } catch { } }
    const lines = Object.entries(counts).map(([k, [p, n]]) =>
      `${p === n ? "PASS" : p === 0 ? "FAIL" : "FLAKY"} ${k}: passed ${p}/${n}`);
    console.log(lines.join("\n"));' "$W"/run*/report.json)
  echo "$UI_SUMMARY"
  ln -sfn "$W/run1/shots" "$W/shots"
  log "UI checks: $([[ $rc == 0 ]] && echo "PASS (all $UI_REPEATS runs)" || echo FAIL); screenshots in $W/run1/shots"
  return $rc
}

e2e_specs() {  # the API e2e spec files this branch added or changed (vs. the base branch)
  local base; base=$(git -C "$R" merge-base HEAD "origin/$(git -C "$R" symbolic-ref -q --short refs/remotes/origin/HEAD | sed 's|^origin/||' || echo main)" 2>/dev/null)
  case "${PREVIEW_E2E:-changed}" in
    none) echo none ;;
    all) ( cd "$R/e2e" && ls src/specs/server/api/*.e2e-spec.ts | grep -v oauth ) ;;
    *) ( cd "$R" && git diff --name-only --diff-filter=AM "${base:-HEAD}" -- 'e2e/src/specs/server/api/*.e2e-spec.ts'; \
         git ls-files -o --exclude-standard -- 'e2e/src/specs/server/api/*.e2e-spec.ts' ) | sed 's|^e2e/||' | grep -v oauth | sort -u ;;
  esac
}

e2e() {  # immich's specs `docker exec|cp` into immich-e2e-server: a shim runs that here, on the shared /data volume
  local specs; mapfile -t specs < <(e2e_specs)
  [[ "${specs[*]}" != none ]] || { log "e2e: skipped (PREVIEW_E2E=none)"; return 0; }
  [[ ${#specs[@]} -gt 0 ]] || { log "e2e: no added or changed API specs (PREVIEW_E2E=all runs the suite)"; return 0; }
  for _ in $(seq 1 300); do [[ -f "$S/test-assets.rc" || -d "$R/e2e/test-assets/albums" ]] && break; sleep 1; done
  [[ -d "$R/e2e/test-assets/albums" ]] || { log "e2e: test assets missing"; tail -n 20 "$S/logs/test-assets.log"; return 1; }
  local bin=$S/bin; mkdir -p "$bin"
  cat > "$bin/docker" <<SH
#!/usr/bin/env bash
# docker shim: the e2e server is the immich-runtime sidecar; /data is shared, /test-assets is this checkout's submodule
rw() { local a; for a in "\$@"; do a=\${a#immich-e2e-server:}; printf '%s\0' "\${a/#\/test-assets/$R/e2e/test-assets}"; done; }
case "\$1" in
  exec) shift; while [[ "\$1" == -* ]]; do shift; done; [[ "\$1" == immich-e2e-server ]] && shift
        mapfile -d '' args < <(rw "\$@"); exec "\${args[@]}" ;;
  cp) shift; mapfile -d '' args < <(rw "\$@"); exec cp -r "\${args[@]}" ;;
  *) echo "docker shim: unsupported: \$*" >&2; exit 1 ;;
esac
SH
  cat > "$bin/immich-admin" <<SH
#!/usr/bin/env bash
cd "$R/server" && exec env DB_HOSTNAME=127.0.0.1 DB_PORT=5435 DB_USERNAME=postgres DB_PASSWORD=postgres DB_DATABASE_NAME=immich \
  REDIS_HOSTNAME=127.0.0.1 IMMICH_MEDIA_LOCATION=/data IMMICH_ENV=testing node dist/main immich-admin "\$@"
SH
  chmod +x "$bin/docker" "$bin/immich-admin"
  log "e2e: ${specs[*]}"
  ( cd "$R/e2e" && PATH=$bin:$PATH VITEST_DISABLE_DOCKER_SETUP=true timeout 900 pnpm exec vitest run --reporter=dot "${specs[@]}" ) \
    > "$S/logs/e2e.log" 2>&1
  local rc=$?
  tail -n 40 "$S/logs/e2e.log"; log "e2e: $([[ $rc == 0 ]] && echo PASS || echo "FAIL (exit $rc)")"
  return $rc
}

case "$CMD" in
  up) up ;;
  restart) install && build && server_start \
    && { prep || log "admin not prepared (e2e specs replace it; \`test\` starts a fresh instance)"; } ;;
  down) rm -f "$S/run"; log "server stopping" ;;
  test)
    test_assets
    install && build || exit 1
    # UI checks first: the e2e specs replace the admin. Each gets a fresh instance.
    fresh || exit 1
    ui_checks; ui=$?
    fresh || exit 1
    e2e; e2e_rc=$?
    ui_word=PASS; if [[ $ui != 0 ]]; then
      flaky=$(grep '^FLAKY ' <<< "${UI_SUMMARY:-}" | sed 's/^FLAKY //' | paste -sd ';' -)
      ui_word="FAIL${flaky:+ (flaky: $flaky)}"
    fi
    log "summary: UI checks $ui_word, e2e $([[ $e2e_rc == 0 ]] && echo PASS || echo FAIL)"
    [[ $ui == 0 && $e2e_rc == 0 ]] ;;
  *) echo "usage: .abca/preview.sh up|test|restart|down" >&2; exit 2 ;;
esac
