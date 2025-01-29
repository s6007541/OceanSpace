from fastapi import APIRouter, Depends

from ..db import User
from ..llm import get_llm_client
from ..schemas import PSSQuestionModel
from ..users import current_active_user

llm_client = get_llm_client()

router = APIRouter()

@router.post("")
async def predict_pss(
    pss_question: PSSQuestionModel, user: User = Depends(current_active_user)
):
    print(pss_question.question)
    print(pss_question.answer)
    score = await llm_client.predict_pss(pss_question)
    return {"pss": score}
