# 🎓 FirstGen Guide

A chatbot for first-generation college students — answers everything nobody tells you about college.

## ⚡ Local Setup (Frontend + Backend)

This project now includes:
- React frontend (`firstgen-guide/`)
- Express backend (`server/index.js`) with:
	- `GET /api/config-status`
	- `POST /api/v1/messages`

### 1. Install dependencies (from repo root)
```bash
npm install
```

### 2. Create backend env
At repo root, create `.env` from `.env.example` and set your key:
```env
PORT=8787
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. (Optional) Create frontend env
In `firstgen-guide/`, create `.env.local` from `.env.example`.

Defaults already work in local dev, but you can explicitly set:
```env
VITE_API_BASE_URL=http://localhost:8787
VITE_CONFIG_STATUS_PATH=/api/config-status
VITE_MESSAGES_PATH=/api/v1/messages
```

### 4. Run both servers
From repo root:
```bash
npm run dev
```

Open: http://localhost:5173

## 🚀 Deployment (No Localhost Errors)

### Recommended (single service)
Deploy the root project as one Node service:

1. Build command:
```bash
npm install
npm run build
```

2. Start command:
```bash
npm start
```

3. Required env vars on host:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
PORT=8787
```

In production, Express serves `firstgen-guide/dist` and handles all `/api/*` routes from the same domain, so no `localhost` or CORS mismatch in live deployments.

### If you deploy frontend and backend separately
Set this in `firstgen-guide/.env.production` before building frontend:
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

---

## 📦 Features
- 💬 AI-powered chat (powered by Claude)
- 🏆 Scholarship database with apply links
- 📖 College glossary (FAFSA, GPA, RA, etc.)
- 📧 Email templates (professor emails, internship follow-ups)
- 🔗 Essential resource links

## 🛠 Tech Stack
- React 18 + Vite
- Anthropic Claude API
- Pure CSS-in-JS (no external UI library needed)
