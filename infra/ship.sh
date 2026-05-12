#!/usr/bin/env bash
# OKIYO — push в GitHub + раскатка на прод одной командой.
#
# Использование:
#   cd ~/Projects/okiyo/okiyo
#   ./infra/ship.sh             # обычный workflow
#   ./infra/ship.sh "сообщение"  # вместе с коммитом всех изменений
#
# Переменные окружения:
#   OKIYO_SSH_HOST   — SSH alias или user@host прод-сервера (default: okiyo-prod)
#   OKIYO_REMOTE_DIR — путь к проекту на сервере (default: /srv/okiyo)

set -euo pipefail

SSH_HOST="${OKIYO_SSH_HOST:-okiyo-prod}"
REMOTE_DIR="${OKIYO_REMOTE_DIR:-/srv/okiyo}"

cd "$(dirname "$0")/.."

# 1. Если переданы аргументы — собираем их как commit message и коммитим всё, что есть.
if [ "$#" -gt 0 ]; then
  COMMIT_MSG="$*"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "==> commit: $COMMIT_MSG"
    git add -A
    git commit -m "$COMMIT_MSG"
  else
    echo "==> рабочее дерево чисто, коммит не нужен"
  fi
fi

# 2. Если есть незакоммиченные правки — стоп.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ есть незакоммиченные изменения. Закоммить (или передай сообщение как аргумент)."
  git status -s
  exit 1
fi

# 3. Pull --rebase на всякий — если кто-то пушил с сервера/CI.
echo "==> fetch + rebase"
git fetch origin
git rebase origin/main || {
  echo "✗ rebase conflict — разрули руками, потом запусти ship.sh снова"
  exit 1
}

# 4. Push.
echo "==> push origin main"
git push origin main

# 5. Deploy.
echo "==> deploy on $SSH_HOST:$REMOTE_DIR"
ssh "$SSH_HOST" "cd $REMOTE_DIR && ./infra/deploy.sh"

echo "✓ ship complete — открой https://okiyo.kz/ (Cmd+Shift+R)"
