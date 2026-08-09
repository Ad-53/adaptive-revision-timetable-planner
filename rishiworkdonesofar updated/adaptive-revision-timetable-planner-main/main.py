from datetime import datetime, timedelta
from pathlib import Path
import sqlite3
import json
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from scraper import create_revision_plan, generate_question_for_topic, grade_quiz_answer

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "revision.db"

app = FastAPI()
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
app.mount("/frontend", StaticFiles(directory=BASE_DIR / "frontend"), name="frontend")

class ExamData(BaseModel):
    subject: str
    board: str
    date: str
    topics: List[str]

class RevisionPlanRequest(BaseModel):
    topics: List[str]
    examDate: str

class QuestionGenerateRequest(BaseModel):
    topic: str
    examBoard: str
    maxScore: int = 4

class AnswerSubmission(BaseModel):
    answer: str
    confidence: int


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY,
            subject TEXT NOT NULL,
            board TEXT NOT NULL,
            date TEXT NOT NULL,
            topics_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS revision_plans (
            id INTEGER PRIMARY KEY,
            exam_id INTEGER,
            plan_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (exam_id) REFERENCES exams(id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INTEGER PRIMARY KEY,
            question_id TEXT NOT NULL,
            answer_text TEXT NOT NULL,
            score INTEGER NOT NULL,
            feedback TEXT NOT NULL,
            confidence INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


init_db()


@app.get("/health")
async def health_check():
    return JSONResponse(content={"status": "ok"})


@app.post("/exam")
async def save_exam_details(data: ExamData):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO exams (subject, board, date, topics_json, created_at) VALUES (?, ?, ?, ?, ?)",
        (data.subject, data.board, data.date, json.dumps(data.topics), datetime.utcnow().isoformat()),
    )
    conn.commit()
    exam_id = cursor.lastrowid
    conn.close()
    return JSONResponse(content={"status": "saved", "exam_id": exam_id, "examData": data.dict()})


@app.get("/exam")
async def get_latest_exam():
    conn = get_connection()
    row = conn.execute("SELECT * FROM exams ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    if not row:
        return JSONResponse(content={"exam": None})
    return JSONResponse(content={
        "exam": {
            "subject": row["subject"],
            "board": row["board"],
            "date": row["date"],
            "topics": json.loads(row["topics_json"]),
            "created_at": row["created_at"],
        }
    })


@app.post("/revision-plan")
async def create_revision_plan_endpoint(request: RevisionPlanRequest):
    if len(request.topics) == 0:
        raise HTTPException(status_code=400, detail="At least one topic is required.")

    plan = create_revision_plan(request.topics, request.examDate)
    conn = get_connection()
    exam_row = conn.execute("SELECT id FROM exams ORDER BY id DESC LIMIT 1").fetchone()
    exam_id = exam_row["id"] if exam_row else None
    conn.execute(
        "INSERT INTO revision_plans (exam_id, plan_json, created_at) VALUES (?, ?, ?)",
        (exam_id, json.dumps(plan), datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return JSONResponse(content={"status": "plan_generated", "revisionQueue": plan})


@app.get("/revision-plan")
async def get_latest_revision_plan():
    conn = get_connection()
    row = conn.execute("SELECT * FROM revision_plans ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    if not row:
        return JSONResponse(content={"revisionQueue": []})
    return JSONResponse(content={"revisionQueue": json.loads(row["plan_json"])})


@app.post("/questions/generate")
async def generate_question(request: QuestionGenerateRequest):
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required.")

    question = generate_question_for_topic(
        request.topic,
        exam_board=request.examBoard,
        max_score=request.maxScore,
    )
    return JSONResponse(content={"question": question})


@app.post("/questions/{question_id}/submit")
async def submit_question_answer(question_id: str, submission: AnswerSubmission):
    if not submission.answer:
        raise HTTPException(status_code=400, detail="Answer text is required.")

    grading = grade_quiz_answer(
        question_id=question_id,
        answer_text=submission.answer,
        confidence=submission.confidence,
    )
    conn = get_connection()
    conn.execute(
        "INSERT INTO quiz_answers (question_id, answer_text, score, feedback, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (
            question_id,
            submission.answer,
            grading["ai_score_awarded"],
            grading["ai_feedback"],
            submission.confidence,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()
    return JSONResponse(content=grading)


@app.get("/design")
async def design_page():
    return FileResponse(BASE_DIR / "design.html")


@app.get("/script.css")
async def script_css():
    return FileResponse(BASE_DIR / "script.css")


@app.get("/function.js")
async def function_js():
    return FileResponse(BASE_DIR / "function.js")


@app.get("/")
async def root():
    return FileResponse(BASE_DIR / "frontend" / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
