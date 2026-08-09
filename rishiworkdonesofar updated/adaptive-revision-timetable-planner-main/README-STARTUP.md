# 🚀 How to Open RevisionAI - Multiple Ways

## Quick Start (Recommended)

### Method 1: Double-click launcher.html ⭐ EASIEST
1. Navigate to the project folder in File Explorer
2. Double-click `launcher.html`
3. Click the **"Open Application"** button
4. Login and start revising!

---

### Method 2: Using start-server.bat 🖥️
1. Open a terminal/command prompt
2. Navigate to the project folder
3. Run: `start-server.bat`
4. Browser will open automatically at login page

---

### Method 3: Manual Server Start 🔧
**Step 1: Set up virtual environment (first time only)**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate
```

**Step 2: Start the server**
```powershell
venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

**Step 3: Open browser**
- Go to: `http://127.0.0.1:8000/`

---

### Method 4: Direct File Opening 📂
Open these files directly in your browser (no server needed for viewing):
- `launcher.html` - Launch page with instructions
- `frontend/login.html` - Login page
- `design.html` - Main dashboard (requires backend)

**Note:** For full functionality, you need the backend server running.

---

## File Flow After Opening

```
┌─────────────────────────────────────────┐
│  launcher.html                          │
│  (Opens browser at root route)          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  frontend/index.html                    │
│  (Checks login status)                  │
│  ── Not logged in? → Go to login       │
│  ── Logged in? → Go to profile         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  frontend/login.html                    │
│  (User enters credentials)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  design.html                            │
│  (Main dashboard with calendar, etc.)   │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### "Server not running" message appears?
1. Make sure you ran `uvicorn main:app --reload` in a terminal
2. Or use Method 1 (launcher.html) which handles this gracefully

### Can't see the dashboard after login?
- Ensure backend server is running
- Check that `design.html` is accessible at `/design` or `/frontend/design.html`

### Port already in use?
- Uvicorn might be using a different port
- Check terminal output for actual port number
- Use that port instead of 8000

---

## Recommended Workflow

1. **First time setup:** Use Method 3 to set up venv and install dependencies
2. **Daily use:** Use Method 1 (launcher.html) - simplest!
3. **Quick start:** Use Method 2 (start-server.bat) if available

---

**Need help?** Check `TESTING.md` for more details or review the hackathon plan.