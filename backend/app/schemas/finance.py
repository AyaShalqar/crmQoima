from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.finance import ExpenseCategory


class IncomeCreate(BaseModel):
    date: datetime
    amount: float
    source: Optional[str] = None
    deal_id: Optional[int] = None
    comment: Optional[str] = None


class IncomeOut(BaseModel):
    id: int
    date: datetime
    amount: float
    source: Optional[str] = None
    deal_id: Optional[int] = None
    comment: Optional[str] = None
    created_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    date: datetime
    amount: float
    category: ExpenseCategory = ExpenseCategory.OTHER
    comment: Optional[str] = None


class ExpenseOut(BaseModel):
    id: int
    date: datetime
    amount: float
    category: ExpenseCategory
    comment: Optional[str] = None
    created_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MonthlyReport(BaseModel):
    month: str
    revenue: float
    expenses: float
    profit: float
