from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Interaction
from schemas import InteractionCreate, InteractionUpdate, InteractionResponse
from typing import Optional

router = APIRouter(prefix="/interactions", tags=["Interactions"])

@router.get("/", response_model=list[InteractionResponse])
def list_interactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    sentiment: Optional[str] = None,
    hcp_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Interaction)
    if search:
        q = q.filter(
            Interaction.hcp_name.ilike(f"%{search}%")
            | Interaction.topics_discussed.ilike(f"%{search}%")
        )
    if sentiment:
        q = q.filter(Interaction.sentiment == sentiment)
    if hcp_name:
        q = q.filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))
    return q.order_by(Interaction.date.desc(), Interaction.time.desc()).offset(skip).limit(limit).all()


@router.get("/{interaction_id}", response_model=InteractionResponse)
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.post("/", response_model=InteractionResponse, status_code=201)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    interaction = Interaction(**data.model_dump())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_interaction(
    interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)
):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(interaction, key, value)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/{interaction_id}")
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": f"Interaction {interaction_id} deleted successfully"}


@router.get("/hcp/{hcp_name}", response_model=list[InteractionResponse])
def get_hcp_interactions(hcp_name: str, db: Session = Depends(get_db)):
    return (
        db.query(Interaction)
        .filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))
        .order_by(Interaction.date.desc())
        .all()
    )
