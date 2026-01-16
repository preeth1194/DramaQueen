import fs from "fs";
import axios from "axios";
import FormData from "form-data";

function getBaseUrl() {
  const version = process.env.WHATSAPP_API_VERSION || "v18.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
  }
  return `https://graph.facebook.com/${version}/${phoneNumberId}`;
}

function getHeaders() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function sendMessage(payload) {
  const url = `${getBaseUrl()}/messages`;
  const headers = getHeaders();

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    const message = error?.response?.data || error?.message || error;
    throw new Error(`WhatsApp API error: ${JSON.stringify(message)}`);
  }
}

export async function uploadMedia(filePath, mimeType = "image/png") {
  const url = `${getBaseUrl()}/media`;
  const headers = getHeaders();

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", mimeType);
  form.append("file", fs.createReadStream(filePath), {
    contentType: mimeType,
    filename: "doom-receipt.png",
  });

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...headers,
        ...form.getHeaders(),
      },
    });
    return response.data?.id;
  } catch (error) {
    const message = error?.response?.data || error?.message || error;
    throw new Error(`WhatsApp media upload error: ${JSON.stringify(message)}`);
  }
}

export async function sendTextMessage(to, body) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };
  return sendMessage(payload);
}

export async function sendImageMessageById(to, mediaId, caption) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { id: mediaId, caption },
  };
  return sendMessage(payload);
}
