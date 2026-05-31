#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"
ENV_FILE="${APP_DIR}/.env"
IMAGE_URI_FILE="${APP_DIR}/image-uri.txt"
METADATA_FILE="${APP_DIR}/deploy-metadata.env"
REQUIRED_RUNTIME_VARS=(
  NODE_ENV
  CLIENT_ORIGIN
  APP_BASE_URL
  DATABASE_URL
  SOCKET_PATH
  CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_PRICE_ID
  OPENAI_API_KEY
)

if [[ ! -f "${METADATA_FILE}" ]]; then
  echo "ERROR: ${METADATA_FILE} is missing from the deployment bundle."
  exit 1
fi

# shellcheck disable=SC1090
source "${METADATA_FILE}"

if [[ -z "${RUNTIME_PARAMETER_PREFIX:-}" || -z "${APP_PORT:-}" ]]; then
  echo "ERROR: ${METADATA_FILE} is missing required deployment metadata."
  exit 1
fi

echo "Ensuring Docker is ready for ${APP_SLUG:-application}"

sudo systemctl enable docker
sudo systemctl start docker

if [[ ! -f "${IMAGE_URI_FILE}" ]]; then
  echo "ERROR: ${IMAGE_URI_FILE} is missing from the deployment bundle."
  exit 1
fi

IMAGE_URI=$(cat "${IMAGE_URI_FILE}")
REGISTRY="${IMAGE_URI%%/*}"
REGION=$(echo "${REGISTRY}" | cut -d. -f4)

if [[ -z "${REGION}" ]]; then
  echo "ERROR: Could not determine AWS region from ${IMAGE_URI}."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required to rebuild ${ENV_FILE} from SSM."
  exit 1
fi

echo "Generating ${ENV_FILE} from SSM parameters under ${RUNTIME_PARAMETER_PREFIX}"
PARAMETERS_JSON=$(aws ssm get-parameters-by-path \
  --region "${REGION}" \
  --path "${RUNTIME_PARAMETER_PREFIX}" \
  --with-decryption \
  --recursive \
  --output json)

export PARAMETERS_JSON
export PARAMETER_PREFIX="${RUNTIME_PARAMETER_PREFIX}"
export ENV_FILE

python3 <<'PY'
import json
import os
import pathlib
import sys

payload = json.loads(os.environ["PARAMETERS_JSON"])
prefix = os.environ["PARAMETER_PREFIX"].rstrip("/")
env_path = pathlib.Path(os.environ["ENV_FILE"])
parameters = payload.get("Parameters", [])

if not parameters:
    print(f"ERROR: No runtime parameters found under {prefix}.", file=sys.stderr)
    raise SystemExit(1)

lines = []
seen_keys = set()

for parameter in sorted(parameters, key=lambda item: item["Name"]):
    name = parameter["Name"]
    if not name.startswith(prefix + "/"):
        continue

    leaf = name[len(prefix) + 1 :]
    key = leaf.replace("-", "_").upper()
    value = str(parameter.get("Value", ""))

    if "\n" in value or "\r" in value:
        print(f"ERROR: Runtime parameter {name} contains a newline and cannot be written to a Docker env file.", file=sys.stderr)
        raise SystemExit(1)

    if key in seen_keys:
        print(f"ERROR: Duplicate runtime key derived from {name}.", file=sys.stderr)
        raise SystemExit(1)

    lines.append(f"{key}={value}")
    seen_keys.add(key)

tmp_path = env_path.with_name(env_path.name + ".tmp")
tmp_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
os.chmod(tmp_path, 0o600)
tmp_path.replace(env_path)
PY

chown ec2-user:ec2-user "${ENV_FILE}"

if ! grep -q '^NODE_ENV=production$' "${ENV_FILE}"; then
  echo "ERROR: ${ENV_FILE} must contain NODE_ENV=production for the deployed backend runtime."
  exit 1
fi

if ! grep -q "^PORT=${APP_PORT}$" "${ENV_FILE}"; then
  echo "ERROR: ${ENV_FILE} must contain PORT=${APP_PORT} so the ALB can reach the container."
  exit 1
fi

for required_var in "${REQUIRED_RUNTIME_VARS[@]}"; do
  if ! grep -Eq "^${required_var}=.+$" "${ENV_FILE}"; then
    echo "ERROR: ${ENV_FILE} is missing required runtime value ${required_var}."
    exit 1
  fi
done

echo "Logging into ${REGISTRY}"
aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "${REGISTRY}"

echo "Pulling ${IMAGE_URI}"
docker pull "${IMAGE_URI}"