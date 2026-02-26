from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, users, clients, deals, tasks, finance, notes, dashboard, settings

settings = get_settings()

app = FastAPI(
    title="Qoima CRM",
    description="Internal CRM for Qoima team",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(deals.router)
app.include_router(tasks.router)
app.include_router(finance.router)
app.include_router(notes.router)
app.include_router(dashboard.router)
app.include_router(settings.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "qoima-crm"}
