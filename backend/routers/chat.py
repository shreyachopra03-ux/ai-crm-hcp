from fastapi import APIRouter, HTTPException
from schemas import ChatMessage, ChatResponse, FormData
from agent.graph import graph
from agent.llm import get_llm
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

FORM_EXTRACT_PROMPT = """You are a data extraction assistant for a pharmaceutical CRM.
Extract any HCP interaction form fields mentioned in the user's message.
Return ONLY a valid JSON object with these exact keys (use null for fields not mentioned):

{
  "hcp_name": string or null,
  "interaction_type": one of ["In-Person Visit", "Virtual Meeting", "Phone Call", "Conference", "Lunch & Learn", "Other"] or null,
  "date": "YYYY-MM-DD" format or null,
  "time": "HH:MM:SS" format or null,
  "attendees": string or null,
  "topics_discussed": string or null,
  "materials_shared": string or null,
  "samples_distributed": string or null,
  "sentiment": one of ["Positive", "Neutral", "Negative"] or null,
  "outcomes": string or null,
  "follow_up_actions": string or null
}

Only include fields clearly mentioned by the user. Do not guess or fabricate data.
Return ONLY the JSON, no explanation."""


async def extract_form_data(message: str) -> FormData | None:
    """Use LLM to extract form fields from a user message."""
    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=FORM_EXTRACT_PROMPT),
            HumanMessage(content=message),
        ]
        response = await asyncio.to_thread(llm.invoke, messages)
        content = response.content.strip()

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)
        # Check if any field has a non-null value
        if any(v is not None for v in data.values()):
            return FormData(**{k: v for k, v in data.items() if k in FormData.model_fields})
        return None
    except Exception as e:
        logger.warning(f"Form data extraction failed: {e}")
        return None


@router.post("/", response_model=ChatResponse)
async def chat(msg: ChatMessage):
    try:
        # Build full conversation history
        messages = []
        if msg.history:
            for h in msg.history:
                if h.role == "user":
                    messages.append(HumanMessage(content=h.content))
                elif h.role == "assistant":
                    messages.append(AIMessage(content=h.content))
        messages.append(HumanMessage(content=msg.message))

        initial_state = {
            "messages": messages,
            "tool_calls": None,
            "tool_results": None,
            "context": None,
        }

        # Run agent and form extraction in parallel for speed
        agent_task = asyncio.to_thread(graph.invoke, initial_state)
        form_task = extract_form_data(msg.message)

        result, form_data = await asyncio.gather(agent_task, form_task)

        final_msg = result["messages"][-1].content
        tool_calls = result.get("tool_calls")

        return ChatResponse(
            response=final_msg,
            tool_calls=tool_calls if tool_calls else None,
            form_data=form_data,
        )
    except Exception as e:
        logger.exception("Chat error")
        err = str(e)
        if "Invalid API Key" in err or "invalid_api_key" in err or "401" in err:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable - GROQ_API_KEY is invalid. Update it in backend/.env and restart the server.",
            )
        raise HTTPException(status_code=500, detail=f"Chat error: {err}")
