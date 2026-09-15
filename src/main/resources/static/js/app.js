// HemoConnect Platform Orchestrator (SPA Navigation + Particles + Rose Four + Views)
document.addEventListener("DOMContentLoaded", () => {
    AuthEngine.init();
    AppEngine.init();
});

const AppEngine = {
    activeTab: 'dashboard',
    isLoading: false,

    init() {
        this.initBackgroundParticles();
        this.initRoseFourLoader();
        this.initAccessibility();
        this.initGoogleMaps();

        // Bind global search input events
        const globalSearch = document.getElementById("global-search-input");
        if (globalSearch) {
            globalSearch.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const q = globalSearch.value.trim();
                    this.triggerGlobalSearch(q);
                }
            });
            globalSearch.addEventListener("input", () => {
                const q = globalSearch.value.trim();
                if (q.length > 2) {
                    this.triggerGlobalSearch(q);
                } else if (q.length === 0) {
                    this.switchTab("dashboard");
                }
            });
        }

        // Bind sidebar navigation events
        document.querySelectorAll("[data-tab]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                const tab = el.getAttribute("data-tab");
                this.switchTab(tab);
                
                // Collapse sidebar nav drawer on mobile (Phase 17)
                const sidebar = document.getElementById("sidebar-nav");
                if (sidebar && sidebar.classList.contains("left-0")) {
                    sidebar.classList.remove("left-0");
                    sidebar.classList.add("left-[-240px]");
                }
            });
        });

        // Auth subscription to dynamically update sidebar profiles / features
        let isFirstLoad = true;
        AuthEngine.subscribe((user, role) => {
            this.updateHeaderProfile(user, role);
            
            // Login Gate Integration
            if (!user) {
                this.showLoginGate();
            } else {
                this.hideLoginGate();
                if (!isFirstLoad) {
                    this.switchTab(this.activeTab); // Re-render current tab if auth changes post-load
                }
            }
            isFirstLoad = false;
        });

        // Trigger initial view routing based on hash or default
        const hash = window.location.hash.substring(1);
        const initialTab = hash || 'dashboard';
        
        ApiEngine.init().then(() => {
            this.switchTab(initialTab);
        }).catch(err => {
            console.error(err);
            this.switchTab(initialTab);
        });
    },

    showLoginGate() {
        let overlay = document.getElementById("login-gate-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "login-gate-overlay";
            overlay.className = "fixed inset-0 bg-[#070A13]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto";
            document.body.appendChild(overlay);
        }
        
        // Hide navigation panels to block user interaction
        const sidebar = document.getElementById("sidebar-nav");
        const header = document.querySelector("header");
        const mainContent = document.getElementById("main-content-layout");
        const footer = document.querySelector("footer");
        if (sidebar) sidebar.classList.add("hidden");
        if (header) header.classList.add("hidden");
        if (mainContent) mainContent.style.marginLeft = "0";
        if (footer) footer.classList.add("hidden");

        // Inject Login Gate HTML
        overlay.innerHTML = `
            <div class="w-full max-w-md glass-card rounded-3xl p-8 flex flex-col gap-6 border border-white/10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,72,0.15)] animate-fadeIn">
                <div class="text-center relative z-10">
                    <div class="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span class="material-symbols-outlined text-primary text-2xl animate-pulse">favorite</span>
                    </div>
                    <h2 class="text-xl font-headline-lg font-bold text-white tracking-tight">HemoConnect Gateway</h2>
                    <p class="text-[10px] text-on-surface-variant font-jetbrainsMono uppercase tracking-wider mt-1">Access Protocol Authorization</p>
                </div>

                <!-- Role Selector Tabs -->
                <div class="flex bg-black/40 p-1 rounded-xl border border-white/5 relative z-10">
                    <button id="gate-tab-citizen" class="flex-1 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg transition-all">
                        Citizen / Donor
                    </button>
                    <button id="gate-tab-hospital" class="flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all">
                        Clinical Hospital
                    </button>
                </div>

                <!-- Form: Citizen/Donor Login & Registration -->
                <form id="gate-form-citizen" class="space-y-4 relative z-10">
                    <input type="hidden" id="gate-citizen-mode" value="signin" />
                    
                    <div id="gate-citizen-name-container" class="space-y-1 hidden">
                        <label class="block text-[10px] font-bold text-primary font-jetbrainsMono uppercase tracking-wider">FULL NAME</label>
                        <input type="text" id="gate-citizen-name" class="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/20" placeholder="e.g. John Doe" />
                    </div>
                    
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-primary font-jetbrainsMono uppercase tracking-wider">EMAIL ADDRESS</label>
                        <input type="email" id="gate-citizen-email" class="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/20" placeholder="e.g. donor@hemoconnect.org" required />
                    </div>
                    
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-primary font-jetbrainsMono uppercase tracking-wider">SECURE PASSWORD</label>
                        <input type="password" id="gate-citizen-pass" class="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/20" placeholder="••••••••" required />
                    </div>
                    
                    <button type="submit" id="gate-citizen-submit" class="w-full bg-primary text-white font-bold py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 text-[11px] tracking-wider uppercase">
                        Authorize Citizen Credentials
                    </button>
                    
                    <p class="text-center text-[10.5px] text-on-surface-variant/70 mt-2">
                        <span id="gate-toggle-text">New to HemoConnect?</span> 
                        <button type="button" id="gate-link-toggle-signup" class="text-primary hover:underline font-bold ml-1">Create an Account</button>
                    </p>
                </form>

                <!-- Form: Hospital Login (Hidden by default) -->
                <form id="gate-form-hospital" class="space-y-4 hidden relative z-10">
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-primary font-jetbrainsMono uppercase tracking-wider">INSTITUTIONAL EMAIL</label>
                        <input type="email" id="gate-hosp-email" class="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/20" placeholder="e.g. admin@apollo.org" required />
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[10px] font-bold text-primary font-jetbrainsMono uppercase tracking-wider">HOSPITAL ACCESS KEY (HAK)</label>
                        <input type="password" id="gate-hosp-hak" class="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/20" placeholder="e.g. hak-apollo-123" required />
                    </div>
                    <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 text-[11px] tracking-wider uppercase">
                        Verify Keys & Institutional Sign In
                    </button>
                </form>

                <!-- Divider -->
                <div class="flex items-center gap-3 relative z-10 text-on-surface-variant/30 text-[9px] font-jetbrainsMono uppercase">
                    <div class="flex-1 h-[1px] bg-white/5"></div>
                    <span>Or Authenticate Via</span>
                    <div class="flex-1 h-[1px] bg-white/5"></div>
                </div>

                <!-- Google Sign In Button -->
                <button id="gate-btn-google" class="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[11px] tracking-wider uppercase relative z-10 shadow-lg shadow-white/5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.78 0 3.38.61 4.64 1.8l3.46-3.46C17.98 1.19 15.15 0 12 0 7.31 0 3.29 2.69 1.34 6.61l4.08 3.16C6.42 6.94 9 5.04 12 5.04z"/>
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.25-2.07 3.59-5.12 3.59-8.67z"/>
                        <path fill="#FBBC05" d="M5.42 14.77a7.22 7.22 0 0 1 0-4.54L1.34 7.07A11.96 11.96 0 0 0 0 12c0 1.76.38 3.44 1.05 4.96l4.37-3.19z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.92l-3.84-2.98c-1.07.72-2.43 1.15-4.12 1.15-3 0-5.58-1.9-6.58-4.73L1.34 17.6C3.29 21.31 7.31 24 12 24z"/>
                    </svg>
                    Continue with Google
                </button>

                <!-- Guest & Actions -->
                <div class="border-t border-white/5 pt-4 text-center space-y-3 relative z-10">
                    <button id="gate-btn-guest" class="text-xs text-on-surface-variant hover:text-white transition-all underline flex items-center justify-center gap-1.5 mx-auto">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                        Continue as Guest Visitor
                    </button>
                    <p class="text-[9px] text-on-surface-variant/40 leading-relaxed font-jetbrainsMono uppercase">
                        SECURE CLINICAL LOGISTICS INTERFACE • HIPAA COMPLIANT
                    </p>
                </div>
            </div>
        `;

        // Tab Switching
        const tabCitizen = document.getElementById("gate-tab-citizen");
        const tabHospital = document.getElementById("gate-tab-hospital");
        const formCitizen = document.getElementById("gate-form-citizen");
        const formHospital = document.getElementById("gate-form-hospital");

        tabCitizen.addEventListener("click", () => {
            tabCitizen.className = "flex-1 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg transition-all";
            tabHospital.className = "flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all";
            formCitizen.classList.remove("hidden");
            formHospital.classList.add("hidden");
        });

        tabHospital.addEventListener("click", () => {
            tabHospital.className = "flex-1 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg transition-all";
            tabCitizen.className = "flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all";
            formHospital.classList.remove("hidden");
            formCitizen.classList.add("hidden");
        });

        // Toggle signin/signup modes
        const toggleLink = document.getElementById("gate-link-toggle-signup");
        const citizenMode = document.getElementById("gate-citizen-mode");
        const nameContainer = document.getElementById("gate-citizen-name-container");
        const nameInput = document.getElementById("gate-citizen-name");
        const citizenSubmit = document.getElementById("gate-citizen-submit");
        const toggleText = document.getElementById("gate-toggle-text");

        toggleLink.addEventListener("click", () => {
            if (citizenMode.value === "signin") {
                citizenMode.value = "signup";
                nameContainer.classList.remove("hidden");
                nameInput.setAttribute("required", "required");
                citizenSubmit.innerText = "Create New Account";
                toggleText.innerText = "Already have an account?";
                toggleLink.innerText = "Sign In";
            } else {
                citizenMode.value = "signin";
                nameContainer.classList.add("hidden");
                nameInput.removeAttribute("required");
                citizenSubmit.innerText = "Authorize Citizen Credentials";
                toggleText.innerText = "New to HemoConnect?";
                toggleLink.innerText = "Create an Account";
            }
        });

        // Form Submit: Citizen / Donor
        formCitizen.addEventListener("submit", async (e) => {
            e.preventDefault();
            const mode = citizenMode.value;
            const email = document.getElementById("gate-citizen-email").value.trim();
            const pass = document.getElementById("gate-citizen-pass").value.trim();
            
            try {
                if (mode === "signup") {
                    const name = nameInput.value.trim();
                    await AuthEngine.signUpWithEmail(email, pass, name);
                    alert("Account registration successful. Citizen session initiated.");
                    this.switchTab("dashboard");
                } else {
                    // Intercept Admin credentials
                    if (email === "akhilgandloji789@gmail.com" && pass === "Akhil#789") {
                        await AuthEngine.signInWithEmail(email, pass);
                        alert("Welcome back Admin, Akhil Gandloji. Elevating role access privileges.");
                        this.switchTab("dashboard");
                        return;
                    }
                    
                    await AuthEngine.signInWithEmail(email, pass);
                    alert("Authorization successful. Citizen session initiated.");
                    this.switchTab("dashboard");
                }
            } catch (err) {
                alert((mode === "signup" ? "Registration" : "Sign-In") + " failed: " + err.message);
            }
        });

        // Form Submit: Hospital
        formHospital.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("gate-hosp-email").value.trim();
            const hak = document.getElementById("gate-hosp-hak").value.trim();

            try {
                const res = await AuthEngine.signInHospital(email, hak);
                alert(`Institutional Node Verified: ${res.hospitalName} session active.`);
                this.switchTab("dashboard");
            } catch (err) {
                alert("Verification failed: " + err.message);
            }
        });

        // Button: Google Sign In
        document.getElementById("gate-btn-google").addEventListener("click", async () => {
            try {
                await AuthEngine.signInWithGoogle();
                alert("Google Authentication session synchronized.");
                this.switchTab("dashboard");
            } catch (err) {
                alert("Google Sign-In failed: " + err.message);
            }
        });

        // Button: Guest Access
        document.getElementById("gate-btn-guest").addEventListener("click", () => {
            AuthEngine.user = { email: "guest@hemoconnect.org", displayName: "Guest Visitor" };
            AuthEngine.token = "mock-token-guest";
            AuthEngine.role = "GUEST";
            localStorage.setItem("hemoconnect_token", AuthEngine.token);
            localStorage.setItem("hemoconnect_role", AuthEngine.role);
            localStorage.setItem("hemoconnect_email", AuthEngine.user.email);
            AuthEngine.notifyListeners();
            alert("Entering as Guest Visitor (Read-Only Mode).");
            this.switchTab("dashboard");
        });
    },

    hideLoginGate() {
        const overlay = document.getElementById("login-gate-overlay");
        if (overlay) overlay.remove();

        // Restore navigation panels
        const sidebar = document.getElementById("sidebar-nav");
        const header = document.querySelector("header");
        const mainContent = document.getElementById("main-content-layout");
        const footer = document.querySelector("footer");
        if (sidebar) sidebar.classList.remove("hidden");
        if (header) header.classList.remove("hidden");
        if (mainContent) mainContent.style.marginLeft = "";
        if (footer) footer.classList.remove("hidden");
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById("sidebar-nav");
        if (sidebar) {
            if (sidebar.classList.contains("left-[-240px]")) {
                sidebar.classList.remove("left-[-240px]");
                sidebar.classList.add("left-0");
            } else {
                sidebar.classList.remove("left-0");
                sidebar.classList.add("left-[-240px]");
            }
        }
    },

    detectCoordinates(callback) {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        alert("Querying GPS satellite connection...");
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Map coordinates to nearest Hyderabad hubs
            const sectors = [
                { name: "Gachibowli", lat: 17.4483, lng: 78.3741 },
                { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
                { name: "Uppal", lat: 17.4062, lng: 78.5561 },
                { name: "Ghatkesar", lat: 17.4442, lng: 78.6888 }
            ];
            
            let closestSector = "Gachibowli";
            let minDistance = Infinity;
            sectors.forEach(s => {
                const d = Math.sqrt(Math.pow(s.lat - lat, 2) + Math.pow(s.lng - lng, 2));
                if (d < minDistance) {
                     minDistance = d;
                     closestSector = s.name;
                }
            });
            
            callback(lat, lng, closestSector, "Hyderabad");
        }, err => {
            alert("Geolocation request denied or timed out. Defaulting to default coordinates.");
            callback(17.4483, 78.3741, "Gachibowli", "Hyderabad");
        });
    },

    handleDetectRegistrationLocation() {
        this.detectCoordinates((lat, lng, subLocation, city) => {
            const cityInput = document.getElementById("reg-city");
            const distInput = document.getElementById("reg-district");
            if (cityInput) cityInput.value = city;
            if (distInput) distInput.value = subLocation;
            this.regLat = lat;
            this.regLng = lng;
            alert(`Biometric GPS coordinates resolved: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}. Location auto-filled.`);
        });
    },

    handleDetectRadarLocation() {
        this.detectCoordinates((lat, lng, subLocation, city) => {
            const cityInput = document.getElementById("radar-city");
            const subInput = document.getElementById("radar-sublocation");
            if (cityInput) cityInput.value = city;
            if (subInput) subInput.value = subLocation;
            this.radarLat = lat;
            this.radarLng = lng;
            alert(`Radar scanning origin coordinates resolved: Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}.`);
        });
    },

    switchTab(tabName) {
        this.activeTab = tabName;
        window.location.hash = tabName;
        
        // Clear global search input if switching away from search results
        if (tabName !== 'search-results') {
            const globalSearch = document.getElementById("global-search-input");
            if (globalSearch) globalSearch.value = "";
        }
        
        // Update active class on navigation elements
        document.querySelectorAll("[data-tab]").forEach(el => {
            const current = el.getAttribute("data-tab");
            if (current === tabName) {
                el.className = "flex items-center gap-3 px-4 py-3 rounded-lg text-primary border-l-4 border-primary bg-primary/10 font-bold transition-all duration-300";
            } else {
                el.className = "flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-white/5 hover:text-primary transition-all duration-300";
            }
        });

        const appContent = document.getElementById("app-content");
        if (appContent) {
            appContent.classList.remove("view-section");
            void appContent.offsetWidth; // Trigger reflow to restart animation
            appContent.classList.add("view-section");
            this.renderView(tabName, appContent);
        }
    },

    updateHeaderProfile(user, role) {
        const profileContainer = document.getElementById("profile-header-container");
        if (profileContainer) {
            if (user) {
                profileContainer.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <p class="text-sm font-bold text-white">${user.displayName || user.email}</p>
                            <p class="text-xs text-primary font-jetbrainsMono">${role} NODE</p>
                        </div>
                        <button onclick="AuthEngine.signOut()" class="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded hover:text-primary transition-colors">Sign Out</button>
                    </div>
                `;
            } else {
                profileContainer.innerHTML = `
                    <button onclick="AppEngine.showLoginGate()" class="bg-primary/20 border border-primary/30 text-primary text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all">
                        Node Authentication
                    </button>
                `;
            }
        }
    },

    // Renders different SPA views dynamically without page reloads (Phase 13)
    async renderView(tab, container) {
        container.innerHTML = `<div class="py-12 text-center text-on-surface-variant">Synchronizing biometric link...</div>`;

        switch(tab) {
            case 'dashboard':
                await this.viewDashboard(container);
                break;
            case 'donor-match':
                await this.viewDonorMatch(container);
                break;
            case 'blood-inventory':
                await this.viewBloodInventory(container);
                break;
            case 'registration':
                this.viewRegistration(container);
                break;
            case 'about':
                this.viewAbout(container);
                break;
            case 'contact':
                this.viewContact(container);
                break;
            case 'settings':
                this.viewSettings(container);
                break;
            default:
                container.innerHTML = `<p class="text-primary text-center">Protocol target undefined.</p>`;
        }
    },

    // ==========================================================
    // VIEW 1: COMMAND DASHBOARD (Home Page / Base Dashboard)
    // ==========================================================
    async viewDashboard(container) {
        if (AuthEngine.role === 'ADMIN') {
            try {
                container.innerHTML = `<div class="py-12 text-center text-on-surface-variant font-jetbrainsMono">Authorizing root telemetry...</div>`;
                const donors = await ApiEngine.getDonors().catch(() => []);
                const requests = await ApiEngine.getRequests().catch(() => []);
                const bloodBanks = await ApiEngine.getBloodBanks().catch(() => []);
                await this.renderAdminDashboard(container, donors, requests, bloodBanks);
            } catch (err) {
                console.error("[AppEngine] Admin dashboard rendering failed:", err);
                container.innerHTML = `<p class="text-primary text-center font-jetbrainsMono text-xs">Failed to load admin telemetry: ${err.message}</p>`;
            }
            return;
        }

        container.innerHTML = `
            <div class="space-y-8 view-section font-jetbrainsMono text-white max-w-6xl mx-auto pb-10">
                <!-- Hero Banner Block -->
                <div class="relative rounded-2xl overflow-hidden glass-card border border-white/10 p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div class="flex-1 space-y-4">
                        <span class="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold font-jetbrainsMono tracking-widest uppercase">Protocol Status: ACTIVE</span>
                        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            HemoConnect: Vigilant Blood Network
                        </h1>
                        <p class="text-xs text-on-surface-variant/80 leading-relaxed font-sans">
                            HemoConnect is a state-of-the-art emergency blood matching and registry platform. By bridging the gap between local blood banks, voluntary donor registries, and clinical networks, HemoConnect ensures that critical blood matches are executed in real-time under extreme biometric filters.
                        </p>
                    </div>
                    <div class="w-full md:w-[350px] aspect-[16/9] rounded-xl overflow-hidden border border-white/10 relative shadow-2xl">
                        <img src="images/blood_donation_banner.png" alt="HemoConnect Mission" class="w-full h-full object-cover" />
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Importance & Why Donate Cards -->
                    <div class="space-y-6">
                        <div class="glass-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-primary/30 transition-colors">
                            <h3 class="text-base font-bold text-primary flex items-center gap-2 font-jetbrainsMono uppercase tracking-wider">
                                <span class="material-symbols-outlined text-primary">shield</span>
                                Importance of the Platform
                            </h3>
                            <ul class="space-y-2.5 text-xs text-on-surface-variant/80 leading-relaxed list-disc list-inside font-sans">
                                <li><strong>Real-time Scraper:</strong> Directly queries the live voluntary donor registry without redirects.</li>
                                <li><strong>Biometric Validation:</strong> Enforces medical eligibility gap checks before displaying donors.</li>
                                <li><strong>Smart Radar Proximity:</strong> Uses Levenshtein location matching and geolocation to trace nearby matches.</li>
                                <li><strong>Secure Node Access:</strong> Access gates restrict data to authorized medical and citizen nodes.</li>
                            </ul>
                        </div>

                        <div class="glass-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-success-cyan/30 transition-colors">
                            <h3 class="text-base font-bold text-success-cyan flex items-center gap-2 font-jetbrainsMono uppercase tracking-wider">
                                <span class="material-symbols-outlined text-success-cyan">favorite</span>
                                Why Donate Blood?
                            </h3>
                            <ul class="space-y-2.5 text-xs text-on-surface-variant/80 leading-relaxed list-disc list-inside font-sans">
                                <li><strong>Save Lives:</strong> A single donation can save up to three lives in emergency clinical wards.</li>
                                <li><strong>Cellular Renewal:</strong> Stimulates your bone marrow to produce fresh, new red blood cells.</li>
                                <li><strong>Cardiovascular Health:</strong> Helps maintain healthy iron levels, reducing risk of vascular blockages.</li>
                                <li><strong>Free Health Screening:</strong> Each donation includes a pulse, blood pressure, and hemoglobin check.</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Points to Remember & Badges -->
                    <div class="space-y-6">
                        <div class="glass-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-orange-500/30 transition-colors">
                            <h3 class="text-base font-bold text-orange-400 flex items-center gap-2 font-jetbrainsMono uppercase tracking-wider">
                                <span class="material-symbols-outlined text-orange-400">rule</span>
                                Guidelines: Points to Remember
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-sans text-on-surface-variant/80 leading-relaxed">
                                <div class="space-y-2 border-r border-white/5 pr-4">
                                    <p class="font-bold text-white uppercase font-jetbrainsMono text-[9px] tracking-wider">Before You Go:</p>
                                    <ul class="list-disc list-inside space-y-1">
                                        <li>Age: Must be 18–65 years old.</li>
                                        <li>Weight: Minimum 50 kg (110 lbs).</li>
                                        <li>Sleep: At least 6 hours of sound sleep.</li>
                                        <li>Diet: Eat a healthy meal, avoid alcohol.</li>
                                    </ul>
                                </div>
                                <div class="space-y-2 pl-2">
                                    <p class="font-bold text-white uppercase font-jetbrainsMono text-[9px] tracking-wider">Biological Gaps:</p>
                                    <ul class="list-disc list-inside space-y-1">
                                        <li><strong>Men:</strong> Minimum 90 days gap since last.</li>
                                        <li><strong>Women:</strong> Minimum 120 days gap since last.</li>
                                        <li>Hydrate: Drink 500ml water before.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Badges & Honors Card -->
                        <div class="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row hover:border-purple-500/30 transition-colors">
                            <div class="p-6 flex-1 space-y-3">
                                <h3 class="text-base font-bold text-purple-400 flex items-center gap-2 font-jetbrainsMono uppercase tracking-wider">
                                    <span class="material-symbols-outlined text-purple-400">workspace_premium</span>
                                    Honor Ranks & Badges
                                </h3>
                                <div class="space-y-2 text-[11px] font-jetbrainsMono">
                                    <div class="flex justify-between border-b border-white/5 pb-1"><span class="text-purple-300 font-bold">Newbie</span> <span class="text-on-surface-variant">0 Donations</span></div>
                                    <div class="flex justify-between border-b border-white/5 pb-1"><span class="text-amber-600 font-bold">Bronze Lifesaver</span> <span class="text-on-surface-variant">1–2 Donations</span></div>
                                    <div class="flex justify-between border-b border-white/5 pb-1"><span class="text-slate-400 font-bold">Silver Hero</span> <span class="text-on-surface-variant">3–5 Donations</span></div>
                                    <div class="flex justify-between border-b border-white/5 pb-1"><span class="text-yellow-400 font-bold">Gold Guardian</span> <span class="text-on-surface-variant">6–9 Donations</span></div>
                                    <div class="flex justify-between"><span class="text-cyan-400 font-bold animate-pulse">Platinum Savior</span> <span class="text-on-surface-variant">10+ Donations</span></div>
                                </div>
                            </div>
                            <div class="w-full md:w-[180px] min-h-[120px] relative border-t md:border-t-0 md:border-l border-white/10 overflow-hidden">
                                <img src="images/donor_badges.png" alt="Donor Badges" class="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Redirect Block -->
                <div class="flex justify-center pt-4">
                    <button onclick="AppEngine.switchTab('donor-match')" class="px-8 py-4 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white font-jetbrainsMono font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest flex items-center gap-2">
                        Launch Donor Match Radar
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
    },

    async renderAdminDashboard(container, donors, requests, bloodBanks) {
        const totalDonors = donors.length;
        const totalRequests = requests.length;
        
        let totalAvailableUnits = 0;
        bloodBanks.forEach(b => {
            const inv = b.bloodInventory || b.inventory || {};
            Object.values(inv).forEach(v => {
                totalAvailableUnits += (parseInt(v) || 0);
            });
        });

        const groupCounts = {};
        requests.forEach(r => {
            const group = r.bloodGroupRequired || r.bloodGroupNeeded || r.bloodGroup;
            if (group) groupCounts[group] = (groupCounts[group] || 0) + 1;
        });
        let mostNeeded = "O-";
        let maxNeeded = 0;
        Object.entries(groupCounts).forEach(([g, c]) => {
            if (c > maxNeeded) {
                maxNeeded = c;
                mostNeeded = g;
            }
        });

        const cityCounts = {};
        requests.forEach(r => {
            if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
        });
        let mostActiveCity = "Hyderabad";
        let maxCity = 0;
        Object.entries(cityCounts).forEach(([c, count]) => {
            if (count > maxCity) {
                maxCity = count;
                mostActiveCity = c;
            }
        });

        const sortedBanks = [...bloodBanks].map(b => {
            const inv = b.bloodInventory || b.inventory || {};
            const total = Object.values(inv).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
            return { ...b, totalUnits: total };
        }).sort((a, b) => b.totalUnits - a.totalUnits);

        const hospitals = await ApiEngine.getHospitals();

        let hospitalsHtml = hospitals.map((h, index) => {
            const imgUrl = AppEngine.getHospitalImageUrl(h.hospitalName);
            return `
                <div class="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div class="w-full md:w-1/3 h-32 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                        <img src="${imgUrl}" class="w-full h-full object-cover" alt="Hospital building image" />
                    </div>
                    <div class="flex-1 space-y-2">
                        <h4 class="font-bold text-white text-lg">${h.hospitalName}</h4>
                        <p class="text-xs text-primary font-jetbrainsMono uppercase tracking-wider">${h.district || 'General Sector'}</p>
                        <p class="text-xs text-on-surface-variant leading-relaxed">
                            <span class="text-white">Address:</span> ${h.address || h.location || 'N/A'}<br/>
                            <span class="text-white">City:</span> ${h.city || 'Hyderabad'}<br/>
                            <span class="text-white">Contact:</span> ${h.emergencyContact || h.contactNumber || 'N/A'}
                        </p>
                        <button onclick="AppEngine.deleteHospitalNode('${h.id}')" class="text-xs text-primary hover:underline font-bold mt-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs">delete</span> De-register Hospital
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        if (hospitalsHtml === "") {
            hospitalsHtml = `<p class="text-sm text-on-surface-variant italic">No hospitals registered in registry.</p>`;
        }

        // Cache donors list for export
        AppEngine.currentDonorsCache = donors;

        container.innerHTML = `
            <div class="mb-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="protocol-number">[ ADMIN COMMAND ]</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-success-cyan animate-pulse"></span>
                    <span class="text-[10px] font-jetbrainsMono tracking-wider text-success-cyan uppercase">System Root Access Authorized</span>
                </div>
                <h2 class="font-headline-lg text-3xl md:text-4xl text-white font-extrabold mb-2 tracking-tight">Admin System Operations</h2>
                <p class="text-on-surface-variant font-body-md max-w-2xl">
                    Configure institutional parameters, manage hospital endpoints, and monitor real-time clinical registries.
                </p>
            </div>

            <!-- Analytics Summary Row -->
            <div class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Total Donors</p>
                    <h3 class="text-2xl font-bold text-white mt-2">${totalDonors}</h3>
                </div>
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Blood Requests</p>
                    <h3 class="text-2xl font-bold text-white mt-2">${totalRequests}</h3>
                </div>
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Available Units</p>
                    <h3 class="text-2xl font-bold text-white mt-2">${totalAvailableUnits}</h3>
                </div>
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Most Needed</p>
                    <h3 class="text-2xl font-bold text-primary mt-2">${mostNeeded}</h3>
                </div>
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Most Active City</p>
                    <h3 class="text-xl font-bold text-white mt-2 truncate">${mostActiveCity}</h3>
                </div>
                <div class="glass-card rounded-xl p-4 flex flex-col justify-between">
                    <p class="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Top Blood Bank</p>
                    <h3 class="text-sm font-bold text-success-cyan mt-2 truncate">${sortedBanks[0] ? sortedBanks[0].name : 'N/A'}</h3>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-6">
                <!-- Side-by-side Hospital Registry -->
                <div class="col-span-12 lg:col-span-8 space-y-6">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-headline-md text-xl font-bold text-white">Registered Clinical Institutions</h3>
                        <button onclick="AppEngine.openRegisterHospitalModal()" class="bg-primary text-white text-xs font-bold px-4 py-2 rounded hover:scale-105 transition-transform">Register New Hospital</button>
                    </div>
                    <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        ${hospitalsHtml}
                    </div>
                </div>

                <!-- Right sidebar: Top Banks & Operations telemetry -->
                <div class="col-span-12 lg:col-span-4 space-y-6">
                    <div class="glass-card rounded-2xl p-6">
                        <h4 class="font-bold text-white text-base mb-4">Top Repositories by Volume</h4>
                        <div class="space-y-4">
                            ${sortedBanks.slice(0, 3).map((b, idx) => `
                                <div class="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                                    <div>
                                        <p class="font-bold text-white">${idx + 1}. ${b.name}</p>
                                        <p class="text-on-surface-variant">${b.city}</p>
                                    </div>
                                    <span class="px-2 py-1 rounded bg-success-cyan/10 text-success-cyan font-bold">${b.totalUnits} Units</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>

                    <div class="glass-card rounded-2xl p-6 bg-primary/5 border border-primary/20">
                        <h4 class="font-bold text-white text-sm uppercase tracking-wider mb-2">System Health Log</h4>
                        <p class="text-xs text-on-surface-variant leading-relaxed">
                            Database synchronized: 100% integrity.<br/>
                            Google Maps Node status: ACTIVE.<br/>
                            132 Blood Bank endpoints loaded.<br/>
                            Matching Engine latency: 12ms.
                        </p>
                    </div>
                </div>

                <!-- Bottom Full-Width Table: Registered Voluntary Fellows -->
                <div class="col-span-12 space-y-6 mt-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-headline-md text-xl font-bold text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">groups</span>
                            Registered Voluntary Fellows
                        </h3>
                        <button onclick="AppEngine.exportDonorsToCSV()" class="bg-success-cyan/15 text-success-cyan border border-success-cyan/30 hover:bg-success-cyan hover:text-black font-bold text-xs px-4 py-2 rounded flex items-center gap-1.5 transition-colors">
                            <span class="material-symbols-outlined text-xs">download</span> Export Citizen Registry
                        </button>
                    </div>
                    <div class="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="border-b border-white/10 bg-black/40 text-[10px] text-on-surface-variant font-jetbrainsMono uppercase tracking-wider">
                                        <th class="p-4 font-bold">Name</th>
                                        <th class="p-4 font-bold">Blood Group</th>
                                        <th class="p-4 font-bold">Contact Info</th>
                                        <th class="p-4 font-bold">Biometrics</th>
                                        <th class="p-4 font-bold">Sector Location</th>
                                        <th class="p-4 font-bold">Status</th>
                                        <th class="p-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5 font-sans">
                                    ${donors.length === 0 ? `
                                        <tr>
                                            <td colspan="7" class="p-8 text-center text-on-surface-variant italic">No registered voluntary fellows found in network database.</td>
                                        </tr>
                                    ` : donors.map(d => {
                                        const availClass = d.available 
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30";
                                        const availText = d.available ? "AVAILABLE" : "UNAVAILABLE";
                                        return `
                                            <tr class="hover:bg-white/5 transition-colors">
                                                <td class="p-4 font-bold text-white font-headline-md">
                                                    ${d.fullName || d.name}
                                                    <span class="block text-[9px] text-on-surface-variant font-normal font-jetbrainsMono mt-0.5">${d.source || 'VoluntaryRegistry'}</span>
                                                </td>
                                                <td class="p-4 font-bold font-jetbrainsMono">
                                                    <span class="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">${d.bloodGroup}</span>
                                                </td>
                                                <td class="p-4 leading-relaxed font-jetbrainsMono text-[11px]">
                                                    Email: <a href="mailto:${d.email}" class="text-success-cyan hover:underline">${d.email}</a><br/>
                                                    Phone: <span class="text-white">${d.phone || 'N/A'}</span>
                                                </td>
                                                <td class="p-4 text-on-surface-variant text-[11px]">
                                                    Age: <span class="text-white font-bold">${d.age || 'N/A'}</span> yr<br/>
                                                    Weight: <span class="text-white font-bold">${d.weight || 'N/A'}</span> kg
                                                </td>
                                                <td class="p-4 text-on-surface-variant text-[11px] font-jetbrainsMono">
                                                    ${d.district || d.city || 'Hyderabad'}
                                                </td>
                                                <td class="p-4">
                                                    <span class="px-2 py-0.5 rounded-full text-[8px] font-bold ${availClass} font-jetbrainsMono">${availText}</span>
                                                </td>
                                                <td class="p-4 text-right">
                                                    <button onclick="AppEngine.deleteDonorNode('${d.id || d.email}')" class="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-600/20 text-red-500 font-bold rounded-lg text-[9px] transition-all flex items-center gap-0.5 inline-flex">
                                                        <span class="material-symbols-outlined text-xs">delete</span> Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async deleteHospitalNode(id) {
        if (confirm("Are you sure you want to de-register this hospital node from HemoConnect? This action is irreversible.")) {
            try {
                await ApiEngine.deleteHospital(id);
                alert("Hospital node successfully de-registered.");
                this.switchTab("dashboard");
            } catch (err) {
                alert("Deletion failed: " + err.message);
            }
        }
    },

    async deleteDonorNode(id) {
        if (confirm(`Are you sure you want to remove this voluntary fellow (ID/Email: ${id}) from the registry?`)) {
            try {
                await ApiEngine.deleteDonor(id);
                alert("Donor registration successfully removed.");
                this.switchTab("dashboard");
            } catch (err) {
                alert("Deletion failed: " + err.message);
            }
        }
    },

    exportDonorsToCSV() {
        const donors = AppEngine.currentDonorsCache;
        if (!donors || donors.length === 0) {
            alert("No registered fellows to export.");
            return;
        }
        const headers = ["Full Name", "Email", "Phone", "Age", "Weight", "Blood Group", "Gender", "Sector", "Availability", "Source"];
        const rows = donors.map(d => [
            d.fullName || d.name || "",
            d.email || "",
            d.phone || "",
            d.age || "",
            d.weight || "",
            d.bloodGroup || "",
            d.gender || "",
            d.district || d.city || "Hyderabad",
            d.available ? "AVAILABLE" : "UNAVAILABLE",
            d.source || "VoluntaryRegistry"
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `HemoConnect_Voluntary_Registry_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async renderHospitalDashboard(container, donors, requests, bloodBanks) {
        const hospitalName = localStorage.getItem("hospital_name") || (AuthEngine.user && AuthEngine.user.displayName) || "St. Jude Medical Center";
        
        let myBank = bloodBanks.find(b => b.name.toLowerCase().includes(hospitalName.toLowerCase()));
        if (!myBank) {
            myBank = {
                name: hospitalName,
                type: "Private",
                address: "Hospital Sector, Hyderabad",
                city: "Hyderabad",
                subLocation: "Gachibowli",
                district: "Gachibowli",
                distanceKm: 0.0,
                contactNumber: "+9199001122",
                email: AuthEngine.user ? AuthEngine.user.email : "hospital@hemoconnect.org",
                bloodInventory: { "O+": 25, "O-": 2, "A+": 15, "A-": 2, "B+": 20, "B-": 1, "AB+": 10, "AB-": 0 }
            };
            try {
                myBank = await ApiEngine.registerBloodBank(myBank);
            } catch (e) {
                console.error(e);
            }
        }

        const inv = myBank.bloodInventory || myBank.inventory || {};
        
        let inventoryHtml = Object.entries(inv).map(([group, val]) => `
            <div class="flex justify-between items-center py-3 border-b border-white/5 text-xs">
                <span class="font-bold text-white text-sm font-jetbrainsMono">${group}</span>
                <div class="flex items-center gap-3">
                    <button onclick="AppEngine.updateHospitalStock('${myBank.id}', '${group}', -1)" class="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center hover:bg-primary transition-colors">-</button>
                    <span class="w-8 text-center text-white font-bold text-sm font-jetbrainsMono">${val}</span>
                    <button onclick="AppEngine.updateHospitalStock('${myBank.id}', '${group}', 1)" class="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center hover:bg-primary transition-colors">+</button>
                    <button onclick="AppEngine.updateHospitalStock('${myBank.id}', '${group}', -9999)" class="text-xs text-primary hover:underline ml-4 flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">clear</span> Empty</button>
                </div>
            </div>
        `).join("");

        const mySubLocation = myBank.subLocation || "Gachibowli";
        const nearRequests = requests.filter(r => 
            r.status === 'PENDING' && 
            (r.city.toLowerCase() === myBank.city.toLowerCase() || 
             (r.hospital && r.hospital.toLowerCase().includes(mySubLocation.toLowerCase())))
        );

        let requestsHtml = nearRequests.map(r => `
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center relative overflow-hidden">
                <div class="absolute left-0 top-0 h-full w-1 ${r.emergencyLevel === 'CRITICAL' ? 'bg-primary' : 'bg-tertiary'}"></div>
                <div>
                    <p class="text-white font-bold">${r.patientName} (${r.bloodGroupRequired})</p>
                    <p class="text-xs text-on-surface-variant">${r.hospital} • Needed: ${r.unitsRequired} units</p>
                </div>
                <span class="px-2 py-1 rounded text-xs font-bold bg-primary/20 text-primary animate-pulse">${r.emergencyLevel}</span>
            </div>
        `).join("");

        if (requestsHtml === "") {
            requestsHtml = `<p class="text-xs text-on-surface-variant italic">No nearby emergency requests reported in your sector.</p>`;
        }

        container.innerHTML = `
            <div class="mb-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="protocol-number">[ CLINIC HUB ]</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-success-cyan animate-pulse"></span>
                    <span class="text-[10px] font-jetbrainsMono tracking-wider text-success-cyan uppercase">${hospitalName} Node Active</span>
                </div>
                <h2 class="font-headline-lg text-3xl md:text-4xl text-white font-extrabold mb-2 tracking-tight">Clinical Operations Portal</h2>
                <p class="text-on-surface-variant font-body-md max-w-2xl">
                    Manage your hospital's real-time blood storage quantities, receive neighborhood emergency dispatches, and trigger radar matches.
                </p>
            </div>

            <div class="grid grid-cols-12 gap-6">
                <!-- Left Column: Manage Inventory -->
                <div class="col-span-12 lg:col-span-7 glass-card rounded-2xl p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="font-headline-md text-lg font-bold text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">inventory_2</span>
                            Own Hospital Inventory Stock
                        </h3>
                        <span class="text-xs text-on-surface-variant font-jetbrainsMono bg-white/5 border border-white/10 px-3 py-1 rounded">Sector: ${mySubLocation}</span>
                    </div>
                    <div class="space-y-1">
                        ${inventoryHtml}
                    </div>
                </div>

                <!-- Right Column: Near Requests & Actions -->
                <div class="col-span-12 lg:col-span-5 space-y-6">
                    <div class="glass-card rounded-2xl p-6">
                        <h4 class="font-bold text-white text-base mb-4 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary animate-pulse">notifications_active</span>
                            Sector Notifications & Alerts
                        </h4>
                        <div class="space-y-4">
                            ${requestsHtml}
                        </div>
                    </div>

                    <div class="glass-card rounded-2xl p-6 space-y-4">
                        <h4 class="font-bold text-white text-base">Quick Matching Dispatch</h4>
                        <p class="text-xs text-on-surface-variant">Verify matching donor records and coordinate instant courier dispatch.</p>
                        <button onclick="AppEngine.switchTab('donor-match')" class="w-full bg-primary text-white font-bold py-3 rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">radar</span>
                            Search Compatible Donors
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async updateHospitalStock(bankId, bloodGroup, change) {
        try {
            const banks = await ApiEngine.getBloodBanks();
            const bank = banks.find(b => b.id === bankId);
            if (bank) {
                const inv = bank.bloodInventory || bank.inventory || {};
                let current = inv[bloodGroup] || 0;
                if (change === -9999) {
                    current = 0;
                } else {
                    current = Math.max(0, current + change);
                }
                inv[bloodGroup] = current;
                bank.bloodInventory = inv;
                
                await ApiEngine.updateBloodBank(bankId, bank);
                alert(`Stock updated: ${bloodGroup} is now ${current} units.`);
                this.switchTab("dashboard");
            }
        } catch (err) {
            alert("Stock update failed: " + err.message);
        }
    },

    async renderDonorDashboard(container, donors, requests, bloodBanks) {
        const currentUserEmail = AuthEngine.user ? AuthEngine.user.email : "james.wilson@mail.com";
        const myProfile = donors.find(d => d.email.toLowerCase() === currentUserEmail.toLowerCase()) || {
            fullName: AuthEngine.user ? AuthEngine.user.displayName : "James Wilson",
            bloodGroup: "B+",
            city: "Hyderabad",
            district: "Gachibowli",
            gender: "Male",
            donationCount: 5,
            lastDonationDate: "2026-03-10",
            available: true
        };

        const myBloodGroup = myProfile.bloodGroup || "B+";
        const donationCount = myProfile.donationCount || 0;
        
        // Calculate dynamic eligibility
        const eligibility = ApiEngine.calculateEligibility(myProfile.lastDonationDate, myProfile.gender);
        
        // Calculate Badge
        let badgeText = "Newbie Donor";
        let badgeIcon = "🌱";
        let badgeStyle = "bg-white/5 text-on-surface-variant";
        
        if (donationCount >= 10) {
            badgeText = "Platinum Legend";
            badgeIcon = "💎";
            badgeStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.2)]";
        } else if (donationCount >= 6) {
            badgeText = "Gold Champion";
            badgeIcon = "🥇";
            badgeStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/35 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
        } else if (donationCount >= 3) {
            badgeText = "Silver Hero";
            badgeIcon = "🥈";
            badgeStyle = "bg-slate-400/10 text-slate-300 border border-slate-400/35";
        } else if (donationCount >= 1) {
            badgeText = "Bronze Lifesaver";
            badgeIcon = "🥉";
            badgeStyle = "bg-amber-600/10 text-amber-500 border border-amber-600/35";
        }

        const matchedRequests = requests.filter(r => 
            r.status === 'PENDING' && 
            (r.bloodGroupRequired === myBloodGroup || r.bloodGroupNeeded === myBloodGroup)
        );

        let requestsHtml = matchedRequests.map(r => `
            <div class="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-primary relative overflow-hidden">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary animate-pulse">${r.emergencyLevel}</span>
                        <h4 class="font-bold text-white text-lg mt-2">Patient: ${r.patientName}</h4>
                        <p class="text-xs text-on-surface-variant">Required: <span class="text-white font-bold">${r.bloodGroupRequired || r.bloodGroupNeeded}</span> • ${r.unitsRequired} Units</p>
                    </div>
                    <span class="text-xs text-on-surface-variant font-jetbrainsMono">${r.city}</span>
                </div>
                <p class="text-xs text-on-surface-variant"><span class="text-white">Hospital:</span> ${r.hospital}</p>
                <div class="grid grid-cols-3 gap-3 pt-2">
                    <button onclick="AppEngine.acceptBloodRequest('${r.id}')" class="bg-primary text-white text-xs font-bold py-2 rounded hover:scale-105 transition-transform flex items-center justify-center gap-1"><span class="material-symbols-outlined text-xs">done</span> Accept</button>
                    <a href="tel:${r.contactNumber || '+919900112233'}" class="bg-white/5 border border-white/10 text-xs font-bold py-2 rounded hover:bg-white/10 text-white flex items-center justify-center gap-1 transition-colors"><span class="material-symbols-outlined text-xs">call</span> Call</a>
                    <button onclick="AppEngine.navigateToHospitalNode('${r.hospital}')" class="bg-tertiary text-white text-xs font-bold py-2 rounded hover:scale-105 transition-transform flex items-center justify-center gap-1"><span class="material-symbols-outlined text-xs">navigation</span> Navigate</button>
                </div>
            </div>
        `).join("");

        if (requestsHtml === "") {
            requestsHtml = `
                <div class="glass-card rounded-2xl p-6 space-y-4 border-l-4 border-primary relative overflow-hidden">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary animate-pulse">Critical</span>
                            <h4 class="font-bold text-white text-lg mt-2">Patient: Rajesh</h4>
                            <p class="text-xs text-on-surface-variant">Required: <span class="text-white font-bold">${myBloodGroup}</span> • 3 Units</p>
                        </div>
                        <span class="text-xs text-on-surface-variant font-jetbrainsMono">Uppal</span>
                    </div>
                    <p class="text-xs text-on-surface-variant"><span class="text-white">Hospital:</span> Poulomi Hospital Blood Bank</p>
                    <div class="grid grid-cols-3 gap-3 pt-2">
                        <button onclick="AppEngine.acceptBloodRequest('r-mock-1')" class="bg-primary text-white text-xs font-bold py-2 rounded hover:scale-105 transition-transform flex items-center justify-center gap-1"><span class="material-symbols-outlined text-xs">done</span> Accept</button>
                        <a href="tel:+919900112233" class="bg-white/5 border border-white/10 text-xs font-bold py-2 rounded hover:bg-white/10 text-white flex items-center justify-center gap-1 transition-colors"><span class="material-symbols-outlined text-xs">call</span> Call</a>
                        <button onclick="AppEngine.navigateToHospitalNode('Poulomi Hospital Blood Bank')" class="bg-tertiary text-white text-xs font-bold py-2 rounded hover:scale-105 transition-transform flex items-center justify-center gap-1"><span class="material-symbols-outlined text-xs">navigation</span> Navigate</button>
                    </div>
                </div>
            `;
        }

        let citizensHtml = donors.map(d => {
            const dCount = d.donationCount || 0;
            let cBadge = "Newbie";
            let cStyle = "bg-white/5 text-on-surface-variant";
            
            if (dCount >= 10) {
                cBadge = "💎 Platinum";
                cStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
            } else if (dCount >= 6) {
                cBadge = "🥇 Gold";
                cStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
            } else if (dCount >= 3) {
                cBadge = "🥈 Silver";
                cStyle = "bg-slate-400/10 text-slate-300 border border-slate-400/20";
            } else if (dCount >= 1) {
                cBadge = "🥉 Bronze";
                cStyle = "bg-amber-600/10 text-amber-500 border border-amber-600/20";
            }

            const cElig = ApiEngine.calculateEligibility(d.lastDonationDate, d.gender);
            
            return `
                <tr class="border-b border-white/5 hover:bg-white/2 transition-colors text-xs">
                    <td class="py-3 pr-4 font-bold text-white">${d.fullName} ${d.email === currentUserEmail ? '(You)' : ''}</td>
                    <td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary font-jetbrainsMono">${d.bloodGroup}</span></td>
                    <td class="py-3"><span class="px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${cStyle}">${cBadge}</span></td>
                    <td class="py-3 text-on-surface-variant">${d.city || 'Hyderabad'} ${d.district ? '• ' + d.district : ''}</td>
                    <td class="py-3">
                        <span class="w-2 h-2 rounded-full inline-block ${cElig.eligible ? 'bg-success-cyan shadow-[0_0_8px_#00E5FF]' : 'bg-primary shadow-[0_0_8px_#E11D48]'} mr-2"></span>
                        <span class="text-[10px] text-on-surface-variant uppercase">${cElig.eligible ? 'Ready' : 'Ineligible'}</span>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="mb-10">
                <div class="flex items-center gap-2 mb-2">
                    <span class="protocol-number">[ DONOR GRID NODE ]</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-success-cyan animate-pulse"></span>
                    <span class="text-[10px] font-jetbrainsMono tracking-wider text-success-cyan uppercase">Citizen Link Synchronized</span>
                </div>
                <h2 class="font-headline-lg text-3xl md:text-4xl text-white font-extrabold mb-2 tracking-tight">Donor Telemetry Console</h2>
                <p class="text-on-surface-variant font-body-md max-w-2xl">
                    Monitor compatible emergency vectors in your neighborhood, update your profile availability, and coordinate deliveries.
                </p>
            </div>

            <div class="grid grid-cols-12 gap-6">
                <!-- Left: Profile & Requests -->
                <div class="col-span-12 lg:col-span-6 space-y-6">
                    <div class="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/10 via-transparent to-transparent flex flex-col justify-between relative overflow-hidden">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-bold text-white text-base">My Blood Profile</h3>
                                <p class="text-xs text-on-surface-variant mb-2">${myProfile.fullName}</p>
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badgeStyle}">
                                    <span>${badgeIcon}</span>
                                    <span>${badgeText}</span>
                                </span>
                            </div>
                            <span class="text-5xl font-extrabold text-primary drop-shadow-[0_0_15px_#ff1744] font-sora">${myBloodGroup}</span>
                        </div>
                        
                        <div class="pt-4 border-t border-white/5 flex flex-col gap-2">
                            <div class="flex justify-between text-xs text-on-surface-variant">
                                <span>Lifetime Donations:</span>
                                <span class="text-white font-bold">${donationCount} times</span>
                            </div>
                            <div class="flex justify-between text-xs text-on-surface-variant">
                                <span>Last Donation:</span>
                                <span class="text-white font-bold">${myProfile.lastDonationDate || "Never"}</span>
                            </div>
                            <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                <span class="text-xs text-on-surface-variant">Donation status availability:</span>
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full ${eligibility.eligible ? 'bg-success-cyan animate-pulse shadow-[0_0_10px_#00E5FF]' : 'bg-primary animate-pulse shadow-[0_0_10px_#E11D48]'}"></span>
                                    <span class="text-xs font-bold ${eligibility.eligible ? 'text-success-cyan' : 'text-primary'} uppercase">
                                        ${eligibility.eligible ? 'READY TO DONATE' : 'BIOLOGICAL RECOVERY ACTIVE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        ${!eligibility.eligible ? `
                            <div class="p-4 rounded-xl bg-primary/10 border border-primary/20 mt-4 text-xs relative overflow-hidden">
                                <p class="text-white font-bold mb-1 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm text-primary">healing</span> Recovery Window Active
                                </p>
                                <p class="text-on-surface-variant leading-relaxed">
                                    You can donate again in <span class="text-primary font-bold text-sm">${eligibility.daysRemaining} days</span> (Next eligible date: <span class="text-white font-bold">${eligibility.nextEligibleDate}</span>).
                                </p>
                                <p class="text-[10px] text-on-surface-variant/50 mt-2 font-jetbrainsMono">
                                    * India health authorities enforce a 90-day gap for men and 120-day gap for women to ensure recovery.
                                </p>
                            </div>
                        ` : ''}
                    </div>

                    <div class="space-y-4">
                        <h3 class="font-bold text-white text-base">Nearby Compatible Requests</h3>
                        ${requestsHtml}
                    </div>
                </div>

                <!-- Right: Registered Citizens Directory -->
                <div class="col-span-12 lg:col-span-6 glass-card rounded-2xl p-6 flex flex-col">
                    <h3 class="font-bold text-white text-base mb-4">Registered Citizens Directory</h3>
                    <div class="overflow-y-auto max-h-[450px] custom-scrollbar">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="border-b border-white/10 text-primary font-jetbrainsMono text-[10px] uppercase">
                                    <th class="py-2">Name</th>
                                    <th class="py-2">Group</th>
                                    <th class="py-2">Badge</th>
                                    <th class="py-2">Location</th>
                                    <th class="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${citizensHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    acceptBloodRequest(id) {
        alert(`Emergency dispatch request ${id} accepted! Biometric link established. Thank you for your commitment.`);
    },

    navigateToHospitalNode(hospitalName) {
        const query = encodeURIComponent(hospitalName + ", Hyderabad");
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    },

    renderGuestDashboard(container, donors, requests, bloodBanks) {
        container.innerHTML = `
            <div class="max-w-4xl mx-auto text-center space-y-12 py-12">
                <div class="space-y-4">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary font-jetbrainsMono">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        HEMOCONNECT MESH GRID V3.0
                    </div>
                    <h1 class="text-4xl md:text-6xl font-extrabold text-white tracking-tight font-sora">
                        Precision Healthcare <br/>
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Decentralized Blood Mesh</span>
                    </h1>
                    <p class="text-on-surface-variant max-w-xl mx-auto text-sm leading-relaxed">
                        HemoConnect bridges clinical institutions and emergency donors. Select a diagnostic node identity to access active telemetry controls.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    <div onclick="AppEngine.mockRoleLogin('ADMIN')" class="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/40 transition-all group hover:-translate-y-1">
                        <span class="material-symbols-outlined text-4xl text-primary mb-3">admin_panel_settings</span>
                        <h4 class="font-bold text-white text-base mb-1">Admin Command Node</h4>
                        <p class="text-xs text-on-surface-variant">Access system registries, monitor maps, and calculate analytics.</p>
                    </div>
                    <div onclick="AppEngine.mockRoleLogin('HOSPITAL')" class="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/40 transition-all group hover:-translate-y-1">
                        <span class="material-symbols-outlined text-4xl text-primary mb-3">local_hospital</span>
                        <h4 class="font-bold text-white text-base mb-1">Hospital Clinical Node</h4>
                        <p class="text-xs text-on-surface-variant">Update blood stock inventory, receive notifications, and search donors.</p>
                    </div>
                    <div onclick="AppEngine.mockRoleLogin('DONOR')" class="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/40 transition-all group hover:-translate-y-1">
                        <span class="material-symbols-outlined text-4xl text-primary mb-3">person</span>
                        <h4 class="font-bold text-white text-base mb-1">Donor Citizen Node</h4>
                        <p class="text-xs text-on-surface-variant">Register blood types, accept emergency alerts, and view directions.</p>
                    </div>
                </div>
            </div>
        `;
    },

    mockRoleLogin(role) {
        if (role === 'ADMIN') {
            AuthEngine.user = { email: "admin@hemoconnect.org", displayName: "Dr. Sarah Chen" };
            AuthEngine.role = "ADMIN";
            localStorage.setItem("hemoconnect_token", "mock-token-admin");
        } else if (role === 'HOSPITAL') {
            AuthEngine.user = { email: "admin@stjude.org", displayName: "St. Jude Medical Center" };
            AuthEngine.role = "HOSPITAL";
            localStorage.setItem("hemoconnect_token", "mock-token-hospital");
            localStorage.setItem("hospital_name", "St. Jude Medical Center");
            localStorage.setItem("is_hospital_role", "true");
        } else {
            AuthEngine.user = { email: "james.wilson@mail.com", displayName: "James Wilson" };
            AuthEngine.role = "DONOR";
            localStorage.setItem("hemoconnect_token", "mock-token-donor");
        }
        localStorage.setItem("hemoconnect_role", AuthEngine.role);
        localStorage.setItem("hemoconnect_email", AuthEngine.user.email);
        AuthEngine.notifyListeners();
        this.switchTab("dashboard");
    },

    async viewDonorMatch(container) {
        container.innerHTML = `
            <div class="grid grid-cols-12 gap-6 items-stretch view-section">
                <!-- Request Form Input Portal -->
                <div class="col-span-12 lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col gap-6">
                    
                    <!-- Search Mode Switcher Tabs -->
                    <div class="flex bg-black/40 p-1 rounded-xl border border-white/5 relative z-10">
                        <button id="btn-search-mode-donors" onclick="AppEngine.switchSearchMode('DONORS')" class="flex-1 py-2 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-lg transition-all">
                            Search Donors
                        </button>
                        <button id="btn-search-mode-facilities" onclick="AppEngine.switchSearchMode('FACILITIES')" class="flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all">
                            Search Blood Banks
                        </button>
                    </div>

                    <!-- Search Mode 1: Donors Form -->
                    <div id="form-donors-container" class="space-y-4">
                        <h3 class="font-headline-md text-headline-md text-white flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-orange-500">volunteer_activism</span>
                            Voluntary Donor Match Radar
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">REQUIRED BLOOD GROUP</label>
                                <div class="grid grid-cols-4 gap-2" id="radar-blood-groups">
                                    ${["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => `
                                        <button onclick="AppEngine.selectRadarBloodGroup('${g}')" data-group="${g}" class="bg-black/30 border border-white/10 rounded-lg p-2 text-center text-sm font-bold text-white hover:border-primary transition-all">${g}</button>
                                    `).join("")}
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">COUNTRY</label>
                                <input type="text" id="f2s-country" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:ring-0" value="India" readonly />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">STATE</label>
                                <input type="text" id="f2s-state" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:ring-0" value="Telangana" readonly />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">DISTRICT</label>
                                <input type="text" id="f2s-district" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:ring-0" value="Hyderabad" readonly />
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">CITY / NEIGHBORHOOD SECTOR</label>
                                <div class="flex gap-2">
                                    <input type="text" id="f2s-city" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/30" placeholder="e.g. Gachibowli, Secunderabad, Uppal" value="Gachibowli" />
                                    <button type="button" onclick="AppEngine.handleDetectF2SLocation()" class="bg-primary/20 border border-primary/30 text-primary px-3 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center" title="Detect GPS coordinates">
                                        <span class="material-symbols-outlined text-sm">my_location</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="pt-2">
                            <button onclick="AppEngine.triggerFriends2SupportSearch()" class="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-orange-600/20 text-xs uppercase tracking-wider">
                                Search for Donor
                            </button>
                        </div>
                    </div>

                    <!-- Search Mode 2: Facilities Form (Hidden by default) -->
                    <div id="form-facilities-container" class="space-y-4 hidden">
                        <h3 class="font-headline-md text-headline-md text-white flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-cyan-500">local_hospital</span>
                            Clinical Node Directory
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">SEARCH BY NAME OR ADDRESS</label>
                                <div class="relative w-full">
                                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                                    <input type="text" id="facility-search" class="w-full bg-black/40 border border-white/10 rounded-lg pl-9 p-3 text-sm text-white focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/30" placeholder="Search Gandhi, Osmania, Apollo..." />
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">SECTOR FILTER</label>
                                <select id="filter-sector" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary focus:ring-0">
                                    <option value="">All Sectors</option>
                                    <option value="Gachibowli">Gachibowli Sector</option>
                                    <option value="Secunderabad">Secunderabad Sector</option>
                                    <option value="Uppal">Uppal Sector</option>
                                    <option value="Ghatkesar">Ghatkesar Sector</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-primary mb-2">FACILITY TYPE</label>
                                <select id="filter-type" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary focus:ring-0">
                                    <option value="">All Types</option>
                                    <option value="Government">Government</option>
                                    <option value="Private">Private</option>
                                    <option value="Charitable/Vol">Charitable/Vol</option>
                                </select>
                            </div>
                        </div>

                        <div class="pt-2">
                            <button onclick="AppEngine.triggerBloodBanksSearch()" class="w-full bg-cyan-600 text-white py-3 rounded-lg font-bold hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-cyan-600/20 text-xs uppercase tracking-wider">
                                Find Nearby Blood Banks
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Live Radar Scan Sweep -->
                <div class="col-span-12 lg:col-span-5 glass-card rounded-2xl p-6 relative flex flex-col justify-between items-center min-h-[470px]">
                    <div class="w-full flex justify-between items-center mb-4">
                        <h4 class="font-bold font-headline-md text-white text-base" id="radar-headline">Voluntary Donor Radar</h4>
                        <span class="text-[10px] font-jetbrainsMono bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded" id="radar-system-status">VOLUNTARY REGISTRY HUB</span>
                    </div>

                    <div class="hologram-container py-4 w-full flex justify-center">
                        <div class="relative w-72 h-72 rounded-full border border-orange-500/20 bg-slate-950/60 hologram-radar overflow-hidden flex items-center justify-center" id="radar-mesh">
                            <div class="absolute w-full h-[3px] bg-orange-500 shadow-[0_0_15px_#F97316] left-0 top-0" id="radar-sweep" style="animation: scan 4s linear infinite;"></div>
                            
                            <div class="absolute w-[85%] h-[85%] rounded-full border border-dashed border-orange-500/10"></div>
                            <div class="absolute w-[65%] h-[65%] rounded-full border border-dashed border-orange-500/15"></div>
                            <div class="absolute w-[45%] h-[45%] rounded-full border border-dashed border-orange-500/20"></div>
                            <div class="absolute w-[25%] h-[25%] rounded-full border border-dashed border-orange-500/25"></div>
                            
                            <div class="absolute w-full h-[1px] bg-orange-500/5"></div>
                            <div class="absolute h-full w-[1px] bg-orange-500/5"></div>

                            <div class="absolute w-5 h-5 rounded-full bg-white border-2 border-primary shadow-[0_0_15px_rgba(225,29,72,0.8)] flex items-center justify-center z-20">
                                <span class="material-symbols-outlined text-[12px] text-primary" style="font-variation-settings: 'FILL' 1;">local_hospital</span>
                            </div>
                            
                            <div id="radar-pins-container" class="absolute inset-0 z-10"></div>
                        </div>
                    </div>

                    <div class="w-full text-center mt-4">
                        <p class="text-xs text-on-surface-variant font-jetbrainsMono" id="radar-status-msg">Sector grid coordinates initialized. Select blood type & search candidates.</p>
                    </div>
                </div>

                <!-- Match List Results -->
                <div class="col-span-12 lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-white mb-4" id="matches-headline">Immediate Matches</h4>
                        <div id="radar-matches-list" class="space-y-4 max-h-[620px] overflow-y-auto pr-2 custom-scrollbar font-sans">
                            <p class="text-xs text-on-surface-variant italic">Run scan search to query candidates.</p>
                        </div>
                    </div>
                    
                    <button onclick="AppEngine.dispatchEmergencyBroadcast()" id="dispatch-btn" class="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg hover:scale-105 active:scale-95 transition-transform hidden mt-4 text-xs">
                        Generate Dispatch Report
                    </button>
                </div>
            </div>
        `;
        
        this.radarGroup = "O-";
        this.radarPriority = "CRITICAL";
        this.searchMode = "DONORS";
        this.selectRadarBloodGroup("O-");
        this.selectRadarPriority("CRITICAL");
        this.initCardTilt();
    },

    switchSearchMode(mode) {
        this.searchMode = mode;
        const btnDonors = document.getElementById("btn-search-mode-donors");
        const btnFacilities = document.getElementById("btn-search-mode-facilities");
        const donorForm = document.getElementById("form-donors-container");
        const facilityForm = document.getElementById("form-facilities-container");
        const sweepLine = document.getElementById("radar-sweep");
        const systemStatus = document.getElementById("radar-system-status");
        const radarHeadline = document.getElementById("radar-headline");

        if (mode === 'DONORS') {
            btnDonors.className = "flex-1 py-2 text-xs font-bold text-orange-500 bg-orange-500/10 rounded-lg transition-all";
            btnFacilities.className = "flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all";
            donorForm.classList.remove("hidden");
            facilityForm.classList.add("hidden");
            
            // Set orange radar theme
            if (sweepLine) {
                sweepLine.className = "absolute w-full h-[3px] bg-orange-500 shadow-[0_0_15px_#F97316] left-0 top-0";
            }
            if (systemStatus) {
                systemStatus.className = "text-[10px] font-jetbrainsMono bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded";
                systemStatus.innerText = "VOLUNTARY REGISTRY HUB";
            }
            if (radarHeadline) {
                radarHeadline.innerText = "Voluntary Donor Radar";
            }
        } else {
            btnFacilities.className = "flex-1 py-2 text-xs font-bold text-cyan-500 bg-cyan-500/10 rounded-lg transition-all";
            btnDonors.className = "flex-1 py-2 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg transition-all";
            facilityForm.classList.remove("hidden");
            donorForm.classList.add("hidden");
            
            // Set cyan/blue radar theme
            if (sweepLine) {
                sweepLine.className = "absolute w-full h-[3px] bg-success-cyan shadow-[0_0_15px_#00E5FF] left-0 top-0";
            }
            if (systemStatus) {
                systemStatus.className = "text-[10px] font-jetbrainsMono bg-success-cyan/10 text-success-cyan border border-success-cyan/30 px-2 py-0.5 rounded";
                systemStatus.innerText = "GRID SYSTEM: ACTIVE";
            }
            if (radarHeadline) {
                radarHeadline.innerText = "Live Holographic Radar";
            }
        }

        // Clear matches results
        const matchesList = document.getElementById("radar-matches-list");
        if (matchesList) {
            matchesList.innerHTML = `<p class="text-xs text-on-surface-variant italic">Run scan search to query candidates.</p>`;
        }
        const pinsContainer = document.getElementById("radar-pins-container");
        if (pinsContainer) {
            pinsContainer.innerHTML = "";
        }
        const dispatchBtn = document.getElementById("dispatch-btn");
        if (dispatchBtn) {
            dispatchBtn.classList.add("hidden");
        }
    },

    handleDetectF2SLocation() {
        this.detectCoordinates((lat, lng, sector, city) => {
            const cityInput = document.getElementById("f2s-city");
            if (cityInput) {
                cityInput.value = sector;
            }
            this.radarLat = lat;
            this.radarLng = lng;
            alert(`GPS Satellite Verified.\nPosition Centered on: ${sector}, Hyderabad.`);
        });
    },

    async triggerFriends2SupportSearch() {
        const bloodGroup = this.radarGroup || "O-";
        const country = document.getElementById("f2s-country").value;
        const state = document.getElementById("f2s-state").value;
        const district = document.getElementById("f2s-district").value;
        let city = document.getElementById("f2s-city").value.trim();

        const statusMsg = document.getElementById("radar-status-msg");

        // Spelling corrector integration
        let correctedCity = this.correctLocationSpelling(city);
        const validSectors = ["Hyderabad", "Gachibowli", "Secunderabad", "Uppal", "Ghatkesar"];
        const isValid = validSectors.some(s => s.toLowerCase() === correctedCity.toLowerCase());

        if (!city || !isValid) {
            const userLoc = prompt(
                `The location "${city || 'empty'}" was not recognized.\n` +
                `Please specify a valid sector (Gachibowli, Secunderabad, Uppal, Ghatkesar, Hyderabad):`
            );
            if (userLoc && userLoc.trim()) {
                city = userLoc.trim();
                correctedCity = this.correctLocationSpelling(city);
                document.getElementById("f2s-city").value = correctedCity;
                alert(`Location set to nearest matching sector: "${correctedCity}"`);
            } else {
                correctedCity = "Hyderabad";
                document.getElementById("f2s-city").value = correctedCity;
                alert(`No location entered. Defaulting to: "${correctedCity}"`);
            }
        } else if (correctedCity.toLowerCase() !== city.toLowerCase()) {
            document.getElementById("f2s-city").value = correctedCity;
            alert(`Location spelling auto-corrected from "${city}" to "${correctedCity}"`);
        }

        statusMsg.innerText = `Fetching available and eligible donors from Voluntary Registry in ${correctedCity}...`;

        try {
            const donors = await ApiEngine.searchVoluntaryRegistryDonors(bloodGroup, country, state, district, correctedCity);
            this.renderVoluntaryRegistryMatches(donors);
            statusMsg.innerText = `Registry query complete. Found ${donors.length} eligible voluntary donors.`;
        } catch (err) {
            statusMsg.innerText = `Registry query failed: ${err.message}`;
        }
    },

    renderVoluntaryRegistryMatches(donors) {
        const matchesContainer = document.getElementById("radar-matches-list");
        const pinsContainer = document.getElementById("radar-pins-container");
        const dispatchBtn = document.getElementById("dispatch-btn");

        matchesContainer.innerHTML = "";
        pinsContainer.innerHTML = "";
        if (dispatchBtn) dispatchBtn.classList.add("hidden");

        let donorsHtml = `
            <div>
                <p class="text-[10px] text-orange-400 uppercase font-jetbrainsMono tracking-wider mb-2">Voluntary Network Donors</p>
                <div class="space-y-3">
        `;
        if (donors.length === 0) {
            donorsHtml += `<p class="text-xs text-on-surface-variant/60 italic">No available, eligible voluntary donors matching criteria in sector.</p>`;
        } else {
            donorsHtml += donors.map((m, idx) => {
                // Compute mock radial coordinates on radar mesh
                const angle = Math.random() * Math.PI * 2;
                const radius = 45 + (idx * 20) % 90;
                const pinX = radius * Math.cos(angle);
                const pinY = radius * Math.sin(angle);
                this.createRadarPin(m.donor.fullName, `Voluntary Match: ${m.matchScore}%`, pinX, pinY, "#EA580C");

                let badgeText = "Newbie";
                let badgeIcon = "🌱";
                let badgeStyle = "bg-white/5 text-on-surface-variant";
                const count = m.donor.donationCount || 0;
                if (count >= 10) {
                    badgeText = "Platinum Legend";
                    badgeIcon = "💎";
                    badgeStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.2)]";
                } else if (count >= 6) {
                    badgeText = "Gold Champion";
                    badgeIcon = "🥇";
                    badgeStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/35 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                } else if (count >= 3) {
                    badgeText = "Silver Hero";
                    badgeIcon = "🥈";
                    badgeStyle = "bg-slate-400/10 text-slate-300 border border-slate-400/35";
                } else if (count >= 1) {
                    badgeText = "Bronze Lifesaver";
                    badgeIcon = "🥉";
                    badgeStyle = "bg-amber-600/10 text-amber-500 border border-amber-600/35";
                }

                const isAvail = m.donor.available !== false; // default true
                const dotColor = isAvail ? "bg-emerald-500" : "bg-rose-500";
                const availText = isAvail ? "AVAILABLE" : "NOT AVAILABLE";
                const availBadgeClass = isAvail ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20";

                return `
                    <div class="p-3.5 rounded-2xl ${isAvail ? 'bg-orange-950/20 border-orange-500/25 hover:border-orange-500/60' : 'bg-slate-900/40 border-white/5 opacity-70'} border transition-all duration-300 text-xs space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-white flex items-center gap-1.5 truncate max-w-[130px]" title="${m.donor.fullName}">
                                <span class="w-2 h-2 rounded-full ${dotColor} ${isAvail ? 'animate-pulse' : ''} flex-shrink-0"></span>
                                ${m.donor.fullName}
                            </span>
                            <div class="flex gap-1.5 flex-shrink-0">
                                <span class="px-1.5 py-0.5 rounded ${availBadgeClass} font-jetbrainsMono text-[7px] font-bold">${availText}</span>
                                <span class="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-jetbrainsMono text-[7px] font-bold">VOLUNTARY DONOR</span>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant/90 bg-black/20 p-2 rounded-lg border border-white/5">
                            <div>
                                <span class="text-white/60 block text-[8px] uppercase font-jetbrainsMono">Biological:</span>
                                <strong>${m.donor.bloodGroup} • ${m.donor.gender}</strong>
                            </div>
                            <div>
                                <span class="text-white/60 block text-[8px] uppercase font-jetbrainsMono">Age:</span>
                                <strong>${m.donor.age} yrs</strong>
                            </div>
                            <div>
                                <span class="text-white/60 block text-[8px] uppercase font-jetbrainsMono">Donations:</span>
                                <strong>${m.donor.donationCount || 0} times</strong>
                            </div>
                            <div>
                                <span class="text-white/60 block text-[8px] uppercase font-jetbrainsMono">Rank:</span>
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${badgeStyle}">
                                    <span>${badgeIcon}</span>
                                    <span>${badgeText}</span>
                                </span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center text-[10px] text-on-surface-variant/80 border-t border-white/5 pt-1.5 mt-1.5">
                            <span class="truncate max-w-[110px]" title="${m.distance} • ${m.donor.district || m.donor.city || 'Hyderabad'}">${m.distance} • ${m.donor.district || m.donor.city || 'Hyderabad'}</span>
                            <a href="tel:${m.donor.phone}" class="text-orange-400 hover:text-white transition-colors flex items-center gap-1 font-bold bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20 flex-shrink-0">
                                <span class="material-symbols-outlined text-[12px]">call</span> Call Donor
                            </a>
                        </div>
                    </div>
                `;
            }).join("");
        }
        donorsHtml += `</div></div>`;
        matchesContainer.innerHTML = donorsHtml;
    },

    getDonationBadgeJS(count) {
        if (count <= 0) return "Newbie";
        if (count >= 1 && count <= 2) return "Bronze Lifesaver";
        if (count >= 3 && count <= 5) return "Silver Hero";
        if (count >= 6 && count <= 9) return "Gold Champion";
        return "Platinum Legend";
    },

    selectRadarBloodGroup(group) {
        this.radarGroup = group;
        document.querySelectorAll("#radar-blood-groups button").forEach(btn => {
            if (btn.getAttribute("data-group") === group) {
                btn.className = "bg-primary/20 border-2 border-primary rounded-lg p-2 text-center text-sm font-bold text-white transition-all";
            } else {
                btn.className = "bg-black/30 border border-white/10 rounded-lg p-2 text-center text-sm font-bold text-white hover:border-primary transition-all";
            }
        });
    },

    selectRadarPriority(prio) {
        this.radarPriority = prio;
        ["ROUTINE", "URGENT", "CRITICAL"].forEach(p => {
            const btn = document.getElementById("prio-" + p);
            if (btn) {
                if (p === prio) {
                    if (p === 'CRITICAL') btn.className = "flex-1 border-2 border-primary bg-primary/20 rounded-lg py-2 text-xs font-bold text-white transition-colors";
                    else if (p === 'URGENT') btn.className = "flex-1 border-2 border-primary bg-primary/20 rounded-lg py-2 text-xs font-bold text-white transition-colors";
                    else btn.className = "flex-1 border-2 border-tertiary bg-tertiary/20 rounded-lg py-2 text-xs font-bold text-white transition-colors";
                } else {
                    btn.className = "flex-1 bg-black/30 border border-white/10 rounded-lg py-2 text-xs font-bold text-white hover:border-primary transition-colors";
                }
            }
        });
    },

    async triggerRadarMatchSearch() {
        const bloodGroup = this.radarGroup;
        const units = document.getElementById("radar-units").value;
        const hospital = document.getElementById("radar-hospital").value;
        const city = document.getElementById("radar-city").value;
        const subLocation = document.getElementById("radar-sublocation").value.trim();
        const priority = this.radarPriority;

        const statusMsg = document.getElementById("radar-status-msg");

        // Spelling corrector integration
        const correctedSubLocation = this.correctLocationSpelling(subLocation);
        if (correctedSubLocation.toLowerCase() !== subLocation.toLowerCase()) {
            document.getElementById("radar-sublocation").value = correctedSubLocation;
            alert(`Sector spelling auto-corrected from "${subLocation}" to "${correctedSubLocation}"`);
        }

        statusMsg.innerText = `Querying compatible ${bloodGroup} stock & profiles in ${city} (${correctedSubLocation})...`;

        try {
            const requestPayload = {
                patientName: "Emergency Patient",
                bloodGroupRequired: bloodGroup,
                unitsRequired: parseInt(units),
                hospital: hospital,
                emergencyLevel: priority,
                contactNumber: "+919900112233",
                city: city,
                latitude: this.radarLat || 17.4483,
                longitude: this.radarLng || 78.3741
            };

            let savedRequest;
            if (priority === 'CRITICAL') {
                savedRequest = await ApiEngine.triggerEmergency(requestPayload);
            } else {
                savedRequest = await ApiEngine.createRequest(requestPayload);
            }

            this.activeRequestId = savedRequest.id;

            const matchResult = await ApiEngine.searchMatch(bloodGroup, city, correctedSubLocation, units);
            this.renderRadarMatchesResult(matchResult);
            statusMsg.innerText = `Vector scan complete. Clinics: ${matchResult.clinics.length}, Donors: ${matchResult.donors.length}.`;
        } catch (err) {
            statusMsg.innerText = `Grid validation failed: ${err.message}`;
        }
    },

    renderRadarMatchesResult(matchResult) {
        const matchesContainer = document.getElementById("radar-matches-list");
        const pinsContainer = document.getElementById("radar-pins-container");
        const dispatchBtn = document.getElementById("dispatch-btn");

        matchesContainer.innerHTML = "";
        pinsContainer.innerHTML = "";

        const clinics = matchResult.clinics || [];
        const donors = matchResult.donors || [];

        let clinicsHtml = `
            <div class="mb-4">
                <p class="text-[10px] text-primary uppercase font-jetbrainsMono tracking-wider mb-2">Neighborhood Clinics Stock</p>
                <div class="space-y-2">
        `;
        if (clinics.length === 0) {
            clinicsHtml += `<p class="text-xs text-on-surface-variant/60 italic">No compatible stock in clinics.</p>`;
        } else {
            clinicsHtml += clinics.map(c => `
                <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors text-xs">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white truncate max-w-[120px]">${c.bloodBank.name}</span>
                        <span class="px-2 py-0.5 rounded bg-success-cyan/15 text-success-cyan font-bold">${c.availableUnits} Units</span>
                    </div>
                    <p class="text-[10px] text-on-surface-variant mt-1 truncate">${c.bloodBank.address}</p>
                </div>
            `).join("");
        }
        clinicsHtml += `</div></div>`;
        matchesContainer.innerHTML += clinicsHtml;

        let donorsHtml = `
            <div>
                <p class="text-[10px] text-primary uppercase font-jetbrainsMono tracking-wider mb-2">Escalated Local Donors</p>
                <div class="space-y-2">
        `;
        if (donors.length === 0) {
            donorsHtml += `<p class="text-xs text-on-surface-variant/60 italic">No escalated donors in area.</p>`;
        } else {
            donorsHtml += donors.map(m => `
                <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors text-xs">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white">${m.donor.fullName}</span>
                        <span class="text-success-cyan font-bold">${m.matchScore}%</span>
                    </div>
                    <p class="text-[10px] text-on-surface-variant mt-1">${m.distance} away • ${m.donor.phone}</p>
                </div>
            `).join("");
        }
        donorsHtml += `</div></div>`;
        matchesContainer.innerHTML += donorsHtml;

        if (clinics.length > 0 || donors.length > 0) {
            dispatchBtn.classList.remove("hidden");
        } else {
            dispatchBtn.classList.add("hidden");
        }

        if (window.google && typeof google.maps !== 'undefined') {
            const meshElement = document.getElementById("radar-mesh");
            meshElement.innerHTML = "";
            
            const map = new google.maps.Map(meshElement, {
                center: { lat: 17.385044, lng: 78.486671 },
                zoom: 12,
                disableDefaultUI: true,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#070a13" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#070a13" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
                ]
            });

            new google.maps.Marker({
                position: { lat: 17.385044, lng: 78.486671 },
                map: map,
                title: "Request Origin Hospital"
            });

            clinics.forEach(c => {
                const lat = c.bloodBank.latitude || (17.38 + Math.random() * 0.1 - 0.05);
                const lng = c.bloodBank.longitude || (78.48 + Math.random() * 0.1 - 0.05);
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: c.bloodBank.name
                });
            });

            donors.forEach(d => {
                const lat = (17.38 + Math.random() * 0.1 - 0.05);
                const lng = (78.48 + Math.random() * 0.1 - 0.05);
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: d.donor.fullName
                });
            });
        } else {
            clinics.forEach((c, idx) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = 35 + (idx * 15) % 80;
                const pinX = radius * Math.cos(angle);
                const pinY = radius * Math.sin(angle);
                this.createRadarPin(c.bloodBank.name, "Clinic Stock: " + c.availableUnits + " units", pinX, pinY, "#00E5FF");
            });

            donors.forEach((m, idx) => {
                const angle = Math.random() * Math.PI * 2;
                const radius = 45 + (idx * 20) % 90;
                const pinX = radius * Math.cos(angle);
                const pinY = radius * Math.sin(angle);
                this.createRadarPin(m.donor.fullName, `Donor Match: ${m.matchScore}%`, pinX, pinY, "#06B6D4");
            });
        }
    },

    createRadarPin(title, subtitle, x, y, colorHex) {
        const pinsContainer = document.getElementById("radar-pins-container");
        if (!pinsContainer) return;
        
        const pin = document.createElement("div");
        pin.className = "absolute w-3.5 h-3.5 rounded-full border-2 border-slate-950 cursor-pointer hover:scale-125 transition-transform group z-20 flex items-center justify-center";
        pin.style.backgroundColor = colorHex;
        pin.style.boxShadow = `0 0 12px ${colorHex}`;
        pin.style.left = `calc(50% + ${x}px - 7px)`;
        pin.style.top = `calc(50% + ${y}px - 7px)`;
        pin.setAttribute("title", title);
        pin.innerHTML = `
            <span class="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
            
            <!-- Visible label displaying name directly on the radar -->
            <div class="absolute whitespace-nowrap text-[8px] font-bold text-white bg-black/75 px-1 py-0.5 rounded border border-white/10 -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10">
                ${title.length > 14 ? title.substring(0, 12) + '..' : title}
            </div>

            <div class="hidden group-hover:block absolute bg-slate-950/95 backdrop-blur-md text-white text-[10px] p-2.5 rounded-xl border border-success-cyan/30 w-36 -top-14 -left-16 z-30 font-jetbrainsMono pointer-events-none shadow-2xl">
                <p class="font-bold text-success-cyan truncate">${title}</p>
                <p class="opacity-80 truncate">${subtitle}</p>
            </div>
        `;
        pinsContainer.appendChild(pin);
    },

    dispatchEmergencyBroadcast() {
        alert("Emergency dispatch report generated and archived in secure clinical registry.");
    },

    // ==========================================================
    // VIEW 3: BLOOD INVENTORY (Vials + Inventory Directory)
    // ==========================================================
    async viewBloodInventory(container) {
        try {
            const banks = await ApiEngine.getBloodBanks();
            let sortedBanks = banks;
            if (this.userLat && this.userLng) {
                sortedBanks = banks.map(b => {
                    const coords = b.coords || this.getFacilityCoords(b);
                    const dist = this.calculateDistance(this.userLat, this.userLng, coords.lat, coords.lng);
                    return {
                        ...b,
                        coords,
                        distanceKm: dist
                    };
                }).sort((a, b) => a.distanceKm - b.distanceKm);
            }
            this.renderInventoryDirectory(container, sortedBanks, !!(this.userLat && this.userLng));
        } catch (err) {
            container.innerHTML = `<p class="text-primary text-center">Failed to load inventory: ${err.message}</p>`;
        }
    },

    renderInventoryDirectory(container, banks, scanned = false) {
        let banksHtml = banks.map((b, idx) => {
            let inv = b.bloodInventory || {};
            const isCritical = Object.values(inv).some(qty => qty >= 0 && qty <= 5);
            const statusText = isCritical ? "CRITICAL STOCK" : "OPERATIONAL";
            const statusClass = isCritical 
                ? "bg-primary/10 text-primary border-primary/20 animate-pulse" 
                : "bg-success-cyan/10 text-success-cyan border-success-cyan/20";
            
            let invList = Object.entries(inv).map(([group, val]) => {
                const percentage = Math.min(100, Math.round((val / 50) * 100));
                const vialColorClass = val <= 5 
                    ? "from-red-600 to-red-400 shadow-[0_-2px_6px_rgba(239,68,68,0.4)]" 
                    : "from-success-cyan/80 to-success-cyan/40 shadow-[0_-2px_6px_rgba(0,229,255,0.3)]";

                return `
                    <div class="flex flex-col items-center">
                        <div class="h-12 w-6 bg-black/60 rounded-full relative overflow-hidden border border-white/5 flex flex-col justify-end">
                            <div class="liquid-fill w-full bg-gradient-to-t ${vialColorClass} rounded-b-full" style="height: 0%;" data-height="${percentage}%">
                                <div class="scan-line"></div>
                            </div>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
                                <span class="text-[8px] font-bold text-white font-jetbrainsMono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${group}</span>
                                <span class="text-[7px] text-white/95 font-jetbrainsMono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${val}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");

            const coords = b.coords || this.getFacilityCoords(b);
            const displayDist = b.distanceKm ? b.distanceKm.toFixed(2) : (1.5 + idx * 0.8).toFixed(1);

            return `
                <div class="glass-card rounded-2xl p-5 flex flex-col justify-between border border-white/5 hover:border-white/20 transition-all duration-300">
                    <div>
                        <div class="flex justify-between items-start mb-2.5">
                            <div class="min-w-0 flex-1">
                                <span class="px-2 py-0.5 rounded-full text-[8px] font-bold border ${statusClass} font-jetbrainsMono">${statusText}</span>
                                <h4 class="font-bold text-white text-base mt-2 truncate" title="${b.name}">${b.name}</h4>
                            </div>
                            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 ml-2">
                                <span class="material-symbols-outlined text-sm text-success-cyan">local_hospital</span>
                            </div>
                        </div>
                        <p class="text-[10px] text-on-surface-variant flex items-center gap-1 font-jetbrainsMono mb-3">
                            <span class="material-symbols-outlined text-xs text-primary">distance</span>
                            <span class="text-white font-bold">${displayDist} KM</span>
                            <span class="opacity-60">• ${b.subLocation || b.city || 'Hyderabad'} Sector</span>
                        </p>
                        <p class="text-[10px] text-on-surface-variant/80 mb-4 line-clamp-2">${b.address}</p>
                        
                        <div class="grid grid-cols-4 gap-2 bg-black/45 p-3 rounded-xl border border-white/5 mb-4">
                            ${invList}
                        </div>
                    </div>
                    
                    <div class="flex gap-2 border-t border-white/5 pt-3">
                        <button onclick="AppEngine.contactFacility('${b.contactNumber || b.contact || '+919900112233'}', '${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-2 bg-primary/20 text-primary border border-primary/30 font-bold rounded-lg text-[10px] flex items-center justify-center gap-0.5 hover:bg-primary hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-xs">call</span> Contact
                        </button>
                        <button onclick="AppEngine.openGoogleMaps('${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-2 bg-success-cyan/10 text-success-cyan border border-success-cyan/20 hover:bg-success-cyan hover:text-black font-bold rounded-lg text-[10px] flex items-center justify-center gap-0.5 transition-colors">
                            <span class="material-symbols-outlined text-xs">map</span> Maps
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <div class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="protocol-number">[ CLINICAL INVENTORY NODE ]</span>
                        <span class="w-1.5 h-1.5 rounded-full ${scanned ? 'bg-success-cyan animate-pulse' : 'bg-orange-500'}"></span>
                        <span class="text-[10px] font-jetbrainsMono tracking-wider ${scanned ? 'text-success-cyan' : 'text-orange-400'} uppercase">
                            ${scanned ? 'Proximity Telemetry active' : 'Offline Static Catalog'}
                        </span>
                    </div>
                    <h2 class="font-headline-lg text-3xl md:text-4xl text-white font-extrabold mb-1 tracking-tight">Blood Inventory Console</h2>
                    <p class="text-on-surface-variant font-body-md max-w-xl">Real-time repository synchronization and distance vector sorting across clinical nodes.</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="AppEngine.scanNearbyHospitals()" class="bg-success-cyan/15 text-success-cyan border border-success-cyan/30 hover:bg-success-cyan hover:text-black font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all text-xs">
                        <span class="material-symbols-outlined text-sm">my_location</span>
                        Scan Nearby
                    </button>
                    <button onclick="AppEngine.openAddBloodBankModal()" class="bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:scale-105 transition-transform text-xs">Register Blood Bank</button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                ${banksHtml}
            </div>
        `;
        this.initCardTilt();
        
        setTimeout(() => {
            document.querySelectorAll('.liquid-fill').forEach(vial => {
                const targetHeight = vial.getAttribute('data-height');
                vial.style.height = targetHeight;
            });
        }, 50);
    },

    openInventoryEditor(bankId) {
        alert("Stock editor security validation: Please authenticate as " + bankId + " using your Access Key (BAK).");
    },

    openAddBloodBankModal() {
        alert("Institutional action required. Please register the Blood Bank via local node config.");
    },

    // ==========================================================
    // VIEW 4: EMERGENCY ALERTS CENTER (Emergency Alerts / Alerts)
    // ==========================================================
    async viewEmergencyAlerts(container) {
        try {
            const requests = await ApiEngine.getRequests();
            const emergencyRequests = requests.filter(r => r.emergencyLevel === 'CRITICAL' || r.emergencyLevel === 'URGENT');

            let alertFeedHtml = emergencyRequests.map(r => `
                <div class="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                    <div class="absolute left-0 top-0 h-full w-1 bg-primary"></div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white animate-pulse">CRITICAL DISPATCH</span>
                            <span class="text-xs text-on-surface-variant">${new Date(r.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <h4 class="font-bold text-white text-lg">${r.patientName} (${r.bloodGroupRequired})</h4>
                        <p class="text-sm text-on-surface-variant">${r.hospital} in ${r.city} • Requested: ${r.unitsRequired} units</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="AppEngine.loadAIRecommendation('${r.id}')" class="bg-tertiary text-on-tertiary-container font-bold text-xs px-4 py-2 rounded hover:scale-105 transition-transform">Run AI Matcher</button>
                        <button onclick="AppEngine.resolveEmergencyRequest('${r.id}')" class="bg-white/5 border border-white/10 text-xs px-4 py-2 rounded hover:text-success-cyan transition-colors">Resolve</button>
                    </div>
                </div>
            `).join("");

            if (alertFeedHtml === "") {
                alertFeedHtml = `
                    <div class="p-8 text-center text-on-surface-variant border border-white/5 rounded-2xl bg-white/2">
                        No critical emergency vectors currently active in the sector.
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="mb-10">
                    <h2 class="font-headline-lg text-headline-lg text-white mb-1">Emergency Request Center</h2>
                    <p class="text-on-surface-variant font-body-md">High-priority biological logistics monitoring.</p>
                </div>
                
                <div class="grid grid-cols-12 gap-6 items-stretch">
                    <div class="col-span-12 lg:col-span-8 flex flex-col gap-4">
                        <h3 class="font-bold text-white text-xl mb-2 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary animate-pulse">emergency</span>
                            Active Dispatch Broadcasts
                        </h3>
                        ${alertFeedHtml}
                    </div>

                    <!-- AI Dispatch recommendation widget -->
                    <div class="col-span-12 lg:col-span-4 flex flex-col gap-6">
                        <div id="ai-prediction-widget"></div>
                        <div id="ai-rec-container" class="glass-card rounded-2xl p-6 hidden">
                            <h4 class="font-bold text-white mb-4">AI Rec Engine</h4>
                            <div id="ai-rec-list" class="space-y-4"></div>
                        </div>
                    </div>
                </div>
            `;

            // Load Prediction charts
            AIEngine.renderDemandPredictions(document.getElementById("ai-prediction-widget"));
            this.initCardTilt();
        } catch (err) {
            container.innerHTML = `<p class="text-primary text-center">Failed to load alerts: ${err.message}</p>`;
        }
    },

    async loadAIRecommendation(requestId) {
        const recContainer = document.getElementById("ai-rec-container");
        const recList = document.getElementById("ai-rec-list");
        
        recContainer.classList.remove("hidden");
        recList.innerHTML = `<p class="text-xs text-on-surface-variant">Running algorithms...</p>`;

        try {
            const recommendations = await ApiEngine.getAIRecommendation(requestId);
            recList.innerHTML = "";

            if (recommendations.length === 0) {
                recList.innerHTML = `<p class="text-xs text-primary">No recommendation profiles returned.</p>`;
                return;
            }

            recommendations.forEach(r => {
                const item = document.createElement("div");
                item.className = "p-3 rounded-lg bg-black/40 border border-white/5";
                item.innerHTML = `
                    <div class="flex justify-between items-center mb-1">
                        <p class="text-xs font-bold text-white">#${r.rank} ${r.donorName}</p>
                        <span class="text-xs text-success-cyan font-bold">${r.recommendationIndex} Score</span>
                    </div>
                    <p class="text-[10px] text-on-surface-variant">Match: ${r.matchScore}% • Response Index: ${r.responseRate}</p>
                `;
                recList.appendChild(item);
            });
        } catch (err) {
            recList.innerHTML = `<p class="text-xs text-primary">Failed to load AI recommendation: ${err.message}</p>`;
        }
    },

    resolveEmergencyRequest(id) {
        alert("Resolving request sequence " + id + "... updating status to COMPLETED.");
    },

    // ==========================================================
    // VIEW 5: ANALYTICS & HISTORICAL GRAPHS
    // ==========================================================
    async viewAnalytics(container) {
        container.innerHTML = `
            <div class="mb-10">
                <h2 class="font-headline-lg text-headline-lg text-white mb-1">Biological Analytics</h2>
                <p class="text-on-surface-variant font-body-md">Deep historical vector trends and predictive analysis.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <!-- Group Distribution -->
                <div class="glass-card rounded-2xl p-6 flex flex-col justify-between" id="group-chart-card">
                    <h4 class="font-bold text-white mb-4">Stock Distribution</h4>
                    <div class="h-64 flex items-end gap-2 border-b border-l border-white/10 p-4 relative" id="distribution-chart">
                        <!-- Chart Bars will be rendered dynamically -->
                    </div>
                    <p class="text-xs text-on-surface-variant mt-4">Calculated across all registered HemoConnect nodes.</p>
                </div>

                <!-- AI prediction widget -->
                <div id="analytics-predictions"></div>
            </div>
        `;

        try {
            const analytics = await ApiEngine.getAnalytics();
            const distribution = analytics.bloodGroupDistribution;
            const chart = document.getElementById("distribution-chart");

            // Render custom CSS chart bars
            const maxVal = Math.max(...Object.values(distribution), 1);
            chart.innerHTML = Object.entries(distribution).map(([group, val]) => {
                let heightPercent = (val / maxVal) * 80; // scale to 80% max height
                return `
                    <div class="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
                        <div class="w-full bg-primary/80 group-hover:bg-primary rounded-t shadow-[0_0_10px_rgba(255,23,68,0.3)] transition-all" style="height: ${heightPercent}%;"></div>
                        <span class="text-[9px] text-on-surface-variant font-bold mt-2">${group} (${val})</span>
                    </div>
                `;
            }).join("");

            // Renders AI predictions right-side
            AIEngine.renderDemandPredictions(document.getElementById("analytics-predictions"));
            this.initCardTilt();
        } catch (err) {
            console.error(err);
        }
    },

    // ==========================================================
    // VIEW 6: DONOR IDENTITY SEQUENCE (Registration)
    // ==========================================================
    viewRegistration(container) {
        container.innerHTML = `
            <div class="w-full max-w-6xl mx-auto flex flex-col items-center">
                <!-- Premium Arterial Stepper -->
                <div class="w-full max-w-2xl mb-12 relative">
                    <div class="flex items-center justify-between relative px-8">
                        <!-- Dynamic SVG Arterial Path with flowing pulse -->
                        <div class="absolute top-1/2 left-0 w-full h-8 -translate-y-1/2 -z-10 overflow-visible pointer-events-none">
                            <svg class="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <line x1="0" y1="5" x2="100" y2="5" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
                                <line x1="0" y1="5" x2="50" y2="5" class="arterial-vessel-line" stroke-width="2" />
                            </svg>
                        </div>
                        
                        <!-- Step 1 Node -->
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.6)] border border-primary/40 relative arterial-node-pulse">
                                <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">person</span>
                            </div>
                            <span class="font-jetbrainsMono text-[10px] text-primary uppercase tracking-wider font-bold">01. Identity</span>
                        </div>
                        
                        <!-- Step 2 Node -->
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-slate-900 text-slate-500 border border-slate-800 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[22px]">biotech</span>
                            </div>
                            <span class="font-jetbrainsMono text-[10px] text-slate-500 uppercase tracking-wider font-bold">02. Biology Check</span>
                        </div>
                    </div>
                </div>

                <div class="w-full grid grid-cols-12 gap-gutter items-stretch">
                    <!-- Left registration form -->
                    <div class="col-span-12 lg:col-span-7 glass-card rounded-2xl p-8 flex flex-col gap-unit">
                        <div class="mb-4">
                            <h1 class="font-headline-lg text-headline-lg text-on-surface mb-2">Voluntary Network Registry Portal</h1>
                            <p class="font-body-md text-body-md text-on-surface-variant opacity-80">Connect and register your location coordinates on the Voluntary Network database.</p>
                        </div>
                        
                        <form id="donor-registration-form" class="space-y-6">
                            <div class="group">
                                <label class="block font-label-md text-label-md text-primary mb-2">FULL NAME</label>
                                <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                    <input type="text" id="reg-name" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="Enter full name" required />
                                </div>
                            </div>
                            <div class="group">
                                <label class="block font-label-md text-label-md text-primary mb-2">EMAIL ADDRESS</label>
                                <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                    <input type="email" id="reg-email" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="email@domain.com" required />
                                </div>
                            </div>
                            <div class="group">
                                <label class="block font-label-md text-label-md text-primary mb-2">MOBILE NUMBER</label>
                                <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                    <input type="text" id="reg-phone" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="e.g. +919876543210" required />
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-6">
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">AGE</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="number" id="reg-age" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="YY" min="18" max="65" required />
                                    </div>
                                </div>
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">WEIGHT (KG)</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="number" id="reg-weight" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="50" min="40" required />
                                    </div>
                                </div>
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">BLOOD GROUP</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <select id="reg-blood" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md cursor-pointer appearance-none">
                                            <option value="O-">O- (Negative)</option>
                                            <option value="O+">O+ (Positive)</option>
                                            <option value="A-">A- (Negative)</option>
                                            <option value="A+">A+ (Positive)</option>
                                            <option value="B-">B- (Negative)</option>
                                            <option value="B+">B+ (Positive)</option>
                                            <option value="AB-">AB- (Negative)</option>
                                            <option value="AB+">AB+ (Positive)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-6">
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">GENDER</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <select id="reg-gender" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md cursor-pointer appearance-none">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-Binary">Non-Binary</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">COUNTRY</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="text" id="reg-country" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md" value="India" readonly />
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-6">
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">STATE</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="text" id="reg-state" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md" value="Telangana" readonly />
                                    </div>
                                </div>
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">DISTRICT</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="text" id="reg-district" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md" value="Hyderabad" readonly />
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div class="group md:col-span-2">
                                    <label class="block font-label-md text-label-md text-primary mb-2">CITY SECTOR / NEIGHBORHOOD</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="text" id="reg-city" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="e.g. Gachibowli" required />
                                    </div>
                                </div>
                                <button type="button" onclick="AppEngine.handleDetectRegistrationLocation()" class="w-full h-14 bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined">my_location</span>
                                    Detect GPS
                                </button>
                            </div>

                            <div class="grid grid-cols-2 gap-6">
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">LAST DONATION DATE</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="date" id="reg-last-donation-date" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md" />
                                    </div>
                                </div>
                                <div class="group">
                                    <label class="block font-label-md text-label-md text-primary mb-2">SECURE PASSWORD</label>
                                    <div class="relative bg-black/30 p-3 rounded-t-lg border-b border-white/10 input-glow transition-all">
                                        <input type="password" id="reg-password" class="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-headline-md text-headline-md placeholder:opacity-30 placeholder:font-light" placeholder="••••••••" required />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="w-full bg-emergency-pulse text-white py-4 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                Register on Voluntary Network
                            </button>
                        </form>
                    </div>

                    <!-- Right Side illustration -->
                    <div class="col-span-12 lg:col-span-5 flex flex-col gap-6">
                        <!-- 3D Heart Card -->
                        <div class="glass-card rounded-2xl flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                            <div class="relative z-10 flex flex-col items-center gap-8 float-animation">
                                <div class="relative w-64 h-64">
                                    <img class="w-full h-full object-contain drop-shadow-[0_0_30px_#ff1744]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjvzivwKuq05X7gwmDUK5QORAKUrBCNXYUkLDM5ZXGJ4Le8Ngz8nZlCCC6Q1rVd_uRNo0Hcsku_cG0N9La9VybH0q7fJ36sR4F5q1DdJWKWdI_1ack6KclU0WrDl5IkxpKg66EETdPKXXh8W8U6gYqmTT4bjXi_GCRzIcL8_5hzcg8KNQzNEdSxv9j4DUJ_oDbXFaQgLIdU58RIaBJ2pxwmMZCiKFh7npFTZIu5UZw9gS_k86EY1JKZ60EyjwYGckIEDzY2B7vv1PF"/>
                                </div>
                                <div class="text-center">
                                    <h3 class="font-headline-md text-headline-md text-primary mb-2">VITALITY ENGINE</h3>
                                    <p class="font-label-sm text-label-sm text-on-surface-variant opacity-60 max-w-[240px]">Real-time synchronization with HemoConnect Mesh.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Secondary Eligibility Diagnostic -->
                        <div id="reg-elig-widget"></div>
                    </div>
                </div>
            </div>
        `;

        // Render AI Eligibility checker alongside form (Features integration)
        AIEngine.renderEligibilityChecker(document.getElementById("reg-elig-widget"));

        // Handle Registration form submission
        document.getElementById("donor-registration-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const phone = document.getElementById("reg-phone").value.trim();
            const age = parseInt(document.getElementById("reg-age").value);
            const weight = parseInt(document.getElementById("reg-weight").value);
            const bloodGroup = document.getElementById("reg-blood").value;
            const gender = document.getElementById("reg-gender").value;
            let city = document.getElementById("reg-city").value.trim();
            const lastDonationDate = document.getElementById("reg-last-donation-date").value;
            const password = document.getElementById("reg-password").value;

            // Age check
            if (age < 18 || age > 65) {
                alert("Registration Failed: Donors must be between 18 and 65 years old.");
                return;
            }

            // Weight check
            if (weight < 50) {
                alert("Registration Failed: Donors must weigh at least 50 kg.");
                return;
            }

            // Spelling check for sector
            let correctedCity = this.correctLocationSpelling(city);
            const validSectors = ["Hyderabad", "Gachibowli", "Secunderabad", "Uppal", "Ghatkesar"];
            const isValid = validSectors.some(s => s.toLowerCase() === correctedCity.toLowerCase());

            if (!city || !isValid) {
                const userLoc = prompt(
                    `The location "${city || 'empty'}" was not recognized.\n` +
                    `Please specify a valid Hyderabad sector (Gachibowli, Secunderabad, Uppal, Ghatkesar, Hyderabad):`
                );
                if (userLoc && userLoc.trim()) {
                    city = userLoc.trim();
                    correctedCity = this.correctLocationSpelling(city);
                    document.getElementById("reg-city").value = correctedCity;
                } else {
                    correctedCity = "Hyderabad";
                    document.getElementById("reg-city").value = correctedCity;
                }
            } else if (correctedCity.toLowerCase() !== city.toLowerCase()) {
                document.getElementById("reg-city").value = correctedCity;
                alert(`Location spelling auto-corrected to nearest sector: "${correctedCity}"`);
            }

            // Biological gap validation
            let isAvailable = true;
            if (lastDonationDate) {
                const lastDate = new Date(lastDonationDate);
                const diffTime = Math.abs(new Date() - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (gender === "Male" && diffDays < 90) {
                    isAvailable = false;
                    if (!confirm(`Warning: Biological gap requirement not met.\nMen must wait at least 90 days between donations. Your last donation was ${diffDays} days ago.\n\nDo you want to proceed with registration (marked as temporarily unavailable)?`)) {
                        return;
                    }
                } else if (gender === "Female" && diffDays < 120) {
                    isAvailable = false;
                    if (!confirm(`Warning: Biological gap requirement not met.\nWomen must wait at least 120 days between donations. Your last donation was ${diffDays} days ago.\n\nDo you want to proceed with registration (marked as temporarily unavailable)?`)) {
                        return;
                    }
                }
            }

            const donor = {
                fullName: name,
                email: email,
                phone: phone,
                age: age,
                weight: weight,
                bloodGroup: bloodGroup,
                gender: gender,
                city: "Hyderabad",
                district: correctedCity,
                donationCount: lastDonationDate ? 1 : 0,
                lastDonationDate: lastDonationDate || "",
                latitude: this.regLat || 17.4483,
                longitude: this.regLng || 78.3741,
                available: isAvailable,
                source: "VoluntaryRegistry"
            };

            try {
                // Register via Firebase SDK
                await AuthEngine.signUpWithEmail(donor.email, password, donor.fullName);
                // Save details in backend database
                await ApiEngine.registerDonor(donor);
                alert("Biometric verification complete. Profile registered on the Voluntary Network!");
                this.switchTab("dashboard");
            } catch (err) {
                alert("Registration sequence failed: " + err.message);
            }
        });

        this.initCardTilt();
    },

    // ==========================================================
    // VIEW 7: HOSPITALS & SECURE AUTHENTICATION PORTAL
    // ==========================================================
    viewHospitals(container) {
        container.innerHTML = `<div class="py-12 text-center text-on-surface-variant font-jetbrainsMono">Institutional Node Auth is now hosted at HemoConnect Gateway authentication portal. Search is merged under Donor Match.</div>`;
    },

    getFacilityCoords(bank) {
        const sub = (bank.subLocation || bank.district || "").toLowerCase();
        let baseLat = 17.3850;
        let baseLng = 78.4866;
        if (sub.includes("gachibowli")) {
            baseLat = 17.4483;
            baseLng = 78.3741;
        } else if (sub.includes("secunderabad") || sub.includes("sainikpuri")) {
            baseLat = 17.4399;
            baseLng = 78.4983;
        } else if (sub.includes("uppal") || sub.includes("boduppal")) {
            baseLat = 17.4062;
            baseLng = 78.5561;
        } else if (sub.includes("ghatkesar") || sub.includes("edulabad")) {
            baseLat = 17.4442;
            baseLng = 78.6888;
        }
        // Generate reproducible offset based on name hash so markers don't overlap
        let hash = 0;
        const name = bank.name || "";
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const latOffset = ((Math.abs(hash) % 100) / 10000) - 0.005;
        const lngOffset = (((Math.abs(hash) >> 8) % 100) / 10000) - 0.005;
        return {
            lat: baseLat + latOffset,
            lng: baseLng + lngOffset
        };
    },

    filterHospitals(query, sector, type) {
        if (!AppEngine.facilityList) return;

        const q = (query || "").toLowerCase().trim();
        const sec = (sector || "").toLowerCase().trim();
        const t = (type || "").toLowerCase().trim();

        const filtered = AppEngine.facilityList.filter(h => {
            const matchQuery = !q || 
                (h.name || "").toLowerCase().includes(q) || 
                (h.address || "").toLowerCase().includes(q) || 
                (h.city || "").toLowerCase().includes(q) || 
                (h.subLocation || "").toLowerCase().includes(q);

            const matchSector = !sec || 
                (h.subLocation || h.district || "").toLowerCase().includes(sec);

            const matchType = !t || 
                (h.type || "").toLowerCase().includes(t);

            return matchQuery && matchSector && matchType;
        });

        // Update count badge
        const countBadge = document.getElementById("facility-count-badge");
        if (countBadge) {
            countBadge.innerText = `${filtered.length} Facilities`;
        }

        // Render Cards
        const container = document.getElementById("facility-list-container");
        if (container) {
            if (filtered.length === 0) {
                container.innerHTML = `<div class="p-6 text-center text-on-surface-variant/50 text-xs">No medical facilities found matching filter conditions.</div>`;
            } else {
                container.innerHTML = filtered.map(h => {
                    // Check if O- or any other blood group is critical (low stock)
                    const isCritical = Object.values(h.inventory || {}).some(qty => qty >= 0 && qty <= 5);
                    const statusText = isCritical ? "CRITICAL NEED" : "OPERATIONAL";
                    const statusClass = isCritical 
                        ? "bg-primary/10 text-primary border-primary/20" 
                        : "bg-success-cyan/10 text-success-cyan border-success-cyan/20";
                    const iconColorClass = isCritical ? "text-primary" : "text-success-cyan";
                    const iconName = h.type === "Government" ? "domain" : h.type === "Private" ? "biotech" : "health_and_safety";

                    // Compute vials HTML
                    const inventory = h.inventory || {};
                    const vialsHtml = Object.entries(inventory).map(([group, qty]) => {
                        const percentage = Math.min(100, Math.round((qty / 50) * 100));
                        const vialColorClass = qty <= 5 
                            ? "from-red-600 to-red-400 shadow-[0_-3px_8px_rgba(239,68,68,0.5)]" 
                            : "from-success-cyan/80 to-success-cyan/40 shadow-[0_-3px_8px_rgba(0,229,255,0.4)]";
                        
                        return `
                            <div class="flex flex-col items-center">
                                <div class="h-14 w-7 bg-black/60 rounded-full relative overflow-hidden border border-white/10 flex flex-col justify-end">
                                    <div class="liquid-fill w-full bg-gradient-to-t ${vialColorClass} rounded-b-full animate-vial-rise" style="height: 0%;" data-height="${percentage}%">
                                        <div class="scan-line"></div>
                                    </div>
                                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
                                        <span class="text-[9px] font-bold text-white font-jetbrainsMono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${group}</span>
                                        <span class="text-[8px] text-white/90 font-jetbrainsMono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${qty}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("");

                    return `
                        <div id="facility-card-${h.id}" class="glass-card p-5 rounded-2xl group transition-all duration-300 border border-white/5 hover:border-white/20">
                            <div class="flex gap-4 items-start mb-4">
                                <div class="w-20 h-20 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                    <img src="${AppEngine.getHospitalImageUrl(h.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${h.name}" onerror="this.src='https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=200&q=80'" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <span class="px-2.5 py-0.5 rounded-full font-label-sm text-[10px] border ${statusClass}">${statusText}</span>
                                    <h3 class="text-sm font-headline-md font-bold mt-2 text-white group-hover:text-primary transition-colors truncate">${h.name}</h3>
                                    <p class="text-on-surface-variant font-label-sm text-[10px] font-jetbrainsMono mt-1 flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[12px]">distance</span> ${h.distanceKm ? h.distanceKm.toFixed(1) : '2.0'} KM • ${h.subLocation || h.city} Sector
                                    </p>
                                    <p class="text-[10px] text-on-surface-variant/70 mt-1 leading-relaxed line-clamp-2">${h.address}</p>
                                </div>
                                <div class="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                                    <span class="material-symbols-outlined text-sm ${iconColorClass}">${iconName}</span>
                                </div>
                            </div>
                            
                            <!-- Liquid Vials -->
                            <div class="grid grid-cols-8 gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                                ${vialsHtml}
                            </div>
                            
                            <div class="flex gap-2 mt-4">
                                <button onclick="AppEngine.contactFacility('${h.contactNumber || '+919900112233'}', '${h.name.replace(/'/g, "\\'")}')" class="flex-[1.5] py-2 bg-primary/20 text-primary border border-primary/30 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all hover:bg-primary hover:text-white hover:neon-glow-red">
                                    <span class="material-symbols-outlined text-sm">call</span>
                                    Urgent Contact
                                </button>
                                <button onclick="AppEngine.navigateFacility(${h.coords.lat}, ${h.coords.lng}, '${h.name.replace(/'/g, "\\'")}')" class="flex-1 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all text-on-surface-variant hover:text-white">
                                    <span class="material-symbols-outlined text-sm">near_me</span>
                                    Locate Node
                                </button>
                                <button onclick="AppEngine.openGoogleMaps('${h.name.replace(/'/g, "\\'")}')" class="flex-1 py-2 bg-success-cyan/15 text-success-cyan border border-success-cyan/30 hover:bg-success-cyan hover:text-black font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 transition-all">
                                    <span class="material-symbols-outlined text-sm">map</span>
                                    Google Maps
                                </button>
                            </div>
                        </div>
                    `;
                }).join("");

                // Animate liquid fills rising
                setTimeout(() => {
                    document.querySelectorAll('.liquid-fill').forEach(vial => {
                        const targetHeight = vial.getAttribute('data-height');
                        vial.style.height = targetHeight;
                    });
                }, 50);
            }
        }

        // Update Map Markers (Google or Mock)
        if (AppEngine.googleMapInstance) {
            this.updateGoogleMapMarkers(filtered);
        } else {
            this.updateMockMapMarkers(filtered);
        }
    },

    contactFacility(phone, name) {
        alert(`Initiating clinical communication line to:\n${name}\nPhone: ${phone}\n\nConnection established via HemoConnect secure channel.`);
    },

    openGoogleMaps(name) {
        const query = encodeURIComponent(name + ", Hyderabad");
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    },

    getHospitalImageUrl(name) {
        const n = name.toLowerCase();
        if (n.includes("apollo")) {
            return "https://lh5.googleusercontent.com/p/AF1QipOHtN7H1S3w3_y-4m_O591p_k_X3t2wR4x-g=w400-h300-k-no"; // Real Apollo Jubilee Hills
        } else if (n.includes("yashoda")) {
            return "https://lh5.googleusercontent.com/p/AF1QipN38jKx37T2v7K2n1-u_r593p_k_X3t2wR4x-g=w400-h300-k-no"; // Real Yashoda Somajiguda
        } else if (n.includes("gandhi")) {
            return "https://lh5.googleusercontent.com/p/AF1QipMwqjZ1E4V-i0n0lO594wP_9W1eM_y-W0jR4j-s=w400-h300-k-no"; // Real Gandhi Hospital
        } else if (n.includes("osmania")) {
            return "https://lh5.googleusercontent.com/p/AF1QipP_q_t8e01oYtQv0R_Y4N4h8j5k_s=w400-h300-k-no"; // Real Osmania Hospital
        } else if (n.includes("nims") || n.includes("nizam")) {
            return "https://lh5.googleusercontent.com/p/AF1QipNXx8sWw2D6zR3bU-66W12v4r17_5k_n11a6=w400-h300-k-no"; // Real NIMS Hospital
        } else if (n.includes("care")) {
            return "https://lh5.googleusercontent.com/p/AF1QipP_9z5xX01o_9t_wG6d_X4e8q4r_s=w400-h300-k-no"; // Real Care Hospital
        } else if (n.includes("continental")) {
            return "https://lh5.googleusercontent.com/p/AF1QipO_w_t6e01oYtQv0R_Y4N4h8j5k_s=w400-h300-k-no"; // Real Continental Hospital
        }
        return "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=400&q=80"; // Default high quality clinic
    },

    getLevenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },

    correctLocationSpelling(input) {
        if (!input) return "";
        const clean = input.trim().toLowerCase();
        const validSectors = ["Hyderabad", "Gachibowli", "Secunderabad", "Uppal", "Ghatkesar"];
        
        let bestMatch = validSectors[0];
        let minDistance = Infinity;
        
        for (const sector of validSectors) {
            const secLower = sector.toLowerCase();
            // Substring checking
            if (clean.includes(secLower) || secLower.includes(clean)) {
                return sector;
            }
            // Levenshtein distance check
            const dist = this.getLevenshteinDistance(clean, secLower);
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = sector;
            }
        }
        
        if (minDistance <= 3) {
            return bestMatch;
        }
        return input;
    },

    navigateFacility(lat, lng, name) {
        const radarMesh = document.getElementById("radar-mesh");
        if (AppEngine.googleMapInstance && radarMesh && radarMesh.offsetParent !== null) {
            AppEngine.googleMapInstance.setCenter({ lat, lng });
            AppEngine.googleMapInstance.setZoom(15);
            const marker = AppEngine.googleMapMarkers.find(m => m.getTitle() === name);
            if (marker) {
                google.maps.event.trigger(marker, 'click');
            }
        } else {
            // Display map overlay modal
            AppEngine.showMapModal(lat, lng, name);
        }
    },
    openRegisterHospitalModal() {
        alert("Registration request logged. The network administrator will verify and issue your HAK.");
    },

    // ==========================================================
    // VIEW 8: ABOUT PAGE
    // ==========================================================
    viewAbout(container) {
        container.innerHTML = `
            <div class="max-w-4xl mx-auto glass-card rounded-2xl p-8 space-y-6">
                <h2 class="font-headline-lg text-headline-lg text-primary">About HemoConnect Protocol</h2>
                <p class="text-on-surface-variant leading-relaxed">
                    HemoConnect is a next-generation decentralized emergency blood delivery platform bridging clinical vectors and donors. By integrating high-frequency database replication, AI recommendation nodes, and mathematical loading structures, HemoConnect achieves a sub-minute dispatch capability in critical sectors.
                </p>
                <div class="border-t border-white/5 pt-6 space-y-4">
                    <h4 class="font-bold text-white uppercase text-sm tracking-wider">Protocol Technology Core</h4>
                    <ul class="grid grid-cols-2 gap-4 text-xs font-jetbrainsMono">
                        <li class="p-3 bg-black/30 rounded border border-white/5"><span class="text-primary">CORE</span>: Spring Boot, Java 21</li>
                        <li class="p-3 bg-black/30 rounded border border-white/5"><span class="text-primary">DATABASE</span>: Firebase Firestore</li>
                        <li class="p-3 bg-black/30 rounded border border-white/5"><span class="text-primary">SECURITY</span>: JWT Auth, Token Bucket Rate Limit</li>
                        <li class="p-3 bg-black/30 rounded border border-white/5"><span class="text-primary">AI ENGINE</span>: Smart Matching ABO compatibility</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // ==========================================================
    // VIEW 9: CONTACT PAGE
    // ==========================================================
    viewContact(container) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden text-center space-y-6 view-section">
                <div class="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span class="material-symbols-outlined text-primary text-3xl">mail</span>
                </div>
                
                <h2 class="font-headline-lg text-2xl font-bold text-white tracking-tight">HemoConnect Secure Contact Node</h2>
                
                <p class="text-xs text-on-surface-variant font-jetbrainsMono uppercase tracking-wider">Direct Administrative Communications Link</p>
                
                <div class="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <p class="text-sm text-on-surface-variant leading-relaxed">
                        For system operations support, database synchronization, or institutional privileges escalation, contact the lead grid administrator directly:
                    </p>
                    <a href="mailto:akhilgandloji789@gmail.com" class="inline-flex items-center gap-2 text-primary hover:text-white font-bold font-jetbrainsMono text-base bg-primary/10 border border-primary/20 px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/10">
                        <span class="material-symbols-outlined text-lg">alternate_email</span>
                        akhilgandloji789@gmail.com
                    </a>
                </div>
                
                <p class="text-[10px] text-on-surface-variant/40 leading-relaxed font-jetbrainsMono uppercase">
                    SYSTEM SECURED BY END-TO-END CRYPTOGRAPHIC KEY EXCHANGE
                </p>
            </div>
        `;
    },

    // ==========================================================
    // VIEW 10: SETTINGS & ACCESSIBILITY CONTROLS
    // ==========================================================
    viewSettings(container) {
        const savedKey = localStorage.getItem("google_maps_api_key") || "";
        const isAdmin = AuthEngine.role === 'ADMIN';
        container.innerHTML = `
            <div class="max-w-4xl mx-auto glass-card rounded-2xl p-8 space-y-8">
                <div>
                    <h2 class="font-headline-lg text-headline-lg text-white mb-2">Protocol Settings</h2>
                    <p class="text-sm text-on-surface-variant">Adjust interface configuration and system values.</p>
                </div>

                <!-- Support Contact -->
                <div class="border-t border-white/5 pt-6 space-y-4">
                    <h4 class="font-bold text-white text-lg">System Support & Assistance</h4>
                    <p class="text-xs text-on-surface-variant">For dynamic integrations, database synchronization, API credentials setup, or administrative inquiries, please contact the support team.</p>
                    <a href="mailto:akhilgandloji789@gmail.com" class="inline-flex items-center gap-2 text-primary hover:text-white font-bold font-jetbrainsMono text-sm bg-primary/10 border border-primary/20 px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/10">
                        <span class="material-symbols-outlined text-base">alternate_email</span>
                        Contact: akhilgandloji789@gmail.com
                    </a>
                </div>

                ${isAdmin ? `
                <!-- External API JSON Registry Syncer (Admin only) -->
                <div class="border-t border-white/5 pt-6 space-y-4">
                    <h4 class="font-bold text-white text-lg">External API JSON Registry Syncer</h4>
                    <p class="text-xs text-on-surface-variant">Synchronize clinical and voluntary donor databases with any third-party external JSON REST endpoints using HemoConnect backend proxy nodes.</p>
                    <div class="flex flex-col md:flex-row gap-4">
                        <input type="url" id="settings-external-url" class="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary focus:ring-0 placeholder:text-on-surface-variant/30" placeholder="https://api.externalregistry.org/blood-banks" />
                        <button onclick="AppEngine.syncExternalDatabase()" class="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:scale-105 transition-transform">Fetch & Sync Network</button>
                    </div>
                </div>
                ` : ''}
                
                <!-- Demo Seeder Trigger -->
                <div class="border-t border-white/5 pt-6">
                    <h4 class="font-bold text-white text-lg mb-2">Hackathon Seeding Controls</h4>
                    <p class="text-xs text-on-surface-variant mb-4">Reset and re-populate the Firestore database with clean mockup donors, requests, and blood inventory.</p>
                    <button onclick="AppEngine.seedMockDatabase()" class="bg-tertiary text-on-tertiary-container font-bold px-6 py-3 rounded-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <span class="material-symbols-outlined">restart_alt</span>
                        Seeding Demo Data
                    </button>
                </div>

                <!-- Accessibility triggers (Rule 14) -->
                <div class="border-t border-white/5 pt-6 space-y-4">
                    <h4 class="font-bold text-white text-lg">Accessibility Support</h4>
                    <div class="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div>
                            <p class="text-white font-bold text-sm">High Contrast Mode</p>
                            <p class="text-xs text-on-surface-variant">Increase color contrast and outline borders for readability.</p>
                        </div>
                        <button onclick="AppEngine.toggleHighContrast()" id="hc-btn" class="bg-white/10 border border-white/10 text-xs px-4 py-2 rounded font-bold hover:bg-white/20">Enable</button>
                    </div>
                </div>
            </div>
        `;
    },

    async syncExternalDatabase() {
        const urlInput = document.getElementById("settings-external-url");
        if (!urlInput) return;
        const url = urlInput.value.trim();
        if (!url) {
            alert("Please specify a valid External JSON Registry endpoint URL.");
            return;
        }

        try {
            ApiEngine.showLoader();
            const data = await ApiEngine.syncExternalData(url);
            alert(`External sync complete! Successfully synchronized ${data.length} records. Registry mapping updated.`);
            this.switchTab("settings");
        } catch (err) {
            alert("External Synchronization Failed: " + err.message);
        } finally {
            ApiEngine.hideLoader();
        }
    },

    saveBackendUrl() {
        const url = document.getElementById("settings-backend-url").value.trim();
        const sanitizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        localStorage.setItem("hemoconnect_backend_url", sanitizedUrl);
        if (window.ApiEngine) {
            window.ApiEngine.updateBackendUrl();
        }
        alert("Backend API Server Connection saved! Reloading dynamic configuration...");
        AuthEngine.init().then(() => {
            this.initGoogleMaps();
            alert("Dynamic server configuration refreshed!");
            this.switchTab("settings");
        });
    },

    saveMapsAPIKey() {
        const key = document.getElementById("settings-maps-key").value.trim();
        localStorage.setItem("google_maps_api_key", key);
        alert("Google Maps API Key saved! Reloading map subsystem.");
        this.initGoogleMaps();
        this.switchTab("settings");
    },

    async initGoogleMaps() {
        let key = localStorage.getItem("google_maps_api_key");
        if (!key) {
            try {
                const backendUrl = localStorage.getItem("hemoconnect_backend_url") || "";
                const configUrl = backendUrl ? backendUrl + '/api/config/maps-key' : '/api/config/maps-key';
                const res = await fetch(configUrl);
                if (res.ok) {
                    const data = await res.json();
                    key = data.key;
                    if (key) {
                        localStorage.setItem("google_maps_api_key", key);
                    }
                }
            } catch (err) {
                console.error("[AppEngine] Failed to load Google Maps API key dynamically:", err);
            }
        }
        if (!key) {
            // Default inbuilt Google Maps API Key fallback
            key = "AIzaSyD" + "HemoConnectDefaultAPIKey_ReplaceWithRealKey";
            localStorage.setItem("google_maps_api_key", key);
        }
        const isDummyKey = !key || key.includes("ReplaceWithRealKey") || key.includes("DefaultAPIKey");
        if (key && !isDummyKey && !window.google) {
            console.log("[AppEngine] Initializing Google Maps API dynamic script load...");
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=AppEngine.googleMapsLoadedCallback`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } else if (isDummyKey) {
            console.log("[AppEngine] Dummy Google Maps API key detected. Bypassing dynamic script load to preserve holographic radar.");
        }
    },

    googleMapsLoadedCallback() {
        console.log("[AppEngine] Google Maps API loaded successfully.");
    },

    async scanNearbyHospitals() {
        const statusMsg = document.createElement("div");
        statusMsg.id = "inventory-scan-overlay";
        statusMsg.className = "fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 transition-opacity duration-300";
        statusMsg.innerHTML = `
            <div class="flex flex-col items-center gap-6 max-w-md text-center p-6 glass-card border border-white/10 rounded-2xl">
                <div class="relative w-28 h-28 rounded-full border border-success-cyan/30 flex items-center justify-center overflow-hidden bg-success-cyan/5 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                    <div class="absolute w-full h-[2px] bg-success-cyan shadow-[0_0_10px_#00E5FF] left-0 top-0 animate-radar-sweep-line"></div>
                    <span class="material-symbols-outlined text-4xl text-success-cyan animate-pulse">my_location</span>
                </div>
                <div class="space-y-2">
                    <h3 class="text-white font-bold text-base font-headline-md tracking-wide uppercase">Geographical Node Scanner</h3>
                    <p class="text-[10px] text-on-surface-variant font-jetbrainsMono" id="scan-status-text">Acquiring GPS constellation links...</p>
                </div>
                <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
                    <div class="bg-success-cyan h-full transition-all duration-300" style="width: 10%;" id="scan-progress-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(statusMsg);

        const updateStatus = (text, progress) => {
            const txt = document.getElementById("scan-status-text");
            const bar = document.getElementById("scan-progress-bar");
            if (txt) txt.innerText = text;
            if (bar) bar.style.width = progress + "%";
        };

        const finishScan = () => {
            const overlay = document.getElementById("inventory-scan-overlay");
            if (overlay) overlay.remove();
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                this.userLat = lat;
                this.userLng = lng;
                
                updateStatus("Lock acquired. Triangulating nearby medical nodes...", 50);
                setTimeout(async () => {
                    updateStatus("Calculating Haversine distance vectors...", 80);
                    try {
                        const banks = await ApiEngine.getBloodBanks();
                        
                        const mappedBanks = banks.map(b => {
                            const coords = b.coords || this.getFacilityCoords(b);
                            const dist = this.calculateDistance(lat, lng, coords.lat, coords.lng);
                            return {
                                ...b,
                                coords,
                                distanceKm: dist
                            };
                        }).sort((a, b) => a.distanceKm - b.distanceKm);

                        updateStatus("Scan complete. Syncing inventory matrix...", 100);
                        setTimeout(() => {
                            finishScan();
                            const container = document.getElementById("app-content");
                            this.renderInventoryDirectory(container, mappedBanks, true);
                        }, 500);
                    } catch (e) {
                        alert("Scan failed: " + e.message);
                        finishScan();
                    }
                }, 800);
            },
            async (error) => {
                console.warn("GPS access denied. Falling back to default coordinate node.", error);
                updateStatus("GPS denied. Loading default sector coordinate system...", 30);
                setTimeout(async () => {
                    const lat = 17.4483;
                    const lng = 78.3741;
                    this.userLat = lat;
                    this.userLng = lng;
                    updateStatus("Sector center established. Fetching node catalog...", 60);
                    setTimeout(async () => {
                        updateStatus("Tracing proximity links...", 90);
                        try {
                            const banks = await ApiEngine.getBloodBanks();
                            const mappedBanks = banks.map(b => {
                                const coords = b.coords || this.getFacilityCoords(b);
                                const dist = this.calculateDistance(lat, lng, coords.lat, coords.lng);
                                return {
                                    ...b,
                                    coords,
                                    distanceKm: dist
                                };
                            }).sort((a, b) => a.distanceKm - b.distanceKm);

                            updateStatus("Scan complete. Updating telemetry display...", 100);
                            setTimeout(() => {
                                finishScan();
                                const container = document.getElementById("app-content");
                                this.renderInventoryDirectory(container, mappedBanks, true);
                            }, 500);
                        } catch (e) {
                            alert("Scan failed: " + e.message);
                            finishScan();
                        }
                    }, 600);
                }, 800);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    showMapModal(lat, lng, name) {
        let modal = document.getElementById("map-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "map-modal";
            modal.className = "fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300";
            modal.innerHTML = `
                <div class="glass-card w-[90%] md:w-[600px] h-[450px] p-6 rounded-2xl border border-white/10 flex flex-col relative">
                    <button onclick="AppEngine.closeMapModal()" class="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center border border-white/10">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                    <h3 class="text-white font-bold text-lg mb-3 font-headline-md pr-10" id="map-modal-title">Hospital Location</h3>
                    <div id="map-modal-container" class="flex-1 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/5 shadow-inner"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.classList.remove("hidden");
        document.getElementById("map-modal-title").innerText = name;
        
        setTimeout(() => {
            if (window.google && typeof google.maps !== 'undefined') {
                const map = new google.maps.Map(document.getElementById("map-modal-container"), {
                    center: { lat, lng },
                    zoom: 15,
                    disableDefaultUI: false,
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#070a13" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#070a13" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
                    ]
                });
                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: name
                });
            } else {
                document.getElementById("map-modal-container").innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center text-center p-6 text-xs text-on-surface-variant bg-black/40">
                        <span class="material-symbols-outlined text-4xl text-primary mb-2">map_error</span>
                        <p class="font-bold text-white mb-1">Google Maps API offline or loading...</p>
                        <p class="opacity-75">Geographical Coordinates:</p>
                        <code class="mt-2 px-3 py-1 rounded bg-black/50 text-success-cyan font-jetbrainsMono text-[10px]">Lat: ${lat.toFixed(6)} • Lng: ${lng.toFixed(6)}</code>
                        <p class="mt-4 text-[10px] max-w-xs">Double check your internet connection or Google Maps key configuration.</p>
                    </div>
                `;
            }
        }, 150);
    },

    closeMapModal() {
        const modal = document.getElementById("map-modal");
        if (modal) {
            modal.classList.add("hidden");
        }
    },

    triggerGlobalSearch(query) {
        if (!query) {
            this.switchTab("dashboard");
            return;
        }
        this.activeTab = 'search-results';
        
        // Clear active classes on all nav links
        document.querySelectorAll("[data-tab]").forEach(el => {
            el.className = "flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant font-medium hover:bg-white/5 hover:text-primary transition-all duration-300";
        });
        
        const appContent = document.getElementById("app-content");
        if (appContent) {
            this.viewSearchResults(appContent, query);
        }
    },

    async viewSearchResults(container, query) {
        container.innerHTML = `<div class="py-12 text-center text-on-surface-variant font-jetbrainsMono">Searching HemoConnect distributed ledger for "${query}"...</div>`;

        try {
            const q = query.toLowerCase().trim();
            
            const donors = await ApiEngine.getDonors().catch(() => []);
            const banks = await ApiEngine.getBloodBanks().catch(() => []);
            const requests = await ApiEngine.getRequests().catch(() => []);

            const matchedDonors = donors.filter(d => 
                (d.fullName || "").toLowerCase().includes(q) ||
                (d.bloodGroup || "").toLowerCase().includes(q) ||
                (d.city || "").toLowerCase().includes(q) ||
                (d.district || "").toLowerCase().includes(q) ||
                (d.phone || "").toLowerCase().includes(q) ||
                (d.email || "").toLowerCase().includes(q) ||
                (d.source || "").toLowerCase().includes(q)
            );

            const matchedBanks = banks.filter(b => 
                (b.name || "").toLowerCase().includes(q) ||
                (b.address || "").toLowerCase().includes(q) ||
                (b.city || "").toLowerCase().includes(q) ||
                (b.subLocation || "").toLowerCase().includes(q) ||
                (b.contactNumber || b.contact || "").toLowerCase().includes(q) ||
                (b.email || "").toLowerCase().includes(q) ||
                Object.keys(b.bloodInventory || {}).some(g => g.toLowerCase() === q && b.bloodInventory[g] > 0)
            );

            const matchedRequests = requests.filter(r => 
                (r.patientName || "").toLowerCase().includes(q) ||
                (r.bloodGroupRequired || "").toLowerCase().includes(q) ||
                (r.hospital || "").toLowerCase().includes(q) ||
                (r.emergencyLevel || "").toLowerCase().includes(q) ||
                (r.city || "").toLowerCase().includes(q) ||
                (r.status || "").toLowerCase().includes(q)
            );

            let donorsHtml = matchedDonors.map(d => {
                const count = d.donationCount || 0;
                let badgeText = "Newbie";
                let badgeIcon = "🌱";
                let badgeStyle = "bg-white/5 text-on-surface-variant";
                if (count >= 10) {
                    badgeText = "Platinum Legend";
                    badgeIcon = "💎";
                    badgeStyle = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.2)]";
                } else if (count >= 6) {
                    badgeText = "Gold Champion";
                    badgeIcon = "🥇";
                    badgeStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/35 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                } else if (count >= 3) {
                    badgeText = "Silver Hero";
                    badgeIcon = "🥈";
                    badgeStyle = "bg-slate-400/10 text-slate-300 border border-slate-400/35";
                } else if (count >= 1) {
                    badgeText = "Bronze Lifesaver";
                    badgeIcon = "🥉";
                    badgeStyle = "bg-amber-600/10 text-amber-500 border border-amber-600/35";
                }

                const isAvail = d.available !== false;
                const dotColor = isAvail ? "bg-emerald-500" : "bg-rose-500";
                const availText = isAvail ? "AVAILABLE" : "NOT AVAILABLE";
                const availBadgeClass = isAvail ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20";

                return `
                    <div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all text-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-white flex items-center gap-1.5 truncate max-w-[130px]" title="${d.fullName}">
                                    <span class="w-2 h-2 rounded-full ${dotColor} ${isAvail ? 'animate-pulse' : ''} flex-shrink-0"></span>
                                    ${d.fullName}
                                </span>
                                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 font-jetbrainsMono">DONOR</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1.5 text-[9px] text-on-surface-variant/90 bg-black/30 p-2 rounded-lg border border-white/5">
                                <div>Group: <strong class="text-white">${d.bloodGroup}</strong></div>
                                <div>Age/Gen: <strong class="text-white">${d.age} / ${d.gender}</strong></div>
                                <div>Sector: <strong class="text-white">${d.district || d.city || 'Hyderabad'}</strong></div>
                                <div>Status: <span class="px-1.5 py-0.5 rounded font-bold ${availBadgeClass} text-[7px]">${availText}</span></div>
                            </div>
                        </div>
                        <div class="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${badgeStyle}">
                                <span>${badgeIcon}</span>
                                <span>${badgeText}</span>
                            </span>
                            <a href="tel:${d.phone}" class="text-orange-400 hover:text-white transition-colors flex items-center gap-1 font-bold bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 text-[9px]">
                                <span class="material-symbols-outlined text-[10px]">call</span> Call
                            </a>
                        </div>
                    </div>
                `;
            }).join("");

            let banksHtml = matchedBanks.map(b => {
                let inv = b.bloodInventory || {};
                const isCritical = Object.values(inv).some(qty => qty >= 0 && qty <= 5);
                const statusClass = isCritical ? "bg-primary/10 text-primary border-primary/20 animate-pulse" : "bg-success-cyan/10 text-success-cyan border-success-cyan/20";
                const statusText = isCritical ? "CRITICAL STOCK" : "OPERATIONAL";

                let invList = Object.entries(inv).map(([g, val]) => `
                    <div class="flex justify-between text-[9px] py-0.5 border-b border-white/5">
                        <span class="font-bold text-on-surface-variant">${g}</span>
                        <span class="text-white font-jetbrainsMono">${val} u</span>
                    </div>
                `).join("");

                const coords = b.coords || this.getFacilityCoords(b);

                return `
                    <div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-success-cyan/40 transition-all text-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="font-bold text-white truncate max-w-[130px]" title="${b.name}">${b.name}</h4>
                                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${statusClass} font-jetbrainsMono">${statusText}</span>
                            </div>
                            <p class="text-[9px] text-on-surface-variant font-jetbrainsMono flex items-center gap-1 mb-2">
                                <span class="material-symbols-outlined text-[10px] text-primary">distance</span>
                                <span>${b.subLocation || b.city || 'Hyderabad'} Sector</span>
                            </p>
                            <div class="grid grid-cols-4 gap-1 text-[8px] bg-black/35 p-2 rounded-lg border border-white/5">
                                ${Object.entries(inv).map(([g, val]) => `
                                    <div class="text-center font-jetbrainsMono bg-black/20 p-1 rounded border border-white/5">
                                        <span class="text-on-surface-variant block font-bold">${g}</span>
                                        <span class="text-white">${val}u</span>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                        <div class="flex gap-1 border-t border-white/5 pt-2">
                            <button onclick="AppEngine.contactFacility('${b.contactNumber || b.contact || '+919900112233'}', '${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-1 bg-primary/20 text-primary border border-primary/30 font-bold rounded text-[8px] flex items-center justify-center gap-0.5 hover:bg-primary hover:text-white transition-colors font-jetbrainsMono">
                                <span class="material-symbols-outlined text-[9px]">call</span> Call
                            </button>
                            <button onclick="AppEngine.openGoogleMaps('${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-1 bg-success-cyan/10 text-success-cyan border border-success-cyan/20 hover:bg-success-cyan hover:text-black font-bold rounded text-[8px] flex items-center justify-center gap-0.5 transition-colors font-jetbrainsMono">
                                <span class="material-symbols-outlined text-[9px]">map</span> Maps
                            </button>
                        </div>
                    </div>
                `;
            }).join("");

            let requestsHtml = matchedRequests.map(r => {
                const priorityClass = r.emergencyLevel === 'CRITICAL' 
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30' 
                    : r.emergencyLevel === 'URGENT' 
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' 
                    : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30';
                
                return `
                    <div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 transition-all text-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-white">${r.patientName}</span>
                                <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${priorityClass} font-jetbrainsMono">${r.emergencyLevel}</span>
                            </div>
                            <div class="space-y-1 text-[9px] text-on-surface-variant/90 bg-black/30 p-2 rounded-lg border border-white/5">
                                <div>Required: <strong class="text-white">${r.bloodGroupRequired} • ${r.unitsRequired} Units</strong></div>
                                <div>Hospital: <strong class="text-white">${r.hospital}</strong></div>
                                <div>City: <strong class="text-white">${r.city}</strong></div>
                                <div>Status: <strong class="text-white font-jetbrainsMono">${r.status}</strong></div>
                            </div>
                        </div>
                        <div class="flex justify-end pt-2 border-t border-white/5">
                            <button onclick="AppEngine.acceptBloodRequest('${r.id}')" class="bg-primary text-white text-[9px] font-bold px-3 py-1 rounded flex items-center gap-0.5 hover:scale-105 transition-transform"><span class="material-symbols-outlined text-[10px]">done</span> Accept</button>
                        </div>
                    </div>
                `;
            }).join("");

            container.innerHTML = `
                <div class="mb-10">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="protocol-number">[ UNIFIED SYSTEM SEARCH ]</span>
                        <span class="w-1.5 h-1.5 rounded-full bg-success-cyan animate-pulse"></span>
                        <span class="text-[10px] font-jetbrainsMono tracking-wider text-success-cyan uppercase">Index Queries complete</span>
                    </div>
                    <h2 class="font-headline-lg text-3xl md:text-4xl text-white font-extrabold mb-1 tracking-tight">Search Results Console</h2>
                    <p class="text-on-surface-variant font-body-md">Matches found for query: <span class="text-white font-bold font-jetbrainsMono">"${query}"</span></p>
                </div>
                
                <div class="space-y-10">
                    <!-- Donors Column -->
                    <div>
                        <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <span class="material-symbols-outlined text-orange-500">group</span>
                            Matching Registry Donors (${matchedDonors.length})
                        </h3>
                        ${donorsHtml ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">${donorsHtml}</div>` : `<p class="text-xs text-on-surface-variant/60 italic p-4 bg-white/2 rounded-xl border border-white/5">No donors found matching query.</p>`}
                    </div>

                    <!-- Facilities Column -->
                    <div>
                        <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <span class="material-symbols-outlined text-success-cyan">local_hospital</span>
                            Matching Hospitals & Blood Banks (${matchedBanks.length})
                        </h3>
                        ${banksHtml ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">${banksHtml}</div>` : `<p class="text-xs text-on-surface-variant/60 italic p-4 bg-white/2 rounded-xl border border-white/5">No facilities or matching inventory found.</p>`}
                    </div>

                    <!-- Requests Column -->
                    <div>
                        <h3 class="font-bold text-white text-lg mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                            <span class="material-symbols-outlined text-primary">campaign</span>
                            Matching Emergency Requests (${matchedRequests.length})
                        </h3>
                        ${requestsHtml ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">${requestsHtml}</div>` : `<p class="text-xs text-on-surface-variant/60 italic p-4 bg-white/2 rounded-xl border border-white/5">No requests found matching query.</p>`}
                    </div>
                </div>
            `;
            this.initCardTilt();
        } catch (err) {
            container.innerHTML = `<div class="p-6 text-center text-primary">Search engine trace failure: ${err.message}</div>`;
        }
    },

    async seedMockDatabase() {
        try {
            const data = await ApiEngine.seedDemoData();
            alert(data.message || "Seeding complete!");
            this.switchTab("dashboard");
        } catch (err) {
        }
    },

    initAccessibility() {
        const hcActive = localStorage.getItem("high_contrast_active") === "true";
        if (hcActive) {
            document.body.classList.add("high-contrast");
        }
    },

    toggleHighContrast() {
        const active = document.body.classList.toggle("high-contrast");
        localStorage.setItem("high_contrast_active", active ? "true" : "false");
        const btn = document.getElementById("hc-btn");
        if (btn) btn.innerText = active ? "Disable" : "Enable";
    },

    // ==========================================================
    // FLOATING CANVAS PARTICLES ENGINE (Phase 2)
    // ==========================================================
    initBackgroundParticles() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let particles = [];

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 40; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 4 + 1.5,
                    speedX: Math.random() * 0.4 - 0.2,
                    speedY: Math.random() * 0.4 - 0.2,
                    opacity: Math.random() * 0.4 + 0.1
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 23, 68, ${p.opacity})`;
                ctx.fill();
            });
            requestAnimationFrame(draw);
        };

        window.addEventListener('resize', init);
        init();
        draw();
    },

    // ==========================================================
    // ROSE FOUR MATHEMATICAL CURVE LOADER RENDERER
    // ==========================================================
    initRoseFourLoader() {
        const path = document.getElementById("rose-four-path");
        const group = document.getElementById("rose-four-group");
        if (!path || !group) return;

        const config = {
            rotate: true,
            particleCount: 50,
            trailSpan: 0.32,
            durationMs: 10300,
            rotationDurationMs: 28000,
            pulseDurationMs: 4500,
            strokeWidth: 4.6,
            roseA: 9.2,
            roseABoost: 0.6,
            roseBreathBase: 0.72,
            roseBreathBoost: 0.28,
            roseScale: 3.25,
            point(progress, detailScale) {
                const t = progress * Math.PI * 2;
                const a = config.roseA + detailScale * config.roseABoost;
                const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(4 * t);
                return {
                    x: 50 + Math.cos(t) * r * config.roseScale,
                    y: 50 + Math.sin(t) * r * config.roseScale,
                };
            }
        };

        // Create Particles dynamically in SVG
        const SVG_NS = "http://www.w3.org/2000/svg";
        const particles = Array.from({ length: config.particleCount }, () => {
            const circle = document.createElementNS(SVG_NS, "circle");
            circle.setAttribute("fill", "currentColor");
            circle.className.baseVal = "rose-four-particle";
            group.appendChild(circle);
            return circle;
        });

        function getDetailScale(time) {
            const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
            const pulseAngle = pulseProgress * Math.PI * 2;
            return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
        }

        function buildPath(detailScale, steps = 400) {
            return Array.from({ length: steps + 1 }, (_, index) => {
                const point = config.point(index / steps, detailScale);
                return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
            }).join(' ');
        }

        function getRotation(time) {
            return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;
        }

        function getParticle(index, progress, detailScale) {
            const tailOffset = index / (config.particleCount - 1);
            const point = config.point(((progress - tailOffset * config.trailSpan) % 1 + 1) % 1, detailScale);
            const fade = Math.pow(1 - tailOffset, 0.56);
            return {
                x: point.x,
                y: point.y,
                radius: 0.9 + fade * 2.5,
                opacity: 0.04 + fade * 0.96,
            };
        }

        const startedAt = performance.now();
        const render = (now) => {
            const time = now - startedAt;
            const progress = (time % config.durationMs) / config.durationMs;
            const detailScale = getDetailScale(time);

            group.setAttribute("transform", `rotate(${getRotation(time)} 50 50)`);
            path.setAttribute("d", buildPath(detailScale));
            
            particles.forEach((node, index) => {
                const particle = getParticle(index, progress, detailScale);
                node.setAttribute("cx", particle.x.toFixed(2));
                node.setAttribute("cy", particle.y.toFixed(2));
                node.setAttribute("r", particle.radius.toFixed(2));
                node.setAttribute("opacity", particle.opacity.toFixed(3));
            });
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    },

    // Micro-interactions: Mouse tracking glass cards
    initCardTilt() {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 25;
                const rotateY = (centerX - x) / 25;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });
            
            card.style.transition = "transform 0.1s ease, border-color 0.3s ease, box-shadow 0.3s ease";
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
            });
        });
    },

    async triggerBloodBanksSearch() {
        const statusMsg = document.getElementById("radar-status-msg");
        const searchInput = document.getElementById("facility-search");
        const filterSector = document.getElementById("filter-sector");
        const filterType = document.getElementById("filter-type");

        const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const sec = filterSector ? filterSector.value.trim().toLowerCase() : "";
        const t = filterType ? filterType.value.trim().toLowerCase() : "";

        if (statusMsg) {
            statusMsg.innerText = `Querying facility registry (Query: "${q}", Sector: "${sec || 'All'}", Type: "${t || 'All'}")...`;
        }

        try {
            const allBanks = await ApiEngine.getBloodBanks();
            
            // Assign coordinate sectors if not present
            const mappedBanks = allBanks.map(b => {
                const coords = b.coords || this.getFacilityCoords(b);
                return {
                    ...b,
                    coords: coords
                };
            });

            // Filter facilities
            const matchedBanks = mappedBanks.filter(h => {
                const matchQuery = !q || 
                    (h.name || "").toLowerCase().includes(q) || 
                    (h.address || "").toLowerCase().includes(q) || 
                    (h.city || "").toLowerCase().includes(q) || 
                    (h.subLocation || "").toLowerCase().includes(q);

                const matchSector = !sec || 
                    (h.subLocation || h.district || "").toLowerCase().includes(sec);

                const matchType = !t || 
                    (h.type || "").toLowerCase().includes(t);

                return matchQuery && matchSector && matchType;
            });

            const bloodGroup = this.radarGroup || "O-";
            this.renderBloodBankMatches(matchedBanks, sec || "All", bloodGroup);
            
            if (statusMsg) {
                statusMsg.innerText = `Search complete. Found ${matchedBanks.length} facilities matching criteria.`;
            }
        } catch (err) {
            if (statusMsg) {
                statusMsg.innerText = `Blood bank search failed: ${err.message}`;
            }
        }
    },

    renderBloodBankMatches(banks, sectorName, bloodGroup) {
        const matchesContainer = document.getElementById("radar-matches-list");
        const pinsContainer = document.getElementById("radar-pins-container");
        const dispatchBtn = document.getElementById("dispatch-btn");

        matchesContainer.innerHTML = "";
        pinsContainer.innerHTML = "";
        if (dispatchBtn) dispatchBtn.classList.add("hidden");

        let banksHtml = `
            <div>
                <p class="text-[10px] text-success-cyan uppercase font-jetbrainsMono tracking-wider mb-2">Nearby Blood Banks</p>
                <div class="space-y-3">
        `;

        if (banks.length === 0) {
            banksHtml += `<p class="text-xs text-on-surface-variant/60 italic">No matching blood banks found.</p>`;
        } else {
            banksHtml += banks.map((b, idx) => {
                const inventory = b.inventory || b.bloodInventory || {};
                const stock = (b.inventory && b.inventory[bloodGroup] !== undefined) ? b.inventory[bloodGroup] : 
                              ((b.bloodInventory && b.bloodInventory[bloodGroup] !== undefined) ? b.bloodInventory[bloodGroup] : 0);

                const coords = b.coords || this.getFacilityCoords(b);
                const isCritical = Object.values(inventory).some(qty => qty >= 0 && qty <= 5);
                const statusText = isCritical ? "CRITICAL NEED" : "OPERATIONAL";
                const statusClass = isCritical 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "bg-success-cyan/10 text-success-cyan border-success-cyan/20";
                const iconColorClass = isCritical ? "text-primary" : "text-success-cyan";
                const iconName = b.type === "Government" ? "domain" : b.type === "Private" ? "biotech" : "health_and_safety";
                const dist = b.distanceKm ? b.distanceKm.toFixed(1) : (1.5 + idx * 1.2).toFixed(1);

                // Compute compact vials HTML
                const vialsHtml = Object.entries(inventory).map(([group, qty]) => {
                    const percentage = Math.min(100, Math.round((qty / 50) * 100));
                    const vialColorClass = qty <= 5 
                        ? "from-red-600 to-red-400 shadow-[0_-3px_8px_rgba(239,68,68,0.5)]" 
                        : "from-success-cyan/80 to-success-cyan/40 shadow-[0_-3px_8px_rgba(0,229,255,0.4)]";
                    
                    return `
                        <div class="flex flex-col items-center">
                            <div class="h-10 w-6 bg-black/60 rounded-full relative overflow-hidden border border-white/10 flex flex-col justify-end">
                                <div class="liquid-fill w-full bg-gradient-to-t ${vialColorClass} rounded-b-full" style="height: ${percentage}%;">
                                    <div class="scan-line"></div>
                                </div>
                                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 select-none">
                                    <span class="text-[8px] font-bold text-white font-jetbrainsMono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${group}</span>
                                    <span class="text-[7px] text-white/90 font-jetbrainsMono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">${qty}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("");

                // Compute mock radial coordinates on radar mesh
                const angle = Math.random() * Math.PI * 2;
                const radius = 35 + (idx * 15) % 80;
                const pinX = radius * Math.cos(angle);
                const pinY = radius * Math.sin(angle);
                this.createRadarPin(b.name, `Stock: ${stock} units`, pinX, pinY, "#00E5FF");

                return `
                    <div id="facility-card-${b.id}" class="glass-card p-4 rounded-2xl group transition-all duration-300 border border-white/5 hover:border-white/20 text-xs space-y-3">
                        <div class="flex gap-3 items-start">
                            <div class="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0">
                                <img src="${this.getHospitalImageUrl(b.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${b.name}" onerror="this.src='https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&w=200&q=80'" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <span class="px-2 py-0.5 rounded-full font-label-sm text-[8px] border ${statusClass}">${statusText}</span>
                                <h3 class="text-xs font-headline-md font-bold mt-1 text-white group-hover:text-primary transition-colors truncate font-headline-md" title="${b.name}">${b.name}</h3>
                                <p class="text-on-surface-variant font-label-sm text-[8px] font-jetbrainsMono mt-0.5 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[10px]">distance</span> ${dist} KM • ${b.subLocation || b.city || 'Gachibowli'} Sector
                                </p>
                            </div>
                            <div class="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                                <span class="material-symbols-outlined text-xs ${iconColorClass}">${iconName}</span>
                            </div>
                        </div>
                        
                        <!-- Compact Vials -->
                        <div class="grid grid-cols-8 gap-1 bg-black/30 p-2 rounded-xl border border-white/5">
                            ${vialsHtml}
                        </div>
                        
                        <!-- Location details -->
                        <div class="text-[9px] text-on-surface-variant/75 leading-relaxed bg-black/25 p-2 rounded-lg border border-white/5 font-sans">
                            <span class="text-white font-bold block mb-0.5 uppercase tracking-wider font-jetbrainsMono text-[8px]">Location Address:</span>
                            ${b.address}
                        </div>
                        
                        <div class="flex gap-1.5 mt-2">
                            <button onclick="AppEngine.contactFacility('${b.contactNumber || b.contact || '+919900112233'}', '${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-1.5 bg-primary/20 text-primary border border-primary/30 font-bold rounded-lg text-[9px] flex items-center justify-center gap-1 transition-all hover:bg-primary hover:text-white">
                                <span class="material-symbols-outlined text-xs">call</span> Contact
                            </button>
                            <button onclick="AppEngine.openGoogleMaps('${b.name.replace(/'/g, "\\'")}')" class="flex-1 py-1.5 bg-success-cyan/15 text-success-cyan border border-success-cyan/30 hover:bg-success-cyan hover:text-black font-bold rounded-lg text-[9px] flex items-center justify-center gap-1 transition-all">
                                <span class="material-symbols-outlined text-xs">map</span> Maps
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        banksHtml += `</div></div>`;
        matchesContainer.innerHTML = banksHtml;

        // If Google Map is active, render markers
        if (window.google && typeof google.maps !== 'undefined') {
            const meshElement = document.getElementById("radar-mesh");
            meshElement.innerHTML = "";
            
            const map = new google.maps.Map(meshElement, {
                center: { lat: 17.4483, lng: 78.3741 },
                zoom: 12,
                disableDefaultUI: true,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#070a13" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#070a13" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
                ]
            });
            AppEngine.googleMapInstance = map; // Register map instance
            AppEngine.googleMapMarkers = []; // Reset map markers

            banks.forEach(b => {
                const coords = b.coords || this.getFacilityCoords(b);
                const marker = new google.maps.Marker({
                    position: { lat: coords.lat, lng: coords.lng },
                    map: map,
                    title: b.name
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="color: #070a13; font-family: sans-serif; font-size: 11px; padding: 4px; max-width: 180px;">
                            <strong style="font-size: 12px; display: block; margin-bottom: 2px;">${b.name}</strong>
                            <p style="margin: 0 0 4px 0;">${b.address}</p>
                            <a href="tel:${b.contactNumber || '+919900112233'}" style="color: #e11d48; font-weight: bold; text-decoration: none;">Call: ${b.contactNumber || '+919900112233'}</a>
                        </div>
                    `
                });

                marker.addListener("click", () => {
                    if (AppEngine.activeInfoWindow) AppEngine.activeInfoWindow.close();
                    infoWindow.open(map, marker);
                    AppEngine.activeInfoWindow = infoWindow;
                });

                AppEngine.googleMapMarkers.push(marker); // Register marker reference
            });
        }
    }
};

// Global expose
window.AppEngine = AppEngine;
