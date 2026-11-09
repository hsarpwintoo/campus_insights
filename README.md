# 🎓 MFU Campus Insight Platform

**Campus Insight** is an evaluation, analytics, and community intelligence web platform designed for **Mae Fah Luang University (MFU)** students and administration. It empowers students to rate, review, inspect criteria breakdowns, and attach photo evidence regarding dormitories, food services, campus transport/Wi-Fi, health facilities, and academic faculty.

---

## 🎨 Branding & Design System
* **Primary Brand Accent:** MFU Crimson (`#762316` / `#8B0000`)
* **Secondary Brand Accent:** MFU Warm Gold (`#B45309` / `#D4AF37`)
* **Interface Style:** Modern Executive Theme, clean typography (`Plus Jakarta Sans`), SVG vector icons (`lucide-react`).
* **Theme Support:** Complete **Light Mode** and **Dark Mode** toggle (`html[data-theme='dark']`) with automatic persistence.

---

## 🚀 Key Features

### 1. 📊 Campus Insights Dashboard (`HomePage.jsx`)
* **Real-time Metric Cards:** Overall MFU satisfaction score, total synced student reviews, highest-performing category, and high-priority focus areas.
* **Category Satisfaction Breakdown:** Visual progress percentage bars summarizing ratings across the four core campus domains.
* **Campus Health Insights & Sub-location Inspector:** Shows top-rated locations with clickable rows and a **Sub-location Quick Explorer dropdown** to inspect any dorm or facility.

### 2. 🎯 Dedicated Sub-location Drill-down Modals (`SubLocationModal.jsx`)
* **Individual Location Inspection:** Compare specific facilities (e.g., **F1 Dormitory vs F5 Dormitory**, **M-Square vs D1 Canteen**).
* **Interactive SVG Radar Chart:** Visualizes satisfaction scores on a 5-point concentric radial axis across all individual criteria (Cleanliness, Utilities, Security, Water Pressure, etc.).
* **Detailed Metric Bars:** Displays the exact average score (out of 5.0) and visual progress fill for each criterion.
* **Location-Filtered Student Reviews:** Displays reviews and comments submitted specifically for that sub-location with helpful vote counters and direct *"Rate this location"* prompt.

### 3. 💬 Category Feedback Feed (`FeedPage.jsx`)
* **Real-time Firestore Subscriptions:** Live feed updates instantly as students post feedback without requiring page reloads.
* **Category Tabs & Search:** Single-click category filters (*All*, *Dormitories*, *Canteens*, *Services & Wifi*, *Health Services*) combined with real-time text search.
* **Direct Sub-location Links:** Every review card features an interactive location button that opens the Sub-location Drill-down modal.

### 4. 👍 Community Engagement & Content Moderation
* **Helpful Upvoting (One Vote Per Student):** Toggleable upvote thumb button on each review. Tracks student emails in `helpfulUsers: string[]` via Firestore transactions to prevent vote manipulation.
* **Structured Content Moderation:** "Report" button opens a reason selector (*Inappropriate Language*, *Harassment*, *Spam*, *False Allegation*, *Other*) and logs audit data directly to `feedback_reports`.
* **Automatic Content Shielding ($\ge$ 3 reports):** Comments receiving 3 or more community reports are automatically masked behind a content warning shield (*"Flagged by student community — Click to reveal"*).

### 5. 📷 Photo Attachment & Lightbox Zoom
* **Client-Side Image Compression:** Automatically resizes (max 1200px) and compresses smartphone camera photos (3MB–5MB) down to **~90KB–120KB in ~150ms** before upload.
* **Storage Upload with Resilient Fallback:** Uploads to Firebase Storage with a strict 8-second timeout, falling back seamlessly to optimized inline data URLs if Storage is unprovisioned.
* **Full-Screen Lightbox:** Click any evidence thumbnail on the feed to view a high-resolution zoomable lightbox with caption.

### 6. 👨‍🏫 Lecturer Search, Sorting & Evaluation (`EvaluationPage.jsx`)
* **University-Wide Lecturer Search:** Quick search bar to locate any faculty member by **name**, **department**, **office room number** (e.g., `E3A-401`), or **email**.
* **Multi-Criteria Sorting:** Sort lecturers by *Highest Rated*, *Most Reviews*, *Name (A → Z)*, or *Default Order*.
* **School Filter Pills:** Instant 1-click filtering between *All Schools*, *School of Management*, *School of Applied Digital Technology*, and *School of Health Science*.
* **Responsive Touch-Optimized UI:** Multi-breakpoint layouts (3 cols desktop, 2 cols tablet, 1 col mobile), touch-friendly 38px rating star targets, and adaptive weekly availability slot cards.

### 7. 🤖 AI-Assisted Executive Briefing (`InsightsPage.jsx`)
* **Gemini 1.5 Flash Integration:** Cloud Function / Express endpoint (`/api/v1/ai-insights`) queries the Google Gemini API to analyze recent student comments.
* **Executive Action Summary:** Automatically summarizes the top 3 critical campus issues and proposes 2 actionable facility management solutions.

### 8. 🔒 Strict University Email Authentication (`LoginPage.jsx`)
* **Google Authentication:** Integrated with Firebase Auth.
* **Domain Whitelist Enforcement:** Restricts authentication strictly to official MFU accounts (`@lamduan.mfu.ac.th` and `@mfu.ac.th`). Unauthorized Google accounts are automatically rejected and signed out.

### 9. 👤 User Profile & Review Management (`ProfilePage.jsx`)
* **Submission History:** Displays all reviews submitted by the logged-in student.
* **Delete with Confirmation:** Students can delete their past submissions via a confirmation modal.
* **Inline Comment Editing:** Allows students to update their written reviews directly.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 8 |
| **Icons & Styling** | Lucide React, Vanilla Modular CSS with CSS Variables |
| **Database & Auth** | Google Cloud Firestore, Firebase Authentication, Firebase Storage |
| **Serverless & AI** | Firebase Cloud Functions / Express, Google Gemini 1.5 Flash API |
| **Build & Tooling** | Rolldown / Vite, ESLint 9 |

---

## 📁 Project Structure

```
campus_insights/
├── campus-insight/
│   ├── functions/                  # Cloud Functions / Express API
│   │   ├── index.js                # Gemini 1.5 Flash AI insights endpoint (/api/v1/ai-insights)
│   │   └── package.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── SubLocationModal.jsx # Sub-location drill-down modal & SVG radar chart
│   │   │   └── styles/
│   │   ├── data/
│   │   │   ├── campusLocations.js  # Dormitory, canteen, and facility mappings & criteria
│   │   │   └── lecturers.js        # School, faculty, department, office data
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Main executive analytics dashboard
│   │   │   ├── FeedPage.jsx        # Real-time category reviews feed with moderation
│   │   │   ├── SubmitFeedbackPage.jsx # Multi-step rating & photo upload form
│   │   │   ├── EvaluationPage.jsx  # Lecturer evaluation search, sort & school filtering
│   │   │   ├── LecturerDetailPage.jsx # Individual faculty profile & availability
│   │   │   ├── LecturerEvaluationPage.jsx # Rating form for lecturers
│   │   │   ├── InsightsPage.jsx    # Analytics charts & AI executive briefing card
│   │   │   ├── ProfilePage.jsx     # Student profile & review management (edit/delete)
│   │   │   └── LoginPage.jsx       # Google login with MFU email verification
│   │   ├── services/
│   │   │   ├── firebaseDb.js       # Firestore, Auth, Storage & client image compression
│   │   │   ├── aiInsightsService.js# AI insights client service with intelligent fallback
│   │   │   └── advisingApi.js      # Partner advising schedule API client
│   │   ├── App.jsx                 # Main layout, router & navigation shell
│   │   ├── App.css                 # Global theme & responsive styles
│   │   └── main.jsx
│   ├── .env.example                # Sample environment configuration
│   ├── firebase.json               # Firebase deployment configuration
│   └── package.json
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/campus_insights.git
cd campus_insights/campus-insight

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies (optional, for local functions emulation)
cd functions && npm install && cd ..
```

### 3. Environment Configuration
Create a `.env` file in `campus-insight/` by copying `.env.example`:
```bash
cp .env.example .env
```
Fill in your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PARTNER_API_KEY=optional_partner_api_key
```

### 4. Running the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Running Production Build & Linter
```bash
# Lint code with ESLint
npm run lint

# Compile production build
npm run build
```

---

## 🗄️ Firestore Collections Schema

* `campus_reviews`: Student ratings and comments across campus facilities.
  * Fields: `category`, `target`, `ratings` (object), `comment`, `author`, `userEmail`, `isAnonymous`, `imageUrl`, `helpfulCount`, `helpfulUsers` (array), `reportCount`, `reportedUsers` (array), `isFlagged` (boolean), `createdAt`, `createdAtMillis`.
* `feedback_reports`: Content moderation audit logs.
  * Fields: `reviewId`, `reporterEmail`, `reason`, `details`, `status`, `createdAt`.
* `lecturers`: Faculty member records and synchronized review metrics.
  * Fields: `id`, `name`, `title`, `department`, `office`, `email`, `schoolId`, `reviewSummary`.
* `lecturer_reviews`: Evaluations submitted for lecturers.
  * Fields: `lecturerId`, `lecturerName`, `schoolId`, `schoolName`, `ratings` (object), `comment`, `author`, `userEmail`, `createdAt`.

---

## 📄 License
This project is developed for educational and campus service improvement at **Mae Fah Luang University**.
