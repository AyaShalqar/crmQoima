from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.database import get_db
from app.models.client import Client
from app.models.deal import Deal
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("/", response_model=List[ClientOut])
async def list_clients(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Client).order_by(Client.id.desc()))
    return [ClientOut.model_validate(c) for c in result.scalars().all()]


@router.post("/", response_model=ClientOut)
async def create_client(
    data: ClientCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    client = Client(**data.model_dump(), created_by=user.id)
    db.add(client)
    await db.flush()
    await db.refresh(client)
    return ClientOut.model_validate(client)


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientOut.model_validate(client)


@router.put("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: int, data: ClientUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(client, k, v)
    await db.flush()
    await db.refresh(client)
    return ClientOut.model_validate(client)


@router.delete("/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    # Delete related deals first
    await db.execute(delete(Deal).where(Deal.client_id == client_id))
    await db.delete(client)
    return {"ok": True}
