# Testing the Login System

A quick guide to try out signup/login before we build more on top of it. Should take about 10 minutes.

## What you need first
- Node.js installed on your laptop
- VS Code, with the "Live Server" extension installed (Extensions tab on the left → search "Live Server" → Install)
- The real Supabase URL and keys — ask whoever set up the Supabase project if you don't have them

## One-time setup
1. Open the `adaptive-revision` folder in VS Code
2. Open `frontend/js/config.js` — if it still says `YOUR_SUPABASE_URL`, ask for the real values and paste them in
3. Open `backend/.env` — if this file doesn't exist, copy `backend/.env.example`, rename the copy to `.env`, and fill in the real values (don't share this file or its contents with anyone outside the team)

## Start the backend
1. Terminal → New Terminal (in VS Code)
2. Run:
   ```
   cd backend
   npm install
   npm start
   ```
3. You should see "Server running on port 4000" in the terminal. Leave it running.

## Start the frontend
1. In the file list on the left, right-click `frontend/index.html`
2. Click "Open with Live Server"
3. A browser tab opens and takes you to a login page

## Things to try (check each one off)

- [ ] Sign up with your name, email, and a password → lands on a profile page
- [ ] Sign up again with the same email → shows an error saying it's already taken
- [ ] Log out (button top right) → returns to the login page
- [ ] Log back in with the same email/password → lands on profile again
- [ ] Try logging in with the wrong password on purpose → shows an error
- [ ] On the profile page, change your display name and save → updates right away
- [ ] Change your password on the profile page, log out, log back in with the new password → works
- [ ] Refresh the profile page → stays logged in, doesn't kick you back to login
- [ ] While logged out, type `profile.html` directly into the browser address bar → redirects you to login instead of showing the page
- [ ] Click "Forgot password", enter your email, check your inbox, click the reset link, set a new password → can log in with the new one afterward

## If something breaks
- Press F12 in the browser, click the "Console" tab, look for a red error message
- Check the terminal running the backend for errors too
- Most problems trace back to a wrong or missing value in `config.js` or `.env` — check those first

Found a bug? Message the group with which step failed and what the error said (screenshot helps).
