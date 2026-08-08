from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json
try:
    from supabase import create_client
except Exception:
    # supabase package may be missing or API incompatible in this environment.
    create_client = None
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jdhlctbbpsfjufvbyufp.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Create Supabase client (with fallback to demo mode if key is empty or import failed)
supabase_client = None
if create_client and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception:
        supabase_client = None

app = FastAPI(title="Adaptive Revision Timetable Planner")

# CORS middleware - allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for frontend assets
app.mount("/static", StaticFiles(directory="static"), name="static")

# Also serve the frontend's own css/js folders so HTML that references
# relative paths like `css/style.css` or `js/login.js` work when the
# FileResponse serves files directly from the `frontend` directory.
project_dir = os.path.dirname(__file__)
frontend_css = os.path.join(project_dir, "frontend", "css")
frontend_js = os.path.join(project_dir, "frontend", "js")
if os.path.isdir(frontend_css):
    app.mount("/css", StaticFiles(directory=frontend_css), name="frontend_css")
if os.path.isdir(frontend_js):
    app.mount("/js", StaticFiles(directory=frontend_js), name="frontend_js")

# Serve the index.html as root (team's frontend - redirects to login or profile)
@app.get("/")
async def root():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    # Serve the combined dashboard as the main page for easier testing
    return FileResponse(os.path.join(frontend_dir, "dashboard.html"))

# Serve team's auth pages (login, signup, forgot-password)
@app.get("/login")
async def login_page():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "login.html"))

@app.get("/signup")
async def signup_page():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "signup.html"))

@app.get("/forgot-password")
async def forgot_password_page():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "forgot-password.html"))

# Serve dashboard page
@app.get("/dashboard")
async def dashboard_page():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "dashboard.html"))


@app.get("/profile")
async def profile_page():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "profile.html"))


# Also support direct requests to the HTML filenames used by some pages
@app.get("/dashboard.html")
async def dashboard_html():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "dashboard.html"))


@app.get("/profile.html")
async def profile_html():
    project_dir = os.path.dirname(__file__)
    frontend_dir = os.path.join(project_dir, "frontend")
    return FileResponse(os.path.join(frontend_dir, "profile.html"))

# Logout endpoint
@app.get("/logout")
async def logout():
    """Logs out the user and redirects to login"""
    return RedirectResponse(url='/login')

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Get current user info (protected route)
@app.get("/api/me")
async def get_current_user(request: Request):
    """Returns user information from Supabase profiles table"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    token = auth_header.split(" ")[1]
    
    try:
        # Get user session from Supabase (only if configured)
        if supabase_client:
            response = supabase_client.auth.get_session(token)
            if response and response.data:
                user_data = response.data
                
                # Get profile from database
                profile = supabase_client.table("profiles").select("*").eq("id", user_data["user"]["id"]).single().execute()
                
                return {
                    "id": user_data["user"]["id"],
                    "email": user_data["user"]["email"],
                    "display_name": profile.data.get("display_name") if profile.data else None,
                    "created_at": profile.data.get("created_at") if profile.data else None,
                    "session": response.data
                }
    except Exception as e:
        pass
    
    # Fallback to demo mode if Supabase is not configured or user not found
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer demo_token_"):
        token_id = auth_header.split("demo_token_")[1]
        return {
            "id": f"demo-{token_id}",
            "email": f"user_{token_id}@example.com",
            "display_name": None,
            "created_at": None
        }
    
    raise HTTPException(status_code=401, detail="Unauthorized")

# Get exam data (or create default)
@app.get("/api/exams/current")
async def get_exam_data():
    """Returns current exam schedule data"""
    return {
        "examName": "Computer Science A-Level",
        "examDate": "2026-06-15",
        "topics": [
            {"id": "1", "name": "Algorithms", "confidence": 0.3, "marks": 40},
            {"id": "2", "name": "Data Structures", "confidence": 0.5, "marks": 35},
            {"id": "3", "name": "Computer Networks", "confidence": 0.7, "marks": 25}
        ]
    }

# Save exam data
@app.post("/api/exams")
async def save_exam_data(exam_data: dict):
    """Saves exam schedule to local storage"""
    return {"message": "Exam data saved", "data": exam_data}

# Generate revision plan
@app.post("/api/revision-plan")
async def generate_revision_plan(plan_data: dict):
    """Generates adaptive revision plan based on topics and exam date"""
    return {
        "message": "Revision plan generated",
        "queue": [
            {"id": f"q_{i}", "topic_name": topic, "question": f"Explain {topic}", "confidence": 5}
            for i, topic in enumerate(plan_data.get("topics", []))
        ]
    }

# Mark question with AI feedback (demo mode)
@app.post("/api/questions/mark")
async def mark_question(data: dict):
    """Grades user answer and provides AI feedback"""
    return {
        "ai_score_awarded": data.get("maxScore", 10),
        "ai_feedback": "Great job! Keep practicing.",
        "user_confidence_rating": data.get("confidence", 5)
    }

# Generate question from scraped content
@app.post("/api/questions/generate")
async def generate_question(data: dict):
    """Generates exam question based on topic and scraped content"""
    return {
        "question": f"What is the implementation of {data.get('topic', 'the concept')}?",
        "marks": 4
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)