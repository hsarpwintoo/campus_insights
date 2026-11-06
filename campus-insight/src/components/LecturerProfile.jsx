// src/components/LecturerProfile.jsx
import React, { useState, useEffect } from "react";
import { fetchLecturerAvailability } from "../services/advisingApi";

const FALLBACK_DATA = {
  name: "Dr. John Doe",
  email: "john.doe@mfu.ac.th",
  department: "School of Information Technology",
  office: "E3B-502",
  schedules: [
    { date: "2026-09-25", time: "10:00 - 11:00", status: "Available (Cached)" },
    { date: "2026-09-25", time: "14:00 - 15:00", status: "Available (Cached)" }
  ]
};

export default function LecturerProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDegraded, setIsDegraded] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchLecturerAvailability("john.doe@mfu.ac.th");

      if (res && res.schedules) {
        setData(res);
        setIsDegraded(false);
      } else {
        // Degraded mode: fallback to cached data when API returns null
        setData(FALLBACK_DATA);
        setIsDegraded(true);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem", color: "#fff", textAlign: "center" }}>Loading lecturer profile...</div>;
  }

  return (
    <div style={{ maxWidth: "650px", margin: "2rem auto", fontFamily: "sans-serif", color: "#333" }}>
      {isDegraded && (
        <div style={{
          backgroundColor: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeeba",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem"
        }}>
          <strong>⚠️ Degradation / Fallback Mode:</strong> Could not connect to external Advising Platform. Showing cached office hours[cite: 1].
        </div>
      )}

      <div style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginTop: 0, color: "#1a365d" }}>{data?.name || "Dr. John Doe"}</h2>
        <p><strong>Email:</strong> john.doe@mfu.ac.th</p>
        <p><strong>Department:</strong> {data?.department || "School of Information Technology"}</p>
        <p><strong>Office:</strong> {data?.office || "E3B-502"}</p>

        <hr style={{ margin: "1.5rem 0", border: "0", borderTop: "1px solid #eee" }} />

        <h3>Advising Availability</h3>
        {data?.schedules ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.schedules.map((slot, index) => (
              <li key={index} style={{
                background: "#f7fafc",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                marginBottom: "0.5rem",
                display: "flex",
                justifyContent: "space-between"
              }}>
                <span>📅 {slot.date} ({slot.time})</span>
                <span style={{ fontWeight: "bold", color: isDegraded ? "#d69e2e" : "#38a169" }}>
                  {slot.status || "Available"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No availability slots currently published.</p>
        )}
      </div>
    </div>
  );
}