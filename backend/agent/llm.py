import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from langchain_groq import ChatGroq


def get_llm():
    """
    Primary model for main LangGraph agent.
    gemma2-9b-it was decommissioned by Groq (Oct 2025).
    Using openai/gpt-oss-20b as the fast replacement.
    """
    return ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="openai/gpt-oss-20b",
        temperature=0.3,
    )


def get_llm_large():
    """
    Large model for heavy tasks: summarization, follow-up suggestions.
    Using openai/gpt-oss-120b as replacement for llama-3.3-70b-versatile.
    """
    return ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="openai/gpt-oss-120b",
        temperature=0.5,
    )
