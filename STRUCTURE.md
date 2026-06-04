# Project Structure

WhatsApp bot for **El Oráculo Andino**, split into backend and frontend with MVC on both sides.

```
whatsapp-bot-evolution/
├── backend/                    # Node.js + Express API
│   ├── data/                   # Client brain JSON (oan_fin.json)
│   ├── docs/                   # Bot behavior instructions
│   └── src/
│       ├── index.js            # Server entry point
│       ├── app.js              # Express app factory
│       ├── config/             # Environment & constants
│       ├── constants/          # Messages, numerology data
│       ├── models/             # MVC — data layer (SQLite-backed sessions)
│       │   ├── SessionModel.js
│       │   └── DashboardModel.js
│       ├── lib/
│       │   └── sessionStore.js # JSON file persistence (backend/data/sessions.json)
│       ├── views/              # MVC — response formatting
│       │   ├── DashboardView.js
│       │   ├── HealthView.js
│       │   └── WebhookView.js
│       ├── controllers/        # MVC — HTTP handlers
│       ├── routes/             # Route definitions
│       ├── middleware/         # Auth, etc.
│       ├── services/           # Business logic (conversation, payment, AI)
│       ├── domain/             # Numerology calculations
│       ├── lib/                # Twilio/OpenAI clients
│       └── utils/              # Helpers
│
├── frontend/                   # Admin dashboard (vanilla HTML/CSS/JS)
│   └── public/
│       ├── index.html
│       └── assets/
│           ├── css/            # Stylesheets
│           └── js/
│               ├── app.js      # Entry point
│               ├── models/     # MVC — API & storage
│               ├── views/      # MVC — DOM rendering
│               ├── controllers/# MVC — app logic
│               └── utils/      # Config, formatters
│
├── scripts/                    # Integration tests
├── docs/                       # Project documentation
├── .env                        # Secrets (not committed)
└── package.json
```

## MVC Layers

### Backend

| Layer | Role | Examples |
|-------|------|----------|
| **Models** | Data access & aggregation | `SessionModel`, `DashboardModel` |
| **Views** | Shape API responses | `DashboardView`, `WebhookView` |
| **Controllers** | Handle HTTP, call models/views | `webhook.controller`, `dashboard.controller` |
| **Services** | Business rules | `conversationService`, `paymentService` |

### Frontend

| Layer | Role | Examples |
|-------|------|----------|
| **Models** | Fetch data, localStorage | `AuthModel`, `DashboardModel` |
| **Views** | Update the DOM | `AuthView`, `DashboardView` |
| **Controllers** | Wire events & refresh loop | `DashboardController` |

## Run

```powershell
npm run dev          # Start backend (serves frontend at /dashboard)
npm run test:flow    # Simulate conversation funnel
```

Dashboard: `http://localhost:3001/dashboard`
