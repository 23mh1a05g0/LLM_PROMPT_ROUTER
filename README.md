# LLM Prompt Router — Intent Classification & Expert Routing

An intelligent Python service that routes user requests to specialized AI personas using a **two-step LLM pipeline**: classify the intent, then route to the right expert.

```
User Message → [Classifier LLM] → Intent Label → [Expert LLM] → Response
                                        ↓
                                  route_log.jsonl
```

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Intent Classification** | Lightweight LLM call detects intent: `code`, `data`, `writing`, `career`, `unclear` |
| 🧠 **Expert Routing** | Routes to specialized system prompts for high-quality, context-aware responses |
| 📊 **Confidence Threshold** | Low-confidence classifications (< 0.7) automatically fall back to clarification |
| 🔧 **Manual Override** | Prefix messages with `@code`, `@data`, `@writing`, `@career` to bypass classification |
| 📝 **JSONL Logging** | Every routing decision is logged to `route_log.jsonl` for observability |
| 🌐 **Web UI** | Stunning FastAPI-powered web interface with chat, logs viewer, and test suite runner |
| 🐳 **Docker Ready** | Containerized with Docker Compose |

## 🚀 Quick Start

### 1. Set up environment

```bash
# Create .env file with your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Web UI

```bash
uvicorn server:app --reload --port 8000
```

Open **http://localhost:8000** in your browser.

### 3. Run the CLI

```bash
python app.py
```

### 4. Run with Docker

```bash
docker-compose up --build
```

## 📁 Project Structure

```
LLM_PROMPT_ROUTER/
├── prompts.py          # All system prompts (classifier + 4 experts + unclear)
├── classifier.py       # classify_intent() — LLM-based intent detection
├── router.py           # route_and_respond() + process_message() — routing logic
├── server.py           # FastAPI web server
├── app.py              # CLI entry point
├── test_questions.py   # 16 test messages
├── route_log.jsonl     # Routing logs (auto-generated)
├── static/
│   ├── index.html      # Web UI
│   ├── style.css       # Premium dark theme
│   └── app.js          # Frontend logic
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🧪 Test Messages

The test suite includes 16 messages covering:
- Clear single-intent messages (code, data, writing, career)
- Ambiguous / vague messages
- Very short inputs
- Messages with typos
- Multi-intent messages

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message → get classified intent + expert response |
| `GET` | `/api/logs` | Retrieve the last 100 route log entries |
| `GET` | `/api/test-messages` | Get the predefined test messages |

### POST `/api/chat`

```json
// Request
{ "message": "how do i sort a list in python?" }

// Response
{
  "intent": "code",
  "confidence": 0.95,
  "response": "Here's how to sort a list in Python..."
}
```

## ⚙️ Configuration

All prompts are stored in `prompts.py`:
- `CLASSIFIER_PROMPT` — Intent classification system prompt
- `EXPERT_PROMPTS` — Dictionary of expert personas keyed by intent label
- `CONFIDENCE_THRESHOLD` — Minimum confidence to accept (default: 0.7)
- `VALID_INTENTS` — List of accepted intent labels