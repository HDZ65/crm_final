from __future__ import annotations

from typing import Dict, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from model import RiskScoringModel


class PredictRequest(BaseModel):
    prev_rejects: int = Field(ge=0)
    channel: str = Field(min_length=1)
    contract_age_months: int = Field(ge=0)
    payment_history_count: int = Field(ge=0)
    lot_code: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    amount_cents: int = Field(ge=0)
    preferred_debit_day: int = Field(ge=1, le=31)


class PredictResponse(BaseModel):
    score: int
    risk_tier: Literal["LOW", "MEDIUM", "HIGH"]
    factors: Dict[str, float]


app = FastAPI(title="Payment Scoring Service", version="1.0.0")


try:
    scoring_model = RiskScoringModel()
except FileNotFoundError:
    scoring_model = None


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> PredictResponse:
    if scoring_model is None:
        raise HTTPException(
            status_code=503,
            detail="Scoring model not available. Run train.py to create model.pkl.",
        )

    result = scoring_model.predict(request.model_dump())
    return PredictResponse(**result)
