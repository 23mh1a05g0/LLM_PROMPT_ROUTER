"""
Intent Classifier Module

Calls the LLM with a lightweight classification prompt and returns structured
JSON with the detected intent and confidence score.

Gracefully handles malformed LLM output by defaulting to "unclear" with 0.0 confidence.
"""

import os
import re
import json
from dotenv import load_dotenv
from groq import Groq

from prompts import CLASSIFIER_PROMPT, VALID_INTENTS, CONFIDENCE_THRESHOLD

load_dotenv(override=True)

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

# Model optimised for speed / low cost on classification tasks
CLASSIFIER_MODEL = "llama-3.1-8b-instant"

# ─── Fallback result when parsing fails ───────────────────────────────────────
_FALLBACK = {"intent": "unclear", "confidence": 0.0}


def _extract_json(text: str) -> dict:
    """
    Attempts to parse JSON from LLM output. Handles common issues like
    markdown code fences, trailing text, and nested JSON objects.
    """
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    # Try direct JSON parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find a JSON object within the text using regex
    match = re.search(r"\{[^{}]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from: {text[:200]}")


def classify_intent(message: str) -> dict:
    """
    Classifies user intent by calling the LLM with the classifier prompt.

    Args:
        message: The raw user message to classify.

    Returns:
        dict: {"intent": str, "confidence": float}
              Defaults to {"intent": "unclear", "confidence": 0.0} on failure.
    """
    try:
        response = _get_client().chat.completions.create(
            model=CLASSIFIER_MODEL,
            messages=[
                {"role": "system", "content": CLASSIFIER_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0,
            max_tokens=60,  # Classification output is tiny; cap tokens for speed
        )

        raw_content = response.choices[0].message.content.strip()
        intent_data = _extract_json(raw_content)

        # ── Validate the parsed result ──────────────────────────────────
        intent = intent_data.get("intent", "unclear")
        confidence = float(intent_data.get("confidence", 0.0))

        # Clamp confidence to [0.0, 1.0]
        confidence = max(0.0, min(1.0, confidence))

        # Reject unknown intents
        if intent not in VALID_INTENTS:
            intent = "unclear"
            confidence = 0.0

        # Apply confidence threshold
        if confidence < CONFIDENCE_THRESHOLD and intent != "unclear":
            intent = "unclear"

        return {"intent": intent, "confidence": confidence}

    except Exception as e:
        print(f"[Classifier Error] {type(e).__name__}: {e}")
        return dict(_FALLBACK)