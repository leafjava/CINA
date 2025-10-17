from fastapi import APIRouter, Query
from typing import Optional
from app.services.governor import list_proposals, get_proposal_detail

router = APIRouter()

@router.get("/proposals")
def proposals(
    dao: str = Query(..., description="Governor contract address"),
    fromBlock: int = Query(-5000, description="negative = blocks from tip"),
    limit: int = Query(20, ge=1, le=200)
):
    try:
        data = list_proposals(dao=dao, from_block=fromBlock, limit=limit)
        return {"code": 0, "data": data, "message": "ok"}
    except Exception as e:
        return {"code": 50001, "data": [], "message": f"CHAIN_RPC_FAIL: {e}"}

@router.get("/proposals/{proposalId}")
def proposal_detail(
    proposalId: int,
    dao: str = Query(..., description="Governor contract address"),
):
    try:
        data = get_proposal_detail(dao=dao, proposal_id=proposalId)
        return {"code": 0, "data": data, "message": "ok"}
    except Exception as e:
        return {"code": 50001, "data": None, "message": f"CHAIN_RPC_FAIL: {e}"}
