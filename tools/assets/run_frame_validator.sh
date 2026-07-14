#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_DIR="$ROOT/.venv-assets"

cd "$ROOT" || {
  echo "ERRO: não foi possível acessar o projeto."
  exit 2
}

if [ "$#" -ne 2 ]; then
  echo "Uso:"
  echo "  $0 <arquivo.png> <character|robot|effect|empty>"
  exit 2
fi

IMAGE="$1"
KIND="$2"
PYTHON_CMD=""

case "$KIND" in
  character|robot|effect|empty)
    ;;
  *)
    echo "ERRO: tipo inválido: $KIND"
    echo "Use: character, robot, effect ou empty."
    exit 2
    ;;
esac

if [ ! -f "$IMAGE" ]; then
  echo "ERRO: arquivo não encontrado:"
  echo "$IMAGE"
  exit 2
fi

if python3 -c "import PIL" >/dev/null 2>&1; then
  PYTHON_CMD="python3"
elif [ -x "$VENV_DIR/bin/python" ] \
  && "$VENV_DIR/bin/python" -c "import PIL" >/dev/null 2>&1; then
  PYTHON_CMD="$VENV_DIR/bin/python"
else
  echo "ERRO: Pillow não está disponível."
  echo "Ambiente esperado:"
  echo "$VENV_DIR"
  exit 2
fi

echo "Python utilizado: $PYTHON_CMD"
echo "Arquivo: $IMAGE"
echo "Tipo: $KIND"

"$PYTHON_CMD" \
  tools/assets/validate_frame.py \
  "$IMAGE" \
  --kind "$KIND"

exit $?
