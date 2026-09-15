# 🩸 HemoConnect - Next-Gen Blood Donation & Emergency Matching Platform

> **Live Deployed Application**: [https://timothyjoy620-web.github.io/HemoConnect/](https://timothyjoy620-web.github.io/HemoConnect/)  
> **GitHub Source Repository**: [https://github.com/timothyjoy620-web/HemoConnect](https://github.com/timothyjoy620-web/HemoConnect)  
> **Lead Administrator & Developer**: **Timothy Benny** (`timothyjoy620@gmail.com`)

---

## 🌟 Executive Summary

**HemoConnect** is a premium, full-stack, futuristic healthcare platform engineered for high-speed blood compatibility matching, emergency broadcasts, hospital registry coordination, and AI-assisted clinical triage. 

Featuring a vibrant dark-mode glassmorphism interface, interactive radar mapping, Spring Boot REST controllers, and integrated Firebase Auth, HemoConnect reduces emergency blood dispatch latencies from hours to seconds.

---

## 🔑 Access Credentials & Role Scopes

| Role Scope | User / Node Type | Access Credentials / Login Method | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | Lead Administrator (**Timothy Benny**) | **Google Sign-In** (`timothyjoy620@gmail.com`) <br/>**OR** Email: `timothyjoy620@gmail.com` <br/>Password: `Timothy#789` | Full root access: System telemetry, register/de-register hospital nodes, monitor inventory volume, broadcast emergency dispatches. |
| **Institutional Node** | Partner Hospitals & Clinics | Email: `apollo@hemoconnect.org` <br/>HAK Key: `HOSP-APOLLO-99` | Query compatible donors, request blood inventory dispatches, access high-priority emergency alert channels. |
| **Voluntary Donor** | Citizens & Donors | **Google 1-Click Login** <br/>**OR** Email Sign-Up / Login | Register physical metrics, update donation availability, calculate compatibility factors, access HemoAI health insights. |
| **Public Guest** | Unauthenticated Citizens | No login required (Guest mode) | Browse blood bank directories, scan nearby inventory via GPS/Haversine geolocation, interact with HemoAI chatbot. |

---

## 🚀 How to Use HemoConnect (Step-by-Step Feature Walkthrough)

### 1️⃣ Dashboard & Admin Operations Center (`#dashboard`)
* **What it does**: Displays real-time operational metrics (Total Donors, Active Requests, Available Units, Most Needed Blood Type, Top Repositories by Volume).
* **How to use**: Log in as Admin (**Timothy Benny**). View registered hospitals (Apollo, NIMS, Yashoda), manage institutional nodes, and monitor real-time system health logs.

### 2️⃣ Smart Donor Match Engine (`#donor-match`)
* **What it does**: Algorithmic ABO & Rh blood group compatibility matrix validating donor eligibility and computing physical distance.
* **How to use**: Select patient blood type (e.g., `A+`, `O-`), enter required units, and click **Run Smart Match**. The radar engine ranks eligible donors based on compatibility factors and distance.

### 3️⃣ Proximity-Sorted Blood Inventory Directory (`#inventory`)
* **What it does**: Geolocation engine that calculates distance to blood banks using HTML5 Geolocation & Haversine calculations.
* **How to use**: Go to the **Blood Inventory** tab and click **Scan Nearby Nodes**. The cards instantly sort from closest to farthest with computed distances in kilometers. Click **Locate Node** to open the Google Maps positioning modal.

### 4️⃣ Voluntary Donor Registry (`#registry`)
* **What it does**: Comprehensive registry of voluntary blood donors with filters for blood type, eligibility, and city.
* **How to use**: Filter candidates by blood group (e.g. `O-`), contact voluntary donors directly, or register a new voluntary donor profile.

### 5️⃣ Emergency Dispatch Broadcast (`#emergency`)
* **What it does**: Issues high-priority emergency alerts across all connected hospital nodes and registered donors.
* **How to use**: Fill out patient critical status, required blood type, hospital location, and trigger **Broadcast Emergency Dispatch**. Alerts radiate across the network in real-time.

### 6️⃣ HemoAI Clinical Diagnostics & Chatbot (`#ai-diagnostics`)
* **What it does**: Intelligence suite featuring 4 clinical modules:
  * 🩺 **Physical Eligibility Checker**: Validates weight, hemoglobin, pulse, and temperature.
  * ⚡ **Priority Estimator**: Ranks case urgency (Routine, Urgent, Critical).
  * 📈 **Demand Forecast Predictor**: Predicts inventory supply/demand trends.
  * 💬 **Iron Recovery Chatbot**: Virtual assistant giving diet and recovery advice.

### 7️⃣ System Settings & Security Configuration (`#settings`)
* **What it does**: Manage Firebase credentials, Google Maps API key, administrative communications link, and external JSON syncer.

---

## ⏰ When to Use HemoConnect (Real-World Scenarios)

1. **Medical Emergency & Trauma Relief**: When a surgical patient or accident victim urgently requires rare blood (e.g., `O-` or `AB-`), coordinators launch an Emergency Dispatch to locate compatible stock in nearby blood banks within seconds.
2. **Hospital Stock Coordination**: When a hospital runs low on specific blood units during peak demand, administrators use the Inventory Radar to find neighboring facilities with surplus stock for immediate transfer.
3. **Donation Camp & Voluntary Recruitment**: During blood donation drives, voluntary donors register their metrics to confirm eligibility and receive automated post-donation recovery guidance via HemoAI.

---

## 🔒 Hardened Architecture & Security
* **Firebase Authentication**: Hardened OAuth 2.0 & Email/Password session management.
* **OWASP Input Sanitization**: HTML tag stripping via JSoup to prevent XSS.
* **Zero-Hardcoded Secrets**: Dynamically served configuration parameters.
