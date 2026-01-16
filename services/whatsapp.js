import axios from "axios";

function getBaseUrl() {
  const version = process.env.WHATSAPP_API_VERSION || "v18.0";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
  }
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
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
  const url = getBaseUrl();
  const headers = getHeaders();

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    const message = error?.response?.data || error?.message || error;
    throw new Error(`WhatsApp API error: ${JSON.stringify(message)}`);
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

export async function sendImageMessage(to, imageUrl, caption) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: imageUrl, caption },
  };
  return sendMessage(payload);
}
