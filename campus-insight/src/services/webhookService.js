const RENDER_BACKEND_URL = "https://campus-insight-b9mp.onrender.com/api/v1";

// 1. Health Check via Render Backend Proxy (Bypasses Browser CORS)
export async function checkAdvisingHealth() {
  try {
    const res = await fetch(`${RENDER_BACKEND_URL}/advising-health`);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 500, ok: false, error: err.message };
  }
}

// 2. Send Signed Webhook via Render Express Proxy (Bypasses Browser CORS)
export async function sendAdvisingWebhook(payload) {
  try {
    const res = await fetch(`${RENDER_BACKEND_URL}/trigger-advising-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    return {
      status: res.status,
      ok: data.success ?? res.ok,
      signatureSent: data.signatureSent,
      response: data.response || data.error
    };
  } catch (err) {
    return {
      status: 500,
      ok: false,
      error: err.message
    };
  }
}