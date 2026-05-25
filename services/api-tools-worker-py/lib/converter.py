"""PDF to DOCX using pdf2docx (editable paragraphs/tables/images)."""

from __future__ import annotations

from pathlib import Path
import shutil
import zipfile


def convert_pdf_to_docx(pdf_path: Path, docx_path: Path) -> None:
    from pdf2docx import Converter

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    docx_path.parent.mkdir(parents=True, exist_ok=True)
    cv = Converter(str(pdf_path))
    try:
        cv.convert(str(docx_path))
    finally:
        cv.close()


def zip_docx_files(docx_paths: list[Path], zip_path: Path) -> None:
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in docx_paths:
            zf.write(p, arcname=p.name)


def clear_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
