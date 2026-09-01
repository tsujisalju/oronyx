from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import agents

app = FastAPI(title="Oronyx Agent Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(agents.router, prefix="/agents", tags=["agents"])


@app.get("/health")
def health():
    return {"status": "ok"}
