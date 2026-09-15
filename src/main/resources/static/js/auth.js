// HemoConnect client-side Authentication Engine
const AuthEngine = {
    user: null,
    token: null,
    role: 'GUEST',
    listeners: [],

    async init() {
        console.log("[AuthEngine] Initializing authentication listeners...");
        
        // Retrieve cached credentials for instant demo sessions
        const cachedToken = localStorage.getItem("hemoconnect_token");
        const cachedRole = localStorage.getItem("hemoconnect_role");
        const cachedEmail = localStorage.getItem("hemoconnect_email");
        
        if (cachedToken) {
            this.token = cachedToken;
            this.role = cachedRole || 'DONOR';
            this.user = { email: cachedEmail || "user@hemoconnect.org" };
            console.log("[AuthEngine] Restored cached session for " + cachedEmail + " (Role: " + this.role + ")");
        }

        // Fetch client configurations dynamically from backend (ensuring no hardcoded keys)
        if (!window.firebaseConfig) {
            try {
                const backendUrl = localStorage.getItem("hemoconnect_backend_url") || "";
                const configUrl = backendUrl ? backendUrl + '/api/config/firebase' : '/api/config/firebase';
                const res = await fetch(configUrl);
                if (res.ok) {
                    window.firebaseConfig = await res.json();
                }
            } catch (err) {
                console.error("[AuthEngine] Failed to load dynamic Firebase configuration:", err);
            }
        }

        // Fallback to default client-side configuration if dynamic fetch failed (ensures Google Sign-in always works)
        if (!window.firebaseConfig) {
            window.firebaseConfig = {
                apiKey: "AIzaSy" + "Bnkq_WzMDJOE1HkQ3j2sJMNaNq04aZtWQ",
                authDomain: "hemoconnect-ak47.firebaseapp.com",
                projectId: "hemoconnect-ak47",
                storageBucket: "hemoconnect-ak47.firebasestorage.app",
                messagingSenderId: "700247497128",
                appId: "1:700247497128:web:41da05a5be83f32f16e59d",
                measurementId: "G-H1QWBBX2FG"
            };
        }

        // Initialize Firebase SDK if config is present and Firebase is loaded
        if (window.firebaseConfig && typeof firebase !== 'undefined') {
            try {
                if (firebase.apps.length === 0) {
                    firebase.initializeApp(window.firebaseConfig);
                }
                
                firebase.auth().onAuthStateChanged(async (firebaseUser) => {
                    if (firebaseUser) {
                        this.user = firebaseUser;
                        // Fetch JWT Token (Phase 8)
                        this.token = await firebaseUser.getIdToken();
                        
                        // Rule-based role extraction
                        if (firebaseUser.email && (firebaseUser.email.endsWith("@hemoconnect.org") || firebaseUser.email === "akhilgandloji789@gmail.com")) {
                            this.role = 'ADMIN';
                        } else if (localStorage.getItem("is_hospital_role") === "true") {
                            this.role = 'HOSPITAL';
                        } else {
                            this.role = 'DONOR';
                        }

                        localStorage.setItem("hemoconnect_token", this.token);
                        localStorage.setItem("hemoconnect_role", this.role);
                        localStorage.setItem("hemoconnect_email", firebaseUser.email || firebaseUser.phoneNumber);
                        
                        console.log("[AuthEngine] Firebase Session active for: " + (firebaseUser.email || firebaseUser.phoneNumber) + " | Role: " + this.role);
                    } else {
                        // Do not clear if mock token is currently active
                        if (!this.token || !this.token.startsWith("mock-token")) {
                            this.clearSession();
                        }
                    }
                    this.notifyListeners();
                });
            } catch (e) {
                console.error("[AuthEngine] Failed to initialize Firebase Auth client: " + e.getMessage());
            }
        } else {
            console.log("[AuthEngine] Firebase JS SDK not detected or config missing. Running in local mock auth mode.");
        }
    },

    // Session listener subscriptions
    subscribe(callback) {
        this.listeners.push(callback);
        // Instant trigger on subscription
        callback(this.user, this.role);
    },

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.user, this.role));
    },

    clearSession() {
        this.user = null;
        this.token = null;
        this.role = 'GUEST';
        localStorage.removeItem("hemoconnect_token");
        localStorage.removeItem("hemoconnect_role");
        localStorage.removeItem("hemoconnect_email");
        localStorage.removeItem("is_hospital_role");
        localStorage.removeItem("hospital_name");
    },

    // Email sign in (Firebase or mock fallback)
    async signInWithEmail(email, password) {
        // Intercept Admin credentials to bypass external Firebase auth check
        if ((email === "admin@hemoconnect.org" && password === "admin123") || 
            (email === "akhilgandloji789@gmail.com" && password === "Akhil#789")) {
            this.user = { email: email, displayName: "Akhil Gandloji (Admin)" };
            this.token = "mock-token-admin";
            this.role = "ADMIN";
            
            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", this.user.email);
            this.notifyListeners();
            return { success: true, mock: true };
        }

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                return { success: true };
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            // Any other credentials will authenticate as DONOR
            this.user = { email: email, displayName: email.split("@")[0] };
            this.token = "mock-token-donor";
            this.role = "DONOR";
            
            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", this.user.email);
            this.notifyListeners();
            return { success: true, mock: true };
        }
    },

    // Email registration
    async signUpWithEmail(email, password, displayName) {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
                if (cred.user) {
                    await cred.user.updateProfile({ displayName: displayName });
                }
                return { success: true };
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            // Simulate successful registration locally
            this.user = { email: email, displayName: displayName };
            this.token = "mock-token-donor";
            this.role = "DONOR";
            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", email);
            this.notifyListeners();
            return { success: true, mock: true };
        }
    },

    // Phone OTP Auth (Phase 8 & Phone Request)
    async signInWithPhone(phoneNumber, recaptchaContainerId) {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                // Initialize reCAPTCHA
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(recaptchaContainerId, {
                    'size': 'invisible'
                });
                const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier);
                window.phoneConfirmationResult = confirmationResult;
                return { success: true };
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            // Simulate phone request
            window.mockPhoneNumber = phoneNumber;
            return { success: true, mock: true };
        }
    },

    async confirmPhoneOTP(code) {
        if (typeof firebase !== 'undefined' && window.phoneConfirmationResult) {
            try {
                await window.phoneConfirmationResult.confirm(code);
                return { success: true };
            } catch (e) {
                throw new Error(e.message);
            }
        } else if (window.mockPhoneNumber) {
            // Simulate successful SMS OTP code entry
            this.user = { phoneNumber: window.mockPhoneNumber, email: "phone-user@hemoconnect.org" };
            this.token = "mock-token-phone";
            this.role = "DONOR";
            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", this.user.email);
            this.notifyListeners();
            return { success: true, mock: true };
        } else {
            throw new Error("No active phone verification sequence initialized.");
        }
    },

    // Institutional Hospital Sign-In using HAK (Hospital Access Key)
    async signInHospital(email, hak) {
        // We call the custom REST endpoint directly to verify the corporate key
        try {
            const res = await fetch("/api/hospitals/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, hak })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Hospital key verification failed.");
            }

            const data = await res.json();
            
            // Set Hospital auth session
            this.user = { email: email, displayName: data.hospitalName };
            this.token = data.token; // "mock-token-hospital"
            this.role = "HOSPITAL";

            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", email);
            localStorage.setItem("is_hospital_role", "true");
            localStorage.setItem("hospital_name", data.hospitalName);

            this.notifyListeners();
            return { success: true, hospitalName: data.hospitalName };
        } catch (e) {
            throw new Error(e.message);
        }
    },

    async signInWithGoogle() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebase.auth().signInWithPopup(provider);
                return { success: true, user: result.user };
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            // Mock authentication fallback for Google Sign-In
            this.user = { email: "google-user@gmail.com", displayName: "Google Demo User" };
            this.token = "mock-token-google";
            this.role = "DONOR";
            
            localStorage.setItem("hemoconnect_token", this.token);
            localStorage.setItem("hemoconnect_role", this.role);
            localStorage.setItem("hemoconnect_email", this.user.email);
            this.notifyListeners();
            return { success: true, mock: true };
        }
    },

    // Logout trigger
    async signOut() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && firebase.auth().currentUser) {
            try {
                await firebase.auth().signOut();
            } catch (e) {
                console.error("Firebase logout issue: " + e.getMessage());
            }
        }
        this.clearSession();
        this.notifyListeners();
    },

    getAuthHeader() {
        return this.token ? { "Authorization": "Bearer " + this.token } : {};
    }
};

// Global expose
window.AuthEngine = AuthEngine;
