from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from typing import List
from app.database import get_db
from app.models.finance import Income, Expense
from app.models.user import User
from app.schemas.finance import IncomeCreate, IncomeOut, ExpenseCreate, ExpenseOut, MonthlyReport
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/finance", tags=["finance"])


# --- Income ---
@router.get("/incomes", response_model=List[IncomeOut])
async def list_incomes(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Income).order_by(Income.date.desc()))
    return [IncomeOut.model_validate(i) for i in result.scalars().all()]


@router.post("/incomes", response_model=IncomeOut)
async def create_income(data: IncomeCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    income = Income(**data.model_dump(), created_by=user.id)
    db.add(income)
    await db.flush()
    await db.refresh(income)
    return IncomeOut.model_validate(income)


@router.delete("/incomes/{income_id}")
async def delete_income(income_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Income).where(Income.id == income_id))
    income = result.scalar_one_or_none()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    await db.delete(income)
    return {"ok": True}


# --- Expenses ---
@router.get("/expenses", response_model=List[ExpenseOut])
async def list_expenses(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Expense).order_by(Expense.date.desc()))
    return [ExpenseOut.model_validate(e) for e in result.scalars().all()]


@router.post("/expenses", response_model=ExpenseOut)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    expense = Expense(**data.model_dump(), created_by=user.id)
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return ExpenseOut.model_validate(expense)


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    return {"ok": True}


# --- Monthly report ---
@router.get("/report", response_model=List[MonthlyReport])
async def monthly_report(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    # Revenue by month
    inc_q = await db.execute(
        select(
            func.to_char(Income.date, 'YYYY-MM').label("month"),
            func.coalesce(func.sum(Income.amount), 0).label("total"),
        ).group_by(func.to_char(Income.date, 'YYYY-MM'))
    )
    rev_map = {r.month: float(r.total) for r in inc_q.all()}

    # Expenses by month
    exp_q = await db.execute(
        select(
            func.to_char(Expense.date, 'YYYY-MM').label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
        ).group_by(func.to_char(Expense.date, 'YYYY-MM'))
    )
    exp_map = {r.month: float(r.total) for r in exp_q.all()}

    months = sorted(set(list(rev_map.keys()) + list(exp_map.keys())))
    return [
        MonthlyReport(
            month=m,
            revenue=rev_map.get(m, 0),
            expenses=exp_map.get(m, 0),
            profit=rev_map.get(m, 0) - exp_map.get(m, 0),
        )
        for m in months
    ]
