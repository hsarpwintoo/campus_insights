import axios from 'axios';

const RENDER_BACKEND_URL = "https://campus-insights-k88b.onrender.com";
const PARTNER_CLOUDFLARE_URL = "https://advising-platform.aron078.workers.dev";
const CAMPUS_INSIGHT_KEY = import.meta.env.VITE_PARTNER_API_KEY;

const requirePartnerApiKey = () => {
  if (!CAMPUS_INSIGHT_KEY) {
    throw new Error('VITE_PARTNER_API_KEY is not configured.');
  }

  return CAMPUS_INSIGHT_KEY;
};

export const fetchPartnerLecturer = async (uid) => {
  const response = await axios.get(`${PARTNER_CLOUDFLARE_URL}/api/partner/lecturers/${encodeURIComponent(uid)}`, {
    headers: { 'x-api-key': requirePartnerApiKey() },
    timeout: 5000
  });
  return response.data?.data || response.data;
};

export const fetchPartnerSchoolLecturers = async (schoolId) => {
  const response = await axios.get(`${PARTNER_CLOUDFLARE_URL}/api/partner/lecturers`, {
    params: { schoolId },
    headers: { 'x-api-key': requirePartnerApiKey() },
    timeout: 5000
  });
  const lecturers = response.data?.data || response.data?.lecturers || response.data;
  return Array.isArray(lecturers) ? lecturers : [];
};

export const fetchPartnerWeeklyAvailability = async () => {
  const response = await axios.get(`${PARTNER_CLOUDFLARE_URL}/api/partner/availability/weekly`, {
    headers: { 'x-api-key': requirePartnerApiKey() },
    timeout: 5000
  });
  return response.data?.data || response.data;
};

/**
 * Fetch lecturer availability from Partner API with automatic failure handling
 */
export const fetchLecturerAvailability = async (email) => {
  try {
    const response = await axios.get(`${PARTNER_CLOUDFLARE_URL}/api/v1/schedules`, {
      params: { email },
      headers: { 'x-api-key': requirePartnerApiKey() },
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
      headers: { 'x-api-key': requirePartnerApiKey() }
    });
    return res.data?.data ? [res.data.data] : [];
  } catch (err) {
    console.warn("Backend fetch error:", err.message);
    return [];
  }
};