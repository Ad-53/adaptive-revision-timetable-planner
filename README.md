# Adaptive Revision — User Login and Management

This covers the "User login and management" item from the task list, built with
**Supabase** (hosted auth + Postgres DB) instead of a custom Node/JWT auth system,
since Supabase handles signup, login, logout, sessions, password reset, and
rate limiting for you — and gives you the database you'll need anyway for
exam boards, topics, and confidence scores.

## Login/signup/password reset run through Supabase — didn't build that from scratch, just wired it up and built the profile page + protected API route on top.

## Project structure

```
adaptive-revision/
├── supabase/
│   └── schema.sql          # run this in the Supabase SQL editor
├── backend/                # Express API (protected routes only — auth itself goes through Supabase directly)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── supabaseClient.js
│       ├── middleware/authMiddleware.js
│       └── routes/userRoutes.js
└── frontend/                # plain HTML/CSS/JS, no build step
    ├── index.html
    ├── signup.html
    ├── login.html
    ├── forgot-password.html
    ├── reset-password.html
    ├── profile.html
    ├── css/style.css
    └── js/
        ├── config.js         # fill in your Supabase URL + anon key here
        ├── supabaseClient.js
        ├── auth.js
        ├── signup.js
        ├── login.js
        ├── forgot-password.js
        ├── reset-password.js
        └── profile.js
```

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the schema.** In your Supabase project, go to SQL Editor → New query, paste the
   contents of `supabase/schema.sql`, and run it. This creates the `profiles` table,
   row-level security policies, and a trigger that auto-creates a profile row on signup.

3. **Get your API keys.** In Supabase, go to Settings → API:
   - Copy the **Project URL** and **anon public key** into `frontend/js/config.js`.
   - Copy the **service_role key** into `backend/.env` (copy `.env.example` to `.env` first —
     never expose this key on the frontend).

4. **Set the redirect URL for password resets.** In Supabase, go to Authentication →
   URL Configuration, and add your reset-password page (e.g.
   `http://localhost:5500/reset-password.html` for local dev) to the Redirect URLs list.

5. **Run the backend:**
   ```
   cd backend
   npm install
   npm start
   ```
   This starts the API on `http://localhost:4000`. `GET /api/me` requires an
   `Authorization: Bearer <access_token>` header — you can get that token from
   `supabaseClient.auth.getSession()` on the frontend once logged in.

6. **Run the frontend.** No build step — just serve the `frontend/` folder statically,
   e.g. with the VS Code "Live Server" extension, or:
   ```
   npx serve frontend
   ```
   Then open `index.html` in the browser.

## Manual test checklist

- [ ] Sign up with a new email → redirected to profile (or told to confirm email)
- [ ] Sign up again with the same email → duplicate email error shown
- [ ] Log in with wrong password → error shown
- [ ] Log in with correct credentials → redirected to profile
- [ ] Submit signup/login forms empty → browser `required` validation blocks it
- [ ] Refresh the profile page while logged in → stays logged in (session persists)
- [ ] Click logout → redirected to login, refreshing profile.html now redirects to login too
- [ ] Use "forgot password" → receive email → reset link opens `reset-password.html` → set new password → can log in with it
- [ ] Update display name on profile page → name updates in navbar
- [ ] Change password on profile page → can log in with new password afterward
