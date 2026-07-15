from sqlalchemy.orm import Session
from models import Interaction
from datetime import date as dt_date, time as dt_time


def edit_interaction(db: Session, interaction_id: int, **kwargs) -> dict:
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        return {"error": f"Interaction with id {interaction_id} not found"}

    field_map = {
        "hcp_name": "hcp_name",
        "interaction_type": "interaction_type",
        "date": "date",
        "time": "time",
        "attendees": "attendees",
        "topics_discussed": "topics_discussed",
        "materials_shared": "materials_shared",
        "samples_distributed": "samples_distributed",
        "sentiment": "sentiment",
        "outcomes": "outcomes",
        "follow_up_actions": "follow_up_actions",
    }

    updated_fields = []
    for key, value in kwargs.items():
        if value is not None and key in field_map:
            db_field = field_map[key]
            if db_field == "date" and isinstance(value, str):
                value = dt_date.fromisoformat(value)
            elif db_field == "time" and isinstance(value, str):
                value = dt_time.fromisoformat(value)
            setattr(interaction, db_field, value)
            updated_fields.append(key)

    if not updated_fields:
        return {"error": "No valid fields provided to update"}

    db.commit()
    db.refresh(interaction)
    return {
        "id": interaction.id,
        "hcp_name": interaction.hcp_name,
        "updated_fields": updated_fields,
        "message": f"Interaction {interaction_id} updated successfully",
    }
