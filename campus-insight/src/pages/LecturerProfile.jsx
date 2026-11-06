import React, { useState, useEffect } from 'react';
import { fetchLecturerAvailability } from '../services/advisingApi';

export default function LecturerProfile({ profEmail = "john.doe@mfu.ac.th" }) {
  const [scheduleData, setScheduleData] = useState(null);
  const [isDegraded, setIsDegraded] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      const liveData = await fetchLecturerAvailability(profEmail);
      if (liveData) {
        setScheduleData(liveData);
      } else {
        // Fallback Mode (Degradation handling)
        setIsDegraded(true);
        setScheduleData({ note: "Showing offline/cached office hours." });
      }
    }
    loadSchedule();
  }, [profEmail]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Lecturer Profile: {profEmail}</h1>
      {isDegraded && (
        <div style={{ color: 'orange', padding: '10px', border: '1px solid orange' }}>
          ⚠️ Advising platform is currently offline. Showing cached office hours.
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <h3>Schedule Status:</h3>
        <pre>{JSON.stringify(scheduleData, null, 2)}</pre>
      </div>
    </div>
  );
}