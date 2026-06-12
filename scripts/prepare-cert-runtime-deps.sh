#!/bin/sh
# Copia dependências de certificados (puppeteer-core, archiver, qrcode) para o runtime Docker.
set -e

DEST="${1:-/runtime-extra/node_modules}"
ROOT="${2:-/app}"

mkdir -p "$DEST"

cd "$ROOT"

npm ls puppeteer-core archiver qrcode --omit=dev --parseable 2>/dev/null | sort -u | while IFS= read -r dir; do
  case "$dir" in
    "$ROOT"/node_modules/*)
      rel="${dir#"$ROOT"/node_modules/}"
      target="$DEST/$rel"
      mkdir -p "$(dirname "$target")"
      if [ ! -e "$target" ]; then
        cp -a "$dir" "$target"
      fi
      ;;
  esac
done

echo "Cert runtime deps preparadas em $DEST"
