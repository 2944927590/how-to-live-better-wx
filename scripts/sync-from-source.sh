#!/usr/bin/env bash
#
# 从《高性价比人生指南》GitHub 仓库同步最新正文到小程序数据。
#
# 流程：检查原书工作区干净 → fetch → 有新提交才 ff-only 合并 →
#       重跑数据管线（内置 608 条 / A410 B149 C49 / 性价比 104·276·228 对账）→
#       生成物 hash 变化才通知。
#
# 安全原则：
#   - 原书仓库 tracked 文件有任何未提交改动 → 跳过本次同步（绝不动用户的在写内容）
#   - 只做快进合并（merge --ff-only），非快进 → 中止，绝不 reset / 不覆盖
#   - 对账不过 → 数据管线非零退出，本次同步作废，通知失败
#
# 可用环境变量覆盖：
#   BOOK_REPO   原书仓库路径（默认见下）
#   WX_REPO     小程序仓库路径（默认本脚本上级目录）
#
# 手动执行：bash scripts/sync-from-source.sh
# 定时执行：由 ~/Library/LaunchAgents/com.xiezhiqiang.hlb-sync.plist 每天触发

set -u

BOOK_REPO="${BOOK_REPO:-/Users/xiezhiqiang/HowToLiveBetter/HowToLiveBetter}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WX_REPO="${WX_REPO:-$(cd "$SCRIPT_DIR/.." && pwd)}"
LOG_DIR="$WX_REPO/scripts/logs"
LOG_FILE="$LOG_DIR/sync.log"
STATE_FILE="$WX_REPO/scripts/.sync-state"
DATA_DIRS=("$WX_REPO/src/data" "$WX_REPO/src/packages/reading/data")
REMOTE="origin"
BRANCH="main"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# 失败时弹 macOS 通知（无自动化权限会静默失败，不影响退出码）
notify() {
  local title="$1" msg="$2"
  /usr/bin/osascript -e "display notification \"$msg\" with title \"$title\"" >/dev/null 2>&1 || true
}

fail() {
  local code="$1" msg="$2"
  log "✖ 同步中止（exit=${code}）：${msg}"
  notify "人生指南同步失败" "$msg"
  exit "$code"
}

# ---------- 0. 前置检查 ----------
[ -d "$BOOK_REPO/.git" ] || fail 10 "原书仓库不存在或不是 git 仓库：$BOOK_REPO"
[ -f "$WX_REPO/scripts/build-data.mjs" ] || fail 10 "小程序仓库路径异常：$WX_REPO"
command -v node >/dev/null || fail 10 "找不到 node"
command -v git >/dev/null || fail 10 "找不到 git"

# ---------- 1. 原书工作区必须干净（只看 tracked，未跟踪的 .pai/ 等不影响） ----------
cd "$BOOK_REPO" || fail 10 "进入原书仓库失败"
if ! git diff --quiet HEAD --; then
  fail 2 "原书仓库有未提交改动（tracked），已跳过，提交或暂存后再同步"
fi

# ---------- 2. fetch（SSH 批处理，避免定时任务挂起等密码） ----------
export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes -o ConnectTimeout=15}"
log "拉取 $REMOTE/$BRANCH …"
if ! git fetch "$REMOTE" "$BRANCH" >>"$LOG_FILE" 2>&1; then
  fail 11 "git fetch 失败（网络或 SSH 凭据），见 $LOG_FILE"
fi

BEFORE="$(git rev-parse HEAD)"
AFTER="$(git rev-parse "$REMOTE/$BRANCH")"
if [ "$BEFORE" = "$AFTER" ]; then
  log "✓ 无新提交（$(git rev-parse --short HEAD)），数据未动"
  exit 0
fi

# 新增提交数（仅用于通知文案）
NEW_COUNT="$(git rev-list --count "HEAD..$REMOTE/$BRANCH")"

# ---------- 3. 快进合并（非快进直接中止，绝不强制） ----------
if ! git merge --ff-only "$REMOTE/$BRANCH" >>"$LOG_FILE" 2>&1; then
  fail 3 "本地分支落后且无法快进（可能有分叉），未做任何改动，请人工处理 $BOOK_REPO"
fi
SHORT="$(git rev-parse --short HEAD)"
log "原书已更新：$NEW_COUNT 个新提交 → $SHORT"

# ---------- 4. 记录生成物旧指纹 ----------
hash_data() {
  {
    for d in "${DATA_DIRS[@]}"; do
      [ -d "$d" ] && find "$d" -type f -name '*.ts' -print0 | xargs -0 shasum
    done
  } | sort | shasum | awk '{print $1}'
}
OLD_HASH=""
[ -f "$STATE_FILE" ] && OLD_HASH="$(cat "$STATE_FILE")"

# ---------- 5. 重跑数据管线（内置对账，不过即非零退出） ----------
cd "$WX_REPO" || fail 10 "进入小程序仓库失败"
log "重新生成数据 …"
if ! BUILD_SOURCE_COMMIT="$SHORT" node scripts/build-data.mjs >>"$LOG_FILE" 2>&1; then
  fail 4 "数据管线对账失败（条目数/分级与原书 README 基准不一致），生成物需人工核查"
fi

# ---------- 6. 变化检测与通知 ----------
NEW_HASH="$(hash_data)"
if [ "$OLD_HASH" = "$NEW_HASH" ]; then
  log "✓ 新提交未改动正文数据，生成物无变化"
else
  echo "$NEW_HASH" > "$STATE_FILE"
  log "✔ 数据已更新并通过对账，源版本 $SHORT"
  notify "人生指南已同步" "原书 $NEW_COUNT 个新提交已同步（$SHORT），可重新上传体验版"
fi

exit 0
