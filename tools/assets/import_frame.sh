#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT" || {
  echo "ERRO: não foi possível acessar o projeto."
  exit 2
}

if [ "$#" -ne 3 ]; then
  echo "Uso:"
  echo "  $0 <origem.png> <miguel|robo|effects> <destino.png>"
  echo
  echo "Exemplo:"
  echo "  $0 incoming/sprites/00_idle.png miguel 00_idle.png"
  exit 2
fi

SOURCE="$1"
GROUP="$2"
TARGET_NAME="$3"

case "$GROUP" in
  miguel)
    KIND="character"
    TARGET_DIR="assets/frames/miguel"
    MANIFEST="assets/frames/miguel/manifest.csv"
    ;;

  robo)
    KIND="robot"
    TARGET_DIR="assets/frames/robo"
    MANIFEST="assets/frames/robo/manifest.csv"
    ;;

  effects)
    KIND="effect"
    TARGET_DIR="assets/frames/effects"
    MANIFEST=""
    ;;

  *)
    echo "ERRO: grupo inválido: $GROUP"
    echo "Use: miguel, robo ou effects."
    exit 2
    ;;
esac

if [ ! -f "$SOURCE" ]; then
  echo "ERRO: arquivo de origem não encontrado:"
  echo "$SOURCE"
  exit 2
fi

case "$TARGET_NAME" in
  *.png)
    ;;

  *)
    echo "ERRO: o nome de destino deve terminar em .png"
    exit 2
    ;;
esac

echo "============================================"
echo "IMPORTAÇÃO DE FRAME"
echo "============================================"
echo
echo "Origem: $SOURCE"
echo "Grupo: $GROUP"
echo "Destino: $TARGET_DIR/$TARGET_NAME"
echo
echo "==> Executando validação técnica"

./tools/assets/run_frame_validator.sh \
  "$SOURCE" \
  "$KIND"

VALIDATION_STATUS=$?

if [ "$VALIDATION_STATUS" -ne 0 ]; then
  echo
  echo "IMPORTAÇÃO CANCELADA."
  echo "O arquivo não passou na validação técnica."
  exit "$VALIDATION_STATUS"
fi

mkdir -p "$TARGET_DIR"

TARGET="$TARGET_DIR/$TARGET_NAME"

if [ -f "$TARGET" ]; then
  BACKUP_DIR="/tmp/jogo-miguel-frame-backups"
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

  mkdir -p "$BACKUP_DIR"

  BACKUP="$BACKUP_DIR/${TARGET_NAME}.${TIMESTAMP}.backup.png"

  cp -p "$TARGET" "$BACKUP"

  echo
  echo "Backup temporário criado:"
  echo "$BACKUP"
fi

cp -p "$SOURCE" "$TARGET"

echo
echo "Frame copiado para:"
echo "$TARGET"

if [ -n "$MANIFEST" ] && [ -f "$MANIFEST" ]; then
  python3 - "$MANIFEST" "$TARGET_NAME" <<'PY'
import csv
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
target_name = sys.argv[2]

with manifest_path.open(
    newline="",
    encoding="utf-8",
) as source:
    reader = csv.DictReader(source)
    fieldnames = reader.fieldnames

    if not fieldnames:
        raise SystemExit(
            "ERRO: manifesto sem cabeçalho."
        )

    rows = list(reader)

found = False

for row in rows:
    if row.get("arquivo") == target_name:
        row["status"] = "validado_tecnico"
        found = True

if not found:
    raise SystemExit(
        f"ERRO: {target_name} não existe no manifesto."
    )

with manifest_path.open(
    "w",
    newline="",
    encoding="utf-8",
) as destination:
    writer = csv.DictWriter(
        destination,
        fieldnames=fieldnames,
    )

    writer.writeheader()
    writer.writerows(rows)

print(
    f"Manifesto atualizado: "
    f"{target_name} = validado_tecnico"
)
PY

  MANIFEST_STATUS=$?

  if [ "$MANIFEST_STATUS" -ne 0 ]; then
    echo
    echo "ERRO: não foi possível atualizar o manifesto."
    echo "O frame foi copiado, mas precisa ser revisado."
    exit 1
  fi
fi

echo
echo "============================================"
echo "IMPORTAÇÃO TÉCNICA CONCLUÍDA"
echo "============================================"
echo
echo "Ainda faltam:"
echo "1. inspeção visual;"
echo "2. mudança do status para aprovado;"
echo "3. commit do frame."
