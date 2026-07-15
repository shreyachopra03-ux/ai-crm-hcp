from pydantic import BaseModel
from datetime import date, time
from typing import Optional


class InteractionBase(BaseModel):
    hcp_name: str
    interaction_type: str
    date: date
    time: time
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[date] = None
    time: Optional[time] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionResponse(InteractionBase):
    id: int

    class Config:
        from_attributes = True


class ChatHistoryMessage(BaseModel):
    role: str  
    content: str


class ChatMessage(BaseModel):
    message: str
    history: Optional[list[ChatHistoryMessage]] = None


class FormData(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[str] = None
    samples_distributed: Optional[str] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    tool_calls: Optional[list[dict]] = None
    form_data: Optional[FormData] = None
