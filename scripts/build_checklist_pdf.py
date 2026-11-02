from html.parser import HTMLParser
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "checklist.html"
OUTPUT = ROOT / "files" / "checklist-priemka-25-points.pdf"


class ChecklistParser(HTMLParser):
    """Extract the five headings and item labels from the website source."""

    def __init__(self):
        super().__init__()
        self.groups = []
        self.in_group = False
        self.heading = False
        self.label = False
        self.current_text = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "article" and "checklist-group" in attributes.get("class", "").split():
            self.in_group = True
        elif tag == "h2" and self.in_group:
            self.heading = True
            self.current_text = []
        elif tag == "label" and self.in_group:
            self.label = True
            self.current_text = []

    def handle_endtag(self, tag):
        if tag == "h2" and self.heading:
            self.groups.append({"title": "".join(self.current_text).strip(), "items": []})
            self.heading = False
            self.current_text = []
        elif tag == "label" and self.label:
            item = " ".join("".join(self.current_text).split())
            if item:
                if not self.groups:
                    raise ValueError("Checklist item appeared before its heading")
                self.groups[-1]["items"].append(item)
            self.label = False
            self.current_text = []
        elif tag == "article" and self.in_group:
            self.in_group = False

    def handle_data(self, data):
        if self.heading or self.label:
            self.current_text.append(data)


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(colors.HexColor("#e87916"))
    canvas.rect(0, height - 5 * mm, width, 5 * mm, fill=1, stroke=0)
    canvas.setFont("Arial", 8)
    canvas.setFillColor(colors.HexColor("#68717a"))
    canvas.drawString(18 * mm, 12 * mm, "Квадрат Ремонт · учебный чек-лист приёмки")
    canvas.drawRightString(width - 18 * mm, 12 * mm, f"Страница {doc.page}")
    canvas.restoreState()


def main():
    parser = ChecklistParser()
    parser.feed(SOURCE.read_text(encoding="utf-8"))
    total = sum(len(group["items"]) for group in parser.groups)
    if len(parser.groups) != 5 or total != 25:
        raise ValueError(f"Expected five groups and 25 items; found {len(parser.groups)} groups and {total} items")

    pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
    pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial", boldItalic="Arial-Bold")

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "ChecklistTitle", parent=styles["Title"], fontName="Arial-Bold",
        fontSize=20, leading=25, alignment=TA_CENTER, textColor=colors.HexColor("#22272d"),
        spaceAfter=4 * mm,
    )
    intro = ParagraphStyle(
        "Intro", parent=styles["BodyText"], fontName="Arial", fontSize=9.5,
        leading=14, textColor=colors.HexColor("#555d65"), alignment=TA_CENTER,
        spaceAfter=3 * mm,
    )
    group_style = ParagraphStyle(
        "GroupHeading", parent=styles["Heading2"], fontName="Arial-Bold",
        fontSize=12, leading=15, textColor=colors.HexColor("#22272d"),
        spaceBefore=3 * mm, spaceAfter=2 * mm, keepWithNext=True,
    )
    item_style = ParagraphStyle(
        "ChecklistItem", parent=styles["BodyText"], fontName="Arial", fontSize=9.2,
        leading=13, leftIndent=7 * mm, firstLineIndent=-7 * mm,
        textColor=colors.HexColor("#333940"), spaceAfter=2.2 * mm,
    )
    note_style = ParagraphStyle(
        "Note", parent=styles["BodyText"], fontName="Arial", fontSize=8.5,
        leading=12, textColor=colors.HexColor("#555d65"), spaceBefore=2 * mm,
    )
    promo_style = ParagraphStyle(
        "Promo", parent=styles["BodyText"], fontName="Arial-Bold", fontSize=10,
        leading=14, textColor=colors.HexColor("#a64c00"), spaceBefore=2 * mm,
    )

    story = [
        Paragraph("Как принять ремонт", title),
        Paragraph("Чек-лист из 25 пунктов для совместного осмотра результата с подрядчиком.", intro),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e87916"), spaceBefore=1 * mm, spaceAfter=3 * mm),
    ]
    number = 0
    for group_index, group in enumerate(parser.groups):
        if group_index == 3:
            story.append(PageBreak())
        block = [Paragraph(escape(group["title"]), group_style)]
        for item in group["items"]:
            number += 1
            block.append(Paragraph(f"□  {number:02d}. {escape(item)}", item_style))
        story.append(KeepTogether(block))
    story += [
        Spacer(1, 2 * mm),
        Paragraph("Важно: электрические измерения и осмотр скрытых/опасных элементов поручайте квалифицированным специалистам. Не снимайте защитные крышки и не выполняйте работы под напряжением самостоятельно.", note_style),
        Paragraph("Промокод для обращения: SMETA24", promo_style),
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=18 * mm, bottomMargin=20 * mm,
        title="Как принять ремонт: чек-лист из 25 пунктов",
        author="Квадрат Ремонт · демонстрационный материал",
    )
    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    print(f"Created {OUTPUT} ({total} checklist items)")


if __name__ == "__main__":
    main()
