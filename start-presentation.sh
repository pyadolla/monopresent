#!/bin/bash
set -e

# Cluster-only: load nodejs via Lmod if available; on a laptop nodejs is
# already on PATH.
if command -v module >/dev/null 2>&1; then
  module load nodejs/18.17.1 2>/dev/null || true
fi

cd "$(dirname "$(readlink -f "$0")")/monopresent"

# react-scripts insists on opening a browser; suppress it
export BROWSER=none
exec yarn start:principiae-presentation 2>&1
