"""S3 utilities for Lambda worker (/tmp uploads)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import BinaryIO


def bucket_name() -> str:
    b = os.environ.get("BUCKET_INFO_GI")
    if not b:
        raise RuntimeError("BUCKET_INFO_GI must be set")
    return b


def _client():
    import boto3

    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-west-2"))


def download_to_path(key: str, dest_path: Path) -> None:
    cli = _client()
    cli.download_file(bucket_name(), key, str(dest_path))


def upload_file(path: Path, key: str, content_type: str) -> None:
    cli = _client()
    cli.upload_file(
        str(path),
        bucket_name(),
        key,
        ExtraArgs={"ContentType": content_type},
    )


def upload_bytes_body(body: BinaryIO | bytes, key: str, content_type: str) -> None:
    import io

    cli = _client()
    bio = io.BytesIO(body) if isinstance(body, (bytes, bytearray)) else body
    bio.seek(0)
    cli.put_object(Bucket=bucket_name(), Key=key, Body=bio.read(), ContentType=content_type)
