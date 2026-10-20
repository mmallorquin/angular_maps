#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SALIDA="${DIR}/casa.ply"

echo "Reuniendo partes de casa.ply..."
cat "${DIR}/casa.ply.part"* > "${SALIDA}"

echo "Verificando suma SHA-256..."
ESPERADO="$(awk '{print $1}' "${DIR}/casa.ply.sha256")"
ACTUAL="$(shasum -a 256 "${SALIDA}" | awk '{print $1}')"

if [ "${ESPERADO}" = "${ACTUAL}" ]; then
  echo "OK: El archivo casa.ply se reconstruyó correctamente (${SALIDA})."
else
  echo "ERROR: La suma SHA-256 no coincide."
  exit 1
fi
