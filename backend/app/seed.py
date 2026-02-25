"""Seed script: creates 4 users + demo data. Safe to run multiple times."""
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.database import async_session
from app.models.user import User, UserRole
from app.models.client import Client
from app.models.deal import Deal, DealStatus
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.finance import Income, Expense, ExpenseCategory
from app.models.note import Note
from app.services.auth import hash_password

USERS = [
    {"email": "bakhredin@qoima.com", "name": "Bakhredin", "role": UserRole.ADMIN, "password": "password123"},
    {"email": "zeyn@qoima.com", "name": "Zeyn", "role": UserRole.PM, "password": "password123"},
    {"email": "dimash@qoima.com", "name": "Dimash", "role": UserRole.DEV, "password": "password123"},
    {"email": "zhanibek@qoima.com", "name": "Zhanibek", "role": UserRole.INTERN, "password": "password123"},
]


async def seed():
    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded, skipping.")
            return

        # Create users
        user_ids = {}
        for u in USERS:
            user = User(email=u["email"], name=u["name"], role=u["role"], hashed_password=hash_password(u["password"]))
            session.add(user)
            await session.flush()
            user_ids[u["name"]] = user.id

        # Demo clients
        clients_data = [
            {"company_name": "TechCorp", "contact_name": "Alex Kim", "contact_email": "alex@techcorp.io", "industry": "SaaS", "created_by": user_ids["Bakhredin"]},
            {"company_name": "DataFlow Inc", "contact_name": "Maria Chen", "contact_email": "maria@dataflow.com", "industry": "Analytics", "created_by": user_ids["Zeyn"]},
            {"company_name": "GreenEnergy KZ", "contact_name": "Yerlan Talgat", "contact_email": "yerlan@greenenergy.kz", "industry": "Energy", "created_by": user_ids["Bakhredin"]},
        ]
        client_ids = []
        for c in clients_data:
            client = Client(**c)
            session.add(client)
            await session.flush()
            client_ids.append(client.id)

        # Demo deals
        now = datetime.now(timezone.utc)
        deals_data = [
            {"client_id": client_ids[0], "title": "TechCorp Annual License", "amount": 24000, "status": DealStatus.WON, "probability": 100, "owner_id": user_ids["Bakhredin"]},
            {"client_id": client_ids[1], "title": "DataFlow Analytics Platform", "amount": 15000, "status": DealStatus.NEGOTIATION, "probability": 60, "owner_id": user_ids["Zeyn"], "expected_close_date": now + timedelta(days=30)},
            {"client_id": client_ids[2], "title": "GreenEnergy Dashboard", "amount": 8000, "status": DealStatus.PROPOSAL, "probability": 40, "owner_id": user_ids["Bakhredin"], "expected_close_date": now + timedelta(days=45)},
            {"client_id": client_ids[0], "title": "TechCorp Support Contract", "amount": 6000, "status": DealStatus.LEAD, "probability": 20, "owner_id": user_ids["Zeyn"]},
        ]
        for d in deals_data:
            session.add(Deal(**d))

        # Demo tasks
        tasks_data = [
            {"title": "Set up CI/CD pipeline", "description": "Configure GitHub Actions for auto-deploy", "status": TaskStatus.DONE, "priority": TaskPriority.HIGH, "assignee_id": user_ids["Dimash"], "created_by": user_ids["Zeyn"]},
            {"title": "Design landing page", "description": "Figma mockup for qoima.com", "status": TaskStatus.IN_PROGRESS, "priority": TaskPriority.MEDIUM, "assignee_id": user_ids["Zhanibek"], "created_by": user_ids["Zeyn"]},
            {"title": "API documentation", "description": "Write OpenAPI docs for all endpoints", "status": TaskStatus.REVIEW, "priority": TaskPriority.MEDIUM, "assignee_id": user_ids["Dimash"], "created_by": user_ids["Zeyn"]},
            {"title": "Client onboarding flow", "description": "Build email sequence for new clients", "status": TaskStatus.BACKLOG, "priority": TaskPriority.LOW, "assignee_id": user_ids["Zeyn"], "created_by": user_ids["Bakhredin"]},
            {"title": "Fix login bug on Safari", "status": TaskStatus.BACKLOG, "priority": TaskPriority.URGENT, "assignee_id": user_ids["Dimash"], "created_by": user_ids["Zeyn"]},
            {"title": "Research competitor pricing", "status": TaskStatus.IN_PROGRESS, "priority": TaskPriority.LOW, "assignee_id": user_ids["Zhanibek"], "created_by": user_ids["Bakhredin"]},
        ]
        for t in tasks_data:
            session.add(Task(**t))

        # Demo finance
        for i in range(6):
            month = now.replace(month=max(1, now.month - 5 + i), day=15)
            session.add(Income(date=month, amount=4000 + i * 500, source="Consulting", created_by=user_ids["Bakhredin"]))
            session.add(Income(date=month, amount=2000 + i * 200, source="Product", created_by=user_ids["Bakhredin"]))
            session.add(Expense(date=month, amount=3000, category=ExpenseCategory.SALARY, comment="Team salaries", created_by=user_ids["Bakhredin"]))
            session.add(Expense(date=month, amount=200 + i * 50, category=ExpenseCategory.TOOLS, comment="SaaS tools", created_by=user_ids["Bakhredin"]))

        # Demo notes
        notes_data = [
            {"title": "Team OKRs Q1 2025", "content": "## Objectives\n\n1. Launch MVP CRM\n2. Close 3 new deals\n3. Hire 1 more developer\n\n## Key Results\n\n- CRM live by Feb 28\n- Pipeline > $50k\n- Revenue growth 20% MoM", "created_by": user_ids["Bakhredin"]},
            {"title": "Meeting Notes — Jan 20", "content": "Discussed product roadmap. Priorities:\n- CRM module\n- Finance tracking\n- Client portal (Q2)\n\nAction items assigned in Tasks.", "created_by": user_ids["Zeyn"]},
        ]
        for n in notes_data:
            session.add(Note(**n))

        await session.commit()
        print("Seed completed: 4 users, 3 clients, 4 deals, 6 tasks, finance data, 2 notes.")


if __name__ == "__main__":
    asyncio.run(seed())
