"""
Router Module

Implements the route_and_respond() function that:
  1. Selects the appropriate expert system prompt based on classified intent
  2. Makes a second LLM call to generate the final response
  3. Logs the full routing decision to route_log.jsonl
"""

import os
import re
import json
import datetime
from dotenv import load_dotenv
from groq import Groq

from prompts import EXPERT_PROMPTS
from classifier import classify_intent

load_dotenv(override=True)

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

# Model for generation (can be different / larger than classifier)
GENERATION_MODEL = "llama-3.1-8b-instant"

# Path to the JSON Lines log file
LOG_FILE = os.path.join(os.path.dirname(__file__), "route_log.jsonl")

# Manual override prefixes (e.g., "@code Fix this bug...")
_OVERRIDE_PATTERN = re.compile(
    r"^@(code|data|writing|career|unclear)\s+",
    re.IGNORECASE,
)


def _log_route(user_message: str, intent: str, confidence: float, final_response: str):
    """Appends a JSON object as a new line in route_log.jsonl."""
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "user_message": user_message,
        "intent": intent,
        "confidence": confidence,
        "final_response": final_response,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def route_and_respond(message: str, intent: dict) -> str:
    """
    Routes the user message to the appropriate expert persona and generates
    a context-aware response.

    Args:
        message:  The original user message.
        intent:   Dict from classify_intent(), e.g. {"intent": "code", "confidence": 0.92}

    Returns:
        The final generated response string.
    """
    intent_label = intent.get("intent", "unclear")
    confidence = intent.get("confidence", 0.0)

    # Select the expert system prompt (fall back to "unclear")
    system_prompt = EXPERT_PROMPTS.get(intent_label, EXPERT_PROMPTS["unclear"])

    # Make the generation LLM call
    response = _get_client().chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        temperature=0.7,
        max_tokens=1024,
    )

    final_response = response.choices[0].message.content.strip()

    # Log the routing decision
    _log_route(message, intent_label, confidence, final_response)

    return final_response


def process_message(message: str) -> dict:
    """
    Full pipeline: classify → route → respond → log.

    Supports manual override via @intent prefix (e.g., "@code Fix this bug...").

    Args:
        message: Raw user input.

    Returns:
        dict with keys: intent, confidence, response
    """
    original_message = message

    # ── Check for manual override ──────────────────────────────────────
    override_match = _OVERRIDE_PATTERN.match(message)
    if override_match:
        forced_intent = override_match.group(1).lower()
        message = _OVERRIDE_PATTERN.sub("", message).strip()
        intent_result = {"intent": forced_intent, "confidence": 1.0}
    else:
        # ── Classify ──────────────────────────────────────────────────
        intent_result = classify_intent(message)

    # ── Route & Respond ───────────────────────────────────────────────
    final_response = route_and_respond(message, intent_result)

    return {
        "intent": intent_result["intent"],
        "confidence": intent_result["confidence"],
        "response": final_response,
    }