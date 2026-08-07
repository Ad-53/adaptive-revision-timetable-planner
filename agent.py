import os
import json
import re
from datetime import datetime, timezone
from openai import OpenAI


#Use Open AI to redirect to featherless API
client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=os.environ.get("FEATHERLESS_API_KEY")
)

MODEL_ID = "featherless/meta-llama/Meta-Llama-3.1-8B-Instruct" #using featherless api to use meta-llama model for question answering

def clean_json_string(raw_string: str) -> str:

    """
    Cleans a raw JSON string by removing unnecessary whitespace and formatting issues.
    e.g. '...JSON..,,,..' becomes 'JSON'
    Used to put strings into python dictionaries
    """

    try:
        cleaned = re.sub(r"^```json\s*", "", raw_string.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "ai_score_awarded" : 0,
            "ai_feedback" : "The AI was unable to parse the JSON string. Please ensure the string is valid JSON and try again."
        }

def generate_question(topic: str, scraped_content: str) -> str:
    """
    Generates a question based on the given topic and scraped content using the featherless API.
    """

    system_prompt = (
        "You are an expert UK A-Level examiner. Your task is to extract or formulate "
        "a single, clear exam question based strictly on the provided past-paper text.\n\n"
        "RULES:\n"
        "1. Fix weird formatting, typos, or broken sentences caused by PDF extraction.\n"
        "2. Do NOT include answers, mark schemes, or examiner notes.\n"
        "3. Ensure the question is directly relevant to the topic provided.\n"
        "4. Include total available marks in brackets at the end (e.g., [4 marks]).\n"
        "5. Output ONLY the question string with zero introductory text."
    )

    user_prompt = f"Topic: {topic}\n\nScraped Context:\n{scraped_content}"

    response = client.chat.completions.create(
        model=MODEL_ID,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7
    )

    return response.choices[0].message.content.strip()