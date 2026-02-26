from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.settings import CompanyBalance
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class BalanceOut(BaseModel):
    amount: float

    class Config:
        from_attributes = True


class BalanceUpdate(BaseModel):
    amount: float


@router.get("/balance", response_model=BalanceOut)
async def get_balance(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(CompanyBalance).where(CompanyBalance.id == 1))
    balance = result.scalar_one_or_none()
    if not balance:
        # Create initial record
        balance = CompanyBalance(id=1, amount=0)
        db.add(balance)
        await db.flush()
        await db.refresh(balance)
        await db.commit()
    return BalanceOut(amount=float(balance.amount))


@router.put("/balance", response_model=BalanceOut)
async def update_balance(data: BalanceUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(CompanyBalance).where(CompanyBalance.id == 1))
    balance = result.scalar_one_or_none()
    if not balance:
        balance = CompanyBalance(id=1, amount=data.amount)
        db.add(balance)
    else:
        balance.amount = data.amount
    await db.flush()
    await db.refresh(balance)
    await db.commit()
    return BalanceOut(amount=float(balance.amount))
