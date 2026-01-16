import fs from "fs/promises";
import path from "path";
import { createCanvas, registerFont } from "canvas";

const OUTPUT_DIR =
  process.env.RECEIPT_OUTPUT_DIR || path.join(process.cwd(), "public", "receipts");

function safeRegisterFont(fontPath, options) {
  try {
    registerFont(fontPath, options);
  } catch (error) {
    console.warn(`Font load failed for ${fontPath}: ${error.message}`);
  }
}

function setupFonts() {
  const fontDir = path.join(process.cwd(), "fonts");
  safeRegisterFont(path.join(fontDir, "PlayfairDisplay-Regular.ttf"), {
    family: "Playfair Display",
  });
  safeRegisterFont(path.join(fontDir, "CourierPrime-Regular.ttf"), {
    family: "Courier Prime",
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawGlitch(ctx, width, height) {
  const glitches = 40;
  for (let i = 0; i < glitches; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const w = 20 + Math.random() * 120;
    const h = 2 + Math.random() * 8;
    ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
    ctx.fillRect(x, y, w, h);
  }
}

export async function generateDoomReceipt({
  userName,
  doomScore,
  summary,
  realityCheck,
}) {
  setupFonts();

  const width = 720;
  const height = 1280;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  drawGlitch(ctx, width, height);

  const margin = 56;
  let cursorY = 80;

  ctx.fillStyle = "#f8fafc";
  ctx.font = "42px \"Playfair Display\"";
  ctx.fillText("THE SPIRAL", margin, cursorY);

  ctx.font = "24px \"Playfair Display\"";
  ctx.fillText("Doom Receipt", margin, cursorY + 38);
  cursorY += 90;

  ctx.strokeStyle = "rgba(248, 250, 252, 0.2)";
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(margin, cursorY);
  ctx.lineTo(width - margin, cursorY);
  ctx.stroke();
  ctx.setLineDash([]);
  cursorY += 40;

  ctx.fillStyle = "#22c55e";
  ctx.font = "22px \"Courier Prime\"";
  ctx.fillText(`Name: ${userName || "Friend"}`, margin, cursorY);
  cursorY += 38;
  ctx.fillText(`Doom Score: ${doomScore}`, margin, cursorY);
  cursorY += 52;

  ctx.fillStyle = "#f8fafc";
  ctx.font = "26px \"Playfair Display\"";
  ctx.fillText("Summary", margin, cursorY);
  cursorY += 34;

  ctx.fillStyle = "#22c55e";
  ctx.font = "20px \"Courier Prime\"";
  for (const line of wrapText(ctx, summary, width - margin * 2)) {
    ctx.fillText(line, margin, cursorY);
    cursorY += 28;
  }

  cursorY += 26;
  ctx.fillStyle = "#f8fafc";
  ctx.font = "26px \"Playfair Display\"";
  ctx.fillText("Reality Check", margin, cursorY);
  cursorY += 34;

  ctx.fillStyle = "#22c55e";
  ctx.font = "20px \"Courier Prime\"";
  for (const line of wrapText(ctx, realityCheck, width - margin * 2)) {
    ctx.fillText(line, margin, cursorY);
    cursorY += 28;
  }

  cursorY += 40;
  ctx.strokeStyle = "rgba(248, 250, 252, 0.2)";
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(margin, cursorY);
  ctx.lineTo(width - margin, cursorY);
  ctx.stroke();
  ctx.setLineDash([]);

  cursorY += 50;
  ctx.fillStyle = "#f8fafc";
  ctx.font = "20px \"Playfair Display\"";
  ctx.fillText("Intent", margin, cursorY);

  ctx.fillStyle = "rgba(34, 197, 94, 0.5)";
  ctx.font = "16px \"Courier Prime\"";
  ctx.fillText("share your doom on instagram", margin, cursorY + 30);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const fileName = `doom-receipt-${Date.now()}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  await fs.writeFile(filePath, canvas.toBuffer("image/png"));

  return { fileName, filePath };
}
