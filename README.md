# 🎓 MFU Campus Insight Platform

**Campus Insight** is an evaluation and analytics web platform for **Mae Fah Luang University (MFU)** students to rate, review, and view real-time data insights regarding campus dormitories, food services, campus transport/wifi, and health facilities.

---

## 🎨 Branding & Design System
* **Primary Brand Accent:** MFU Crimson (`#8B0000` / `#A71930`)
* **Secondary Brand Accent:** MFU Gold (`#B45309` / `#D4AF37`)
* **Interface Style:** Light Executive Theme, high-contrast typography (`Plus Jakarta Sans`), SVG vector icons (`lucide-react`).

---

## ✅ Completed Features

### 1. **Overview & Analytics Dashboard (`HomePage.jsx`)**
* **Real-time Metric Cards:** Overall MFU satisfaction score, total synced reviews count, top-performing category, and high-priority focus areas.
* **Category Breakdown Chart:** Visual horizontal percentage bar chart summarizing ratings across all four core domains.
* **Target Insight Cards:** Summarized metrics for dormitory utilities, canteen halal compliance, and transport timeliness.

### 2. **Feedback Submission Pipeline (`SubmitFeedbackPage.jsx`)**
* **Category Selection:** Categorized forms for **Dormitories**, **Canteens**, **Services & Wifi**, and **Health Services**.
* **Sub-location Selectors:** Dynamic dropdown mapping to specific dorm blocks (`F1`–`F5`, `S1`–`S5`, `L1`–`L5`), canteens (`M-Square`, `D1`, `Lamduan`, `E1`, `E2`), transport (`Ngeap Bus`, `Library`, `Wifi`), and healthcare facilities.
* **Custom Rating Metrics:** 1 to 5 range sliders for domain-specific criteria (Cleanliness, Security, Electricity, Food Variety, Halal Suitability, Fees).
* **Firestore Integration:** Asynchronous document writes directly to the `campus_reviews` collection with server timestamps and loading states.

### 3. **Category Feedback Feed (`FeedPage.jsx`)**
* **Live Feed Fetching:** Reads documents from Cloud Firestore sorted by timestamp (`createdAt: desc`).
* **Card Display:** Displays location targets, overall feedback text, author tags, and post timestamps.

### 4. **Infrastructure & Styling**
* Clean modular navigation router in `App.jsx`.
* Replaced emojis with vector icons (`lucide-react`).
* Connected to Cloud Firestore database (`campus-insight-623f0`).

---

## 📌 Roadmap & Future Tasks (What's Left to Do)

- [ ] **Authentication & Profile System (MFU Email)**
  - Firebase Auth integration restricted to `@lamduan.mfu.ac.th` or MFU student/staff credentials.
  - User profiles displaying user role, display name, and submission history.

- [ ] **AI-Assisted Insight Generator (`InsightsPage.jsx`)**
  - Connect Cloud Functions / LLM service to analyze raw text feedback from Firestore.
  - Generate automated weekly sentiment reports (e.g., *“85% positive sentiment on Library Wifi, frequent complaints about Peak-Hour Shuttle Bus waiting times”*).

- [ ] **Category Filtering & Search Bar (`FeedPage.jsx`)**
  - Add search bar to filter posts by keywords (e.g., *"Lamduan"*, *"F1"*, *"Wifi"*).
  - Add single-click filter tabs (`All`, `Dormitories`, `Canteens`, `Services`, `Health`).

- [ ] **Detailed Sub-location Modals**
  - Add dedicated detail pages/modals for each specific dormitory (e.g., inspecting F1's detailed rating breakdown per criterion).