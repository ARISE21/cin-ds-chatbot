#!/usr/bin/env bash
set -euo pipefail
repo=$(git rev-parse --show-toplevel)
baseline=c1bfe72d275b371dcfd2527c700ad66092833834
execucao=$(mktemp -d /tmp/secgrad-v2-historica.XXXXXX)
printf 'V2 acadêmica original; baseline %s; execução em %s\n' "$baseline" "$execucao"
git -C "$repo" archive "$baseline" | tar -x -C "$execucao"
cd "$execucao/backend"
npm ci
npx vitest run --config vitest.sprint3-v2.config.mts --coverage
