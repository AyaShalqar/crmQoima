from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventOut, EventUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/", response_model=List[EventOut])
async def list_events(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Get events, optionally filtered by date range"""
    query = select(Event).order_by(Event.start_datetime)

    if start:
        start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
        query = query.where(Event.start_datetime >= start_dt)
    if end:
        end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
        query = query.where(Event.start_datetime <= end_dt)

    result = await db.execute(query)
    return [EventOut.model_validate(e) for e in result.scalars().all()]


@router.post("/", response_model=EventOut)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    event = Event(**data.model_dump(), created_by=user.id)
    db.add(event)
    await db.flush()
    await db.refresh(event)
    await db.commit()
    return EventOut.model_validate(event)


@router.get("/{event_id}", response_model=EventOut)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventOut.model_validate(event)


@router.put("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: int,
    data: EventUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    await db.flush()
    await db.refresh(event)
    await db.commit()
    return EventOut.model_validate(event)


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return {"ok": True}
