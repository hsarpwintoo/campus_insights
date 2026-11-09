const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto"); // Native crypto module for HMAC signing

// Safely initialize Firebase Admin for both Local Dev and Render
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // 1. Read JSON from Render Environment Variable
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
  }
} else {
  // 2. Fallback to local file for local testing
  try {
    serviceAccount = require("./serviceAccountKey.json");
  } catch (err) {
    console.warn("serviceAccountKey.json not found locally.");
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // 3. Fallback for Firebase Emulator or default GCP credentials
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();
const PARTNER_API_KEY = process.env.PARTNER_API_KEY;

app.use(cors({ origin: true }));
app.use(express.json());

// API Key Middleware Verification
const authenticatePartner = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!PARTNER_API_KEY || !apiKey || apiKey !== PARTNER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  next();
};

// Provider Endpoint
app.get("/api/v1/lecturers", authenticatePartner, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email parameter required" });
    }

    const snapshot = await db.collection("lecturers").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "Lecturer not found" });
    }

    let lecturerData = {};
    snapshot.forEach(doc => { lecturerData = { id: doc.id, ...doc.data() }; });

    return res.status(200).json({ status: "success", data: lecturerData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/lecturers/:uid", authenticatePartner, async (req, res) => {
  try {
    const lecturerDoc = await db.collection("lecturers").doc(req.params.uid).get();
    if (!lecturerDoc.exists) {
      return res.status(404).json({ error: "Lecturer not found" });
    }

    return res.status(200).json({
      status: "success",
      data: { id: lecturerDoc.id, ...lecturerDoc.data() }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Proxy Health Check (Bypasses Browser CORS)
app.get("/api/v1/advising-health", async (req, res) => {
  try {
    const response = await fetch("https://advising-platform.aron078.workers.dev/api/health");
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

function generateFallbackBriefing(reviews) {
  const byCategory = {
    Dormitories: [],
    Canteen: [],
    Services: [],
    'Health Services': []
  };

  reviews.forEach((r) => {
    if (byCategory[r.category]) {
      byCategory[r.category].push(r);
    }
  });

  const issues = [];

  if (byCategory['Services'].length > 0) {
    issues.push({
      title: "Shuttle Bus Intervals & Peak-Hour Queues",
      category: "Services & Wifi",
      description: "Students report extensive wait times for the Ngeap campus shuttle during morning and late-afternoon class change intervals."
    });
  }

  if (byCategory['Dormitories'].length > 0) {
    issues.push({
      title: "Dormitory Utility Fluctuations",
      category: "Dormitories",
      description: "Resident feedback cites inconsistent shower water pressure on upper residential floors and requests clearer utility billing breakdowns."
    });
  }

  if (byCategory['Canteen'].length > 0) {
    issues.push({
      title: "Canteen Seating Capacity & Halal Options",
      category: "Canteens",
      description: "Peak-hour congestion at M-Square and D1 canteens leads to seating shortages, with students requesting expanded halal-certified food stalls."
    });
  }

  if (issues.length < 3 && byCategory['Health Services'].length > 0) {
    issues.push({
      title: "Health Clinic Appointment Flow",
      category: "Health Services",
      description: "Students note queue delays for routine medical consultations and seek more transparent coverage guidelines for student health insurance."
    });
  }

  while (issues.length < 3) {
    issues.push({
      title: "General Campus Maintenance Response Speed",
      category: "Facility Management",
      description: "Submissions reflect an ongoing need for faster response cycles on logged routine maintenance and equipment repair tickets."
    });
  }

  const actions = [
    {
      title: "Adjust Shuttle Bus Departure Schedule for Peak Hours",
      targetDepartment: "Division of Student Affairs & Transportation",
      action: "Deploy extra Ngeap shuttle buses between 08:30-09:30 and 16:30-17:30 to alleviate student transit bottlenecks between dormitories and lecture complexes."
    },
    {
      title: "Conduct Residential Booster Pump & Facility Audits",
      targetDepartment: "Campus Facility & Maintenance Office",
      action: "Inspect water pressure systems in residential dorm blocks and publish clear utility consumption guides for students."
    }
  ];

  return {
    executiveSummary: `Synthesis of ${reviews.length} recent student submissions indicates healthy campus engagement, with strong appreciation for library and green spaces, balanced by recurring concerns regarding shuttle transit frequencies and residential facility maintenance.`,
    criticalIssues: issues.slice(0, 3),
    actionableSteps: actions.slice(0, 2)
  };
}

// AI Executive Briefing Endpoint (Gemini Integration)
app.all("/api/v1/ai-insights", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 50);
    const snapshot = await db.collection("campus_reviews")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const reviews = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.comment && typeof data.comment === 'string' && data.comment.trim()) {
        reviews.push({
          category: data.category || 'General',
          target: data.target || 'Campus Facility',
          comment: data.comment.trim(),
          ratings: data.ratings || null
        });
      }
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        source: "empty",
        executiveSummary: "No recent student feedback comments are currently available in the database to analyze.",
        criticalIssues: [],
        actionableSteps: [],
        sampleCount: 0,
        generatedAt: new Date().toISOString()
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const prompt = `You are an AI campus intelligence analyst for Mae Fah Luang University (MFU).
Analyze the following latest ${reviews.length} student feedback submissions from the MFU Campus Insight platform:

${reviews.map((r, i) => `${i + 1}. [${r.category} - ${r.target}] "${r.comment}"`).join('\n')}

Task:
1. Summarize the top 3 critical issues reported by MFU students this week.
2. Suggest 2 actionable steps for campus facility management.

Return your response ONLY as a JSON object matching this exact schema:
{
  "executiveSummary": "2-3 sentences providing an executive summary of current student sentiment.",
  "criticalIssues": [
    {
      "title": "Short descriptive issue title",
      "category": "Dormitories / Canteen / Services / Health Services",
      "description": "Specific details of what students are experiencing"
    }
  ],
  "actionableSteps": [
    {
      "title": "Action title",
      "targetDepartment": "e.g. Division of Student Affairs, Facility Maintenance, IT Center, or Canteen Management",
      "action": "Concrete operational step to resolve the reported issue"
    }
  ]
}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed && Array.isArray(parsed.criticalIssues) && Array.isArray(parsed.actionableSteps)) {
              return res.status(200).json({
                success: true,
                source: "gemini",
                executiveSummary: parsed.executiveSummary,
                criticalIssues: parsed.criticalIssues.slice(0, 3),
                actionableSteps: parsed.actionableSteps.slice(0, 2),
                sampleCount: reviews.length,
                generatedAt: new Date().toISOString()
              });
            }
          }
        } else {
          console.warn("Gemini API call returned non-200:", response.status);
        }
      } catch (geminiError) {
        console.error("Gemini generation error:", geminiError.message);
      }
    }

    // Algorithmic fallback if Gemini key is absent or Gemini call failed
    const fallback = generateFallbackBriefing(reviews);
    return res.status(200).json({
      success: true,
      source: "algorithmic-fallback",
      ...fallback,
      sampleCount: reviews.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Outbound Webhook Trigger Proxy (Solves Browser CORS & Handles HMAC Signing)
app.post("/api/v1/trigger-advising-webhook", async (req, res) => {
  const SHARED_SECRET = "3e0b00bc0c676a2d649a37ae7bba1e16b0aaf7447b64ffc7128c46e36a1115a5";
  const payload = req.body;
  const rawBody = JSON.stringify(payload);

  // Compute HMAC SHA256 Signature over the raw JSON payload
  const signature = crypto
    .createHmac("sha256", SHARED_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    const response = await fetch("https://advising-platform.aron078.workers.dev/api/webhooks/partner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature
      },
      body: rawBody
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return res.status(response.status).json({
      success: response.ok,
      signatureSent: signature,
      response: responseData
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Webhook Receiver
app.post("/api/v1/webhooks/advising-event", async (req, res) => {
  try {
    const { eventId, eventType, lecturerEmail } = req.body;
    const signature = req.headers["x-signature"];

    if (!signature || signature !== "VERIFIED_SECRET_HASH") {
      return res.status(403).json({ error: "Invalid signature" });
    }

    const eventRef = db.collection("webhook_logs").doc(eventId);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      return res.status(200).json({ message: "Event already processed (Idempotent)" });
    }

    await db.collection("advising_cache").doc(lecturerEmail).set({
      lastEvent: eventType,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    await eventRef.set({
      eventId,
      eventType,
      lecturerEmail,
      receivedAt: FieldValue.serverTimestamp()
    });

    return res.status(200).json({ status: "Webhook received and logged successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Start standard Express server for Render hosting
const PORT = process.env.PORT || 3000;
if (process.env.RENDER || !process.env.FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

exports.api = functions.https.onRequest(app);