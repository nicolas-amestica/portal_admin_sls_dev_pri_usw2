"""DynamoDB helpers for PDF→Word job rows (maintainer single-table partition TOOLS#PDF_TO_WORD)."""

from __future__ import annotations

import os
from typing import Any, Optional

JOB_PK = os.environ.get("JOB_PK", "TOOLS#PDF_TO_WORD")


def _table_name() -> str:
    table = os.environ.get("DYNAMODB_MAINTAINER_TABLE")
    if not table:
        raise RuntimeError("DYNAMODB_MAINTAINER_TABLE must be set")
    return table


def _ddb():
    import boto3

    return boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-west-2"))


def job_sk(job_id: str) -> str:
    return f"JOB#{job_id}"


def get_job(job_id: str) -> Optional[dict[str, Any]]:
    table = _ddb().Table(_table_name())
    key = {"pk": JOB_PK, "sk": job_sk(job_id)}
    resp = table.get_item(Key=key)
    return resp.get("Item")


def update_job(job_id: str, updates: dict[str, Any]) -> None:
    """Partial update merging top-level scalar attributes."""
    table = _ddb().Table(_table_name())
    key = {"pk": JOB_PK, "sk": job_sk(job_id)}

    names: dict[str, str] = {}
    values: dict[str, Any] = {}
    set_parts: list[str] = []

    for i, (attr, val) in enumerate(updates.items()):
        an = f"#a{i}"
        vn = f":v{i}"
        names[an] = attr
        values[vn] = val
        set_parts.append(f"{an} = {vn}")

    expr = "SET " + ", ".join(set_parts)
    table.update_item(
        Key=key,
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=values,
    )


def mark_error(job_id: str, message: str) -> None:
    from datetime import datetime, timezone

    safe = message[:500]
    update_job(
        job_id,
        {
            "status": "ERROR",
            "error": safe,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        },
    )

