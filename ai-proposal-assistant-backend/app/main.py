from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, time

app = FastAPI(title="AI Proposal Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"status": "ok", "ts": int(time.time())}

# Routers
from app.routers import metrics, proposals, simulate
app.include_router(metrics.router, prefix="/v1/dao", tags=["dao"])
app.include_router(proposals.router, prefix="/v1/dao", tags=["dao"])
app.include_router(simulate.router, prefix="/v1/dao", tags=["dao"])
