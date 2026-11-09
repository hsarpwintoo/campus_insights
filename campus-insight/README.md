# MFU Campus Insight Frontend (`campus-insight`)

The web client for **MFU Campus Insight**, built with **React 19**, **Vite 8**, and **Firebase**.

For complete project architecture, feature breakdown, and database schemas, please refer to the [Root README](../README.md).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your Firebase project credentials:
```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PARTNER_API_KEY=optional_partner_api_key
```

> **Note on `VITE_PARTNER_API_KEY`:** This key is only needed if connecting to a live external lecturer advising API. If left blank, the app gracefully uses its built-in fallback data.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build & Lint
```bash
# Check ESLint
npm run lint

# Production build
npm run build
```

---

## 📱 Features Included
* **Executive Dashboard:** Real-time satisfaction scores and sub-location explorer.
* **Sub-location Drill-down Modals:** Interactive SVG radar charts and location-filtered reviews.
* **Category Feedback Feed:** Live updates, category filters, and search.
* **Community Engagement:** One-vote-per-student helpful upvotes, reporting modal, and automatic content shielding ($\ge 3$ reports).
* **Photo Attachments:** Client-side image compression down to ~100KB, Storage upload, and full-screen lightbox zoom.
* **Admin Portal & Moderation:** Real-time reported content queue, dismissal/takedown controls, official university facility response attachment, all-reviews search & manager, and CSV export.
* **Lecturer Evaluation:** University-wide lecturer search (name, dept, office), multi-criteria sorting, and responsive touch UI.
* **AI Executive Briefing:** Gemini 1.5 Flash automated issue summary.
* **Authentication:** Google login restricted strictly to `@lamduan.mfu.ac.th` and `@mfu.ac.th`.
* **Profile Management:** View history, inline edit, or delete past submissions.
* **Dark Theme:** Complete light and dark mode support with instant toggle.
