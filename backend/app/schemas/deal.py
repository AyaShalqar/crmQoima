from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.deal import DealStatus


class DealCreate(BaseModel):
    client_id: int
    title: str
    amount: float = 0
    currency: str = "USD"
    status: DealStatus = DealStatus.LEAD
    probability: int = 0
    expected_close_date: Optional[datetime] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[DealStatus] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None


class DealOut(BaseModel):
    id: int
    client_id: int
    title: str
    amount: float
    currency: str
    status: DealStatus
    probability: int
    expected_close_date: Optional[datetime] = None
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DealCommentCreate(BaseModel):
    content: str


class DealCommentOut(BaseModel):
    id: int
    deal_id: int
    user_id: int
    content: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
