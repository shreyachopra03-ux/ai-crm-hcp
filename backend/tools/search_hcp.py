from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Interaction


def search_hcp(db: Session, query: str) -> list[dict]:
    results = (
        db.query(Interaction)
        .filter(
            or_(
                Interaction.hcp_name.ilike(f"%{query}%"),
                Interaction.topics_discussed.ilike(f"%{query}%"),
                Interaction.attendees.ilike(f"%{query}%"),
            )
        )
        .order_by(Interaction.date.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": r.id,
            "hcp_name": r.hcp_name,
            "interaction_type": r.interaction_type,
            "date": str(r.date),
            "time": str(r.time),
            "sentiment": r.sentiment,
            "outcomes": r.outcomes,
            "topics_discussed": r.topics_discussed,
        }
        for r in results
    ]
