# AI-First CRM – HCP Interaction Manager

An AI-powered Customer Relationship Management (CRM) system built for pharmaceutical field representatives to log, search, and manage interactions with Healthcare Professionals (HCPs). Powered by a LangGraph AI agent with Groq LLMs.

## Features

- Dual Logging Interface — Log interactions via a structured form or through natural language chat
- AI Chat Auto-Fill — Type in chat (e.g. _"Log a call with Dr. Patel about diabetes drug"_) and the form fields auto-populate
- LangGraph Agent — Intelligent agent with 5 tools for HCP management
- Conversation Context — Multi-turn chat with full history passed to the AI
- Search & Filter — Search interactions by HCP name, topics, or attendees; filter by sentiment
- Real-time Sentiment — Tag interactions as Positive, Neutral, or Negative

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Redux Toolkit, Tailwind CSS |
| Font | Google Inter |
| Backend | Python, FastAPI |
| AI Agent | LangGraph |
| LLM (Main Agent) | Groq — `openai/gpt-oss-20b` (replacement for deprecated `gemma2-9b-it`) |
| LLM (Summarization) | Groq — `openai/gpt-oss-120b` (replacement for deprecated `llama-3.3-70b-versatile`) |
| Database | PostgreSQL (via SQLAlchemy) |


## LangGraph Agent & Tools

The LangGraph agent acts as the brain of the CRM. It receives user messages, decides which tool(s) to call, executes them, and returns a human-readable response. The graph follows an agent → tools → agent loop.

### Tool 1 — `log_interaction`
Logs a new HCP interaction to the database. The AI can extract all fields from a natural language message (hcp name, date, type, topics, sentiment, outcomes, etc.) using the LLM and save them directly.

### Tool 2 — `edit_interaction`
Edits an existing interaction by ID. The user can say _"Update interaction 3, change sentiment to Positive"_ and the agent patches only the specified fields.

### Tool 3 — `search_hcp`
Searches the database for interactions matching a query string — matches against HCP name, topics discussed, and attendees. Returns the 10 most recent relevant records.

### Tool 4 — `suggest_followups`
Given an interaction context, uses `llama-3.3-70b-versatile` to generate 3–5 specific, actionable follow-up tasks for the field rep (e.g., schedule demo, send clinical data, book lunch meeting).

### Tool 5 — `summarize_notes`
Takes raw, unstructured interaction notes and uses the LLM to produce a clean, professional summary highlighting key decisions, action items, and outcomes.


## Project Structure

```
ai-crm-hcp/
├── backend/
│   ├── agent/
│   │   ├── graph.py               # LangGraph agent graph definition
│   │   ├── state.py               # AgentState TypedDict
│   │   └── llm.py                 # Groq LLM configuration
│   ├── tools/
│   │   ├── log_interaction.py     # Tool 1 — log new HCP interaction
│   │   ├── edit_interaction.py    # Tool 2 — edit existing interaction
│   │   ├── search_hcp.py          # Tool 3 — search interactions by query
│   │   ├── suggest_followups.py   # Tool 4 — AI follow-up suggestions
│   │   └── summarize_notes.py     # Tool 5 — summarize raw notes
│   ├── routers/
│   │   ├── chat.py                # /chat endpoint + form-data extraction
│   │   └── interactions.py        # CRUD endpoints
│   ├── main.py                    # FastAPI app entry point
│   ├── models.py                  # SQLAlchemy ORM models
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── database.py                # Database connection setup
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatAssistant.tsx       # AI chat panel
    │   │   ├── LogInteractionForm.tsx  # Form with AI auto-fill
    │   │   ├── SentimentSelector.tsx   # Sentiment tag selector
    │   │   └── FollowUpSuggestions.tsx # Follow-up display component
    │   ├── store/
    │   │   ├── store.ts               # Redux store setup
    │   │   ├── chatSlice.ts           # Chat state management
    │   │   └── interactionsSlice.ts   # Interactions state management
    │   ├── api/
    │   │   └── client.ts              # Axios API client
    │   ├── App.tsx                    # Main app component
    │   └── main.tsx                   # React entry point
    ├── index.html
    └── package.json
```


## Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL database
- Groq API key → [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set:
#   GROQ_API_KEY=your_key_here
#   DATABASE_URL=postgresql://user:password@localhost:5432/ai_crm

# Run server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Environment Variables

Create `backend/.env` with:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_crm
```

## How to Use the AI Chat

The AI assistant understands natural language. Examples:

| What you type | What happens |
|--------------|-------------|
| `"Log a visit with Dr. Sharma about diabetes drug, positive sentiment"` | Form auto-fills + tool logs to DB |
| `"Search for Dr. Patel interactions"` | Returns matching records |
| `"Edit interaction 5, change follow-up to next Monday"` | Updates the record |
| `"Suggest follow-ups for my meeting with Dr. Anil about oncology"` | Returns 3-5 action items |
| `"Summarize: met doc, talked drugs, he seemed interested"` | Returns professional summary |

## API Endpoints
    
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/chat/` | AI agent chat |
| `GET` | `/interactions/` | List all interactions |
| `POST` | `/interactions/` | Create interaction |
| `PUT` | `/interactions/{id}` | Update interaction |
| `DELETE` | `/interactions/{id}` | Delete interaction |
| `GET` | `/interactions/hcp/{name}` | Get by HCP name |
