import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from app.database import Base


class ExpenseCategory(str, enum.Enum):
    SALARY = "SALARY"
    TOOLS = "TOOLS"
    MARKETING = "MARKETING"
    OFFICE = "OFFICE"
    OTHER = "OTHER"


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    source = Column(String(255))
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)
    comment = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(Enum(ExpenseCategory), default=ExpenseCategory.OTHER)
    comment = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
