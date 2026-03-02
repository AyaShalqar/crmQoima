"""add events table for calendar

Revision ID: 003
Revises: 002
Create Date: 2025-03-02 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_datetime', sa.DateTime(timezone=True), nullable=True),
        sa.Column('all_day', sa.Boolean(), server_default='false'),
        sa.Column('color', sa.String(20), server_default="'#3b82f6'"),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('events')
