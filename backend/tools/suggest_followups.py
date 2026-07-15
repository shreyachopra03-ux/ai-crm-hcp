import os
import httpx


async def suggest_followups(interaction_context: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    prompt = f"""Based on the following HCP interaction details, suggest 3-5 specific, actionable follow-up actions.
Be concise and practical for a pharmaceutical sales rep.

Interaction Context:
{interaction_context}

Provide follow-up suggestions as a numbered list:"""

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
                "temperature": 0.7,
                "max_tokens": 500,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
