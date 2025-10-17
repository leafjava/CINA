from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.governor import encode_propose_ai, estimate_gas, basic_checks, DAO_ENV, checksum

router = APIRouter()

class SimReq(BaseModel):
    dao: str | None = Field(None, description="Governor address; default to env DAO_ADDRESS")
    title: str
    description: str
    fundAmountWei: str
    target: str
    fromAddress: str = "0x0000000000000000000000000000000000000001"  # for gas estimate only

@router.post("/simulate")
def simulate(req: SimReq):
    try:
        dao = req.dao or DAO_ENV
        checks = basic_checks(req.target, 0)
        if not (checks["targetOk"] and checks["budgetOk"]):
            return {"code": 40001, "data": None, "message": "target/value failed policy checks"}
        calldata = encode_propose_ai(req.title, req.description, int(req.fundAmountWei), req.target, dao=dao)
        gas = estimate_gas(req.fromAddress, dao, calldata, 0)
        return {"code": 0, "data": {"calldata": calldata, "value":"0", "gasEstimate": gas, "checks": checks, "warnings":[]}, "message": "ok"}
    except Exception as e:
        return {"code": 50002, "data": None, "message": f"SIMULATION_FAIL: {e}"}
