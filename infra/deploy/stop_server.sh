#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"
METADATA_FILE="${APP_DIR}/deploy-metadata.env"
CONTAINER_NAME="app-backend"

if [[ -f "${METADATA_FILE}" ]]; then
	# shellcheck disable=SC1090
	source "${METADATA_FILE}"
	CONTAINER_NAME=${CONTAINER_NAME:-app-backend}
fi

docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

echo "Stopped ${CONTAINER_NAME} if it was running"