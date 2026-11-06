import axios from 'axios';

const RENDER_BACKEND_URL = "https://campus-insight-b9mp.onrender.com";
const PARTNER_CLOUDFLARE_URL = "https://advising-platform.aron078.workers.dev";
const CAMPUS_INSIGHT_KEY = "ADVISING_PLATFORM_SECRET_KEY";

/**
 * Fetch lecturer availability from Partner API with automatic failure handling
 */
export const fetchLecturerAvailability = async (email) => {
  try {
    const response = await axios.get(`${PARTNER_CLOUDFLARE_URL}/api/v1/schedules`, {
      params: { email },
      headers: { 'x-api-key': CAMPUS_INSIGHT_KEY },
      timeout: 4000
    });
    return { success: true, schedules: response.data?.schedules || response.data || [] };
  } catch (error) {
    console.warn("Partner Advising API unavailable, loading fallback cache:", error.message);
    return {
      success: false,
      error: error.message,
      schedules: [
        { date: "2026-09-25", time: "10:00 - 11:00", status: "Available (Cached)" },
        { date: "2026-09-25", time: "14:00 - 15:00", status: "Available (Cached)" }
      ]
    };
  }
};

/**
 * CRUD Operations against live Render express backend / Firestore
 */
export const fetchLecturersFromBackend = async () => {
  try {
    const res = await axios.get(`${RENDER_BACKEND_URL}/api/v1/lecturers?email=john.doe@mfu.ac.th`, {
      headers: { 'x-api-key': CAMPUS_INSIGHT_KEY }
    });
    return res.data?.data ? [res.data.data] : [];
  } catch (err) {
    console.warn("Backend fetch error:", err.message);
    return [];
  }
};