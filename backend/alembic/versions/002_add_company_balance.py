"""add company balance

Revision ID: 002
Revises: 001
Create Date: 2025-02-26 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'company_balance',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('amount', sa.Numeric(14, 2), server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # Insert initial record
    op.execute("INSERT INTO company_balance (id, amount) VALUES (1, 0)")


def downgrade() -> None:
    op.drop_table('company_balance')
