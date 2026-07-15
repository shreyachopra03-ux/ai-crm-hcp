import json
import asyncio
import concurrent.futures
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.llm import get_llm

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system focused on Healthcare Professional (HCP) interactions.

You have access to tools to:
- search_hcp: Search interactions by HCP name, topic, or attendee
- log_interaction: Log a new HCP interaction to the database
- edit_interaction: Edit an existing interaction by its ID
- suggest_followups: Generate follow-up action suggestions
- summarize_notes: Summarize raw interaction notes professionally

Use tools whenever the user asks you to log, search, edit, suggest, or summarize.
Always respond in the same language as the user's message.
Be concise and professional."""


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result()
    else:
        return asyncio.run(coro)


@tool
def search_hcp(query: str) -> str:
    """Search HCP interactions by name, topic discussed, or attendee name."""
    from tools.search_hcp import search_hcp as _search
    from database import SessionLocal
    db = SessionLocal()
    try:
        results = _search(db, query)
        if not results:
            return f"No interactions found matching '{query}'."
        lines = [f"Found {len(results)} interaction(s):\n"]
        for r in results:
            lines.append(
                f"• ID {r['id']} | {r['hcp_name']} | {r['interaction_type']} | "
                f"{r['date']} | Sentiment: {r['sentiment'] or 'N/A'} | "
                f"Topics: {r['topics_discussed'] or 'N/A'}"
            )
        return "\n".join(lines)
    finally:
        db.close()


@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    date: str,
    time: str,
    attendees: Optional[str] = "",
    topics_discussed: Optional[str] = "",
    materials_shared: Optional[str] = "",
    samples_distributed: Optional[str] = "",
    sentiment: Optional[str] = "Neutral",
    outcomes: Optional[str] = "",
    follow_up_actions: Optional[str] = "",
) -> str:
    """Log a new HCP interaction to the database.
    date format: YYYY-MM-DD, time format: HH:MM:SS
    sentiment: Positive, Neutral, or Negative
    interaction_type: In-Person Visit, Virtual Meeting, Phone Call, Conference, Lunch & Learn, Other
    """
    from tools.log_interaction import log_interaction as _log
    from database import SessionLocal
    db = SessionLocal()
    try:
        result = _log(
            db,
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            date=date,
            time=time,
            attendees=attendees or "",
            topics_discussed=topics_discussed or "",
            materials_shared=materials_shared or "",
            samples_distributed=samples_distributed or "",
            sentiment=sentiment or "Neutral",
            outcomes=outcomes or "",
            follow_up_actions=follow_up_actions or "",
        )
        return f"✅ {result['message']} (ID: {result['id']})"
    finally:
        db.close()


@tool
def edit_interaction(
    interaction_id: int,
    hcp_name: Optional[str] = None,
    interaction_type: Optional[str] = None,
    date: Optional[str] = None,
    time: Optional[str] = None,
    attendees: Optional[str] = None,
    topics_discussed: Optional[str] = None,
    materials_shared: Optional[str] = None,
    samples_distributed: Optional[str] = None,
    sentiment: Optional[str] = None,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
) -> str:
    """Edit an existing HCP interaction by its ID. Only provide fields you want to change."""
    from tools.edit_interaction import edit_interaction as _edit
    from database import SessionLocal
    db = SessionLocal()
    try:
        kwargs = {k: v for k, v in {
            "hcp_name": hcp_name, "interaction_type": interaction_type,
            "date": date, "time": time, "attendees": attendees,
            "topics_discussed": topics_discussed, "materials_shared": materials_shared,
            "samples_distributed": samples_distributed, "sentiment": sentiment,
            "outcomes": outcomes, "follow_up_actions": follow_up_actions,
        }.items() if v is not None}
        result = _edit(db, interaction_id, **kwargs)
        if "error" in result:
            return f"❌ {result['error']}"
        return f"✅ {result['message']} (Updated: {', '.join(result.get('updated_fields', []))})"
    finally:
        db.close()


@tool
def suggest_followups(interaction_context: str) -> str:
    """Generate 3-5 specific actionable follow-up suggestions based on an HCP interaction context."""
    from tools.suggest_followups import suggest_followups as _suggest
    return _run_async(_suggest(interaction_context))


@tool
def summarize_notes(raw_notes: str) -> str:
    """Summarize raw, unstructured HCP interaction notes into a clean professional summary."""
    from tools.summarize_notes import summarize_notes as _summarize
    return _run_async(_summarize(raw_notes))


TOOLS = [search_hcp, log_interaction, edit_interaction, suggest_followups, summarize_notes]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}


def create_graph():
    llm = get_llm()
    llm_with_tools = llm.bind_tools(TOOLS)

    def agent_node(state: AgentState) -> dict:
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(state["messages"])
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def tool_node(state: AgentState) -> dict:
        last_msg = state["messages"][-1]
        tool_calls_made = []
        result_messages = []

        for tc in last_msg.tool_calls:
            tool_name = tc["name"]
            tool_args = tc["args"]
            tool_id   = tc["id"]
            tool_calls_made.append({"tool": tool_name, "params": tool_args})

            try:
                fn = TOOLS_BY_NAME[tool_name]
                result = fn.invoke(tool_args)
            except Exception as e:
                result = f"❌ Tool '{tool_name}' failed: {str(e)}"

            result_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id)
            )

        return {
            "messages": result_messages,
            "tool_calls": tool_calls_made,
            "tool_results": {"results": [m.content for m in result_messages]},
        }

    def should_use_tools(state: AgentState) -> str:
        last_msg = state["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            return "tools"
        return "end"

    builder = StateGraph(AgentState)
    builder.add_node("agent", agent_node)
    builder.add_node("tools", tool_node)
    builder.set_entry_point("agent")
    builder.add_conditional_edges("agent", should_use_tools, {"tools": "tools", "end": END})
    builder.add_edge("tools", "agent")

    return builder.compile()


graph = create_graph()
