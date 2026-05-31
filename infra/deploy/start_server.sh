#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"
ENV_FILE="${APP_DIR}/.env"
IMAGE_URI_FILE="${APP_DIR}/image-uri.txt"
METADATA_FILE="${APP_DIR}/deploy-metadata.env"

if [[ ! -f "${METADATA_FILE}" ]]; then
  echo "ERROR: ${METADATA_FILE} is missing."
  exit 1
fi

# shellcheck disable=SC1090
source "${METADATA_FILE}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} is missing."
  exit 1
fi

if [[ ! -f "${IMAGE_URI_FILE}" ]]; then
  echo "ERROR: ${IMAGE_URI_FILE} is missing."
  exit 1
fi

CONTAINER_NAME=${CONTAINER_NAME:-app-backend}
APP_PORT=${APP_PORT:-3000}

IMAGE_URI=$(cat "${IMAGE_URI_FILE}")

docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  --env-file "${ENV_FILE}" \
  -p "${APP_PORT}:${APP_PORT}" \
  "${IMAGE_URI}"

echo "Started ${CONTAINER_NAME} from ${IMAGE_URI}"