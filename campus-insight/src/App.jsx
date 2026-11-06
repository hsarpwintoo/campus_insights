import React, { useState, useEffect } from 'react';
import { checkAdvisingHealth, sendAdvisingWebhook } from './services/webhookService';

export default function App() {
  const [activeTab, setActiveTab] = useState("webhooks");

  // Health State
  const [healthResult, setHealthResult] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Webhook Tester State
  const [lecturerEmail, setLecturerEmail] = useState("john.doe@mfu.ac.th");
  const [slotDate, setSlotDate] = useState("2026-09-25");
  const [slotTime, setSlotTime] = useState("10:00-11:00");
  const [webhookResult, setWebhookResult] = useState(null);
  const [sendingWebhook, setSendingWebhook] = useState(false);

  useEffect(() => {
    handleCheckHealth();
  }, []);

  const handleCheckHealth = async () => {
    setHealthLoading(true);
    const res = await checkAdvisingHealth();
    setHealthResult(res);
    setHealthLoading(false);
  };

  const handleSendTestWebhook = async () => {
    setSendingWebhook(true);
    setWebhookResult(null);

    const payload = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: "slot_booked",
      lecturerEmail: lecturerEmail,
      bookedSlot: {
        date: slotDate,
        time: slotTime
      },
      serverTimestamp: new Date().toISOString()
    };

    const result = await sendAdvisingWebhook(payload);
    setWebhookResult({ payload, ...result });
    setSendingWebhook(false);
  };

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Sidebar */}
      <aside style={{ width: "260px", minWidth: "260px", backgroundColor: "#111827", borderRight: "1px solid #1f2937", padding: "2rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #3b82f6)", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: "1.2rem", color: "#fff" }}>C</div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "#fff" }}>Campus Insight</h2>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Webhook Tester</span>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab("webhooks")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: "8px", border: "none",
            backgroundColor: "#1e293b", color: "#38bdf8", fontWeight: "600", cursor: "pointer", textAlign: "left"
          }}
        >
          ⚡ Advising Webhooks
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2.5rem 3rem", overflowY: "auto" }}>
        
        <header style={{ marginBottom: "2rem", borderBottom: "1px solid #1f2937", paddingBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.85rem", fontWeight: "700" }}>Advising Platform Webhook Test Bench</h1>
          <p style={{ margin: "0.35rem 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
            Target: <code>https://advising-platform.aron078.workers.dev</code>
          </p>
        </header>

        {/* 1. Health Endpoint Status */}
        <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: "700", textTransform: "uppercase" }}>Endpoint Status</span>
              <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.1rem" }}>GET /api/health</h3>
            </div>
            <button onClick={handleCheckHealth} style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#cbd5e1", padding: "0.4rem 0.85rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
              {healthLoading ? "Checking..." : "🔄 Ping Health"}
            </button>
          </div>

          <pre style={{ backgroundColor: "#090d16", border: "1px solid #1f2937", padding: "1rem", borderRadius: "8px", color: healthResult?.ok ? "#4ade80" : "#fca5a5", fontSize: "0.85rem", margin: 0 }}>
            {healthLoading ? "Ping in progress..." : JSON.stringify(healthResult, null, 2)}
          </pre>
        </div>

        {/* 2. HMAC Signed Webhook Sender */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          
          {/* Dispatch Form */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#a855f7" }}>POST /api/webhooks/partner</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 0 }}>Dispatches a HMAC-SHA256 signed event payload.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Lecturer Email</label>
                <input type="email" value={lecturerEmail} onChange={(e) => setLecturerEmail(e.target.value)} style={{ width: "100%", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.6rem 0.85rem", borderRadius: "6px", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Slot Date</label>
                  <input type="text" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} style={{ width: "100%", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.6rem 0.85rem", borderRadius: "6px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>Slot Time</label>
                  <input type="text" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} style={{ width: "100%", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.6rem 0.85rem", borderRadius: "6px", boxSizing: "border-box" }} />
                </div>
              </div>

              <button 
                onClick={handleSendTestWebhook} 
                disabled={sendingWebhook}
                style={{ backgroundColor: "#9333ea", color: "#fff", border: "none", padding: "0.75rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "0.5rem" }}
              >
                {sendingWebhook ? "Signing & Sending..." : "🚀 Dispatch Signed Webhook"}
              </button>
            </div>
          </div>

          {/* Response Inspector */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Execution Log & Response</h3>
            
            {webhookResult ? (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Sent Signature (X-Webhook-Signature):</div>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#f59e0b", backgroundColor: "#090d16", padding: "0.5rem", borderRadius: "6px", marginBottom: "0.75rem", wordBreak: "break-all" }}>
                  {webhookResult.signatureSent}
                </div>

                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem" }}>HTTP Status: <strong style={{ color: webhookResult.ok ? "#4ade80" : "#fca5a5" }}>{webhookResult.status}</strong></div>

                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.25rem", marginTop: "0.5rem" }}>Server Response:</div>
                <pre style={{ backgroundColor: "#090d16", border: "1px solid #1f2937", padding: "0.85rem", borderRadius: "8px", color: "#c084fc", fontSize: "0.8rem", overflowX: "auto" }}>
                  {JSON.stringify(webhookResult.response || webhookResult.error, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ flex: 1, display: "grid", placeItems: "center", color: "#64748b", fontSize: "0.9rem", border: "1px dashed #1f2937", borderRadius: "8px" }}>
                Click "Dispatch Signed Webhook" to send an event.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}