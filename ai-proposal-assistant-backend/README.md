# AI Proposal Assistant Backend (FastAPI + Web3.py) — MVP

A tiny backend for your hackathon demo: **read-chain**, **assemble/simulate calldata**, and **aggregate minimal metrics**.
No private keys, no database. Frontend (or wallet) does the on-chain submission.

## Features (MVP)
- `GET /healthz`
- `GET /v1/dao/metrics?dao=0x...`
- `GET /v1/dao/proposals?dao=0x...&fromBlock=-5000&limit=20`
- `GET /v1/dao/proposals/{id}?dao=0x...`
- `POST /v1/dao/simulate` → encodes `proposeAI((title,desc,fundAmountWei),target)` and estimates gas

## Quickstart
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# copy .env template and fill it
cp .env.example .env

# run
uvicorn app.main:app --reload --port 8787
# then visit: http://127.0.0.1:8787/healthz and http://127.0.0.1:8787/docs
```

## Env Vars
See `.env.example`. You **must** set `RPC_URL` and `DAO_ADDRESS` at least.
Optionally, set `ALLOWED_TARGETS` (comma separated) to whitelist the execution target for proposals.

## ABI
Put your compiled **AIProposalGovernor** ABI at `abi/AIProposalGovernor.json`.
This repo ships a **minimal ABI** good enough for `proposeAI` & `ProposalCreated`. Replace with your full one if needed.

## Notes
- This backend **never holds private keys**. All on-chain submissions must be signed by the front-end wallet.
- For demo speed, some fields are simplified. Extend as you wish.
- If your RPC requires a `from` address for gas estimation, pass `fromAddress` in `/simulate`.
