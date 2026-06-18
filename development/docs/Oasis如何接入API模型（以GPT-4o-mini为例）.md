API Key: sk-fG8qWYWohGP49MFiKiVuPxdwMk9x39NwehJLl8Jd3IrpBic2

Base URL:可选地址
https://api.vectorengine.cn
https://api.vectorengine.cn/v1
https://api.vectorengine.cn/v1/chat/completions


具体步骤
第一步：确认你的 VectorEngine API 信息
登录 https://api.vectorengine.ai/console/token 后，你需要找到两个信息：

API Key：你申请的 Token
Base URL：通常是 https://api.vectorengine.ai/v1（请在控制台文档页确认）

第二步：设置环境变量（推荐）
在终端中运行：
bashexport OPENAI_COMPATIBILITY_API_KEY="你的VectorEngine_API_Key"
export OPENAI_COMPATIBILITY_API_BASE_URL="https://api.vectorengine.ai/v1"
或在 Python 脚本开头直接写：
pythonimport os
os.environ["OPENAI_COMPATIBILITY_API_KEY"] = "你的VectorEngine_API_Key"
os.environ["OPENAI_COMPATIBILITY_API_BASE_URL"] = "https://api.vectorengine.ai/v1"
第三步：在 OASIS 中构建 model 并传入
pythonimport os
from camel.models import ModelFactory
from camel.types import ModelPlatformType
from camel.configs import ChatGPTConfig

# 使用 OpenAI 兼容模式接入 VectorEngine 的 GPT-4O-Mini
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI_COMPATIBLE_MODEL,
    model_type="gpt-4o-mini",  # VectorEngine 上的模型名，请以控制台为准
    api_key=os.environ.get("OPENAI_COMPATIBILITY_API_KEY"),
    url=os.environ.get("OPENAI_COMPATIBILITY_API_BASE_URL"),
    model_config_dict={"temperature": 0.4, "max_tokens": 4096},
)
然后把这个 model 传给 OASIS 的 Social Agent，OASIS 支持传入 ModelBackend、List[ModelBackend] 或 ModelManager，例如： camel-ai
python# 在 OASIS 的 agent 配置中使用
# 具体 API 取决于你的 OASIS 仿真脚本
agent = YourSocialAgent(model=model, ...)


The Western Australian state government just announced an emergency
    7% stamp duty surcharge on all residential property purchases by
    foreign investors, effective immediately. Simultaneously, the RBA
    cut interest rates by 50 basis points.

    Simulate how these two simultaneous policy shocks ripple through
    the Perth property market: how do foreign investors, local
    first-home buyers, existing landlords, real estate agents, and
    the regulator each respond? What collective market dynamics and
    narratives emerge from their interactions over the following weeks?
    Who adapts, who panics, and what opportunities or risks surface?
这是今天demo的用户query
