from fastapi import APIRouter, Query
from typing import Optional
from app.services.governor import w3
from app.services.governor import list_proposals

router = APIRouter()

@router.get("/metrics")
def metrics(dao: str = Query(..., description="Governor contract address")):
    degraded = False
    supply = "0"
    active = 0
    try:
        # basic active proposals count via recent logs heuristic
        props = list_proposals(dao=dao, from_block=-5000, limit=100)
        active = sum(1 for p in props if p.get("state") == "Active")
    except Exception:
        degraded = True
    return {
        "code": 0,
        "data": {
            "tvl": 0.0,  # fill from your own treasury logic if needed
            "supply": supply,
            "activeProposals": active,
            "pegDeviation": 0.0,
            "degraded": degraded
        },
        "message": "ok" if not degraded else "degraded"
    }
