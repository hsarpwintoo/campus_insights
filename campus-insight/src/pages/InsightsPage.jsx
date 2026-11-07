import React from 'react';

export default function InsightsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖 AI-Assisted Insights</h1>
      <div style={{ background: '#111827', padding: '1.5rem', borderRadius: '10px', border: '1px solid #1f2937' }}>
        <h3 style={{ color: '#a855f7' }}>Summary Highlights</h3>
        <ul>
          <li>85% positive sentiment regarding Library Wifi speed and study environment.</li>
          <li>High volume of feedback requesting more peak-hour Shuttle Bus frequency.</li>
          <li>M-Square canteen rated highest for halal and dietary variety.</li>
        </ul>
      </div>
    </div>
  );
}