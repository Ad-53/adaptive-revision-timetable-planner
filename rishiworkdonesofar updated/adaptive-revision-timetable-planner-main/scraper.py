import random
from datetime import datetime, timedelta
from typing import Dict, List

SUBJECT_QUESTION_TEMPLATES: Dict[str, str] = {
    "computer science": "Explain the key concepts and exam strategy for computer systems and algorithms.",
    "economics": "Describe the main economic models and how they apply to market behaviour questions.",
    "biology": "Explain the biological process and how it would be assessed in an exam question.",
    "physics": "Describe the physical principles and solve the exam-style problem step by step.",
    "mathematics": "Show how to work through the calculation and explain each step clearly.",
}


def create_revision_plan(topics: List[str], exam_date: str) -> List[Dict]:
    today = datetime.utcnow().date()
    try:
        target = datetime.fromisoformat(exam_date).date()
    except ValueError:
        target = today

    days_until = max(1, (target - today).days)
    schedule_gap = max(1, days_until // max(len(topics), 1))

    plan = []
    for index, topic in enumerate(topics):
        next_date = today + timedelta(days=index * schedule_gap)
        plan.append({
            "id": f"rev_{index + 1}_{int(datetime.utcnow().timestamp())}",
            "topic_name": topic,
            "question": f"Summarise the most important ideas for {topic} and how you would answer an exam question.",
            "confidence": 5,
            "scheduledAt": next_date.isoformat(),
            "lastFeedback": "No submissions yet.",
            "ai_score_awarded": None,
            "ai_max_score": None,
        })
    return plan


def generate_question_for_topic(topic: str, exam_board: str = "AQA", max_score: int = 4) -> Dict:
    template = SUBJECT_QUESTION_TEMPLATES.get(topic.strip().lower())
    if not template:
        template = f"Create a strong exam-style answer for {topic}. Focus on the most important concepts and common exam rubrics."

    question_text = f"{template} Provide a concise answer that would score well on an {exam_board} paper."
    return {
        "id": f"quiz_{topic.strip().lower().replace(' ', '_')}_{int(datetime.utcnow().timestamp())}_{random.randint(100,999)}",
        "topic_name": topic,
        "question_text": question_text,
        "marks": max_score,
        "max_score": max_score,
    }


def grade_quiz_answer(question_id: str, answer_text: str, confidence: int = 5) -> Dict:
    answer_length = len(answer_text.strip())
    score = min(4, max(0, answer_length // 40))
    if any(keyword in answer_text.lower() for keyword in ["explain", "describe", "evaluate", "justify", "compare"]):
        score = min(4, score + 1)

    if score >= 4:
        feedback = "Excellent answer. You covered the main ideas with good exam structure."
    elif score >= 3:
        feedback = "Strong answer. Add a little more detail and you will have full marks."
    elif score >= 2:
        feedback = "The answer is on the right track, but you need more specificity and clearer structure."
    else:
        feedback = "This answer is too short or too general. Focus on the key concepts and answer directly."

    return {
        "question_id": question_id,
        "ai_score_awarded": score,
        "ai_feedback": feedback,
        "confidence": confidence,
    }
