#!/usr/bin/env bash
# .abca/preview-sidecar.sh: supervisor for the `immich-runtime` service container (ABCA ECS service containers).
#
# Runs inside immich's official runtime image (ffmpeg, exiftool, libvips sharp, /build data) as root, and serves the
# AGENT's own server build from the shared workspace volume. preview.sh copies this file to $S/sidecar.sh; the
# container's command waits for it. Fargate cannot restart one container of a running task, so the server's lifecycle
# is driven by a control file instead:
#   $S/repo   path of the checkout to serve (written by preview.sh)
#   $S/run    present = keep the server running; a new content (a generation stamp) = restart; removed = stop
#   $S/server.log  the server's output; preview.sh waits for "Immich Microservices is running" in it
# The server runs as uid 1000 (`node` here, `agent` in the agent container) so the agent can read and clean up the
# files it writes to /data. It listens on 127.0.0.1:2285 (immich's e2e port), which every container of the task shares.
set -uo pipefail
S=/workspace/.abca-preview; LOG=$S/server.log; BD=$S/build-data
mkdir -p "$BD"
# immich's build data (geodata, plugins) from this image; preview.sh adds the agent's web build as www/
for d in /build/*; do [[ $(basename "$d") == www ]] || cp -an "$d" "$BD/"; done
chown -R 1000:1000 "$BD"
img_sharp=$(cd /usr/src/app/server && readlink -f node_modules/sharp)
echo "== supervisor up (image sharp: $img_sharp)" >> "$LOG"

stop() {  # immich forks API + microservices workers: signal the whole process group, or the port stays bound
  [[ -n "${pid:-}" ]] || return 0
  kill -- -"$pid" 2>/dev/null
  for _ in $(seq 1 40); do kill -0 -- -"$pid" 2>/dev/null || break; sleep 0.25; done
  kill -9 -- -"$pid" 2>/dev/null; wait "$pid" 2>/dev/null; pid=""; echo "== stopped $gen" >> "$LOG"
}

use_image_sharp() {  # the image's sharp is built against its own libvips (RAW, HEIF, JXL); swap it in when versions match
  local r=$1 v dst
  v=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$r/server/node_modules/sharp/package.json" 2>/dev/null | head -1)
  dst=$r/node_modules/.pnpm/sharp@$v/node_modules/sharp
  if [[ -n "$v" && "$img_sharp" == *"/sharp@$v/node_modules/sharp" && -d "$dst" && ! -f "$dst/.abca-image-sharp" ]]; then
    rm -rf "$dst" && cp -a "$img_sharp" "$dst" && touch "$dst/.abca-image-sharp" && chown -R 1000:1000 "$dst" \
      && echo "== sharp $v: using the image's libvips build" >> "$LOG"
  fi
}

gen=""; pid=""
while true; do
  cur=$(cat "$S/run" 2>/dev/null)
  if [[ -n "$pid" && "$cur" != "$gen" ]]; then stop; fi
  if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then echo "== exited $gen" >> "$LOG"; pid=""; gen="exited:$gen"; fi
  if [[ -z "$pid" && -n "$cur" && "$cur" != "${gen#exited:}" ]]; then
    R=$(cat "$S/repo"); gen=$cur
    use_image_sharp "$R"
    ln -sfn "$R/e2e/test-assets" /test-assets   # immich's e2e passes /test-assets paths to the server
    echo "== start $gen ($R)" >> "$LOG"
    ( cd /usr/src/app && exec setpriv --reuid=1000 --regid=1000 --clear-groups env HOME=/tmp \
        IMMICH_ENV=testing IMMICH_HOST=127.0.0.1 IMMICH_PORT=2285 \
        DB_HOSTNAME=127.0.0.1 DB_PORT=5435 DB_USERNAME=postgres DB_PASSWORD=postgres DB_DATABASE_NAME=immich \
        REDIS_HOSTNAME=127.0.0.1 REDIS_PORT=6379 IMMICH_MACHINE_LEARNING_ENABLED=false \
        IMMICH_MEDIA_LOCATION=/data IMMICH_BUILD_DATA="$BD" IMMICH_IGNORE_MOUNT_CHECK_ERRORS=true IMMICH_TELEMETRY_INCLUDE=all \
        IMMICH_BUILD=1234567890 IMMICH_BUILD_URL=https://github.com/immich-app/immich/actions/runs/1234567890 \
        IMMICH_BUILD_IMAGE=e2e IMMICH_SOURCE_REF=e2e IMMICH_SOURCE_COMMIT=e2eeeeeeeeeeeeeeeeee \
        IMMICH_SOURCE_URL=https://github.com/immich-app/immich/commit/e2eeeeeeeeeeeeeeeeee \
        setsid node "$R/server/dist/main" ) >> "$LOG" 2>&1 &
    pid=$!
  fi
  sleep 0.5
done
