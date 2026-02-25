import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, func
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PM = "PM"
    DEV = "DEV"
    INTERN = "INTERN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.DEV)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
