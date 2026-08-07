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