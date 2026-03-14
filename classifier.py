
import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CLASSIFIER_PROMPT = """
Your task is to classify the user's intent.

Choose ONE label from:
- code
- data
- writing
- career
- unclear

Respond ONLY with JSON:
{
  "intent": "label",
  "confidence": number_between_0_and_1
}
"""

def classify_intent(message: str) -> dict:
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", 
            messages=[
                {"role": "system", "content": CLASSIFIER_PROMPT},
                {"role": "user", "content": message}
            ],
            temperature=0
        )

        content = response.choices[0].message.content.strip()

        print("RAW LLM OUTPUT:", content)

        intent_data = json.loads(content)

        return intent_data

    except Exception as e:
        print("Classification Error:", e)

        return {
            "intent": "unclear",
            "confidence": 0.0
        }