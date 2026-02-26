from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.finance import Income, Expense
from app.models.deal import Deal, DealStatus
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpi")
async def get_kpi(
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # Parse dates
    d_from = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc) if date_from else datetime(2020, 1, 1, tzinfo=timezone.utc)
    d_to = datetime.strptime(date_to, "%Y-%m-%d").replace(tzinfo=timezone.utc) if date_to else datetime(2099, 12, 31, tzinfo=timezone.utc)

    # Revenue
    rev_result = await db.execute(
        select(func.coalesce(func.sum(Income.amount), 0)).where(Income.date >= d_from, Income.date <= d_to)
    )
    revenue = float(rev_result.scalar())

    # Expenses
    exp_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.date >= d_from, Expense.date <= d_to)
    )
    expenses = float(exp_result.scalar())

    # Pipeline (Negotiation + Proposal deals)
    pipe_result = await db.execute(
        select(func.coalesce(func.sum(Deal.amount), 0)).where(
            Deal.status.in_([DealStatus.NEGOTIATION, DealStatus.PROPOSAL])
        )
    )
    pipeline = float(pipe_result.scalar())

    # Active users
    user_result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    active_users = int(user_result.scalar())

    # Revenue per employee
    rev_per_employee = revenue / active_users if active_users > 0 else 0

    # MRR — monthly revenue for current month using income dates
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    mrr_result = await db.execute(
        select(func.coalesce(func.sum(Income.amount), 0)).where(Income.date >= month_start)
    )
    mrr = float(mrr_result.scalar())

    # Previous month revenue for MoM growth
    prev_month_start = (month_start.replace(day=1) - __import__('datetime').timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_rev_result = await db.execute(
        select(func.coalesce(func.sum(Income.amount), 0)).where(
            Income.date >= prev_month_start, Income.date < month_start
        )
    )
    prev_revenue = float(prev_rev_result.scalar())
    growth_mom = ((mrr - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

    profit = revenue - expenses

    # Deal counts by status
    deal_counts_q = await db.execute(
        select(Deal.status, func.count(Deal.id)).group_by(Deal.status)
    )
    deal_counts = {str(r[0].value): r[1] for r in deal_counts_q.all()}

    # Total balance (all-time income - all-time expenses)
    total_income_result = await db.execute(
        select(func.coalesce(func.sum(Income.amount), 0))
    )
    total_income = float(total_income_result.scalar())

    total_expense_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0))
    )
    total_expense = float(total_expense_result.scalar())

    balance = total_income - total_expense

    return {
        "revenue": round(revenue, 2),
        "mrr": round(mrr, 2),
        "pipeline": round(pipeline, 2),
        "profit": round(profit, 2),
        "expenses": round(expenses, 2),
        "revenue_per_employee": round(rev_per_employee, 2),
        "growth_mom": round(growth_mom, 2),
        "active_users": active_users,
        "deal_counts": deal_counts,
        "balance": round(balance, 2),
    }
