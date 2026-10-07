#!/bin/sh
# Starts Garage and, on first boot, configures the single-node layout, the
# media bucket and the application's access key. Safe to run on every start.
set -eu

: "${S3_BUCKET:?S3_BUCKET is required}"
: "${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID is required}"
: "${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY is required}"

garage server &
PID=$!
trap 'kill -TERM "$PID" 2>/dev/null; wait "$PID"' TERM INT

i=0
until garage status >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "garage: server did not start" >&2
    exit 1
  fi
  sleep 1
done

if garage status 2>/dev/null | grep -q "NO ROLE ASSIGNED"; then
  NODE_ID=$(garage node id -q | cut -d@ -f1)
  echo "garage: assigning layout to node $NODE_ID"
  garage layout assign -z dc1 -c "${GARAGE_CAPACITY:-50G}" "$NODE_ID"
  garage layout apply --version 1
fi

garage bucket info "$S3_BUCKET" >/dev/null 2>&1 || garage bucket create "$S3_BUCKET"
garage key info "$S3_ACCESS_KEY_ID" >/dev/null 2>&1 ||
  garage key import --yes -n kuzana-app "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY"
garage bucket allow --read --write --owner "$S3_BUCKET" --key "$S3_ACCESS_KEY_ID" >/dev/null

touch /tmp/garage-ready
echo "garage: ready (bucket $S3_BUCKET)"
wait "$PID"
