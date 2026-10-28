#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"
export PORT="${PORT:-3000}"
export RUNTIME_DIR="${RUNTIME_DIR:?}"
if [[ -n "${OPENCODE_WEB_DIR:-}" ]]; then
  /usr/bin/time -p node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const project = path.resolve(process.argv[1]);
    const output = path.resolve(process.argv[2], "deployment-output.json");
    fs.writeFileSync(output, JSON.stringify({ project, directory: project }));
  ' "$project_dir" "$OPENCODE_WEB_DIR"
fi
/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-start.mjs"
