from fastapi import APIRouter

from app.schemas.market_qa import (
    MarketQAOneRequest,
    MarketQAOneResponse,
    MarketQAQuestion,
    MarketQARequest,
    MarketQAResponse,
)
from app.services import market_qa_service

router = APIRouter(prefix="/api/market-qa", tags=["market-qa"])


@router.post("/questions", response_model=MarketQAResponse)
async def get_questions(data: MarketQARequest) -> MarketQAResponse:
    questions = await market_qa_service.generate_questions(
        description=data.description, product_type=data.product_type
    )
    return MarketQAResponse(questions=questions)


@router.post("/questions/one", response_model=MarketQAOneResponse)
async def generate_one_question(data: MarketQAOneRequest) -> MarketQAOneResponse:
    existing = [
        MarketQAQuestion(id=q.id, question=q.question) for q in data.existing_questions
    ]
    question = await market_qa_service.generate_one_question(
        description=data.description,
        product_type=data.product_type,
        index=data.index,
        target_count=data.target_count,
        existing=existing,
    )
    return MarketQAOneResponse(
        question=question,
        index=data.index,
        target_count=data.target_count,
    )

