from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.project import ProjectStatus, ProjectPriority


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client_id: Optional[int] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    budget: float = 0
    spent: float = 0
    currency: str = "KZT"
    progress: int = 0
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_id: Optional[int] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    currency: Optional[str] = None
    progress: Optional[int] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    client_id: Optional[int] = None
    status: ProjectStatus
    priority: ProjectPriority
    budget: float
    spent: float
    currency: str
    progress: int
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    owner_id: int
    share_token: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
