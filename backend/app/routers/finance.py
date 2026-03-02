from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, literal_column, and_
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.finance import Income, Expense
from app.models.user import User
from app.schemas.finance import IncomeCreate, IncomeOut, ExpenseCreate, ExpenseOut, MonthlyReport
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/finance", tags=["finance"])


# --- Income ---
@router.get("/incomes", response_model=List[IncomeOut])
async def list_incomes(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Income).order_by(Income.date.desc())
    if date_from:
        start_dt = datetime.fromisoformat(date_from)
        query = query.where(Income.date >= start_dt)
    if date_to:
        end_dt = datetime.fromisoformat(date_to + "T23:59:59")
        query = query.where(Income.date <= end_dt)
    result = await db.execute(query)
    return [IncomeOut.model_validate(i) for i in result.scalars().all()]


@router.post("/incomes", response_model=IncomeOut)
async def create_income(data: IncomeCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    income = Income(**data.model_dump(), created_by=user.id)
    db.add(income)
    await db.flush()
    await db.refresh(income)
    await db.commit()
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
async def list_expenses(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(Expense).order_by(Expense.date.desc())
    if date_from:
        start_dt = datetime.fromisoformat(date_from)
        query = query.where(Expense.date >= start_dt)
    if date_to:
        end_dt = datetime.fromisoformat(date_to + "T23:59:59")
        query = query.where(Expense.date <= end_dt)
    result = await db.execute(query)
    return [ExpenseOut.model_validate(e) for e in result.scalars().all()]


@router.post("/expenses", response_model=ExpenseOut)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    expense = Expense(**data.model_dump(), created_by=user.id)
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    await db.commit()
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
async def monthly_report(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    # Build income query with optional date filters
    inc_query = select(
        func.to_char(Income.date, 'YYYY-MM').label("month"),
        func.sum(Income.amount).label("total"),
    )
    if date_from:
        start_dt = datetime.fromisoformat(date_from)
        inc_query = inc_query.where(Income.date >= start_dt)
    if date_to:
        end_dt = datetime.fromisoformat(date_to + "T23:59:59")
        inc_query = inc_query.where(Income.date <= end_dt)
    inc_query = inc_query.group_by(literal_column("1"))

    inc_q = await db.execute(inc_query)
    rev_map = {r.month: float(r.total) if r.total else 0 for r in inc_q.all()}

    # Build expense query with optional date filters
    exp_query = select(
        func.to_char(Expense.date, 'YYYY-MM').label("month"),
        func.sum(Expense.amount).label("total"),
    )
    if date_from:
        start_dt = datetime.fromisoformat(date_from)
        exp_query = exp_query.where(Expense.date >= start_dt)
    if date_to:
        end_dt = datetime.fromisoformat(date_to + "T23:59:59")
        exp_query = exp_query.where(Expense.date <= end_dt)
    exp_query = exp_query.group_by(literal_column("1"))

    exp_q = await db.execute(exp_query)
    exp_map = {r.month: float(r.total) if r.total else 0 for r in exp_q.all()}

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
