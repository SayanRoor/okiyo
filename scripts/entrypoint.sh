#!/bin/sh
set -e

echo "==> applying payload migrations"
node node_modules/payload/bin.js migrate

echo "==> starting next"
exec node node_modules/next/dist/bin/next start
