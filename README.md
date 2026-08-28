# Oronyx

Scoped Agent Wallets on Sui — a Move-based trust layer for autonomous
financial agents, letting a user define exactly what an agent is allowed to
do with their funds, then enforcing that boundary on-chain.

Team Evernight — MUBA Blockchain Hackathon 2026

> "They were born of nothingness, turning chaos into order. They define the
> rules and destiny of all things."

## What this is

An agent shouldn't need a blank check to be useful. Oronyx lets a user set
spending limits, allowed actions, allowed targets, and a risk threshold for
an AI agent acting on their behalf — encoded as an on-chain capability
object, not just a UI promise. Actions within policy execute automatically;
anything riskier is flagged and held for the user to approve or reject
themselves. The user can deactivate the agent at any time, independent of
whether the backend is trusted, online, or even compromised.

## Structure

| Directory        | What's in it                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/move`          | The Sui Move contract — vaults, agent capabilities, policy enforcement, and the supported action types (transfer, stake, mock swap, Cetus swap). See `move/README.md`. |
| `/executor`      | TypeScript service that builds and submits the actual Sui transactions an agent takes, signed by a dedicated operator keypair. See `executor/README.md`.               |
| `/agent-service` | Python/FastAPI service responsible for the agent's decision-making — parsing user policy from natural language, deciding what action to take and how risky it is.      |
| `/frontend`      | Next.js dApp — agent creation, policy setup, and the audit/approval dashboard.                                                                                         |

## How to run the dev environment

Run `docker compose up --build` in the root directory to start `frontend`
and `agent-service` together. `/move` is compiled and deployed separately
via the Sui CLI (see `move/README.md`); `/executor` is run directly with
`npm run dev` (see `executor/README.md`).
