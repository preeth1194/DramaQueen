import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SessionManager } from "./services/sessionManager.js";
import { createDramaResponse } from "./services/openai.js";
import {
  sendImageMessageById,
  sendTextMessage,
  uploadMedia,
} from "./services/whatsapp.js";
import { generateDoomReceipt } from "./services/imageGenerator.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/receipts", express.static(path.join(__dirname, "public", "receipts")));

const sessions = new SessionManager();
const maxRequestsPerUser = Number.parseInt(
  process.env.MAX_REQUESTS_PER_USER || "10",
  10
);

function parseIncomingMessage(payload) {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message || message.type !== "text") {
    return null;
  }

  const text = message?.text?.body?.trim();
  if (!text) {
    return null;
  }

  return {
    from: message.from,
    text,
    name: value?.contacts?.[0]?.profile?.name || "Friend",
  };
}

function parseSnapResponse(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (parsed?.Status !== "SNAP") {
      return null;
    }

    const doomScore = Number(parsed.DoomScore);
    return {
      doomScore: Number.isFinite(doomScore) ? Math.min(Math.max(doomScore, 0), 100) : 0,
      summary: String(parsed.Summary || ""),
      realityCheck: String(parsed.RealityCheck || ""),
    };
  } catch (error) {
    return null;
  }
}

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const payload = req.body;
  const incoming = parseIncomingMessage(payload);

  if (!incoming) {
    return res.sendStatus(200);
  }

  const { from, text, name } = incoming;
  const requestCount = sessions.incrementRequestCount(from);
  if (Number.isFinite(maxRequestsPerUser) && requestCount > maxRequestsPerUser) {
    await sendTextMessage(
      from,
      "You have reached the 10 message limit for now. Try again later."
    );
    return res.sendStatus(200);
  }

  sessions.appendUserMessage(from, text);
  const turnCount = sessions.countUserTurns(from);

  try {
    let responseText = await createDramaResponse({
      history: sessions.getHistory(from),
      turnCount,
      userName: name,
      forceSnap: false,
    });

    let snap = parseSnapResponse(responseText);
    if (!snap && turnCount >= 4) {
      responseText = await createDramaResponse({
        history: sessions.getHistory(from),
        turnCount,
        userName: name,
        forceSnap: true,
      });
      snap = parseSnapResponse(responseText);
    }

    if (snap) {
      const receipt = await generateDoomReceipt({
        userName: name,
        doomScore: snap.doomScore,
        summary: snap.summary,
        realityCheck: snap.realityCheck,
      });

      try {
        const mediaId = await uploadMedia(receipt.filePath, "image/png");
        if (!mediaId) {
          throw new Error("WhatsApp media upload returned no id");
        }
        await sendImageMessageById(
          from,
          mediaId,
          "Your doom receipt is ready. Share it on Instagram."
        );
      } finally {
        try {
          await fs.unlink(receipt.filePath);
        } catch (cleanupError) {
          console.warn("Failed to delete receipt file:", cleanupError);
        }
      }

      sessions.clearHistory(from);
    } else {
      await sendTextMessage(from, responseText);
      sessions.appendAssistantMessage(from, responseText);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook handler error:", error);
    try {
      await sendTextMessage(
        from,
        "The Spiral is catching its breath. Try again in a moment."
      );
    } catch (sendError) {
      console.error("Failed to send fallback message:", sendError);
    }
    return res.sendStatus(200);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`The Spiral listening on port ${port}`);
});
