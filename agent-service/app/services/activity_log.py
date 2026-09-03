"""Audit trail for every decision the agent pipeline makes, act or skip.

This is the off-chain complement to on-chain ActionExecuted/ActionFlagged
events (not yet indexed) — reasoning has no on-chain equivalent, so this
table is the only place it's captured.
"""

import os
import sqlite3
from datetime import datetime, timezone

DB_PATH = os.getenv(
    "AGENT_METADATA_DB",
    "/app/data/agent_metadata.db",
)


def _connect():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    _ = connection.execute(
        """
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cap_id TEXT NOT NULL,
            action_type INTEGER NOT NULL,
            decision TEXT NOT NULL,
            reasoning TEXT NOT NULL,
            target TEXT,
            amount_mist TEXT,
            risk_score INTEGER,
            created_at TEXT NOT NULL
        )
        """
    )

    connection.commit()

    return connection


def log_decision(
    cap_id: str,
    action_type: int,
    decision: str,
    reasoning: str,
    target: str | None = None,
    amount_mist: str | None = None,
    risk_score: int | None = None,
) -> None:
    connection = _connect()
    try:
        _ = connection.execute(
            """
            INSERT INTO activity_log (
                cap_id, action_type, decision, reasoning,
                target, amount_mist, risk_score, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cap_id,
                action_type,
                decision,
                reasoning,
                target,
                amount_mist,
                risk_score,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        connection.commit()
    finally:
        connection.close()


def get_recent_activity(cap_id: str, limit: int = 10) -> list[sqlite3.Row]:
    connection = _connect()
    try:
        return connection.execute(
            """
            SELECT * FROM activity_log
            WHERE cap_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (cap_id, limit),
        ).fetchall()
    finally:
        connection.close()
