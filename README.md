Got it! Here's the revised `README.md` with **Leaflet** instead of Google Maps API, and everything else aligned with your current project setup:

---

# 🌿 SustainedAway

**SustainedAway** is a sustainability-focused web app that helps users make eco-conscious shopping decisions. By scanning products or bills, users receive instant sustainability insights, health impact analysis, and community-driven ratings. The app includes a Leaflet-based sustainability heat map, a gamified experience, and even allows sharing feedback on X (Twitter).

---

## 🛠️ Getting Started

This project is divided into a frontend React app and three backend servers.

### 🔧 Prerequisites

Make sure you have the following installed:

- Node.js (v14 or above)
- npm
- Python (for `server.js and server2.js`)
- Firebase 
- Cloudinary credentials (for image upload in `server3.js`)
- X API credentials

---

## 🚀 Running the App

### 1️⃣ Start the Frontend

```bash
npm install
npm start
```

Runs the React app on [http://localhost:3000](http://localhost:3000)

---

### 2️⃣ Start the Backend Servers

In the project root directory:

#### ✅ Server 1 (Main App Server)

```bash
node server.js
```

Runs on: `http://localhost:5000`

#### ✅ Server 2 (Python Analysis Server)

Make sure your Python script is compatible and listed in `requirements.txt`.

```bash
node server2.js
```

Runs on: `http://localhost:5001`

This server auto-installs Python dependencies and executes sustainability analysis.

#### ✅ Server 3 (Image Upload + AI Handler)

```bash
node server3.js
```

Runs on: `http://localhost:5002`

Handles Cloudinary uploads and sends back image URLs.

---

## 📦 Available Scripts (in `/client`)

| Command           | Description                                 |
|------------------|---------------------------------------------|
| `npm start`       | Runs the app in development mode            |
| `npm test`        | Launches test runner                        |
| `npm run build`   | Builds the app for production               |
| `npm run eject`   | Ejects the app configuration (not reversible) |

---

## 🔗 External Integrations

- **Cloudinary** – For image uploads (server3.js)
- **Leaflet** – Interactive sustainability heat map (eco-store markers)
- **Firebase / Firestore** – Product & user data storage
- **Twitter (X)** – For sharing sustainability feedback

---
