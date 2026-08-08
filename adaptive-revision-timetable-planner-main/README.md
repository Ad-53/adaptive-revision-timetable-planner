# Adaptive Revision Timetable Planner

A full-stack adaptive revision timetable application built with **FastAPI (Python)** backend and vanilla HTML/CSS/JS frontend. Features AI-powered question generation, exam scheduling, flowchart decomposition, and user authentication via Supabase.

---

## 🚀 Quick Start - Run the Server

### Prerequisites
- Python 3.8+ installed
- `uvicorn` for running the FastAPI server

### Step 1: Install Dependencies
```bash
cd adaptive-revision-timetable-planner-main
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### Step 2: Configure Supabase (Optional for Demo Mode)
Edit `.env` file with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Run the Server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

### Step 4: Open in Browser
Navigate to: **http://127.0.0.1:5000**

---

## 📁 Project Structure

```
adaptive-revision-timetable-planner-main/
├── .env                          # Supabase credentials
├── main.py                       # FastAPI backend with all routes
├── agent.py                      # AI question generation (Featherless API)
├── scraper.py                    # PDF scraping utilities
├── requirements.txt              # Python dependencies
├── README.md                     # This file
├── TESTING.md                    # Test cases
├── static/                       # Static assets
└── frontend/
    ├── index.html                # Redirect handler (auth check)
    ├── login.html                # Login page
    ├── signup.html               # Signup page
    ├── forgot-password.html      # Password reset request
    ├── profile.html              # User profile
    ├── dashboard.html            # Main application page
    ├── css/
    │   └── style.css             # Shared styles for all pages
    └── js/
        ├── config.js             # Supabase configuration
        ├── supabaseClient.js     # Supabase client instance
        ├── requireAuth.js        # Auth check utility
        ├── login.js              # Login form handler
        ├── signup.js             # Signup form handler
        ├── forgot-password.js    # Password reset handler
        └── profile.js            # Profile page actions
```

---

## 🎯 Features Implemented

### Core Features
- ✅ **User Authentication** - Sign up, login, logout via Supabase
- ✅ **Password Reset** - Forgot password flow with email verification
- ✅ **Profile Management** - View/edit user profile with stats
- ✅ **Adaptive Revision Timetable** - Calendar-based exam scheduling
- ✅ **Exam Schedule Management** - Add subject, board, and exam date
- ✅ **Topic Confidence Tracking** - 1-10 confidence scale for topics
- ✅ **Focus Mode** - Dedicated revision day mode
- ✅ **Flowchart Decomposition** - Upload images, get Mermaid.js diagrams
- ✅ **AI Question Generation** - Generate questions from scraped content
- ✅ **AI Marking & Feedback** - Auto-grade responses with detailed feedback

### UI/UX Features
- 🌓 **Theme Toggle** - Light/dark mode support
- 🔔 **Toast Notifications** - Success/error/warning messages
- ⏳ **Loading Overlays** - Async operation indicators
- 📱 **Responsive Design** - Works on desktop and mobile

---

## 🛠️ Development Workflow

### Adding New Features

1. **Create a feature branch:**
   ```bash
   git checkout -b feature-name
   ```

2. **Make your changes** (avoid editing the same files as teammates)

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "short description of change"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin feature-name
   ```

5. **Create a Pull Request** on GitHub and merge after review

6. **Pull changes locally:**
   ```bash
   git pull origin main
   ```

---

## 🧪 Testing Cases

See `TESTING.md` for comprehensive test cases including:
- Wrong password handling
- Expired token behavior
- Duplicate signup email validation
- Empty form submission prevention
- Logout clears state on refresh

---

## 📚 Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Supabase** - Authentication & database
- **Featherless AI** - Question generation and marking
- **PDFPlumber** - PDF scraping for past papers

### Frontend
- **Vanilla HTML/CSS/JS** - No build step required
- **FullCalendar** - Exam scheduling visualization
- **Mermaid.js** - Flowchart decomposition rendering
- **Supabase JS Client** - Authentication handling

---

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Redirect to login or dashboard |
| GET | `/login` | Login page |
| GET | `/signup` | Signup page |
| GET | `/forgot-password` | Password reset request |
| GET | `/profile` | Profile page |
| GET | `/dashboard` | Main application dashboard |
| GET | `/logout` | Logout and redirect to login |
| GET | `/health` | Backend health check |

---

## 🎨 Styling Consistency

All pages use the same CSS from `frontend/css/style.css`:
- **Login/Signup** - Auth forms with validation styling
- **Dashboard** - Full application with calendar, topics, and revision queue
- **Profile** - User stats and settings display
- **Forgot Password** - Password reset form

The dashboard includes all team HTML files integrated with consistent styling across all pages.

---

## 📝 License

This project is for hackathon purposes. Feel free to use and modify as needed!

---

## 👥 Team Credits

Built by the Adaptive Revision Timetable Planner team for the hackathon.