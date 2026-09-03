import os
from typing import Any

import anthropic
from dotenv import load_dotenv

load_dotenv()


MODEL = os.getenv("ORONYX_LLM_MODEL", "claude-haiku-4-5-20251001")


POLICY_TOOL = {
    "name": "parse_agent_policy",
    "description": (
        "Extract a user's natural-language Oronyx agent policy into "
        "structured policy fields. Do not invent blockchain addresses "
        "or targets."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "spending_limit_per_tx_sui": {
                "type": "number",
                "description": ("Maximum SUI allowed in a single transaction."),
            },
            "spending_limit_period_sui": {
                "type": "number",
                "description": (
                    "Maximum total SUI spending allowed during the policy period."
                ),
            },
            "period_length_hours": {
                "type": "number",
                "description": ("Length of the spending period in hours."),
            },
            "allowed_actions": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": [
                        "transfer",
                        "mock_swap",
                        "stake",
                        "cetus_swap",
                    ],
                },
                "description": ("Actions explicitly allowed by the user."),
            },
            "allowed_targets": {
                "type": "array",
                "items": {
                    "type": "string",
                },
                "description": (
                    "Recipients, validators, pools, protocols, "
                    "or other targets explicitly mentioned."
                ),
            },
            "risk_stance": {
                "type": "string",
                "enum": [
                    "low",
                    "medium",
                    "high",
                ],
                "description": ("The user's qualitative risk preference."),
            },
            "expiry_hours": {
                "type": ["number", "null"],
                "description": (
                    "Number of hours until policy expiry. "
                    "Use null if no expiry was specified."
                ),
            },
        },
        "required": [
            "spending_limit_per_tx_sui",
            "spending_limit_period_sui",
            "period_length_hours",
            "allowed_actions",
            "allowed_targets",
            "risk_stance",
            "expiry_hours",
        ],
    },
}


SYSTEM_PROMPT = """
You are the policy parser for Oronyx.

Your job is to extract the user's natural-language policy
into the structured format provided by the parse_agent_policy tool.

Rules:

1. Extract only what the user actually says.
2. Never invent blockchain addresses.
3. Never invent recipients, validators, pools, or protocols.
4. Do not convert SUI into MIST.
5. Allowed actions must come from the user's instructions.
6. If the user explicitly permits transfers, use "transfer".
7. If the user explicitly permits swaps without naming Cetus,
   use "mock_swap".
8. Only use "cetus_swap" when the user explicitly requests Cetus.
9. Conservative, cautious, or low-risk means "low".
10. Moderate or balanced means "medium".
11. Aggressive or high-risk means "high".
12. If the user gives no expiry, return null for expiry_hours.
13. If no spending period is specified, use 24 hours.
"""


def _get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not configured. Add it to agent-service/.env."
        )

    return anthropic.Anthropic(api_key=api_key)


def parse_policy_with_llm(text: str) -> dict[str, Any]:
    """
    Calls the Anthropic API with the parse_agent_policy tool forced, so
    the response is always structured JSON matching POLICY_TOOL's schema
    rather than free text we'd have to parse ourselves.
    """
    client = _get_client()

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[POLICY_TOOL],
        tool_choice={"type": "tool", "name": "parse_agent_policy"},
        messages=[{"role": "user", "content": text}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "parse_agent_policy":
            return block.input

    # Forcing tool_choice should make this unreachable in practice, but
    # don't silently return something malformed if the API's behavior
    # ever changes.
    raise RuntimeError("LLM response did not include the expected tool_use block")
