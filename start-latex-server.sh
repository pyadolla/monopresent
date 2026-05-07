#!/bin/bash
set -e

# Cluster-only: prefer the project-local TeX Live 2026 if it's installed.
# On a laptop / any machine without that path, fall through to the system
# `lualatex` and `dvisvgm` already on PATH.
CLUSTER_TL=/project/6108939/pyadolla/texlive/2025/bin/x86_64-linux
if [ -d "$CLUSTER_TL" ]; then
  export PATH="$CLUSTER_TL:$PATH"
fi

# Cluster-only: load nodejs via Lmod if available; on a laptop nodejs is
# already on PATH.
if command -v module >/dev/null 2>&1; then
  module load nodejs/18.17.1 2>/dev/null || true
fi

# Belt-and-suspenders: clear OSFONTDIR in case a prior `~/texmf` overlay
# left it set in the calling shell. Harmless on machines that never set it.
unset OSFONTDIR

cd "$(dirname "$(readlink -f "$0")")/latex-server"
exec npm run start:concmath 2>&1
