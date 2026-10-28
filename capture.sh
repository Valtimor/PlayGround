#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export RUNTIME_DIR="${RUNTIME_DIR:?}"
/usr/bin/time -p node "$(dirname "$0")/scripts/capture.mjs"
