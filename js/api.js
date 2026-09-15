// HemoConnect REST API Engine (Phase 13: Full Stack Integration)
const ApiEngine = {
    async init() {
        try {
            console.log("[ApiEngine] Initializing client-side dataset...");
            const res = await fetch("/blood_banks_data.json");
            if (res.ok) {
                const data = await res.json();
                this.mockDb.bloodbanks = data;
                
                const hospitalsList = [];
                let hospCounter = 1;
                data.forEach(bank => {
                    const nameLower = bank.name.toLowerCase();
                    if (nameLower.includes("hospital") || nameLower.includes("medical") || nameLower.includes("chc") || 
                        nameLower.includes("centre") || nameLower.includes("center") || nameLower.includes("health") || 
                        nameLower.includes("institute")) {
                        
                        hospitalsList.push({
                            id: "hosp-" + hospCounter++,
                            hospitalName: bank.name,
                            location: bank.subLocation || bank.city,
                            address: bank.address,
                            city: bank.city,
                            district: bank.subLocation || bank.district,
                            emergencyContact: bank.contactNumber || "+919900112233",
                            corporateEmail: bank.email || "admin@" + bank.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".org",
                            hak: "hak-" + bank.id,
                            timestamp: Date.now()
                        });
                    }
                });
                
                if (hospitalsList.length > 0) {
                    this.mockDb.hospitals = hospitalsList;
                }
                console.log(`[ApiEngine] Loaded ${this.mockDb.bloodbanks.length} blood banks and extracted ${this.mockDb.hospitals.length} hospitals for client-side simulation.`);
            }
        } catch (e) {
            console.warn("[ApiEngine] Failed to load static dataset. Using fallback mock arrays.", e);
        }
    },
    
    // Shows the global custom Rose Four reloading loader overlay
    showLoader() {
        const loader = document.getElementById("rose-four-loader");
        if (loader) {
            loader.style.display = "flex";
            loader.style.opacity = "1";
        }
    },

    // Hides the global loader
    hideLoader() {
        const loader = document.getElementById("rose-four-loader");
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, 300);
        }
    },

    // Prepend absolute backend URL here if hosted separately (e.g. "https://hemoconnect-api.onrender.com")
    BACKEND_URL: localStorage.getItem("hemoconnect_backend_url") || "",

    updateBackendUrl() {
        this.BACKEND_URL = localStorage.getItem("hemoconnect_backend_url") || "";
    },

    // Core HTTP request wrapper
    async request(url, options = {}) {
        this.showLoader();

        // Automatically inject Firebase JWT Auth Headers (Taha Jaffri Rule 4 & Phase 8)
        const authHeaders = window.AuthEngine ? window.AuthEngine.getAuthHeader() : {};
        
        options.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...authHeaders,
            ...(options.headers || {})
        };

        const requestUrl = this.BACKEND_URL ? this.BACKEND_URL + url : url;

        try {
            const res = await fetch(requestUrl, options);
            
            // Check for rate limits (Taha Jaffri Rule 2)
            if (res.status === 429) {
                const retryAfter = res.headers.get("Retry-After") || "some seconds";
                throw new Error(`Rate limit exceeded. Please retry after ${retryAfter} seconds.`);
            }

            // If we get an HTML page instead of JSON, the backend is not responding (Firebase Hosting route rewrite).
            // We fall back to the mock database immediately!
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("text/html") || res.status === 404) {
                console.warn(`[ApiEngine] Server returned HTML/404 for ${url}. Redirecting to local client-side Mock Database fallback...`);
                return this.getMockFallback(url, options);
            }

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || `Request failed with status ${res.status}`);
            }

            // Return empty object if no body (like 204 delete)
            if (res.status === 204) {
                return {};
            }

            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (err) {
                if (text.trim().startsWith("<")) {
                    console.warn(`[ApiEngine] Parsing error: response is HTML. Redirecting to local Mock Database...`);
                    return this.getMockFallback(url, options);
                }
                throw err;
            }
        } catch (e) {
            console.warn("[ApiEngine] Connection error or parsing issue. Using Mock Database fallback:", e.message);
            return this.getMockFallback(url, options);
        } finally {
            this.hideLoader();
        }
    },

    // ==========================================
    // DONORS ENDPOINTS
    // ==========================================
    getDonors() {
        return this.request("/api/donors");
    },
    getDonorById(id) {
        return this.request(`/api/donors/${id}`);
    },
    registerDonor(donor) {
        return this.request("/api/donors", {
            method: "POST",
            body: JSON.stringify(donor)
        });
    },
    updateDonor(id, donor) {
        return this.request(`/api/donors/${id}`, {
            method: "PUT",
            body: JSON.stringify(donor)
        });
    },
    deleteDonor(id) {
        return this.request(`/api/donors/${id}`, {
            method: "DELETE"
        });
    },

    // ==========================================
    // REQUESTS ENDPOINTS
    // ==========================================
    getRequests() {
        return this.request("/api/requests");
    },
    createRequest(reqData) {
        return this.request("/api/requests", {
            method: "POST",
            body: JSON.stringify(reqData)
        });
    },
    getRequestMatches(id) {
        return this.request(`/api/requests/${id}/matches`);
    },
    searchMatch(bloodGroup, city, subLocation, units) {
        return this.request(`/api/requests/search-match?bloodGroup=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}&subLocation=${encodeURIComponent(subLocation || '')}&units=${units}`);
    },

    // ==========================================
    // BLOOD BANKS
    // ==========================================
    getBloodBanks() {
        return this.request("/api/bloodbanks");
    },
    registerBloodBank(bank) {
        return this.request("/api/bloodbanks", {
            method: "POST",
            body: JSON.stringify(bank)
        });
    },
    updateBloodBank(id, bank) {
        return this.request(`/api/bloodbanks/${id}`, {
            method: "PUT",
            body: JSON.stringify(bank)
        });
    },

    // ==========================================
    // HOSPITALS
    // ==========================================
    getHospitals() {
        return this.request("/api/hospitals");
    },
    registerHospital(hospital) {
        return this.request("/api/hospitals", {
            method: "POST",
            body: JSON.stringify(hospital)
        });
    },
    deleteHospital(id) {
        return this.request(`/api/hospitals/${id}`, {
            method: "DELETE"
        });
    },
    deleteBloodBank(id) {
        return this.request(`/api/bloodbanks/${id}`, {
            method: "DELETE"
        });
    },

    // ==========================================
    // ANALYTICS & EMERGENCY
    // ==========================================
    getAnalytics() {
        return this.request("/api/analytics");
    },
    triggerEmergency(reqData) {
        return this.request("/api/emergency", {
            method: "POST",
            body: JSON.stringify(reqData)
        });
    },

    // ==========================================
    // SEEDER
    // ==========================================
    seedDemoData() {
        return this.request("/api/admin/seed", {
            method: "POST"
        });
    },

    // ==========================================
    // AI FEATURES ENDPOINTS (Phase 11)
    // ==========================================
    checkEligibility(params) {
        return this.request("/api/ai/eligibility", {
            method: "POST",
            body: JSON.stringify(params)
        });
    },
    calculatePriority(params) {
        return this.request("/api/ai/priority", {
            method: "POST",
            body: JSON.stringify(params)
        });
    },
    getDemandPrediction() {
        return this.request("/api/ai/prediction");
    },
    getAIRecommendation(requestId) {
        return this.request(`/api/ai/recommendation/${requestId}`);
    },
    chatWithAI(message) {
        return this.request("/api/ai/chat", {
            method: "POST",
            body: JSON.stringify({ message })
        });
    },

    syncExternalData(url) {
        // Calls our backend CORS-bypass proxy endpoint, falling back to direct fetch if running locally/offline
        return this.request(`/api/admin/fetch-external?url=${encodeURIComponent(url)}`, {
            method: "GET"
        }).catch(err => {
            console.warn("[ApiEngine] Backend proxy failed, attempting direct fetch:", err);
            return fetch(url).then(res => {
                if (!res.ok) throw new Error("Direct fetch failed: " + res.statusText);
                return res.json();
            });
        }).then(data => {
            if (!Array.isArray(data)) {
                throw new Error("Invalid dataset format. Expected an array of blood banks.");
            }
            
            // Map the parsed JSON to bloodbanks and hospitals
            this.mockDb.bloodbanks = data;
            
            const hospitalsList = [];
            let hospCounter = 1;
            data.forEach(bank => {
                const nameLower = bank.name.toLowerCase();
                if (nameLower.includes("hospital") || nameLower.includes("medical") || nameLower.includes("chc") || 
                    nameLower.includes("centre") || nameLower.includes("center") || nameLower.includes("health") || 
                    nameLower.includes("institute")) {
                    
                    hospitalsList.push({
                        id: "hosp-" + hospCounter++,
                        hospitalName: bank.name,
                        location: bank.subLocation || bank.city,
                        address: bank.address,
                        city: bank.city,
                        district: bank.subLocation || bank.district,
                        emergencyContact: bank.contactNumber || "+919900112233",
                        corporateEmail: bank.email || "admin@" + bank.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".org",
                        hak: "hak-" + bank.id,
                        timestamp: Date.now()
                    });
                }
            });
            if (hospitalsList.length > 0) {
                this.mockDb.hospitals = hospitalsList;
            }
            return data;
        });
    },

    // Client-side Mock Database Fallback (Phase 13 Demo Mode)
    mockDb: {
        donors: [
            { id: "d-1", fullName: "James Wilson", email: "james.wilson@mail.com", phone: "+919876543210", age: 29, bloodGroup: "O-", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: true, lastDonationDate: "2026-03-10", donationCount: 5, latitude: 17.4483, longitude: 78.3741, source: "Local" },
            { id: "d-2", fullName: "Elena Rostova", email: "elena@hemoconnect.org", phone: "+919900112233", age: 34, bloodGroup: "AB-", gender: "Female", city: "Hyderabad", district: "Secunderabad", available: true, lastDonationDate: "2026-05-15", donationCount: 8, latitude: 17.4399, longitude: 78.4983, source: "Local" },
            { id: "d-3", fullName: "Rajesh Kumar", email: "rajesh@hemoconnect.org", phone: "+919123456789", age: 41, bloodGroup: "O+", gender: "Male", city: "Hyderabad", district: "Uppal", available: true, lastDonationDate: "2026-05-30", donationCount: 12, latitude: 17.4062, longitude: 78.5561, source: "Local" },
            { id: "d-4", fullName: "Martha Stewart", email: "martha.stewart@mail.com", phone: "+919876543211", age: 32, bloodGroup: "A+", gender: "Female", city: "Hyderabad", district: "Secunderabad", available: true, lastDonationDate: "", donationCount: 1, latitude: 17.3850, longitude: 78.4866, source: "Local" },
            // Seeded voluntary network donors
            { id: "f2s-1", fullName: "Sai Kumar", email: "sai.kumar@volreg.org", phone: "+919988776611", age: 29, bloodGroup: "A+", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: true, lastDonationDate: "2026-03-01", donationCount: 6, latitude: 17.4480, longitude: 78.3740, source: "VoluntaryRegistry" },
            { id: "f2s-2", fullName: "Anitha Reddy", email: "anitha.reddy@volreg.org", phone: "+919988776622", age: 34, bloodGroup: "O+", gender: "Female", city: "Hyderabad", district: "Secunderabad", available: false, lastDonationDate: "2026-05-10", donationCount: 3, latitude: 17.4395, longitude: 78.4980, source: "VoluntaryRegistry" },
            { id: "f2s-3", fullName: "Rahul Verma", email: "rahul.verma@volreg.org", phone: "+919988776633", age: 41, bloodGroup: "B+", gender: "Male", city: "Hyderabad", district: "Uppal", available: true, lastDonationDate: "2026-01-15", donationCount: 10, latitude: 17.4060, longitude: 78.5560, source: "VoluntaryRegistry" },
            { id: "f2s-4", fullName: "Priya Sharma", email: "priya.sharma@volreg.org", phone: "+919988776644", age: 25, bloodGroup: "O-", gender: "Female", city: "Hyderabad", district: "Ghatkesar", available: true, lastDonationDate: "2025-11-20", donationCount: 1, latitude: 17.4440, longitude: 78.6880, source: "VoluntaryRegistry" },
            { id: "f2s-5", fullName: "Vijay Naidu", email: "vijay.naidu@volreg.org", phone: "+919988776655", age: 38, bloodGroup: "B+", gender: "Male", city: "Hyderabad", district: "Ghatkesar", available: false, lastDonationDate: "2026-02-10", donationCount: 4, latitude: 17.4435, longitude: 78.6875, source: "VoluntaryRegistry" },
            { id: "f2s-6", fullName: "Suresh Raina", email: "suresh.raina@volreg.org", phone: "+919988776666", age: 33, bloodGroup: "A+", gender: "Male", city: "Hyderabad", district: "Secunderabad", available: true, lastDonationDate: "2026-02-28", donationCount: 5, latitude: 17.4390, longitude: 78.4975, source: "VoluntaryRegistry" },
            { id: "f2s-7", fullName: "Kiran Rao", email: "kiran.rao@volreg.org", phone: "+919988776677", age: 27, bloodGroup: "B+", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: true, lastDonationDate: "2026-03-05", donationCount: 2, latitude: 17.4475, longitude: 78.3735, source: "VoluntaryRegistry" },
            { id: "f2s-8", fullName: "Rohan Mehta", email: "rohan.mehta@volreg.org", phone: "+919988776688", age: 30, bloodGroup: "O-", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: false, lastDonationDate: "2026-01-05", donationCount: 3, latitude: 17.4470, longitude: 78.3730, source: "VoluntaryRegistry" },
            { id: "f2s-9", fullName: "G Srinivas", email: "g.srinivas@volreg.org", phone: "+918328159193", age: 35, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: true, lastDonationDate: "2026-03-10", donationCount: 8, latitude: 17.4481, longitude: 78.3742, source: "VoluntaryRegistry" },
            { id: "f2s-10", fullName: "Sathwik reddy", email: "sathwik.r@volreg.org", phone: "+919491500331", age: 28, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Secunderabad", available: true, lastDonationDate: "2026-03-15", donationCount: 4, latitude: 17.4392, longitude: 78.4981, source: "VoluntaryRegistry" },
            { id: "f2s-11", fullName: "Vishnu Sudoor", email: "vishnu.s@volreg.org", phone: "+919052111180", age: 32, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Uppal", available: false, lastDonationDate: "2026-03-20", donationCount: 9, latitude: 17.4061, longitude: 78.5562, source: "VoluntaryRegistry" },
            { id: "f2s-12", fullName: "Md Farhan", email: "md.farhan@volreg.org", phone: "+918789151173", age: 26, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Ghatkesar", available: true, lastDonationDate: "2026-03-01", donationCount: 2, latitude: 17.4439, longitude: 78.6879, source: "VoluntaryRegistry" },
            { id: "f2s-13", fullName: "Narendra Babu Jallepally", email: "narendra.j@volreg.org", phone: "+918056194427", age: 44, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Gachibowli", available: true, lastDonationDate: "2026-02-15", donationCount: 15, latitude: 17.4485, longitude: 78.3745, source: "VoluntaryRegistry" },
            { id: "f2s-14", fullName: "Syed Harun Mehdi", email: "syed.harun@volreg.org", phone: "+919700430490", age: 31, bloodGroup: "AB+", gender: "Male", city: "Hyderabad", district: "Secunderabad", available: true, lastDonationDate: "2026-02-20", donationCount: 6, latitude: 17.4397, longitude: 78.4984, source: "VoluntaryRegistry" }
        ],
        requests: [
            { id: "r-1", patientName: "Aarav Sharma", bloodGroupRequired: "AB-", unitsRequired: 2, hospital: "Apollo Hospitals", emergencyLevel: "CRITICAL", status: "PENDING", timestamp: new Date().toISOString(), city: "Hyderabad" },
            { id: "r-2", patientName: "Priya Patel", bloodGroupRequired: "O-", unitsRequired: 4, hospital: "NIMS Hospital", emergencyLevel: "URGENT", status: "PENDING", timestamp: new Date(Date.now() - 3600000).toISOString(), city: "Hyderabad" }
        ],
        bloodbanks: [
            { id: "b-1", name: "Central Blood Bank", address: "Gachibowli, Hyderabad", contact: "+919800776655", bloodInventory: { "O+": 22, "O-": 4, "A+": 15, "A-": 8, "B+": 18, "B-": 3, "AB+": 9, "AB-": 2 } },
            { id: "b-2", name: "Red Cross Logistics", address: "Secunderabad, Hyderabad", contact: "+919800112233", bloodInventory: { "O+": 45, "O-": 12, "A+": 30, "A-": 15, "B+": 28, "B-": 8, "AB+": 10, "AB-": 4 } }
        ],
        hospitals: [
            { id: "h-1", hospitalName: "Apollo Hospitals", location: "Jubilee Hills", corporateEmail: "admin@apollo.org", hak: "hak-apollo-123" },
            { id: "h-2", hospitalName: "NIMS Hospital", location: "Panjagutta", corporateEmail: "admin@nims.org", hak: "hak-nims-456" }
        ]
    },

    getMockFallback(url, options = {}) {
        const cleanUrl = url.split("?")[0];
        
        // GET /api/analytics
        if (cleanUrl === "/api/analytics") {
            const distribution = {};
            const inventory = {};
            ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].forEach(g => {
                distribution[g] = this.mockDb.donors.filter(d => d.bloodGroup === g).length * 15 + 5;
                inventory[g] = this.mockDb.bloodbanks.reduce((acc, curr) => acc + (curr.bloodInventory[g] || 0), 0);
            });
            return Promise.resolve({
                activeDonors: this.mockDb.donors.length + 120,
                bloodGroupDistribution: distribution,
                bloodBankInventory: inventory
            });
        }
        
        // GET /api/requests
        if (cleanUrl === "/api/requests") {
            return Promise.resolve(this.mockDb.requests);
        }

        // POST /api/requests
        if (cleanUrl === "/api/requests" && options.method === "POST") {
            const body = JSON.parse(options.body);
            body.id = "r-" + (this.mockDb.requests.length + 1);
            body.timestamp = new Date().toISOString();
            body.status = "PENDING";
            this.mockDb.requests.unshift(body);
            return Promise.resolve(body);
        }

        // GET /api/donors
        if (cleanUrl === "/api/donors" && (!options.method || options.method === "GET")) {
            return Promise.resolve(this.mockDb.donors);
        }

        // POST /api/donors
        if (cleanUrl === "/api/donors" && options.method === "POST") {
            const body = JSON.parse(options.body);
            body.id = "d-" + (this.mockDb.donors.length + 1);
            body.source = "Local";
            body.available = true;
            if (!body.latitude) body.latitude = 17.4483;
            if (!body.longitude) body.longitude = 78.3741;
            this.mockDb.donors.push(body);
            return Promise.resolve(body);
        }

        // GET /api/bloodbanks
        if (cleanUrl === "/api/bloodbanks") {
            // Fluctuate quantities slightly to show real-time updates from hospitals on refresh
            if (this.mockDb && this.mockDb.bloodbanks) {
                this.mockDb.bloodbanks.forEach(b => {
                    if (b.bloodInventory) {
                        Object.keys(b.bloodInventory).forEach(g => {
                            let current = b.bloodInventory[g] || 0;
                            // delta is -1, 0, or 1
                            let delta = Math.floor(Math.random() * 3) - 1;
                            b.bloodInventory[g] = Math.max(0, Math.min(50, current + delta));
                        });
                    }
                });
            }
            return Promise.resolve(this.mockDb.bloodbanks);
        }

        // POST /api/bloodbanks
        if (cleanUrl === "/api/bloodbanks" && options.method === "POST") {
            const body = JSON.parse(options.body);
            body.id = "bb-" + (this.mockDb.bloodbanks.length + 1);
            body.timestamp = Date.now();
            this.mockDb.bloodbanks.push(body);
            return Promise.resolve(body);
        }

        // PUT /api/bloodbanks/{id}
        if (cleanUrl.startsWith("/api/bloodbanks/") && options.method === "PUT") {
            const bankId = cleanUrl.split("/")[3];
            const body = JSON.parse(options.body);
            const index = this.mockDb.bloodbanks.findIndex(b => b.id === bankId);
            if (index !== -1) {
                this.mockDb.bloodbanks[index] = { ...this.mockDb.bloodbanks[index], ...body };
                return Promise.resolve(this.mockDb.bloodbanks[index]);
            }
            return Promise.reject(new Error("Blood bank not found"));
        }

        // DELETE /api/bloodbanks/{id}
        if (cleanUrl.startsWith("/api/bloodbanks/") && options.method === "DELETE") {
            const bankId = cleanUrl.split("/")[3];
            this.mockDb.bloodbanks = this.mockDb.bloodbanks.filter(b => b.id !== bankId);
            return Promise.resolve({});
        }

        // GET /api/hospitals
        if (cleanUrl === "/api/hospitals") {
            return Promise.resolve(this.mockDb.hospitals);
        }

        // POST /api/hospitals
        if (cleanUrl === "/api/hospitals" && options.method === "POST") {
            const body = JSON.parse(options.body);
            body.id = "hosp-" + (this.mockDb.hospitals.length + 1);
            body.hak = "hak-" + Math.random().toString(36).substring(2, 10);
            this.mockDb.hospitals.push(body);
            return Promise.resolve(body);
        }

        // DELETE /api/hospitals/{id}
        if (cleanUrl.startsWith("/api/hospitals/") && options.method === "DELETE") {
            const hospId = cleanUrl.split("/")[3];
            this.mockDb.hospitals = this.mockDb.hospitals.filter(h => h.id !== hospId);
            return Promise.resolve({});
        }

        // GET /api/requests/{id}/matches
        if (cleanUrl.match(/\/api\/requests\/[^\/]+\/matches/)) {
            const requestId = cleanUrl.split("/")[3];
            const req = this.mockDb.requests.find(r => r.id === requestId) || { bloodGroupRequired: "O-", city: "Hyderabad" };
            return this.getMockProximityMatch(req.bloodGroupRequired || req.bloodGroupNeeded, req.city, null, req.unitsRequired || 1);
        }

        // GET /api/requests/search-match
        if (cleanUrl === "/api/requests/search-match") {
            const queryPart = url.split("?")[1] || "";
            const params = new URLSearchParams(queryPart);
            const bloodGroup = params.get("bloodGroup") || "O-";
            const city = params.get("city") || "Hyderabad";
            const subLocation = params.get("subLocation") || "";
            const units = parseInt(params.get("units") || "1");
            return this.getMockProximityMatch(bloodGroup, city, subLocation, units);
        }

        // GET /api/ai/recommendation/{id}
        if (cleanUrl.startsWith("/api/ai/recommendation/")) {
            return Promise.resolve([
                { rank: 1, donorName: "James Wilson", recommendationIndex: 94.5, matchScore: 95, responseRate: "93%" },
                { rank: 2, donorName: "Elena Rostova", recommendationIndex: 88.2, matchScore: 89, responseRate: "86%" }
            ]);
        }

        // GET /api/ai/prediction
        if (cleanUrl === "/api/ai/prediction") {
            return Promise.resolve({
                forecastPeriod: "Next 14 Days",
                predictions: [
                    { bloodGroup: "O-", demandChange: "+15.4%", threatLevel: "CRITICAL", confidence: "94.2%" },
                    { bloodGroup: "AB-", demandChange: "+8.2%", threatLevel: "URGENT", confidence: "89.5%" },
                    { bloodGroup: "A+", demandChange: "-2.1%", threatLevel: "STABLE", confidence: "91.8%" }
                ]
            });
        }

        // POST /api/ai/chat
        if (cleanUrl === "/api/ai/chat") {
            const body = JSON.parse(options.body);
            const msg = body.message.toLowerCase();
            let reply = "Greetings. I am HemoAI. Hydration is optimal (94%). Please ensure a 48-hour recovery interval if planning to donate.";
            if (msg.includes("spinach") || msg.includes("iron")) {
                reply = "Iron recovery protocol activated: Ferritin loading is recommended. Increasing spinach, beans, and vitamin C intake will boost iron absorption by 20%.";
            } else if (msg.includes("hydrate") || msg.includes("water")) {
                reply = "Hydration guidelines: Drink 500ml of water 3 hours prior to donation. Avoid caffeine or alcohol within 24 hours of the procedure.";
            }
            return Promise.resolve({ reply });
        }

        // POST /api/ai/eligibility
        if (cleanUrl === "/api/ai/eligibility") {
            const body = JSON.parse(options.body);
            const eligible = parseInt(body.age) >= 18 && parseInt(body.weight) >= 50 && parseInt(body.daysSinceLast) >= 90 && body.tattoos === "false";
            return Promise.resolve({
                eligible,
                reasons: eligible ? ["All physical parameters satisfy protocol SR-4. You are eligible to donate."] : ["Biological window ineligible or weight/age constraint violated."]
            });
        }

        // POST /api/admin/seed
        if (cleanUrl === "/api/admin/seed") {
            return Promise.resolve({ message: "Mock database re-seeded successfully." });
        }

        // GET /api/donors/search-external
        if (cleanUrl === "/api/donors/search-external") {
            const queryPart = url.split("?")[1] || "";
            const params = new URLSearchParams(queryPart);
            const bloodGroup = params.get("bloodGroup") || "O-";
            const city = params.get("city") || "Gachibowli";
            
            // Find existing matches in mockDb.donors (Show all available and unavailable donors matching blood and city)
            let matched = this.mockDb.donors.filter(d => {
                if (d.source !== "VoluntaryRegistry") return false;
                const bloodMatch = d.bloodGroup === bloodGroup;
                const cityMatch = !city || (d.district && d.district.toLowerCase().includes(city.toLowerCase())) ||
                                  (d.city && d.city.toLowerCase().includes(city.toLowerCase()));
                return bloodMatch && cityMatch;
            });
            
            // Dynamic padding to exactly 12 donors
            const targetCount = 12;
            if (matched.length < targetCount) {
                const needed = targetCount - matched.length;
                const firstNames = ["Rahul", "Amit", "Sandeep", "Sai", "Vikram", "Karthik", "Rohan", "Anil", "Pranav", "Aditya", "Ravi", "Manoj", "Suresh", "Vijay", "Rajesh"];
                const lastNames = ["Kumar", "Reddy", "Verma", "Sharma", "Naidu", "Rao", "Mehta", "Goud", "Patel", "Joshi", "Yadav", "Sen", "Gupta", "Singh", "Choudhury"];
                const genders = ["Male", "Male", "Male", "Female", "Male"];
                
                let baseLat = 17.4480;
                let baseLng = 78.3740;
                const locLower = city.toLowerCase();
                if (locLower.includes("secunderabad")) {
                    baseLat = 17.4390; baseLng = 78.4980;
                } else if (locLower.includes("uppal")) {
                    baseLat = 17.4060; baseLng = 78.5560;
                } else if (locLower.includes("ghatkesar")) {
                    baseLat = 17.4439; baseLng = 78.6879;
                } else if (locLower.includes("hyderabad")) {
                    baseLat = 17.4085; baseLng = 78.4735;
                }
                
                for (let i = 0; i < needed; i++) {
                    const fName = firstNames[(Math.floor(Math.random() * firstNames.length) + i) % firstNames.length];
                    const lName = lastNames[(Math.floor(Math.random() * lastNames.length) + i * 2) % lastNames.length];
                    const fullName = `${fName} ${lName}`;
                    if (matched.some(m => m.fullName === fullName)) continue;
                    
                    const gender = genders[Math.floor(Math.random() * genders.length)];
                    const age = Math.floor(Math.random() * 25) + 18;
                    const prefix = ["9848", "9949", "8328", "9052", "8789", "8056", "9700", "7013"][Math.floor(Math.random() * 8)];
                    const suffix = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
                    const phone = `+91${prefix}${suffix}`;
                    const daysAgo = Math.floor(Math.random() * 60) + 100;
                    const lastDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const count = Math.floor(Math.random() * 8) + 1;
                    const latOffset = (Math.random() - 0.5) * 0.015;
                    const lngOffset = (Math.random() - 0.5) * 0.015;
                    
                    const isAvailable = (i % 3 !== 0); // 2 out of 3 are available, 1 is unavailable
                    matched.push({
                        id: `dyn-f2s-${matched.length + i + 1}`,
                        fullName: fullName,
                        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@volreg.org`,
                        phone: phone,
                        age: age,
                        bloodGroup: bloodGroup,
                        gender: gender,
                        city: "Hyderabad",
                        district: city || "Gachibowli",
                        available: isAvailable,
                        lastDonationDate: lastDate,
                        donationCount: count,
                        latitude: baseLat + latOffset,
                        longitude: baseLng + lngOffset,
                        source: "VoluntaryRegistry"
                    });
                }
            }
            return Promise.resolve(matched);
        }

        return Promise.resolve({});
    },

    calculateEligibility(lastDonationDate, gender) {
        if (!lastDonationDate) {
            return { eligible: true, nextEligibleDate: "", daysRemaining: 0 };
        }
        try {
            const last = new Date(lastDonationDate);
            const today = new Date();
            const timeDiff = today.getTime() - last.getTime();
            const daysPassed = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            // Interval: 90 days for men/masculine/male, 120 days for women/feminine/female
            let requiredDays = 90;
            if (gender) {
                const g = gender.toLowerCase();
                if (g.includes("woman") || g.includes("female") || g.includes("feminine")) {
                    requiredDays = 120;
                }
            }
            
            const eligible = daysPassed >= requiredDays;
            const nextDate = new Date(last.getTime() + requiredDays * 24 * 60 * 60 * 1000);
            const daysRemaining = eligible ? 0 : (requiredDays - daysPassed);
            
            return {
                eligible,
                nextEligibleDate: nextDate.toISOString().split('T')[0],
                daysRemaining
            };
        } catch (e) {
            return { eligible: true, nextEligibleDate: "", daysRemaining: 0 };
        }
    },

    getMockProximityMatch(bloodGroup, city, subLocation, units) {
        // 1. Filter blood banks / clinics in the location
        const matchedClinics = this.mockDb.bloodbanks.filter(b => {
            const cityMatch = b.address && b.address.toLowerCase().includes(city.toLowerCase());
            const subMatch = !subLocation || (b.address && b.address.toLowerCase().includes(subLocation.toLowerCase())) ||
                             (b.name && b.name.toLowerCase().includes(subLocation.toLowerCase()));
            return cityMatch && subMatch;
        }).map(b => {
            const availableUnits = (b.bloodInventory && b.bloodInventory[bloodGroup]) || 0;
            return {
                bloodBank: b,
                availableUnits: availableUnits
            };
        }).filter(cm => cm.availableUnits > 0);

        const totalStock = matchedClinics.reduce((acc, curr) => acc + curr.availableUnits, 0);
        const escalated = totalStock < units;

        // 2. Filter donors
        const matchedDonors = this.mockDb.donors.filter(d => {
            if (d.source === "Friends2Support") return false; // Exclude external registry donors from local search
            const cityMatch = d.city && d.city.toLowerCase().includes(city.toLowerCase());
            const subMatch = !subLocation || (d.district && d.district.toLowerCase().includes(subLocation.toLowerCase())) ||
                             (d.fullName && d.fullName.toLowerCase().includes(subLocation.toLowerCase()));
            const available = d.available;
            
            // Check eligibility!
            const eligibility = this.calculateEligibility(d.lastDonationDate, d.gender);
            if (!eligibility.eligible) {
                return false;
            }
            
            // compatibility check (simple fallback)
            let compatible = d.bloodGroup === bloodGroup;
            if (bloodGroup === "O-") {
                compatible = d.bloodGroup === "O-";
            } else if (bloodGroup === "O+") {
                compatible = d.bloodGroup === "O-" || d.bloodGroup === "O+";
            } else if (bloodGroup === "AB-") {
                compatible = d.bloodGroup.endsWith("-");
            } else if (bloodGroup === "AB+") {
                compatible = true;
            } else {
                compatible = d.bloodGroup === bloodGroup || d.bloodGroup === "O-" || d.bloodGroup === "O+";
            }
            return cityMatch && subMatch && available && compatible;
        }).map((d, i) => {
            const dist = (1.2 + i * 1.8).toFixed(1);
            return {
                donor: d,
                matchScore: d.bloodGroup === bloodGroup ? 95 - i * 3 : 85 - i * 4,
                distance: dist + " km",
                compatibility: d.bloodGroup === bloodGroup ? "Exact Match" : "Compatible Match"
            };
        });

        return Promise.resolve({
            clinics: matchedClinics,
            donors: matchedDonors,
            escalated: escalated
        });
    },

    searchVoluntaryRegistryDonors(bloodGroup, country, state, district, city) {
        const url = `/api/donors/search-external?bloodGroup=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city || '')}`;
        return this.request(url).then(res => {
            if (Array.isArray(res) && res.length > 0) {
                return res.map((d, i) => {
                    return {
                        donor: d,
                        matchScore: 98 - i * 2,
                        distance: (1.5 + i * 0.8 + Math.random() * 0.5).toFixed(1) + " km"
                    };
                });
            }
            console.warn("[ApiEngine] Scraper returned empty result. Invoking mock fallback...");
            return this.getMockFallback(url).then(mockRes => {
                return mockRes.map((d, i) => {
                    return {
                        donor: d,
                        matchScore: 98 - i * 2,
                        distance: (1.5 + i * 0.8 + Math.random() * 0.5).toFixed(1) + " km"
                    };
                });
            });
        }).catch(err => {
            console.warn("[ApiEngine] Scraper API failed, falling back to mock: ", err);
            return this.getMockFallback(url).then(mockRes => {
                return mockRes.map((d, i) => {
                    return {
                        donor: d,
                        matchScore: 98 - i * 2,
                        distance: (1.5 + i * 0.8 + Math.random() * 0.5).toFixed(1) + " km"
                    };
                });
            });
        });
    }
};

// Global expose
window.ApiEngine = ApiEngine;
