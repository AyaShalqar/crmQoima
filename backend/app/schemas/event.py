from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool = False
    color: Optional[str] = "#3b82f6"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    color: Optional[str] = None


class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool
    color: str
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
