import urllib.request
import json
import ssl
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from io import BytesIO
from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://ayevvaecybqjvlvmrbme.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZXZ2YWVjeWJxanZsdm1yYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ1MTg1MiwiZXhwIjoyMDkzMDI3ODUyfQ.mIyomUW0MtEvGtUVYaKmbiIdHPW-4For-6b0YRtfCjg"
OUTPUT_PDF   = "scratch/qr_codes_printable.pdf"

# ── Fetch all students from Supabase ─────────────────────────────────────────
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/qr_users?select=name,unique_id,role&order=name",
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
)
with urllib.request.urlopen(req, context=ssl_ctx) as resp:
    students = json.loads(resp.read().decode())

print(f"✅ Fetched {len(students)} students")

# ── PDF Layout ────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4          # 210 x 297 mm
COLS      = 4
MARGIN    = 10 * mm
QR_SIZE   = 42 * mm          # QR image size
CELL_W    = (PAGE_W - 2 * MARGIN) / COLS
CELL_H    = QR_SIZE + 16 * mm  # QR + name + HT no
ROWS_PER  = int((PAGE_H - 2 * MARGIN) / CELL_H)

c = canvas.Canvas(OUTPUT_PDF, pagesize=A4)
c.setTitle("QR Attendance Codes")

def draw_qr(c, student, x, y):
    name     = student["name"].strip()
    uid      = student["unique_id"].strip()

    # Generate QR
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(uid)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Save QR to buffer
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    pil_img = Image.open(buf)

    # Draw QR
    buf2 = BytesIO()
    pil_img.save(buf2, format="PNG")
    buf2.seek(0)
    from reportlab.lib.utils import ImageReader
    c.drawImage(ImageReader(buf2), x + (CELL_W - QR_SIZE) / 2, y + 10 * mm,
                width=QR_SIZE, height=QR_SIZE)

    # Name (truncate if too long)
    display_name = name if len(name) <= 22 else name[:20] + "…"
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(colors.black)
    c.drawCentredString(x + CELL_W / 2, y + 6 * mm, display_name)

    # HT No
    c.setFont("Helvetica", 6.5)
    c.setFillColor(colors.grey)
    c.drawCentredString(x + CELL_W / 2, y + 2 * mm, uid)

    # Light border
    c.setStrokeColor(colors.HexColor("#dddddd"))
    c.setLineWidth(0.5)
    c.rect(x + 1*mm, y + 0.5*mm, CELL_W - 2*mm, CELL_H - 1*mm)

# ── Render pages ──────────────────────────────────────────────────────────────
idx = 0
total = len(students)

while idx < total:
    page_start_y = PAGE_H - MARGIN - CELL_H

    for row in range(ROWS_PER):
        for col in range(COLS):
            if idx >= total:
                break
            x = MARGIN + col * CELL_W
            y = page_start_y - row * CELL_H
            draw_qr(c, students[idx], x, y)
            idx += 1

    # Page number
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.grey)
    c.drawCentredString(PAGE_W / 2, 6 * mm, f"QR Attendance System — Page {c.getPageNumber()}")

    if idx < total:
        c.showPage()

c.save()
print(f"🎉 PDF saved to: {OUTPUT_PDF}")
print(f"   Total students: {total} | Pages: ~{(total // (COLS * ROWS_PER)) + 1}")
