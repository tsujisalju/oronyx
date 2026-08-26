from fastapi import APIRouter

router = APIRouter()


@router.post("/parse-policy")
def parse_policy():
    # will take natural-language rules -> structured AgentCap fields
    ...


@router.post("/decide")
def decide():
    # runtime decision: evaluate action against policy
    ...
