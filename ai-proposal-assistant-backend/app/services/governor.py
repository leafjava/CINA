import os, json
from typing import Dict, Any, List
from web3 import Web3
from hexbytes import HexBytes

RPC_URL = os.getenv("RPC_URL", "http://localhost:8545")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

DAO_ENV = os.getenv("DAO_ADDRESS", "0x0000000000000000000000000000000000000000")

ABI_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "abi", "AIProposalGovernor.json")
with open(ABI_PATH, "r") as f:
    GOV_ABI = json.load(f)

ALLOWED_TARGETS = {Web3.to_checksum_address(a) for a in os.getenv("ALLOWED_TARGETS","").split(",") if a.strip()}

def checksum(addr: str) -> str:
    return Web3.to_checksum_address(addr)

def governor_contract(dao: str = None):
    address = checksum(dao) if dao else checksum(DAO_ENV)
    return w3.eth.contract(address=address, abi=GOV_ABI)

def encode_propose_ai(title: str, description: str, fund_wei: int, target: str, dao: str = None) -> str:
    c = governor_contract(dao)
    target = checksum(target)
    return c.encodeABI(fn_name="proposeAI", args=[(title, description, int(fund_wei)), target])

def estimate_gas(from_addr: str, to_addr: str, data: str, value: int = 0) -> int:
    tx = {
        "from": checksum(from_addr),
        "to": checksum(to_addr),
        "data": HexBytes(data),
        "value": value
    }
    return int(w3.eth.estimate_gas(tx))

def basic_checks(target: str, value: int = 0) -> Dict[str, Any]:
    ok_target = True
    if ALLOWED_TARGETS:
        ok_target = checksum(target) in ALLOWED_TARGETS
    checks = {
        "paused": False,      # extend if your contract exposes a pause flag
        "budgetOk": (value == 0),
        "targetOk": ok_target
    }
    return checks

def list_proposals(dao: str, from_block: int, limit: int = 20) -> List[Dict[str, Any]]:
    c = governor_contract(dao)
    # ProposalCreated event is included in the ABI shipped
    event_abi = None
    for item in GOV_ABI:
        if item.get("type") == "event" and item.get("name") == "ProposalCreated":
            event_abi = item
            break
    if event_abi is None:
        return []

    topic0 = Web3.keccak(text="ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)").hex()
    latest = w3.eth.block_number
    start_block = latest + from_block if from_block < 0 else from_block
    if start_block < 0:
        start_block = 0
    logs = w3.eth.get_logs({
        "fromBlock": start_block,
        "toBlock": latest,
        "address": checksum(dao),
        "topics": [topic0]
    })
    results = []
    for lg in logs[-limit:]:
        try:
            ev = c.events.ProposalCreated().process_log(lg)
            pid = str(ev["args"]["proposalId"])
            proposer = ev["args"]["proposer"]
            start = int(ev["args"]["startBlock"])
            end = int(ev["args"]["endBlock"])
            desc = ev["args"]["description"]
            # A lightweight 'state' via call
            state = c.functions.state(int(pid)).call()
            state_map = {
                0:"Pending",1:"Active",2:"Canceled",3:"Defeated",4:"Succeeded",
                5:"Queued",6:"Expired",7:"Executed"
            }
            results.append({
                "id": pid,
                "title": desc[:60] if desc else f"Proposal {pid}",
                "state": state_map.get(state, str(state)),
                "proposer": proposer,
                "start": start,
                "end": end,
            })
        except Exception:
            continue
    return results

def get_proposal_detail(dao: str, proposal_id: int) -> Dict[str, Any]:
    c = governor_contract(dao)
    # Many OZ functions exist; here we fetch a minimal set
    state = c.functions.state(int(proposal_id)).call()
    state_map = {
        0:"Pending",1:"Active",2:"Canceled",3:"Defeated",4:"Succeeded",
        5:"Queued",6:"Expired",7:"Executed"
    }
    # We don't store title separately; front-end can map from description hash if needed.
    # For demo, return placeholder fields.
    return {
        "id": str(proposal_id),
        "title": f"Proposal {proposal_id}",
        "description": "Refer to on-chain description.",
        "actions": [],
        "state": state_map.get(state, str(state))
    }
