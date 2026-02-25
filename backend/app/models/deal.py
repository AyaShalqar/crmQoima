import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from app.database import Base


class DealStatus(str, enum.Enum):
    LEAD = "LEAD"
    NEGOTIATION = "NEGOTIATION"
    PROPOSAL = "PROPOSAL"
    WON = "WON"
    LOST = "LOST"


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), default=0)
    currency = Column(String(3), default="USD")
    status = Column(Enum(DealStatus), default=DealStatus.LEAD)
    probability = Column(Integer, default=0)  # 0-100%
    expected_close_date = Column(DateTime(timezone=True))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DealComment(Base):
    __tablename__ = "deal_comments"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
