from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import interactions, chat

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM HCP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interactions.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"status": "AI-CRM Backend is running successfully"}
