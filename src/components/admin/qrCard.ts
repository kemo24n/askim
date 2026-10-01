"use client";
import QRCode from "qrcode";

export type CardTable = { number: number; zone: string; url: string };

const INK = "#1a120c";
const CRIMSON = "#931d1e";
const PAPER = "#efe3c8";

function rhombus(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = CRIMSON;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws the branded table card (same design as the dashboard) at print resolution. */
export async function renderCard(t: CardTable): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('400 120px "Aref Ruqaa"', "أشكم"),
    document.fonts.load('400 120px "Cormorant Garamond"', "AŞKIM 0123456789"),
    document.fonts.load('italic 400 40px "Cormorant Garamond"', "Okutun"),
  ]).catch(() => {});

  const W = 1200, H = 1800;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // paper + inner frame
  ctx.fillStyle = PAPER;
  roundRect(ctx, 0, 0, W, H, 70); ctx.fill();
  ctx.strokeStyle = "rgba(26,18,12,0.18)"; ctx.lineWidth = 3;
  roundRect(ctx, 40, 40, W - 80, H - 80, 48); ctx.stroke();
  rhombus(ctx, W / 2, 40, 26);

  // logo
  ctx.fillStyle = INK;
  ctx.font = '400 170px "Aref Ruqaa", serif';
  ctx.direction = "rtl";
  ctx.fillText("أشكم", W / 2, 280);
  ctx.direction = "ltr";
  rhombus(ctx, W / 2 + 20, 120, 22);
  ctx.font = '500 40px "Cormorant Garamond", serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "26px";
  ctx.fillText("AŞKIM", W / 2 + 13, 395);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";

  // divider
  ctx.fillStyle = "rgba(147,29,30,0.55)";
  ctx.fillRect(W / 2 - 150, 440, 300, 3);

  // table number + zone
  ctx.fillStyle = INK;
  ctx.font = '500 210px "Cormorant Garamond", serif';
  ctx.fillText(String(t.number), W / 2, 640);
  ctx.globalAlpha = 0.6;
  ctx.font = '600 34px "Manrope Variable", sans-serif';
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "12px";
  ctx.fillText(t.zone.toUpperCase(), W / 2 + 6, 710);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.globalAlpha = 1;

  // QR
  const qr = QRCode.create(t.url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const size = 640;
  const cell = size / n;
  const qx = (W - size) / 2, qy = 780;
  ctx.fillStyle = INK;
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(r, col)) ctx.fillRect(qx + col * cell, qy + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  // captions
  ctx.font = '400 66px "Aref Ruqaa", serif';
  ctx.direction = "rtl";
  ctx.fillText("امسح واطلب من طاولتك", W / 2, 1560);
  ctx.direction = "ltr";
  ctx.font = 'italic 400 44px "Cormorant Garamond", serif';
  ctx.fillText("Okutun, sipariş verin, aşkla gönderin", W / 2, 1640);
  ctx.globalAlpha = 0.7;
  ctx.font = 'italic 400 36px "Cormorant Garamond", serif';
  ctx.fillText("Scan to order, share & send with love", W / 2, 1700);
  ctx.globalAlpha = 1;
  return c;
}

function save(canvas: HTMLCanvasElement, name: string) {
  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      resolve();
    }, "image/png");
  });
}

export async function downloadCard(t: CardTable) {
  await save(await renderCard(t), `askim-table-${t.number}-card.png`);
}

/** Plain QR code (high-res, white background) — for designers / printers. */
export async function downloadQr(t: CardTable) {
  const c = document.createElement("canvas");
  await QRCode.toCanvas(c, t.url, { width: 1600, margin: 4, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } });
  await save(c, `askim-table-${t.number}-qr.png`);
}
