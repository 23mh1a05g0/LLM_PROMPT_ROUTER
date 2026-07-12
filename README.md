# 🌌 LLM-Powered Prompt Router & Observability Dashboard

An enterprise-grade, high-performance intent classification and intelligent routing pipeline. This project dynamically categorizes incoming user queries into specialized domains (Code, Data, Writing, Career, or Unclear) and forwards them to dedicated LLM experts. It features a complete React dashboard with a real-time Chat Simulator, Routing Log Viewer, and an automated Test Suite Runner.

```
                  ┌────────────────────────────────────────┐
                  │              User Query                │
                  └───────────────────┬────────────────────┘
                                      │
                         [Has @intent override?]
                           /                 \
                        (Yes)               (No)
                         /                     \
      ┌─────────────────▼────────┐      ┌───────▼────────────────┐
      │ Bypass Classification    │      │ Classifier LLM         │
      │ (e.g. @code query)       │      │ (Strict JSON Output)   │
      └─────────────────┬────────┘      └───────┬────────────────┘
                        │                       │
                        │                 [Confidence < 0.7?]
                        │                    /       \
                        │                 (Yes)      (No)
                        │                   /           \
                        │       ┌──────────▼─────┐  ┌────▼───────────────┐
                        │       │ Fallback to    │  │ Route to Detected  │
                        │       │ "unclear"      │  │ Expert Persona     │
                        │       └──────────┬─────┘  └────┬───────────────┘
                        │                  │             │
                        └─────────┬────────┴─────────────┘
                                  │
                       ┌──────────▼──────────────┐
                       │ Expert LLM Generation   │
                       └──────────┬──────────────┘
                                  │
                       ┌──────────▼──────────────┐
                       │ Append route_log.jsonl  │
                       └──────────┬──────────────┘
                                  │
                  ┌───────────────▼────────┐
                  │   Structured Response  │
                  └────────────────────────┘
```

---

## 🌟 Key Capabilities

* **🧠 Dual-Stage LLM Pipeline:** Uses a high-speed classifier to determine the intent and confidence score before dispatching the query to a specialized persona.
* **🛡️ Fallback Resilience:** Ingests malformed LLM responses safely, gracefully degrading to `unclear` (confidence `0.0`) without server downtime.
* **⚡ Confidence Thresholding:** Rejects weak matches (confidence `< 0.70`), falling back to a Clarification Expert who guides the user toward supported domains.
* **🔧 Explicit Manual Overrides:** Users can bypass intent classification completely by prepending requests with `@code`, `@data`, `@writing`, or `@career`.
* **📊 Observability Logs:** Persistently serializes transaction records (timestamp, query, classification, confidence, response) in a structured JSON Lines (`route_log.jsonl`) file.
* **🎛️ React Dashboard:** Beautiful glassmorphic UI featuring a simulator with typing indicators, filtered audit logs, and a batch regression runner.

---

## 📁 System Architecture

```
LLM_PROMPT_ROUTER/
├── frontend/               # React SPA Frontend
│   ├── src/                # Component & Style Directory
│   │   ├── components/
│   │   │   ├── ChatSimulator.jsx   # Interactive chat preview
│   │   │   ├── RoutingLogs.jsx     # JSONL log table with search/filters
│   │   │   └── TestSuiteRunner.jsx # Sequential regression tester
│   │   ├── App.jsx         # App router and sidebar layout
│   │   └── index.css       # Custom glassmorphic styles
│   ├── package.json        # Frontend manifest
│   └── vite.config.js      # Vite configuration (proxies `/api` to 8000)
├── static/                 # Production-built assets (auto-generated)
├── classifier.py           # Intent parsing & schema enforcement
├── router.py               # Message routing and JSONL logging
├── prompts.py              # Expert personas and system templates
├── server.py               # FastAPI backend server
├── app.py                  # Interactive CLI client
├── test_questions.py       # Predefined evaluation test suite
├── test_router.py          # Backend unittest suite
├── requirements.txt        # Python dependency manifest
├── Dockerfile              # Backend container definition
└── docker-compose.yml      # Orchestrates full-stack development containers
```

---

## 🚀 Setting Up the Development Environment

### Prerequisites
* Python 3.10+
* Node.js 18+ (for frontend development)
* Groq API Key (get yours at [console.groq.com](https://console.groq.com))

### 1. Backend Setup
Clone this repository, navigate to the project root, configure your environment variables, and install dependencies:

```bash
# Create and edit your .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# Initialize python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
python -m uvicorn server:app --port 8000
```
The backend API will be running at `http://localhost:8000`.

### 2. Frontend Setup
Open a second terminal, navigate to the `frontend/` directory, install Node packages, and launch Vite's dev server:

```bash
cd frontend
npm install
npm run dev
```
The developer dashboard will be active at `http://localhost:5173`. Vite is pre-configured to proxy API requests directly to the FastAPI server running on port 8000.

---

## 🐳 Running with Docker

You can spin up the entire system (both the FastAPI backend and Node.js frontend servers) in containerized mode with Docker Compose:

```bash
# Start containers
docker-compose up --build
```
Access the application at `http://localhost:8000`.

---

## 🧪 Testing

### Backend Unit Tests
Execute the Python test runner to verify intent parsing, confidence threshold fallbacks, regex resilience against malformed JSON, and logging behavior:

```bash
python -m unittest test_router.py
```

### Batch UI Testing
Navigate to the **Test Suite Runner** tab in the dashboard to execute the 16 regression test cases sequentially. The UI compiles aggregated statistics in real-time, including:
- **Accuracy Rate (%)**
- **Average Confidence (%)**
- **Cumulative Runtime (seconds)**

---

## 🔌 API Reference

### 1. Route Message
* **Endpoint:** `POST /api/chat`
* **Content-Type:** `application/json`

**Request Body:**
```json
{
  "message": "how do i sort a dictionary in python?"
}
```

**Response Body (200 OK):**
```json
{
  "intent": "code",
  "confidence": 0.98,
  "response": "To sort a dictionary in Python, you can use the built-in `sorted()` function..."
}
```

### 2. Read Routing Logs
* **Endpoint:** `GET /api/logs`
* **Response Body (200 OK):** Returns the last 100 entries logged to `route_log.jsonl` (newest first).

### 3. Fetch Test Suite
* **Endpoint:** `GET /api/test-messages`
* **Response Body (200 OK):** Returns the array of 16 evaluation test scenarios.

---

## ⚙️ Routing Logic Rules

Our system enforces the following constraints:
1. **JSON Output Extraction:** The classifier LLM is strictly constrained via its system prompt to output valid JSON matching `{"intent": string, "confidence": float}`. A regex parser filters out markdown block fences if returned.
2. **Crash Prevention:** If the LLM generates plain text or malformed JSON, the classifier returns `{"intent": "unclear", "confidence": 0.0}` instead of crashing.
3. **Threshold Filter:** If the returned confidence is `< 0.70`, the router automatically overrides the target intent to `unclear`.
4. **Clarification Fallback:** All `unclear` intents map to the **Clarification Assistant**, instructing the user on how to refine their prompt to match supported domains (Code, Data, Writing, Career).