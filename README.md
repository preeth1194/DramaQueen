# The Spiral - WhatsApp Chatbot Backend

Production-ready Node.js backend for the "The Spiral" WhatsApp chatbot.
It uses WhatsApp Cloud API, OpenAI Chat Completions, and node-canvas to
generate Doom Receipt images.

## Features
- WhatsApp webhook verification (GET) and message handling (POST)
- OpenAI-driven dramatic responses with SNAP JSON mode
- Receipt image generation with `canvas`
- WhatsApp media upload + image send by media ID
- In-memory session history and per-user request limit

## Requirements
- Node.js 18+
- WhatsApp Cloud API credentials
- OpenAI API key
- Font files in `./fonts`:
  - `PlayfairDisplay-Regular.ttf`
  - `CourierPrime-Regular.ttf`

## Setup
1. Install dependencies:
   - `npm install`
2. Copy env template:
   - `cp .env.example .env`
3. Fill in `.env` values.

## Environment Variables
See `.env.example` for the full list.

Important values:
- `WHATSAPP_VERIFY_TOKEN`: Choose any string and configure in Meta Webhooks.
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID`: Phone number ID from Meta.
- `OPENAI_API_KEY`: OpenAI API key.
- `OPENAI_MODEL`: Model name (defaults to `gpt-4o`).
- `MAX_REQUESTS_PER_USER`: Per-user request limit (default 10).

## Running
- `npm start`
- Server listens on `PORT` (default 3000).

## Webhook Configuration (Meta)
1. Set webhook URL to:
   - `https://<your-domain>/webhook`
2. Configure verify token to match `WHATSAPP_VERIFY_TOKEN`.

## Media Upload Flow
The server uploads the generated receipt to WhatsApp and sends the image
by media ID. After upload, the local file is deleted immediately.

## Project Structure
- `server.js`: Express app and webhook routes
- `services/openai.js`: OpenAI chat completion logic and system prompt
- `services/whatsapp.js`: WhatsApp send + media upload helpers
- `services/imageGenerator.js`: Doom Receipt renderer with `canvas`
- `services/sessionManager.js`: In-memory session store and limits
- `public/receipts`: Local receipt output (ephemeral)
- `fonts`: Custom font files

## Notes
- In-memory sessions are per-instance. For multi-instance scaling,
  replace `SessionManager` with Redis or another shared store.
- Receipt files are deleted after WhatsApp media upload.

## Troubleshooting
- If `canvas` fails to install, ensure system dependencies are present
  (build tools, cairo, pango, jpeg, gif, and rsvg libs).
- If WhatsApp requests fail, confirm `WHATSAPP_PHONE_NUMBER_ID` and
  `WHATSAPP_ACCESS_TOKEN` are valid and not expired.
