# RevisionAI - Frontend Integration Guide

## Overview
RevisionAI is an adaptive revision timetable application built with HTML, CSS, and JavaScript. It provides AI-powered exam preparation features including:

- **Adaptive Revision Timetable**: Calendar-based scheduling that prioritizes weak topics
- **Flowchart Decomposition**: Upload images of flowcharts to get structured Mermaid.js diagrams
- **Focus Mode**: AI-powered questioning with confidence tracking (1-10 scale)
- **User Authentication**: Login/signup with session management

## Quick Start

### 1. Backend Setup (Required First)
Before running the frontend, ensure the backend is running:

```bash
cd c:\Users\rishi\Documents\Hackathon\backendfiles
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

### 2. Frontend Setup

The frontend files are located in `frontendfiles/`:
- `design.html` - Main HTML structure
- `script.css` - Professional styling with dark/light mode
- `function.js` - Application logic and API integration

### 3. Running the Frontend

**Option A: Serve from backend (Recommended)**
Update `backendfiles/main.py` to serve the frontend:

```python
from fastapi.staticfiles import StaticFiles
import os

# Mount frontend files
frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontendfiles')
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="")
```

Then run backend and open: `http://127.0.0.1:5000`

**Option B: Local static server**
```bash
cd c:\Users\rishi\Documents\Hackathon\frontendfiles
python -m http.server 8000
# Open: http://localhost:8000
```

Set `API_BASE_URL` in browser console if needed:
```javascript
window.API_BASE_URL = 'http://127.0.0.1:5000';
```

## Features Implemented

### Authentication System
- Login/Signup toggle
- Email/password validation
- Session persistence with localStorage
- Demo mode when backend unavailable

### Dashboard
- Exam details input (AQA board, subject, date)
- Topic management (add/remove topics)
- FullCalendar integration for revision schedule
- Exam countdown timer
- Statistics display (questions answered, avg confidence)

### Flowchart Decomposition
- Drag-and-drop image upload
- Mermaid.js rendering of decomposed structures
- Code templates (for loops, while loops, recursion, if/else)
- Copy to clipboard functionality

### Focus Mode (Revision)
- Adaptive question generation
- Answer submission with AI grading
- Confidence rating slider (1-10)
- Revision queue with priority sorting
- Progress tracking
- Feedback display with scores

### Theme System
- Light/Dark mode toggle
- Persistent theme preference
- Smooth transitions

## API Endpoints Expected

The frontend expects these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login |
| `/auth/signup` | POST | User registration |
| `/exam` | POST | Save exam details |
| `/revision-plan` | POST | Generate revision schedule |
| `/questions/{id}/submit` | POST | Submit answer for grading |

## Testing Checklist

- [ ] Login/Signup works
- [ ] Exam date and subject can be set
- [ ] Topics can be added/removed
- [ ] Calendar displays exam and revision events
- [ ] Flowchart upload shows Mermaid diagram
- [ ] Code templates load correctly
- [ ] Questions load in Focus Mode
- [ ] Answer submission works
- [ ] Confidence slider updates value
- [ ] Theme toggle switches light/dark mode
- [ ] Logout clears session

## Git Workflow (from hackathon plan)

When adding new features:

1. Deactivate venv if active
2. Create branch: `git branch name-of-feature`
3. Switch branch: `git switch name-of-feature`
4. Make changes
5. Commit: `git add <file> && git commit -m "description"`
6. Push: `git push origin name-of-feature`
7. Create Pull Request on GitHub
8. Merge after review
9. Pull changes: `git pull origin main`

## Team Member Notes

- **Jack**: Backend setup and API implementation
- **Frontend Team**: HTML/CSS/JS refinement (completed)
- All files are in `frontendfiles/` directory
- Use Git branches to avoid merge conflicts
- Test locally before pushing

## Browser Compatibility

Tested on:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires modern browser with ES6+ support.

## License

Hackathon Project - For educational use only