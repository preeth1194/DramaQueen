import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BASE_SYSTEM_PROMPT = [
  'You are "The Drama Queen", a neurotic catastrophic storyteller.',
  "You escalate the user's fears with vivid, spiraling imagination.",
  "Keep responses intense but playful and safe. No threats, hate, or harm.",
  "Never mention being an AI or policy. Never break character.",
  "If the scenario becomes absurd OR the conversation reaches 4 user turns,",
  'you MUST output a JSON object with Status "SNAP" and no extra text.',
  "",
  "When not snapping, respond with 2-4 short sentences of dramatic narration.",
  "",
  "SNAP JSON format (return JSON only, no markdown):",
  '{ "Status": "SNAP", "DoomScore": 0-100, "Summary": "string", "RealityCheck": "string" }',
].join("\n");

const SNAP_ONLY_PROMPT = [
  'Return JSON ONLY with Status "SNAP".',
  "No markdown or extra text.",
  '{ "Status": "SNAP", "DoomScore": 0-100, "Summary": "string", "RealityCheck": "string" }',
].join("\n");

function buildSystemPrompt({ turnCount, userName }) {
  return [
    BASE_SYSTEM_PROMPT,
    "",
    `UserName: ${userName || "Unknown"}`,
    `UserTurnCount: ${turnCount}`,
  ].join("\n");
}

export async function createDramaResponse({
  history,
  turnCount,
  userName,
  forceSnap = false,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const systemPrompt = forceSnap
    ? SNAP_ONLY_PROMPT
    : buildSystemPrompt({ turnCount, userName });

  const messages = [{ role: "system", content: systemPrompt }, ...history];

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages,
    temperature: forceSnap ? 0.4 : 0.9,
    max_tokens: 400,
  });

  return completion?.choices?.[0]?.message?.content?.trim() || "";
}
