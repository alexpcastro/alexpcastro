#!/usr/bin/env python3
"""Build the local portfolio cover letter + unchanged official resume.

Run with a Python runtime containing reportlab and pypdf. Sources remain read-only.
This creates a private local review artifact outside public assets, not authorization to publish the resume.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import black, HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\x7f", "").replace("’", "'")).strip().lower()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--job-search", type=Path, default=Path.home() / "Documents/ChatGPT/Job Search")
    args = parser.parse_args()
    about_path = ROOT / "src/pages/About.js"
    official_js = args.job_search / "src/officialResume.js"
    official_source = official_js.read_text()
    profile_match = re.search(r"import approved from ['\"]\.\./([^'\"]+)['\"]", official_source)
    if not profile_match:
        raise ValueError("Cannot identify the official profile source.")
    profile_path = args.job_search / profile_match.group(1)
    profile = json.loads(profile_path.read_text())
    pdf_match = re.search(r"officialPdfUrl\s*=\s*['\"](/[^'\"?]+)", official_source)
    if not pdf_match:
        raise ValueError("Cannot identify the official resume PDF.")
    resume_path = args.job_search / "public" / pdf_match.group(1).lstrip("/")
    resume_sha = sha256(resume_path)
    about_sha = sha256(about_path)
    paragraphs = [re.sub(r"\s+", " ", text).strip() for text in re.findall(r"<p>\s*(.*?)\s*</p>", about_path.read_text(), re.S)]
    if len(paragraphs) != 5 or any("<" in text or "{" in text for text in paragraphs):
        raise ValueError("About paragraphs changed shape; review extraction before building.")

    resume = PdfReader(resume_path)
    resume_text = "\n".join(page.extract_text() for page in resume.pages)
    normalized_resume = normalized(resume_text)
    verified_blocks = 0
    for block in profile["blocks"]:
        if block["type"] == "heading":
            continue  # The approved PDF uses presentation-specific section labels.
        pieces = block["text"].split(" | ") if block["type"] in {"role", "academic_role"} else [block["text"]]
        for piece in pieces:
            if normalized(piece) not in normalized_resume:
                raise ValueError(f"Official PDF does not contain profile block: {piece}")
        verified_blocks += 1

    cover_bytes = io.BytesIO()
    pdf = canvas.Canvas(cover_bytes, pagesize=(612, 792), pageCompression=1, invariant=1)
    pdf.setTitle("Alex Castro Cover Letter and Resume")
    pdf.setAuthor("Alex Castro")
    left, width = 54, 504
    pdf.setFillColor(black)
    pdf.setFont("Times-Bold", 24)
    pdf.drawString(left, 730, "Alex Castro")
    pdf.setFont("Times-Roman", 12)
    pdf.drawString(left, 707, "Cover Letter")
    style = ParagraphStyle("CoverBody", fontName="Times-Roman", fontSize=12, leading=17, textColor=HexColor("#222222"), spaceAfter=15)
    y = 666
    for text in paragraphs:
        paragraph = Paragraph(escape(text), style)
        _, height = paragraph.wrap(width, y - 54)
        if y - height < 54:
            raise ValueError("Cover letter would overflow one page; review its layout.")
        paragraph.drawOn(pdf, left, y - height)
        y -= height + style.spaceAfter
    pdf.showPage()
    pdf.save()
    cover_bytes.seek(0)
    cover = PdfReader(cover_bytes)
    if len(cover.pages) != 1:
        raise ValueError("Expected a single cover letter page.")

    output_dir = ROOT / ".review-input/downloads"
    qa_dir = ROOT / "scripts/tmp/pdfs"
    output_dir.mkdir(parents=True, exist_ok=True)
    qa_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / "Alex-Castro-Cover-Letter-and-Resume.pdf"
    writer = PdfWriter()
    writer.append(cover)
    writer.append(resume)
    writer.add_metadata({"/Title": "Alex Castro Cover Letter and Resume", "/Author": "Alex Castro", "/Producer": "", "/Creator": ""})
    with output.open("wb") as stream:
        writer.write(stream)

    combined = PdfReader(output)
    assert len(combined.pages) == len(resume.pages) + 1
    cover_text = combined.pages[0].extract_text()
    expected_cover = "Alex Castro Cover Letter " + " ".join(paragraphs)
    assert normalized(cover_text) == normalized(expected_cover), "Cover text differs from About paragraphs."
    for index, page in enumerate(resume.pages):
        appended = combined.pages[index + 1]
        assert appended.extract_text() == page.extract_text(), "Resume text changed."
        assert appended.get_contents().get_data() == page.get_contents().get_data(), "Resume page drawing content changed."
        assert tuple(appended.mediabox) == tuple(page.mediabox), "Resume page size changed."
    assert sha256(resume_path) == resume_sha, "Source resume PDF changed."
    assert sha256(about_path) == about_sha, "Source About text changed."
    text_output = qa_dir / "combined-extracted.txt"
    text_output.write_text("\n\f\n".join(page.extract_text() for page in combined.pages))
    report = {
        "output": str(output), "sha256": sha256(output), "file_bytes": output.stat().st_size,
        "cover_pages": 1, "resume_pages": len(resume.pages), "combined_pages": len(combined.pages),
        "about_paragraphs": len(paragraphs), "about_text_exact_normalized_match": True,
        "official_profile": str(profile_path), "official_status": profile["status"],
        "official_content_blocks_verified": verified_blocks, "resume_source": str(resume_path),
        "source_resume_sha256": resume_sha, "source_about_sha256": about_sha,
        "resume_page_text_unchanged": True, "resume_drawing_streams_unchanged": True,
        "resume_page_sizes_unchanged": True, "source_files_unchanged": True,
        "cover_content_bottom_pt": y + style.spaceAfter,
        "publication_review_required": ["Private resume and contact details require separate public-publication approval"],
    }
    (qa_dir / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
