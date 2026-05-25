"""
Lambda (Python): descarga PDFs desde S3, convierte con pdf2docx, sube DOCX o ZIP a S3,
actualiza el job en DynamoDB (partition TOOLS#PDF_TO_WORD).

@description Procesamiento asíncrono de jobs PDF→Word para el Portal Admin.
"""

from __future__ import annotations

import sys
from pathlib import Path as PathLibPath

_PY_ROOT = PathLibPath(__file__).resolve().parent.parent
if str(_PY_ROOT) not in sys.path:
    sys.path.insert(0, str(_PY_ROOT))

import re
from datetime import datetime, timezone
from pathlib import Path

from lib.converter import clear_dir, convert_pdf_to_docx, zip_docx_files
from lib.job_store import get_job, mark_error, update_job
from lib.s3_io import download_to_path, upload_file


def _slug_safe(name: str) -> str:
    base = Path(name).stem.strip() or "documento"
    cleaned = re.sub(r"[^\w\s.-]", "_", base, flags=re.UNICODE).strip("_")
    return cleaned[:120] if cleaned else "documento"


def lambda_handler(event, context):  # noqa: ARG001
    job_id = (event or {}).get("jobId")
    if not job_id:
        print("[pdf-to-word-worker] Missing jobId in event")
        return {"ok": False, "reason": "missing_job_id"}

    try:
        row = get_job(job_id)
        if not row:
            print(f"[pdf-to-word-worker] Job not found: {job_id}")
            return {"ok": False, "reason": "not_found"}

        status = row.get("status")
        if status != "PROCESSING":
            print(f"[pdf-to-word-worker] Unexpected status={status}, skip jobId={job_id}")
            return {"ok": False, "reason": "wrong_status"}

        inputs = row.get("inputs") or []
        if not isinstance(inputs, list) or len(inputs) < 1:
            mark_error(job_id, "Sin archivos en el job.")
            return {"ok": False, "reason": "no_inputs"}

        tmp_in = Path("/tmp") / job_id / "in"
        tmp_out = Path("/tmp") / job_id / "out"
        clear_dir(tmp_in.parent)

        pdf_paths: list[Path] = []
        meta_names: list[str] = []

        for idx, inp in enumerate(inputs):
            key = inp.get("s3Key") if isinstance(inp, dict) else None
            raw_name = (inp.get("fileName") if isinstance(inp, dict) else "") or f"documento-{idx}"
            slug = _slug_safe(str(raw_name))
            meta_names.append(slug)
            pdf_path = tmp_in / f"{idx:03d}-{slug}.pdf"
            pdf_path.parent.mkdir(parents=True, exist_ok=True)
            download_to_path(str(key), pdf_path)
            pdf_paths.append(pdf_path)

        docx_paths: list[Path] = []
        for i, pdf_path in enumerate(pdf_paths):
            docx_paths.append(tmp_out / f"{meta_names[i]}.docx")
            convert_pdf_to_docx(pdf_path, docx_paths[i])

        now = datetime.now(timezone.utc).isoformat()
        out_prefix = f"tools/pdf-to-word/{job_id}/output"

        if len(docx_paths) == 1:
            out_name = f"{meta_names[0]}.docx"
            out_key = f"{out_prefix}/{out_name}"
            upload_file(
                docx_paths[0],
                out_key,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            update_job(
                job_id,
                {
                    "status": "DONE",
                    "outputS3Key": out_key,
                    "outputFileName": out_name,
                    "outputContentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "completedAt": now,
                    "updatedAt": now,
                },
            )
        else:
            zip_name = f"conversion-{job_id}.zip"
            zip_path = tmp_out / zip_name
            zip_docx_files(docx_paths, zip_path)
            out_key = f"{out_prefix}/{zip_name}"
            upload_file(zip_path, out_key, "application/zip")
            update_job(
                job_id,
                {
                    "status": "DONE",
                    "outputS3Key": out_key,
                    "outputFileName": zip_name,
                    "outputContentType": "application/zip",
                    "completedAt": now,
                    "updatedAt": now,
                },
            )

        print(f"[pdf-to-word-worker] DONE jobId={job_id}")
        return {"ok": True, "jobId": job_id}

    except Exception as e:  # noqa: BLE001
        msg = str(e) or type(e).__name__
        print(f"[pdf-to-word-worker] ERROR jobId={job_id}: {msg}")
        try:
            mark_error(job_id, msg)
        except Exception as mark_e:  # noqa: BLE001
            print(f"[pdf-to-word-worker] failed to mark_error: {mark_e}")
        return {"ok": False, "jobId": job_id, "error": msg}
