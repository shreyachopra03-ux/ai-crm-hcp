from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    tool_calls: Optional[list[dict]]
    tool_results: Optional[dict]
    context: Optional[str]
