# TaskSphere — deployment checklist

## Before publishing
- **Rotate credentials** if any earlier ZIP or repository contained `backend/.env` (the supplied ZIP did). Never commit the file.
- Use a dedicated MongoDB Atlas database user with least privileges and a restricted IP access policy.
- Configure `JWT_SECRET` as a randomly generated value of at least 32 characters. Do not expose it to the frontend.
- Confirm `npm run build` succeeds and manually test account isolation, login/logout, reload, task edits, archive, and import/export.

## Recommended hosting layout
Serve frontend and backend **under the same site** (for example, reverse proxy `/api` to Express and all other routes to Vite's built assets). This matches the existing HTTP-only cookie configuration (`SameSite=Lax`, `Secure` in production).

Backend environment variables:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<random 32+ character secret>
CLIENT_ORIGIN=https://your-app.example
```

Frontend: leave `VITE_API_URL` unset when `/api` is proxied to the backend. Build with `npm ci && npm run build`; deploy `dist/`. Backend: `cd backend && npm ci && npm start`.

**Do not** deploy frontend and backend on unrelated sites without first implementing cross-site cookie and CSRF protections. The default production cookies will not work reliably across unrelated sites.

## Verification
1. `GET /api/health` returns `{"status":"ok"}` after MongoDB connects.
2. Sign up as account A, create a task, refresh and verify it remains.
3. Log out, sign up as B, verify A's task is absent.
4. Log back in as A and verify the task is restored.
5. Open browser developer tools > Network and verify `/api/workspace` GET/PUT return 200 after authentication.
6. Confirm the browser never receives `JWT_SECRET`, `MONGODB_URI`, or password hashes.

## Known MVP limitations
- Last-write-wins workspace snapshot; simultaneous tabs can overwrite each other's edits.
- No password reset, email verification, session revocation, or full per-field schema validation.
- Not yet covered by automated end-to-end tests; manual verification is required before production launch.
