"""
Unit tests for the LLM Prompt Router.
Mocks the Groq client to test intent classification parsing, fallback handling,
confidence thresholding, routing, logging, and manual override.
"""

import unittest
from unittest.mock import MagicMock, patch
import json
import os

import classifier
import router
from prompts import CONFIDENCE_THRESHOLD

# Mock responses for testing
MOCK_CODE_JSON_RESPONSE = '{"intent": "code", "confidence": 0.95}'
MOCK_MALFORMED_RESPONSE = 'this is not json'
MOCK_LOW_CONFIDENCE_RESPONSE = '{"intent": "career", "confidence": 0.4}'
MOCK_INVALID_INTENT_RESPONSE = '{"intent": "invalid_intent", "confidence": 0.9}'
MOCK_MARKDOWN_JSON_RESPONSE = '```json\n{"intent": "data", "confidence": 0.85}\n```'

class TestLLMPromptRouter(unittest.TestCase):

    def setUp(self):
        # Reset lazy clients so mocks take effect
        classifier._client = None
        router._client = None
        # Clear/setup log file path for testing
        self.original_log_file = router.LOG_FILE
        router.LOG_FILE = "test_route_log.jsonl"
        if os.path.exists(router.LOG_FILE):
            os.remove(router.LOG_FILE)

    def tearDown(self):
        # Restore log file and clean up test files
        if os.path.exists(router.LOG_FILE):
            os.remove(router.LOG_FILE)
        router.LOG_FILE = self.original_log_file

    @patch("classifier._get_client")
    def test_classify_intent_success(self, mock_get_client):
        # Setup mock completion
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = MOCK_CODE_JSON_RESPONSE
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        result = classifier.classify_intent("How do I sort a list?")
        self.assertEqual(result["intent"], "code")
        self.assertEqual(result["confidence"], 0.95)

    @patch("classifier._get_client")
    def test_classify_intent_malformed_json_fallback(self, mock_get_client):
        # Setup mock completion returning malformed JSON
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = MOCK_MALFORMED_RESPONSE
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        # Should not crash; should default to unclear with 0.0 confidence
        result = classifier.classify_intent("malformed test")
        self.assertEqual(result["intent"], "unclear")
        self.assertEqual(result["confidence"], 0.0)

    @patch("classifier._get_client")
    def test_classify_intent_low_confidence_fallback(self, mock_get_client):
        # Setup mock completion with confidence < 0.7
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = MOCK_LOW_CONFIDENCE_RESPONSE
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        # Should threshold to unclear
        result = classifier.classify_intent("low confidence test")
        self.assertEqual(result["intent"], "unclear")

    @patch("classifier._get_client")
    def test_classify_intent_invalid_intent_fallback(self, mock_get_client):
        # Setup mock completion with unknown intent name
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = MOCK_INVALID_INTENT_RESPONSE
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        # Should default to unclear
        result = classifier.classify_intent("invalid intent test")
        self.assertEqual(result["intent"], "unclear")
        self.assertEqual(result["confidence"], 0.0)

    @patch("classifier._get_client")
    def test_classify_intent_markdown_fences(self, mock_get_client):
        # Setup mock completion with markdown formatting
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = MOCK_MARKDOWN_JSON_RESPONSE
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        result = classifier.classify_intent("markdown json test")
        self.assertEqual(result["intent"], "data")
        self.assertEqual(result["confidence"], 0.85)

    @patch("router._get_client")
    def test_route_and_respond_and_logging(self, mock_get_client):
        # Setup mock response for expert response generation
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_choice = MagicMock()
        mock_choice.message.content = "This is a specialized code response."
        mock_client.chat.completions.create.return_value.choices = [mock_choice]

        message = "How do I sort a list?"
        intent = {"intent": "code", "confidence": 0.95}

        response = router.route_and_respond(message, intent)
        self.assertEqual(response, "This is a specialized code response.")

        # Check if the entry is correctly logged to JSONL
        self.assertTrue(os.path.exists(router.LOG_FILE))
        with open(router.LOG_FILE, "r") as f:
            lines = f.readlines()
            self.assertEqual(len(lines), 1)
            log_data = json.loads(lines[0])
            self.assertEqual(log_data["user_message"], message)
            self.assertEqual(log_data["intent"], "code")
            self.assertEqual(log_data["confidence"], 0.95)
            self.assertEqual(log_data["final_response"], "This is a specialized code response.")

    @patch("router._get_client")
    @patch("classifier._get_client")
    def test_manual_override(self, mock_classifier_get, mock_router_get):
        # Mock responses
        mock_router_client = MagicMock()
        mock_router_get.return_value = mock_router_client
        mock_router_choice = MagicMock()
        mock_router_choice.message.content = "Specialized data response."
        mock_router_client.chat.completions.create.return_value.choices = [mock_router_choice]

        # Use prefix override
        result = router.process_message("@data analyze my numbers")
        self.assertEqual(result["intent"], "data")
        self.assertEqual(result["confidence"], 1.0)
        self.assertEqual(result["response"], "Specialized data response.")

        # Ensure classification client was NOT called (overridden directly)
        mock_classifier_get.assert_not_called()


if __name__ == "__main__":
    unittest.main()
