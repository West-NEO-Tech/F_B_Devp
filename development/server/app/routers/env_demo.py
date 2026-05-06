from fastapi import APIRouter

from app.schemas.env_demo import EnvTestResponse

router = APIRouter(prefix="/api", tags=["Env"])

_FIXED_USER_PERSONA = (
    "25–40 岁一线及新一线城市职场人；重视效率与可信度；愿意为省时间付费；"
    "习惯移动端完成决策；对竞品价格敏感。"
)
_FIXED_BUSINESS_GOAL = (
    "6 个月内跑通 MVP：获取 3000 名注册用户，付费转化率达到 8%，"
    "单客获客成本控制在 120 元以内。"
)
_FIXED_CONSTRAINTS = (
    "首期研发人力 3 名全职；市场推广月预算封顶 15 万；需在现行数据合规框架下留存用户明细；"
    "核心功能必须可在弱网环境下完成主路径。"
)


@router.get(
    "/env",
    response_model=EnvTestResponse,
    summary="Env (test)",
    description=(
        "Returns fixed user persona, business goal, constraints, and sample derived "
        "business insights for integration testing (not LLM-generated)."
    ),
)
async def get_env_test() -> EnvTestResponse:
    return EnvTestResponse(
        user_persona=_FIXED_USER_PERSONA,
        business_goal=_FIXED_BUSINESS_GOAL,
        constraints=_FIXED_CONSTRAINTS,
        business_insights=[
            (
                "市场切入：先做「高密度写字楼 + 地铁商圈」联名试点，用小范围地推 + "
                "企业内购清单验证获客成本是否低于 120 元阈值。"
            ),
            (
                "产品优先级：首期仅保留付费核心路径与用户信任链（实名/订单/退款说明），"
                "其余功能延后，以匹配三支人力与高合规要求。"
            ),
            (
                "定价假设：若以月费制为主，可参考竞品中位价的 85%–95% 做 A/B；"
                "若 8% 转化未达标，优先测试「年费折上折」而非单纯降价。"
            ),
            (
                "风险缓冲：弱网友好要求下，离线队列与重试需纳入首迭代；否则易在通勤场景丢失转化。"
            ),
            (
                "里程碑：前三月侧重验证 LTV/CAC，后三月在达标区域复制投放模型，不达标则收缩渠道。"
            ),
        ],
    )
