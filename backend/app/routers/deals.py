from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.deal import Deal, DealComment
from app.models.user import User
from app.schemas.deal import DealCreate, DealUpdate, DealOut, DealCommentCreate, DealCommentOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("/", response_model=List[DealOut])
async def list_deals(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Deal).order_by(Deal.id.desc()))
    return [DealOut.model_validate(d) for d in result.scalars().all()]


@router.post("/", response_model=DealOut)
async def create_deal(data: DealCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    deal = Deal(**data.model_dump(), owner_id=user.id)
    db.add(deal)
    await db.flush()
    await db.refresh(deal)
    return DealOut.model_validate(deal)


@router.get("/{deal_id}", response_model=DealOut)
async def get_deal(deal_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealOut.model_validate(deal)


@router.put("/{deal_id}", response_model=DealOut)
async def update_deal(
    deal_id: int, data: DealUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(deal, k, v)
    await db.flush()
    await db.refresh(deal)
    return DealOut.model_validate(deal)


@router.delete("/{deal_id}")
async def delete_deal(deal_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    await db.delete(deal)
    return {"ok": True}


# --- Comments ---
@router.get("/{deal_id}/comments", response_model=List[DealCommentOut])
async def list_comments(deal_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(
        select(DealComment).where(DealComment.deal_id == deal_id).order_by(DealComment.created_at.desc())
    )
    return [DealCommentOut.model_validate(c) for c in result.scalars().all()]


@router.post("/{deal_id}/comments", response_model=DealCommentOut)
async def add_comment(
    deal_id: int, data: DealCommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    comment = DealComment(deal_id=deal_id, user_id=user.id, content=data.content)
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return DealCommentOut.model_validate(comment)
