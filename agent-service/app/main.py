from fastapi import FastAPI

from app.routers import agents

app = FastAPI(title="Oronyx Agent Service")
app.include_router(agents.router, prefix="/agents", tags=["agents"])


@app.get("/health")
def health():
    return {"status": "ok"}
