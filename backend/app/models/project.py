import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from app.database import Base


class ProjectStatus(str, enum.Enum):
    PLANNING = "PLANNING"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ProjectPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM)
    budget = Column(Numeric(14, 2), default=0)
    spent = Column(Numeric(14, 2), default=0)
    currency = Column(String(3), default="KZT")
    progress = Column(Integer, default=0)  # 0-100%
    start_date = Column(DateTime(timezone=True))
    deadline = Column(DateTime(timezone=True))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    share_token = Column(String(64), unique=True, nullable=True)  # for public sharing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
