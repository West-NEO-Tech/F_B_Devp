#!/usr/bin/env bash
# LiteLLM Proxy 启动脚本
# 在隔离的 venv 中运行 litellm proxy，避免与项目依赖冲突
#
# 用法:
#   ./server/scripts/start-litellm.sh
#
# 首次运行:
#   1. 自动创建 ~/.litellm-env/ 虚拟环境并安装依赖（约 30s）
#   2. 终端显示 OAuth device code，浏览器打开授权 URL 完成登录
#   3. 凭证保存到本地，后续启动无需再次授权

set -euo pipefail

VENV_DIR="${HOME}/.litellm-env"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../litellm_config.yaml"
PORT="${LITELLM_PORT:-4100}"

# 创建或更新 venv
if [ ! -f "${VENV_DIR}/bin/litellm" ]; then
    echo ">>> 正在创建 LiteLLM 隔离环境 (${VENV_DIR}) ..."
    uv venv "${VENV_DIR}" --python 3.13 --quiet
    uv pip install --python "${VENV_DIR}/bin/python" \
        'litellm[proxy]>=1.75' 'fastapi>=0.115,<0.130' --quiet
    echo ">>> 安装完成"
fi

echo ">>> LiteLLM Proxy 启动中 (port ${PORT}) ..."
echo ">>> 配置: ${CONFIG_FILE}"
echo ">>> 健康检查: curl http://localhost:${PORT}/health"
echo ""

# 从 /tmp 启动，避免 litellm 读取 server/.env 中的 DATABASE_URL
cd /tmp
env -u DATABASE_URL "${VENV_DIR}/bin/litellm" \
    --config "${CONFIG_FILE}" \
    --port "${PORT}"
