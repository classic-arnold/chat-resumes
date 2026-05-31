#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"
METADATA_FILE="${APP_DIR}/deploy-metadata.env"
MAX_RETRIES=20
RETRY_INTERVAL=3

if [[ ! -f "${METADATA_FILE}" ]]; then
  echo "ERROR: ${METADATA_FILE} is missing."
  exit 1
fi

# shellcheck disable=SC1090
source "${METADATA_FILE}"

CONTAINER_NAME=${CONTAINER_NAME:-app-backend}
APP_PORT=${APP_PORT:-3000}
HEALTH_CHECK_PATH=${HEALTH_CHECK_PATH:-/health}
HEALTH_URL="http://localhost:${APP_PORT}${HEALTH_CHECK_PATH}"

if [[ -z "$(docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format '{{.Names}}')" ]]; then
  echo "ERROR: ${CONTAINER_NAME} is not running"
  docker ps -a
  exit 1
fi

for attempt in $(seq 1 "${MAX_RETRIES}"); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_URL}" 2>/dev/null || echo "000")

  if [[ "${HTTP_CODE}" == "200" ]]; then
    echo "Health check passed at ${HEALTH_URL}"
    exit 0
  fi

  if [[ "${attempt}" == "${MAX_RETRIES}" ]]; then
    echo "ERROR: Health check failed after ${MAX_RETRIES} attempts (HTTP ${HTTP_CODE})"
    docker logs --tail 200 "${CONTAINER_NAME}" 2>/dev/null || true
    exit 1
  fi

  echo "Attempt ${attempt}/${MAX_RETRIES} returned HTTP ${HTTP_CODE}; retrying in ${RETRY_INTERVAL}s"
  sleep "${RETRY_INTERVAL}"
done