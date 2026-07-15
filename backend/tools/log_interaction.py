from sqlalchemy.orm import Session
from models import Interaction
from datetime import date as dt_date, time as dt_time


def log_interaction(
    db: Session,
    hcp_name: str,
    interaction_type: str,
    date: str,
    time: str,
    attendees: str = "",
    topics_discussed: str = "",
    materials_shared: str = "",
    samples_distributed: str = "",
    sentiment: str = "Neutral",
    outcomes: str = "",
    follow_up_actions: str = "",
) -> dict:
    interaction = Interaction(
        hcp_name=hcp_name,
        interaction_type=interaction_type,
        date=dt_date.fromisoformat(date),
        time=dt_time.fromisoformat(time),
        attendees=attendees,
        topics_discussed=topics_discussed,
        materials_shared=materials_shared,
        samples_distributed=samples_distributed,
        sentiment=sentiment,
        outcomes=outcomes,
        follow_up_actions=follow_up_actions,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return {
        "id": interaction.id,
        "hcp_name": interaction.hcp_name,
        "message": f"Interaction logged successfully for {hcp_name} on {date}",
    }
