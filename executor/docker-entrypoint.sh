#!/bin/sh
set -e

# node_modules is an anonymous volume (see docker-compose.yml), so it
# persists across `docker compose up`/`restart` independent of the
# bind-mounted source — switching branches changes package-lock.json but
# never touches that volume. npm writes its own copy of the lockfile into
# node_modules/.package-lock.json after a successful install; comparing it
# against the real package-lock.json tells us whether the volume is stale.
if [ ! -f node_modules/.package-lock.json ] || ! cmp -s package-lock.json node_modules/.package-lock.json; then
  echo "docker-entrypoint: package-lock.json changed, running npm ci..."
  npm ci
fi

exec "$@"
