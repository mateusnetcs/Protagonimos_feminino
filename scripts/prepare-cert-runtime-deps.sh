#!/bin/sh
# Copia dependências de certificados (puppeteer-core, archiver, qrcode) para o runtime Docker.
set -e

DEST="${1:-/runtime-extra/node_modules}"
ROOT="${2:-/app}"

mkdir -p "$DEST"
cd "$ROOT"

copy_pkg() {
  rel="$1"
  src="node_modules/$rel"
  target="$DEST/$rel"
  if [ -e "$src" ]; then
    mkdir -p "$(dirname "$target")"
    cp -a "$src" "$target"
  fi
}

# Pacotes principais e transitivos usados na geração de PDF/ZIP
for pkg in \
  puppeteer-core \
  archiver \
  archiver-utils \
  compress-commons \
  zip-stream \
  crc32-stream \
  qrcode \
  chromium-bidi \
  devtools-protocol \
  typed-query-selector \
  ws \
  async \
  buffer-crc32 \
  is-stream \
  lazystream \
  normalize-path \
  readable-stream \
  readdir-glob \
  tar-stream \
  dijkstrajs \
  pngjs; do
  copy_pkg "$pkg"
done

if [ -d node_modules/@puppeteer ]; then
  mkdir -p "$DEST"
  cp -a node_modules/@puppeteer "$DEST/"
fi

# npm ls cobre dependências aninhadas extras (ex.: dentro de puppeteer-core)
npm ls puppeteer-core archiver qrcode --omit=dev --parseable 2>/dev/null | sort -u | while IFS= read -r dir; do
  case "$dir" in
    "$ROOT"/node_modules/*)
      rel="${dir#"$ROOT"/node_modules/}"
      target="$DEST/$rel"
      if [ ! -e "$target" ]; then
        mkdir -p "$(dirname "$target")"
        cp -a "$dir" "$target"
      fi
      ;;
  esac
done

if [ ! -d "$DEST/puppeteer-core" ]; then
  echo "ERRO: puppeteer-core não copiado para $DEST" >&2
  exit 1
fi

# Evita falha do Docker COPY com diretório vazio
touch "$DEST/.keep"

echo "Cert runtime deps preparadas em $DEST"
