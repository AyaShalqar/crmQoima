from sqlalchemy import Column, Integer, Numeric, DateTime, func
from app.database import Base


class CompanyBalance(Base):
    __tablename__ = "company_balance"

    id = Column(Integer, primary_key=True, default=1)
    amount = Column(Numeric(14, 2), default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
