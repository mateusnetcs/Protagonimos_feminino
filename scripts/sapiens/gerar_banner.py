#!/usr/bin/env python3
"""
Gera as duas versões do banner IX SAPIENS (.pptx, 90 x 120 cm) preenchidas com os dados do projeto.

  Versão 1 — duas colunas, como o template original.
  Versão 2 — Resultados e Discussões em faixa horizontal com dois gráficos + QR Code.

Fonte dos dados: GET /api/sapiens (textos de lib/sapiens-content.ts + indicadores do banco).
O layout (posições em cm) também vem da API, então a prévia do site e o .pptx ficam iguais.
As fontes do template (54 pt corpo, 60 pt cabeçalhos, 54 pt título) são preservadas.

Uso (com o app rodando em http://localhost:3000):
    python3 -m venv .venv-sapiens && .venv-sapiens/bin/pip install -r scripts/sapiens/requirements.txt
    .venv-sapiens/bin/python scripts/sapiens/gerar_banner.py

Opções:
    --api URL       endpoint da API (padrão: http://localhost:3000/api/sapiens)
    --json ARQUIVO  usar um JSON salvo em vez da API
"""
from __future__ import annotations

import argparse
import copy
import io
import json
import shutil
import sys
import urllib.request
from pathlib import Path

import qrcode
from PIL import ImageFont
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Cm, Pt

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = Path(__file__).with_name("Template_Banner_IX_Sapiens.pptx")
OUT_NAMES = {
    "v1": "Banner_IX_Sapiens_TecnoProdutivo_Versao1.pptx",
    "v2": "Banner_IX_Sapiens_TecnoProdutivo_Versao2.pptx",
}
OUT_DIRS = [ROOT / "public" / "sapiens", ROOT / "sapies "]

BLUE = RGBColor(0x04, 0x35, 0xDA)
NAVY = RGBColor(0x02, 0x1E, 0x5D)
GREEN = RGBColor(0x3A, 0xB5, 0x4B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BLACK = RGBColor(0x00, 0x00, 0x00)
SLATE = RGBColor(0x1E, 0x29, 0x3B)
BORDER = RGBColor(0xCB, 0xD5, 0xE1)

# IDs das formas no template original
ID_BACKGROUND, ID_LOGO, ID_TITLE = 9, 7, 3
SECTION_SHAPES = {
    # seção: (id do cabeçalho, id da caixa de texto)
    "introducao": (14, 10),
    "metodos": (15, 11),
    "resultados": (16, 13),
    "conclusoes": (17, 12),
    "referencias": (2, 4),
}


# ---------------------------------------------------------------- utilidades

def load_data(args) -> dict:
    if args.json:
        return json.loads(Path(args.json).read_text(encoding="utf-8"))
    with urllib.request.urlopen(args.api, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def place(shape, x, y, w, h):
    shape.left, shape.top, shape.width, shape.height = Cm(x), Cm(y), Cm(w), Cm(h)


def shape_by_id(slide, shape_id):
    for sh in slide.shapes:
        if sh.shape_id == shape_id:
            return sh
    raise KeyError(f"Forma {shape_id} não encontrada no template")


def fixed_box(tf):
    """Desliga o auto-ajuste do template (spAutoFit) para a caixa manter o tamanho do layout."""
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.word_wrap = True


def fill_paragraphs(tf, paragraphs, size_pt=None, align=None, bold=None, color=None):
    """
    Reescreve o texto reaproveitando o primeiro parágrafo/run do template.
    Cada item de `paragraphs` é um texto ou uma lista de (texto, negrito) para runs mistos.
    Tamanho, negrito e alinhamento ficam os do template; só mudam se passados explicitamente.
    """
    txBody = tf._txBody
    ps = txBody.findall(qn("a:p"))
    proto = copy.deepcopy(ps[0])
    proto_r = proto.find(qn("a:r"))
    for p in ps:
        txBody.remove(p)
    for item in paragraphs:
        p_el = copy.deepcopy(proto)
        for child in list(p_el):
            if child.tag != qn("a:pPr"):
                p_el.remove(child)
        txBody.append(p_el)
        para = tf.paragraphs[-1]
        if align is not None:
            para.alignment = align
        runs = item if isinstance(item, list) else [(item, None)]
        for text, run_bold in runs:
            if proto_r is not None:
                r_el = copy.deepcopy(proto_r)
                r_el.find(qn("a:t")).text = text
                para._p.append(r_el)
                run = para.runs[-1]
            else:
                run = para.add_run()
                run.text = text
            f = run.font
            if size_pt:
                f.size = Pt(size_pt)
            b = run_bold if run_bold is not None else bold
            if b is not None:
                f.bold = b
            if color is not None:
                f.color.rgb = color


def add_textbox(slide, x, y, w, h, paragraphs, size_pt, anchor=MSO_ANCHOR.TOP, **kw):
    tb = slide.shapes.add_textbox(Cm(x), Cm(y), Cm(w), Cm(h))
    tf = tb.text_frame
    fixed_box(tf)
    tf.vertical_anchor = anchor
    fill_paragraphs(tf, paragraphs, size_pt, **kw)
    return tb


def make_qr_png(url: str) -> io.BytesIO:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=24, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#021e5d", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def add_qr(slide, url, x, y, size):
    pic = slide.shapes.add_picture(make_qr_png(url), Cm(x), Cm(y), Cm(size), Cm(size))
    pic.name = "QR Code relatorio"
    pic._element.nvPicPr.cNvPr.set("descr", f"QR Code para {url}")
    return pic


def style_chart_common(chart, font_pt):
    chart.has_legend = False
    chart.has_title = False
    chart.font.size = Pt(font_pt)
    chart.font.color.rgb = SLATE


def color_points(series, colors):
    for i, c in enumerate(colors):
        pt = series.points[i]
        pt.format.fill.solid()
        pt.format.fill.fore_color.rgb = c


def add_hbar_chart(slide, rows, x, y, w, h, font_pt, value_pt, suffix="", highlight_first=False):
    """Barras horizontais nativas (editáveis). `rows` na ordem de exibição (de cima para baixo)."""
    cd = CategoryChartData()
    rev = list(reversed(rows))  # o PowerPoint desenha de baixo para cima
    cd.categories = [r["label"] for r in rev]
    cd.add_series("Valores", [r["value"] for r in rev])
    gf = slide.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Cm(x), Cm(y), Cm(w), Cm(h), cd)
    chart = gf.chart
    style_chart_common(chart, font_pt)
    plot = chart.plots[0]
    plot.gap_width = 40
    plot.has_data_labels = True
    dl = plot.data_labels
    dl.position = XL_LABEL_POSITION.OUTSIDE_END
    dl.number_format = f'0"{suffix}"' if suffix else "0"
    dl.number_format_is_linked = False
    dl.font.size = Pt(value_pt)
    dl.font.bold = True
    dl.font.color.rgb = BLACK
    series = plot.series[0]
    colors = [BLUE] * len(rev)
    if highlight_first:
        colors[-1] = GREEN
    color_points(series, colors)
    cat = chart.category_axis
    cat.has_major_gridlines = False
    cat.format.line.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    cat.tick_labels.font.size = Pt(font_pt)
    val = chart.value_axis
    val.visible = False
    val.has_major_gridlines = False
    val.minimum_scale = 0
    val.maximum_scale = max(r["value"] for r in rows) * 1.25
    return gf


def add_column_chart(slide, rows, x, y, w, h, font_pt, value_pt, suffix="", highlight_max=True):
    cd = CategoryChartData()
    cd.categories = [r["label"] for r in rows]
    cd.add_series("Valores", [r["value"] for r in rows])
    gf = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Cm(x), Cm(y), Cm(w), Cm(h), cd)
    chart = gf.chart
    style_chart_common(chart, font_pt)
    plot = chart.plots[0]
    plot.gap_width = 35
    plot.has_data_labels = True
    dl = plot.data_labels
    dl.position = XL_LABEL_POSITION.OUTSIDE_END
    dl.number_format = f'0"{suffix}"' if suffix else "0"
    dl.number_format_is_linked = False
    dl.font.size = Pt(value_pt)
    dl.font.bold = True
    dl.font.color.rgb = BLACK
    mx = max(r["value"] for r in rows)
    color_points(plot.series[0], [GREEN if (highlight_max and r["value"] == mx) else BLUE for r in rows])
    cat = chart.category_axis
    cat.has_major_gridlines = False
    cat.format.line.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    cat.tick_labels.font.size = Pt(font_pt)
    val = chart.value_axis
    val.visible = False
    val.has_major_gridlines = True
    val.major_gridlines.format.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
    val.minimum_scale = 0
    val.maximum_scale = 118 if suffix == "%" else mx * 1.2
    return gf


def add_card(slide, x, y, w, h, name):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Cm(x), Cm(y), Cm(w), Cm(h))
    shp.name = name
    shp.fill.solid()
    shp.fill.fore_color.rgb = WHITE
    shp.line.color.rgb = BORDER
    shp.line.width = Pt(2)
    shp.shadow.inherit = False
    return shp


# ---------------------------------------------------------------- medição de texto
# Carlito tem a mesma métrica da Calibri (fonte do template): a altura medida aqui é a do PowerPoint.
FONT_DIR = Path(__file__).with_name("fonts")
_FONTS: dict = {}


def _font(bold: bool):
    key = "b" if bold else "r"
    if key not in _FONTS:
        _FONTS[key] = ImageFont.truetype(str(FONT_DIR / ("Carlito-Bold.ttf" if bold else "Carlito-Regular.ttf")), 1000)
    return _FONTS[key]


def _tokens(item, bold=False):
    """Paragrafo -> lista de (palavra, negrito)."""
    runs = item if isinstance(item, list) else [(item, bold)]
    out = []
    for text, b in runs:
        out += [(w, bool(b if b is not None else bold)) for w in text.split()]
    return out


def count_lines(item, width_cm, size_pt, bold=False):
    limit = width_cm / 2.54 * 72 * 1000 / size_pt  # largura em unidades da fonte (tamanho 1000)
    space = _font(False).getlength(" ")
    lines, cur = 1, 0.0
    for word, b in _tokens(item, bold):
        w = _font(b).getlength(word)
        if cur == 0:
            cur = w
        elif cur + space + w <= limit:
            cur += space + w
        else:
            lines += 1
            cur = w
    return lines


def line_cm(L, size_pt):
    return size_pt * 0.03528 * L["lineHeight"]


def text_height(L, paragraphs, width_cm, size_pt, bold=False):
    inner = width_cm - 2 * L["inset"]["x"]
    n = sum(count_lines(p, inner, size_pt, bold) for p in paragraphs)
    return n * line_cm(L, size_pt) + 2 * L["inset"]["y"]


# ---------------------------------------------------------------- montagem (layout em fluxo)

def set_insets(tf, L):
    tf.margin_left = tf.margin_right = Cm(L["inset"]["x"])
    tf.margin_top = tf.margin_bottom = Cm(L["inset"]["y"])


def fill_common(slide, banner, L):
    """Fundo, logo e bloco título + autoras. Retorna o y (cm) onde as seções começam."""
    bg = L["background"]
    place(shape_by_id(slide, ID_BACKGROUND), bg["x"], bg["y"], bg["w"], bg["h"])
    lg = L["logo"]
    place(shape_by_id(slide, ID_LOGO), lg["x"], lg["y"], lg["w"], lg["h"])

    F = L["fonts"]
    T = L["title"]
    title = banner["title"].upper()
    lines = [a["line"] for a in banner["authors"]]
    inner = T["w"] - 2 * L["inset"]["x"]
    h = (count_lines(title, inner, F["titlePt"], True) * line_cm(L, F["titlePt"])
         + sum(count_lines(x, inner, F["authorsPt"], True) for x in lines) * line_cm(L, F["authorsPt"])
         + 2 * L["inset"]["y"])
    t = shape_by_id(slide, ID_TITLE)
    place(t, T["x"], T["y"], T["w"], h)
    tf = t.text_frame
    fixed_box(tf)
    set_insets(tf, L)
    tf.vertical_anchor = MSO_ANCHOR.TOP
    fill_paragraphs(tf, [title] + lines)
    for i, para in enumerate(tf.paragraphs):
        para.runs[0].font.size = Pt(F["titlePt"] if i == 0 else F["authorsPt"])
    return T["y"] + h + L["gap"]


def place_section(slide, banner, L, key, x, y, w, paragraphs=None, header_only=False):
    """Cabeçalho + texto medidos a partir de y. Retorna o y final do bloco."""
    header_id, text_id = SECTION_SHAPES[key]
    place(shape_by_id(slide, header_id), x, y, w, L["headerH"])
    y += L["headerH"]
    if header_only:
        return y
    paragraphs = paragraphs or banner[key]["paragraphs"]
    h = text_height(L, paragraphs, w, L["fonts"]["bodyPt"])
    body = shape_by_id(slide, text_id)
    place(body, x, y + L["headerGap"], w, h)
    tf = body.text_frame
    fixed_box(tf)
    set_insets(tf, L)
    fill_paragraphs(tf, paragraphs)
    return y + L["headerGap"] + h


def check_bottom(L, y, label):
    if y > L["content"]["bottom"]:
        print(f"  AVISO: {label} termina em {y:.1f} cm (limite {L['content']['bottom']} cm) — encurte o texto.")


def section_height(L, banner, key, w):
    return L["headerH"] + L["headerGap"] + text_height(L, banner[key]["paragraphs"], w, L["fonts"]["bodyPt"])


def build_v1(prs, banner):
    L = banner["layout"]
    F = L["fonts"]
    C = L["content"]
    slide = prs.slides[0]
    y0 = fill_common(slide, banner, L)
    xl, xr, w = C["x"], C["x"] + C["colW"] + C["colGap"], C["colW"]

    # Coluna esquerda: Introdução, Materiais e Métodos, Conclusões e QR Code
    y = y0
    for key in ("introducao", "metodos", "conclusoes"):
        y = place_section(slide, banner, L, key, xl, y, w) + L["gap"]
    q = L["qrSize"]
    add_qr(slide, banner["qr"]["url"], xl, y, q)
    add_textbox(slide, xl + q + 0.6, y, w - q - 0.6, q, [banner["qr"]["caption"]], F["bodyPt"],
                anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.LEFT)
    check_bottom(L, y + q, "coluna esquerda")

    # Coluna direita: Resultados, gráfico (ocupa o espaço que sobra) e Referências
    y = place_section(slide, banner, L, "resultados", xr, y0, w) + L["gap"]
    refs_h = section_height(L, banner, "referencias", w)
    chart_h = max(L["chartMinH"], L["fillTo"] - refs_h - L["gap"] - y)
    gf = add_hbar_chart(slide, banner["chart"]["data"], xr, y, w, chart_h, F["chartPt"], F["chartPt"])
    gf.name = "Grafico adocao"
    y += chart_h + L["gap"]
    end = place_section(slide, banner, L, "referencias", xr, y, w)
    check_bottom(L, end, "coluna direita")


def build_v2(prs, banner):
    L = banner["layoutV2"]
    F = L["fonts"]
    C = L["content"]
    K = L["cards"]
    v2 = banner["v2"]
    slide = prs.slides[0]
    y = fill_common(slide, banner, L)
    xl, xr, w = C["x"], C["x"] + C["colW"] + C["colGap"], C["colW"]

    # Linha 1: Introdução | Materiais e Métodos
    end = max(place_section(slide, banner, L, "introducao", xl, y, w),
              place_section(slide, banner, L, "metodos", xr, y, w))
    y = end + L["gap"]

    # Alturas do que vem depois dos cartões (legenda e linha 3), para os cartões ocuparem o resto
    caption = [[(v2["caption"]["source"] + " ", True), (v2["caption"]["text"], False)]]
    caption_h = text_height(L, caption, C["w"], F["bodyPt"])
    row3_h = max(section_height(L, banner, "conclusoes", w), section_height(L, banner, "referencias", w))

    # Resultados: cabeçalho de largura total, cartões e legenda
    y = place_section(slide, banner, L, "resultados", C["x"], y, C["w"], header_only=True) + L["headerGap"]
    card_h = max(K["minH"], L["fillTo"] - row3_h - L["gap"] - caption_h - L["headerGap"] - y)
    pad = 0.6
    chart_y = y + K["titleH"]
    chart_h = card_h - K["titleH"] - 0.6
    cw = (C["w"] - K["qrW"] - 2 * K["gap"]) / 2
    xa, xb, xq = C["x"], C["x"] + cw + K["gap"], C["x"] + 2 * (cw + K["gap"])
    for key, x, cw_, title in (("a", xa, cw, v2["chartPct"]["title"]), ("b", xb, cw, v2["chartVolume"]["title"]),
                               ("qr", xq, K["qrW"], v2["qrTitle"])):
        add_card(slide, x, y, cw_, card_h, f"Cartao {key}")
        add_textbox(slide, x + pad, y + 0.2, cw_ - 2 * pad, K["titleH"] - 0.2, [title], F["chartTitlePt"],
                    anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER, bold=True, color=NAVY)
    gf = add_column_chart(slide, v2["chartPct"]["data"], xa + pad, chart_y, cw - 2 * pad, chart_h,
                          F["chartPt"], F["chartValuePt"], suffix=v2["chartPct"]["suffix"])
    gf.name = "Grafico percentual"
    gf = add_hbar_chart(slide, v2["chartVolume"]["data"], xb + pad, chart_y, cw - 2 * pad, chart_h,
                        F["chartPt"], F["chartValuePt"], highlight_first=True)
    gf.name = "Grafico registros"
    size = K["qrW"] - 2.4
    hint_h = 2.4
    qr_y = chart_y + max(0.2, (chart_h - size - hint_h) / 2)
    add_qr(slide, banner["qr"]["url"], xq + 1.2, qr_y, size)
    add_textbox(slide, xq, qr_y + size + 0.2, K["qrW"], hint_h, [v2["qrHint"]], F["chartPt"],
                align=PP_ALIGN.CENTER, bold=True, color=BLUE)
    y += card_h

    cap = shape_by_id(slide, SECTION_SHAPES["resultados"][1])
    place(cap, C["x"], y + L["headerGap"], C["w"], caption_h)
    fixed_box(cap.text_frame)
    set_insets(cap.text_frame, L)
    fill_paragraphs(cap.text_frame, caption)
    y += L["headerGap"] + caption_h + L["gap"]

    # Linha 3: Conclusões | Referências
    end = max(place_section(slide, banner, L, "conclusoes", xl, y, w),
              place_section(slide, banner, L, "referencias", xr, y, w))
    check_bottom(L, end, "banner v2")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--api", default="http://localhost:3000/api/sapiens")
    ap.add_argument("--json")
    args = ap.parse_args()

    banner = load_data(args)["banner"]
    for version, builder in (("v1", build_v1), ("v2", build_v2)):
        prs = Presentation(str(TEMPLATE))
        builder(prs, banner)
        first = OUT_DIRS[0] / OUT_NAMES[version]
        first.parent.mkdir(parents=True, exist_ok=True)
        prs.save(str(first))
        print(f"Banner {version} gerado: {first}")
        for d in OUT_DIRS[1:]:
            if d.exists():
                shutil.copyfile(first, d / OUT_NAMES[version])
                print(f"  cópia: {d / OUT_NAMES[version]}")


if __name__ == "__main__":
    sys.exit(main())
