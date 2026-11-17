# TaskSphere — Full-stack task manager

React 19 + TypeScript + Vite frontend; Express + MongoDB backend with account-specific workspaces.

## Setup

Requires Node.js 22+, MongoDB running locally (or MongoDB Atlas), and npm.

1. Open `backend/`, run `npm install`, copy `.env.example` to `.env` and set `MONGODB_URI` and a strong random `JWT_SECRET` (32+ characters). For example, generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
2. In `backend/`, run `npm run dev`.
3. In the frontend root (this directory), run `npm install` then `npm run dev`.
4. Open http://localhost:5173 and sign up. Your tasks, projects, activities and archived tasks are stored in MongoDB and isolated by account.

### Windows PowerShell

```powershell
cd C:\Projects\TaskSphere\frontend\backend
npm install
Copy-Item .env.example .env
# Edit .env and set your MongoDB URI and JWT secret
npm run dev
```

In a second terminal:

```powershell
cd C:\Projects\TaskSphere\frontend
npm install
npm run build
npm run dev
```

### Important

- This is a **full-stack application**. Deploy the backend to a Node hosting service and configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`. Set `VITE_API_URL` to your deployed backend URL ending in `/api` when building the frontend. Cross-site cookies require `SameSite=None; Secure` and appropriate CSRF protection; for easiest production setup use the same site / reverse proxy for frontend and `/api`.
- Your old pre-login localStorage tasks are **not automatically imported** (to prevent data leaking into another account). Export them from your old copy before replacing files, and use the existing JSON Import button to import after signup.
- App data is saved to MongoDB as an account-scoped workspace snapshot. This is suitable for a portfolio MVP, not collaborative multi-user simultaneous editing. Backend enforces request size and basic collection limits; add stricter per-field validation, session revocation, automated tests and monitoring before production use.
- Never commit `.env` or MongoDB credentials.
