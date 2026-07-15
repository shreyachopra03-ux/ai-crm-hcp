import os
import httpx


async def summarize_notes(raw_notes: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    prompt = f"""Summarize the following HCP interaction notes into a clean, professional summary.
Highlight key points, decisions made, and any action items.

Raw Notes:
{raw_notes}

Professional Summary:"""

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openai/gpt-oss-120b",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "max_tokens": 600,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
