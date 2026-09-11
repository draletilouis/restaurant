from pathlib import Path
from datetime import date
import html
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "USER_GUIDE.md"
OUTPUT = ROOT / "output" / "pdf" / "Cater_ERP_User_Guide.pdf"


def ascii_text(value: str) -> str:
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2011": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2192": "->",
        "\u2022": "-",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return value.encode("ascii", "ignore").decode("ascii")


def inline_markup(value: str) -> str:
    value = ascii_text(value)
    escaped = html.escape(value, quote=False)
    escaped = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", escaped)
    return escaped


def table_rows(lines):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells:
            rows.append(cells)
    return rows


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="normal",
        )
        self.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=draw_page)])


def draw_page(canvas, document):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#D0D5DD"))
    canvas.setLineWidth(0.5)
    canvas.line(document.leftMargin, height - 17 * mm, width - document.rightMargin, height - 17 * mm)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#344054"))
    canvas.drawString(document.leftMargin, height - 13 * mm, "CATER ERP")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - document.rightMargin, height - 13 * mm, "User Guide")
    canvas.line(document.leftMargin, 14 * mm, width - document.rightMargin, 14 * mm)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(document.leftMargin, 9 * mm, "Contract catering operations - Phase 1")
    canvas.drawRightString(width - document.rightMargin, 9 * mm, f"Page {document.page}")
    canvas.restoreState()


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=colors.HexColor("#101828"),
        alignment=TA_CENTER,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=17,
        textColor=colors.HexColor("#475467"),
        alignment=TA_CENTER,
        spaceAfter=18,
    ))
    styles.add(ParagraphStyle(
        name="H1Guide",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#101828"),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="H2Guide",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#175CD3"),
        spaceBefore=13,
        spaceAfter=6,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="H3Guide",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#344054"),
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True,
    ))
    styles.add(ParagraphStyle(
        name="BodyGuide",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.3,
        textColor=colors.HexColor("#344054"),
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BulletGuide",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.1,
        leading=12.8,
        leftIndent=14,
        firstLineIndent=-8,
        textColor=colors.HexColor("#344054"),
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name="CodeGuide",
        fontName="Courier",
        fontSize=8.2,
        leading=11,
        leftIndent=8,
        rightIndent=8,
        backColor=colors.HexColor("#F2F4F7"),
        borderColor=colors.HexColor("#D0D5DD"),
        borderWidth=0.5,
        borderPadding=7,
        spaceBefore=5,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.7,
        leading=10,
        textColor=colors.HexColor("#344054"),
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.7,
        leading=10,
        textColor=colors.white,
    ))
    return styles


def build_story():
    styles = make_styles()
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story = []
    story.append(Spacer(1, 31 * mm))
    story.append(Paragraph("Cater ERP", styles["CoverTitle"]))
    story.append(Paragraph("User Guide", styles["CoverTitle"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Contract catering operations - Phase 1", styles["CoverSubtitle"]))
    cover_table = Table(
        [[Paragraph("This guide explains how to use every active workspace tab, complete the operational workflow, and keep stock and approvals auditable.", styles["BodyGuide"])]],
        colWidths=[145 * mm],
    )
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF8FF")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#B2DDFF")),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"Prepared for the Cater ERP workspace | {date.today().isoformat()}", styles["BodyGuide"]))
    story.append(PageBreak())

    i = 0
    paragraph_buffer = []

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(item.strip() for item in paragraph_buffer if item.strip())
            if text:
                story.append(Paragraph(inline_markup(text), styles["BodyGuide"]))
            paragraph_buffer = []

    while i < len(lines):
        line = lines[i]
        if line.strip() == "---":
            flush_paragraph()
            i += 1
            continue
        if line.startswith("```"):
            flush_paragraph()
            i += 1
            code = []
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(ascii_text(lines[i]))
                i += 1
            story.append(Preformatted("\n".join(code), styles["CodeGuide"]))
            i += 1
            continue

        if line.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[2:]), styles["H1Guide"]))
            i += 1
            continue
        if line.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[3:]), styles["H1Guide"]))
            i += 1
            continue
        if line.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[4:]), styles["H2Guide"]))
            i += 1
            continue
        if line.startswith("#### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(line[5:]), styles["H3Guide"]))
            i += 1
            continue

        if line.strip().startswith("|"):
            flush_paragraph()
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(lines[i])
                i += 1
            raw_rows = table_rows(block)
            raw_rows = [row for row in raw_rows if not all(re.fullmatch(r"[-: ]+", cell or "") for cell in row)]
            if raw_rows:
                usable_width = 170 * mm
                col_count = max(len(row) for row in raw_rows)
                col_width = usable_width / col_count
                data = []
                for row_index, row in enumerate(raw_rows):
                    padded = row + [""] * (col_count - len(row))
                    style_name = "TableHeader" if row_index == 0 else "TableCell"
                    data.append([Paragraph(inline_markup(cell), styles[style_name]) for cell in padded])
                table = Table(data, colWidths=[col_width] * col_count, repeatRows=1, hAlign="LEFT")
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#175CD3")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D5DD")),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFFFFF")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]))
                story.append(table)
                story.append(Spacer(1, 5))
            continue

        ordered = re.match(r"^(\d+)\.\s+(.*)$", line.strip())
        if ordered:
            flush_paragraph()
            story.append(Paragraph(f"{ordered.group(1)}. {inline_markup(ordered.group(2))}", styles["BulletGuide"]))
            i += 1
            continue
        if line.strip().startswith("- "):
            flush_paragraph()
            story.append(Paragraph(f"- {inline_markup(line.strip()[2:])}", styles["BulletGuide"]))
            i += 1
            continue
        if not line.strip():
            flush_paragraph()
            i += 1
            continue
        paragraph_buffer.append(line)
        i += 1

    flush_paragraph()
    return story


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = GuideDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=23 * mm,
        bottomMargin=20 * mm,
        title="Cater ERP User Guide",
        author="Cater ERP",
        subject="Contract catering operations - Phase 1",
    )
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
