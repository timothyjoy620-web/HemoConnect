# HemoConnect - Next-Gen Blood Donation & Emergency Matching Platform

HemoConnect is a premium, full-stack, futuristic healthcare platform designed for high-speed blood compatibility matching, emergency broadcasts, and institutional coordination. It features a dark-themed glassmorphism single-page interface, real-time radar mapping, Spring Boot controllers, Firebase Firestore integration, and built-in AI diagnostic modules.

---

## 🌟 Comprehensive Feature Catalog

### 1. Futuristic Glassmorphic User Interface (SPA)
*   **What it is**: A Single Page Application (SPA) styled with vibrant dark-mode aesthetics, custom glassmorphism components, parallax tilt card micro-animations, and background canvas-driven animated blood cell particles.
*   **How it is used**: Simply open the app in any modern browser. Navigate through tabs (Dashboard, Find Donors, Register Donor, Inventory, Emergency, HemoAI, Settings) without full page reloads.
*   **Why it is useful**: The premium interface enhances user engagement, while the SPA architecture enables instantaneous, fluid user navigation and reduces server payload.

### 2. Proximity-Sorted Blood Inventory Directory
*   **What it is**: A geographical sorting engine that calculates physical distances to blood banks and hospitals using the browser's HTML5 Geolocation API, falling back to a Haversine formula calculation.
*   **How it is used**: Go to the **Blood Inventory** tab and click **Scan Nearby**. The page will prompt for geolocation permissions and immediately sort the listing cards from closest to farthest (displaying the computed distance in KM).
*   **Why it is useful**: In critical medical situations, this allows coordinators to pinpoint the closest blood bank containing compatible stock in seconds, saving lives.

### 3. Interactive 3D Radar Map & Google Maps Locate Modal
*   **What it is**: An interactive dark glassmorphic modal containing a Google Maps instance that places geolocation markers on blood banks, clinics, and emergency requests.
*   **How it is used**: Under the **Blood Inventory** tab, click **Locate Node** on any card. A dark modal pops up loading the Google Maps API centered on the exact latitude and longitude coordinates.
*   **Why it is useful**: Provides rapid visual navigation to coordinate route directions during critical transfer dispatches.

### 4. Smart Matching compatibility Engine
*   **What it is**: An algorithmic compatibility matrix validating ABO and Rh blood groups (A, B, AB, O and +/- compatibility factors) ranking matching candidates based on distance and eligibility.
*   **How it is used**: Triggered automatically when hospitals query compatible donors via `/api/requests/{id}/matches` or through the interactive matching radar.
*   **Why it is useful**: Eliminates compatibility errors by verifying compatibility factors prior to dispatch, complying with clinical transfusion standards.

### 5. HemoAI Diagnostics & Chatbot Insights
*   **What it is**: A suite of four intelligence modules assisting clinical decision-making:
    *   **Physical Eligibility Checker**: Evaluates physical metrics (weight, pulse, temperature, hemoglobin) to qualify donors.
    *   **Priority Estimator**: Ranks request urgency (Routine, Urgent, Critical) based on medical indicators.
    *   **Demand Forecast Predictor**: Estimates inventory supply/demand fluctuations.
    *   **Iron Recovery chatbot**: A conversational assistant advising on recovery diets and donation schedules.
*   **How it is used**: Access the **HemoAI** tab, fill out physical metrics, trigger predictions, or chat directly with the virtual assistant (which talks to `/api/ai/chat`).
*   **Why it is useful**: Reduces the burden on healthcare staff by performing preliminary patient screening and offering instant clinical guidance.

---

## 🔒 Security Hardening Architecture (OWASP Compliant)

HemoConnect is fully hardened to prevent data leaks, unauthorized access, and request abuse:

### 1. Dynamic Zero-Hardcoding Config Server
*   **What it is**: Client-side Firebase credentials and Google Maps API keys are completely stripped from frontend scripts and served dynamically from server properties.
*   **How it is used**: Frontend scripts fetch configuration details from `/api/config/firebase` and `/api/config/maps-key` on startup. 
*   **Why it is useful**: Ensures sensitive keys are never committed to git repositories, aligning with standard secrets isolation.

### 2. User-Based Hashed Token Rate Limiting
*   **What it is**: An API rate limiter parsing the `Authorization` header, computing a SHA-256 hash of the bearer token, and falling back to IP if anonymous.
*   **How it is used**: Enforced via `RateLimitingFilter.java`. If limits are exceeded, the API returns a graceful `429 Too Many Requests` response.
*   **Why it is useful**: Mitigates brute-force credential attacks, prevents denial of service (DoS), and blocks API abuse.

### 3. Server-Side Request Forgery (SSRF) Prevention
*   **What it is**: A security filter resolving host addresses on external data proxy endpoints.
*   **How it is used**: The admin endpoint `/api/admin/fetch-external` verifies URLs before fetching. It blocks requests pointing to loopback (`127.0.0.1`, `localhost`), link-local (`169.254.x.x`), and private subnets (RFC 1918).
*   **Why it is useful**: Prevents attackers from querying internal services, backend databases, or cloud instance metadata credentials.

### 4. Strict JSR-380 Input Schema Validation & HTML Sanitization
*   **What it is**: Schema validations rejecting unrecognized properties, combined with JSoup HTML tag stripping.
*   **How it is used**: Enabled via `spring.jackson.deserialization.fail-on-unknown-properties=true` and `InputSanitizer.java` running on all service layers. Unexpected properties return `400 Bad Request`.
*   **Why it is useful**: Eliminates parameter pollution/mass assignment vulnerabilities and blocks XSS script injections.

### 5. Content-Security-Policy (CSP) & Hardened HTTP Headers
*   **What it is**: HTTP security headers protecting framing and scripts:
    *   `Content-Security-Policy`: Permits script/asset loading exclusively from `'self'`, `gstatic.com` (Firebase), and `googleapis.com` (Google Maps).
    *   `X-Frame-Options: DENY`: Blocks clickjacking attacks.
    *   `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
    *   `Strict-Transport-Security`: Forces secure HTTPS channels.
*   **How it is used**: Automatically injected by `SecurityConfig.java` on every response.
*   **Why it is useful**: Blocks cross-site scripting (XSS), script execution injection, and connection hijacking.

---

## 📡 REST API Specifications

| Method | Endpoint | Description | Auth Scope | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/config/firebase` | Fetches dynamic Firebase client credentials | Public | GENERAL (60/min) |
| **GET** | `/api/config/maps-key` | Fetches dynamic Google Maps API key | Public | GENERAL (60/min) |
| **POST** | `/api/hospitals/verify` | Authenticates institutional credentials & key | Public | AUTH (5/15 min) |
| **POST** | `/api/donors` | Registers a new donor (with HTML sanitization) | Public | GENERAL (60/min) |
| **GET** | `/api/donors/search-external` | Searches voluntary registry donors | Public | GENERAL (60/min) |
| **POST** | `/api/requests` | Creates a new blood request | User Token | GENERAL (60/min) |
| **GET** | `/api/requests/{id}/matches` | Returns ranked blood matches | User Token | GENERAL (60/min) |
| **POST** | `/api/emergency` | Issues emergency alerts | Hospital / Admin | AI/HIGH (10/min) |
| **GET** | `/api/admin/fetch-external` | CORS-bypass proxy data sync (SSRF Protected) | Admin Token | GENERAL (60/min) |
| **POST** | `/api/admin/seed` | Populates demo data in the registry | Public | AUTH (5/15 min) |

---

## 🚀 Setup & Execution

### Prerequisites
- **Java JDK 21**
- **Maven 3.9+**

### Local Run (Mock Mode / zero-config)
To run the platform out-of-the-box using the thread-safe local in-memory fallback database:
1. Clone or navigate to the project directory:
   ```bash
   cd HemoConnect
   ```
2. Launch the application:
   ```bash
   mvn spring-boot:run
   ```
3. Open your browser and navigate to `http://localhost:8080`.
4. Go to the **Settings** tab and click **Seeding Demo Data** to populate the lists instantly.

### Running with Firebase (Firestore & Authentication)
1. **Authentication**: Go to Firebase Console -> Authentication -> Sign-in Method, and enable **Email/Password** and **Phone**.
2. **Firestore**: Enable Firestore Database and create the following collections:
   - `donors`, `blood_requests`, `blood_banks`, `hospitals`, `admins`, `notifications`
3. **Private Key**: Switch to Project Settings -> Service accounts, and click **Generate new private key**.
4. Save the downloaded private key inside the project directory:
   `src/main/resources/serviceAccountKey.json`
5. Relaunch using:
   ```bash
   mvn spring-boot:run
   ```

---

## ☁️ Deployment Strategies

### Frontend (Firebase Hosting)
Configure Firebase CLI and deploy the static resources:
1. Log in to Firebase:
   ```bash
   firebase login
   ```
2. Initialize project:
   ```bash
   firebase init hosting
   ```
   *   Select your project `hemoconnect-ak47`.
   *   Set the public directory to: `src/main/resources/static`.
3. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

### Backend (Google Cloud Run / Containerized)
We provide a `Dockerfile` setup to build and deploy the container to Cloud Run, which connects natively with Firebase resources:
1. Build the Maven jar:
   ```bash
   mvn clean package -DskipTests
   ```
2. Deploy the container:
   ```bash
   gcloud run deploy hemoconnect-backend --source .
   ```
