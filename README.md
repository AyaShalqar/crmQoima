# Qoima CRM — Internal Team Workspace

> MVP internal CRM for Qoima team (4 people): dashboard KPIs, task board, CRM, finance tracking, shared notes.

## Architecture

```
┌─────────────┐    ┌───────────────┐    ┌──────────────┐
│   Next.js    │───▶│   FastAPI     │───▶│  PostgreSQL  │
│  Frontend    │    │   Backend     │    │     DB       │
│  :3000       │    │   :8000       │    │   :5432      │
└─────────────┘    └───────────────┘    └──────────────┘
```

**Stack:** FastAPI (Python) + SQLAlchemy + Alembic │ PostgreSQL 16 │ Next.js 14 + TypeScript + Tailwind │ JWT auth (bcrypt)

## Quick Start

```bash
# 1. Clone and navigate
cd qoima-crm

# 2. Copy env file
cp .env.example .env

# 3. Launch everything
docker compose up --build

# 4. Open browser
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/docs
```

Migrations run automatically on startup. Seed data (4 users + demo data) is created on first launch.

## Demo Accounts

| Name       | Email                | Password      | Role   |
|------------|---------------------|---------------|--------|
| Bakhredin  | bakhredin@qoima.com | password123   | ADMIN  |
| Zeyn       | zeyn@qoima.com      | password123   | PM     |
| Dimash     | dimash@qoima.com    | password123   | DEV    |
| Zhanibek   | zhanibek@qoima.com  | password123   | INTERN |

## Modules

### Dashboard (KPIs)
- Revenue, MRR, Pipeline, Profit, Expenses, Revenue per Employee
- Month-over-Month growth rate
- Deal pipeline summary by status
- Date range filter

### Tasks (Kanban)
- Columns: Backlog → In Progress → Review → Done
- Move cards with arrow buttons
- Priority badges (Low/Medium/High/Urgent)
- Assign to team members, set due dates

### CRM
- **Clients:** Company info, contacts, industry, notes
- **Deals:** Amount, status pipeline (Lead→Won/Lost), probability, close date
- Deal comments/activity history

### Finance
- Income and expense tracking
- Category-based expenses (Salary, Tools, Marketing, Office, Other)
- Monthly P&L report with margins

### Notes (Wiki)
- Shared team notes with markdown content
- Split-pane view (list + content)

### Team Management
- User list with roles and status
- Admin can add new members and deactivate accounts

## API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/auth/login                | Login, get JWT token     |
| GET    | /api/auth/me                   | Current user info        |
| GET    | /api/users/                    | List all users           |
| POST   | /api/users/                    | Create user (ADMIN)      |
| PUT    | /api/users/{id}                | Update user              |
| GET    | /api/clients/                  | List clients             |
| POST   | /api/clients/                  | Create client            |
| PUT    | /api/clients/{id}              | Update client            |
| DELETE | /api/clients/{id}              | Delete client            |
| GET    | /api/deals/                    | List deals               |
| POST   | /api/deals/                    | Create deal              |
| PUT    | /api/deals/{id}                | Update deal              |
| DELETE | /api/deals/{id}                | Delete deal              |
| GET    | /api/deals/{id}/comments       | Deal comments            |
| POST   | /api/deals/{id}/comments       | Add comment              |
| GET    | /api/tasks/                    | List tasks               |
| POST   | /api/tasks/                    | Create task              |
| PUT    | /api/tasks/{id}                | Update task              |
| DELETE | /api/tasks/{id}                | Delete task              |
| GET    | /api/finance/incomes           | List incomes             |
| POST   | /api/finance/incomes           | Add income               |
| DELETE | /api/finance/incomes/{id}      | Delete income            |
| GET    | /api/finance/expenses          | List expenses            |
| POST   | /api/finance/expenses          | Add expense              |
| DELETE | /api/finance/expenses/{id}     | Delete expense           |
| GET    | /api/finance/report            | Monthly P&L report       |
| GET    | /api/notes/                    | List notes               |
| POST   | /api/notes/                    | Create note              |
| PUT    | /api/notes/{id}                | Update note              |
| DELETE | /api/notes/{id}                | Delete note              |
| GET    | /api/dashboard/kpi             | KPI metrics              |

## Project Structure

```
qoima-crm/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/001_initial.py
│   └── app/
│       ├── main.py              # FastAPI app
│       ├── config.py            # Settings
│       ├── database.py          # SQLAlchemy engine/session
│       ├── seed.py              # Demo data seeder
│       ├── models/              # SQLAlchemy ORM models
│       ├── schemas/             # Pydantic request/response schemas
│       ├── routers/             # API route handlers
│       └── services/auth.py     # JWT + password hashing
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── lib/api.ts           # API client
        ├── components/          # Sidebar, Modal, AuthGuard
        └── app/                 # Next.js pages
            ├── login/
            ├── dashboard/
            ├── tasks/
            ├── crm/clients/
            ├── crm/deals/
            ├── finance/
            ├── notes/
            └── users/
```

## ERD

```
users (id, email, name, hashed_password, role, is_active, created_at, updated_at)
  │
  ├──< clients (id, company_name, contact_*, industry, notes, created_by)
  │      │
  │      └──< deals (id, client_id, title, amount, currency, status, probability, expected_close_date, owner_id)
  │             │
  │             ├──< deal_comments (id, deal_id, user_id, content, created_at)
  │             └──< incomes (id, date, amount, source, deal_id, comment, created_by)
  │
  ├──< tasks (id, title, description, status, priority, assignee_id, created_by, due_date, labels)
  ├──< expenses (id, date, amount, category, comment, created_by)
  └──< notes (id, title, content, created_by)
```

## Development

```bash
# Backend only (requires running Postgres)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install
npm run dev

# Run migrations manually
cd backend
alembic upgrade head

# Re-seed data
cd backend
python -m app.seed
```

## Deploy to Railway

### 1. Создать проект
1. Зайди на [railway.app](https://railway.app) и создай новый проект
2. Подключи GitHub репозиторий

### 2. Добавить PostgreSQL
1. В проекте нажми **+ New** → **Database** → **PostgreSQL**
2. Railway автоматически создаст переменную `DATABASE_URL`

### 3. Деплой Backend
1. **+ New** → **GitHub Repo** → выбери репозиторий
2. В настройках сервиса:
   - **Root Directory:** `backend`
   - **Variables:**
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     SECRET_KEY=your-secure-random-key-here
     CORS_ORIGINS=https://your-frontend.up.railway.app
     ```
3. Скопируй URL бэкенда (например: `https://qoima-backend.up.railway.app`)

### 4. Деплой Frontend
1. **+ New** → **GitHub Repo** → выбери тот же репозиторий
2. В настройках сервиса:
   - **Root Directory:** `frontend`
   - **Variables:**
     ```
     NEXT_PUBLIC_API_URL=https://qoima-backend.up.railway.app
     ```

### 5. Обновить CORS
После деплоя фронтенда, обнови `CORS_ORIGINS` в бэкенде на реальный URL фронтенда.

### Environment Variables

| Service  | Variable              | Description                         |
|----------|-----------------------|-------------------------------------|
| Backend  | DATABASE_URL          | PostgreSQL connection string        |
| Backend  | SECRET_KEY            | JWT signing key (generate random)   |
| Backend  | CORS_ORIGINS          | Frontend URL(s), comma-separated    |
| Frontend | NEXT_PUBLIC_API_URL   | Backend API URL                     |

## RBAC

| Action              | ADMIN | PM  | DEV | INTERN |
|---------------------|-------|-----|-----|--------|
| View Dashboard      | ✅    | ✅  | ✅  | ✅     |
| Manage Tasks        | ✅    | ✅  | Own | Own    |
| CRM (Clients/Deals) | ✅    | ✅  | ✅  | ✅     |
| Finance             | ✅    | ✅  | ✅  | ✅     |
| Notes               | ✅    | ✅  | ✅  | ✅     |
| View Team           | ✅    | ✅  | ❌  | ❌     |
| Create Users        | ✅    | ❌  | ❌  | ❌     |
# crmQoima
