#!/usr/bin/env python3
"""Genera el PDF del guion de defensa a partir de guia.md.

Render fiel del Markdown (headers, blockquotes, tablas, bullets, reglas,
negritas e inline-code) con fpdf2 + fuente DejaVu (Unicode: acentos, ñ,
flechas, «»). Mantiene una sola fuente de verdad: el guia.md.

Uso:  python gen_guion_pdf.py
"""
import os
import re
from fpdf import FPDF

SRC = os.path.join(os.path.dirname(__file__), "guia.md")
OUT = os.path.join(os.path.dirname(__file__), "guia.pdf")

INK = (24, 34, 50)
SLATE = (80, 95, 118)
LINE = (197, 198, 205)
BOXBG = (244, 246, 249)

DEJAVU = "/usr/share/fonts/truetype/dejavu"

# Glifos que DejaVu no trae (emojis): se sustituyen por equivalentes de texto.
EMOJI = {
    "✅": "[OK]", "⚠️": "[!]", "⚠": "[!]", "🤖": "", "❌": "[X]",
    "🔧": "", "→": "->",
}


def clean(s: str) -> str:
    for k, v in EMOJI.items():
        s = s.replace(k, v)
    # inline code `x` -> x (markdown=True de fpdf no procesa backticks)
    s = s.replace("`", "")
    return s.rstrip()


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(*SLATE)
        self.cell(0, 6, "GQG System  |  Guion de Defensa - Primer Examen Final", align="L")
        self.cell(0, 6, str(self.page_no()), align="R")
        self.ln(8)

    def footer(self):
        self.set_y(-12)
        self.set_font("DejaVu", "I", 7)
        self.set_text_color(*SLATE)
        self.cell(0, 6, "Ingenieria de Software III - FP-UNA", align="C")


pdf = PDF(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=16)
pdf.set_margins(18, 16, 18)
pdf.add_font("DejaVu", "", f"{DEJAVU}/DejaVuSans.ttf")
pdf.add_font("DejaVu", "B", f"{DEJAVU}/DejaVuSans-Bold.ttf")
# DejaVuSans no trae oblicua; se usa la regular para "I" y la bold para "BI"
# (necesario porque markdown=True puede pedir negrita dentro de un bloque italic).
pdf.add_font("DejaVu", "I", f"{DEJAVU}/DejaVuSans.ttf")
pdf.add_font("DejaVu", "BI", f"{DEJAVU}/DejaVuSans-Bold.ttf")
pdf.add_font("Mono", "", f"{DEJAVU}/DejaVuSansMono.ttf")
pdf.add_page()


def usable_w():
    return pdf.w - pdf.l_margin - pdf.r_margin


def hr():
    pdf.set_draw_color(*LINE)
    pdf.set_line_width(0.3)
    y = pdf.get_y() + 1
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
    pdf.ln(4)


def heading(txt, level):
    sizes = {1: 15, 2: 12, 3: 10.5}
    pdf.ln(2 if level == 1 else 1)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("DejaVu", "B", sizes[level])
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 6.5, clean(txt), markdown=True)
    if level == 1:
        pdf.set_draw_color(*INK)
        pdf.set_line_width(0.5)
        y = pdf.get_y() + 1
        pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
        pdf.ln(3)
    else:
        pdf.ln(1)


def paragraph(txt):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("DejaVu", "", 9.5)
    pdf.set_text_color(40, 40, 40)
    pdf.multi_cell(0, 5.0, clean(txt), markdown=True)
    pdf.ln(0.5)


def bullet(txt, indent=0):
    pdf.set_text_color(40, 40, 40)
    x0 = pdf.l_margin + 3 + indent * 5
    pdf.set_x(x0)
    pdf.set_font("DejaVu", "B", 9.5)
    pdf.cell(3.5, 5.0, "•")
    pdf.set_font("DejaVu", "", 9.5)
    pdf.multi_cell(usable_w() - 3.5 - (3 + indent * 5), 5.0, clean(txt), markdown=True)


def blockquote(lines):
    pdf.set_fill_color(*BOXBG)
    pdf.set_text_color(*SLATE)
    pdf.set_font("DejaVu", "I", 9)
    txt = clean("\n".join(lines))
    x = pdf.l_margin
    pdf.set_x(x + 2)
    pdf.multi_cell(usable_w() - 4, 4.8, txt, markdown=True, fill=True, border=0)
    pdf.ln(1.5)


def table(rows):
    # rows: lista de listas de celdas (la 1a es encabezado)
    ncol = max(len(r) for r in rows)
    w = usable_w() / ncol
    pdf.set_font("DejaVu", "", 7.5)
    lh = 4.4
    for ri, row in enumerate(rows):
        # altura de la fila = max lineas de sus celdas
        pdf.set_font("DejaVu", "B" if ri == 0 else "", 7.5)
        heights = []
        for c in row:
            lines = pdf.multi_cell(w, lh, clean(c), dry_run=True, output="LINES", markdown=True)
            heights.append(max(1, len(lines)))
        rh = max(heights) * lh
        if pdf.get_y() + rh > pdf.page_break_trigger:
            pdf.add_page()
        y0 = pdf.get_y()
        x0 = pdf.l_margin
        for ci in range(ncol):
            cell = row[ci] if ci < len(row) else ""
            pdf.set_xy(x0 + ci * w, y0)
            if ri == 0:
                pdf.set_fill_color(*INK)
                pdf.set_text_color(255, 255, 255)
                fill = True
            else:
                pdf.set_fill_color(255, 255, 255)
                pdf.set_text_color(40, 40, 40)
                fill = False
            pdf.multi_cell(w, rh, clean(cell), border=1, align="L",
                           fill=fill, markdown=True,
                           new_x="RIGHT", new_y="TOP", max_line_height=lh)
        pdf.set_xy(pdf.l_margin, y0 + rh)
    pdf.ln(2)


# ---------------- Parser de Markdown ----------------
with open(SRC, encoding="utf-8") as f:
    raw = f.readlines()

i = 0
n = len(raw)
while i < n:
    line = raw[i].rstrip("\n")
    s = line.strip()

    if s == "":
        pdf.ln(1.5)
        i += 1
        continue

    # regla horizontal
    if re.fullmatch(r"-{3,}", s):
        hr()
        i += 1
        continue

    # encabezados
    m = re.match(r"(#{1,6})\s+(.*)", s)
    if m:
        heading(m.group(2), min(len(m.group(1)), 3))
        i += 1
        continue

    # blockquote (uno o varios > seguidos)
    if s.startswith(">"):
        block = []
        while i < n and raw[i].strip().startswith(">"):
            block.append(re.sub(r"^\s*>\s?", "", raw[i].rstrip("\n")))
            i += 1
        blockquote(block)
        continue

    # tabla (bloque de lineas que empiezan con |)
    if s.startswith("|"):
        rows = []
        while i < n and raw[i].strip().startswith("|"):
            cells = [c.strip() for c in raw[i].strip().strip("|").split("|")]
            # saltar la fila separadora |---|---|
            if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in cells):
                rows.append(cells)
            i += 1
        if rows:
            table(rows)
        continue

    # bullets (con posible sub-nivel por indentacion)
    mb = re.match(r"(\s*)[-*]\s+(.*)", line)
    if mb:
        indent = len(mb.group(1)) // 2
        bullet(mb.group(2), indent=min(indent, 2))
        i += 1
        continue

    # parrafo normal (puede continuar en lineas siguientes hasta blanco/bloque)
    para = [s]
    i += 1
    while i < n:
        nxt = raw[i].rstrip("\n")
        ns = nxt.strip()
        if ns == "" or re.match(r"(#{1,6})\s", ns) or ns.startswith((">", "|", "-", "*")) \
                or re.fullmatch(r"-{3,}", ns):
            break
        para.append(ns)
        i += 1
    paragraph(" ".join(para))

pdf.output(OUT)
print("PDF generado:", OUT, "-", os.path.getsize(OUT), "bytes")
