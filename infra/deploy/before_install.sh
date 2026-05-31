#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"

echo "Preparing ${APP_DIR} for the new deployment"

mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

find . -maxdepth 1 \
  -not -name '.' \
  -not -name '..' \
  -not -name '.env' \
  -exec rm -rf {} +

echo "Preserved ${APP_DIR}/.env if it already existed"