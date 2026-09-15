// HemoConnect AI Features Interface Controller (Phase 11)
const AIEngine = {
    
    // Renders the Eligibility Checker interactive form (Feature 2)
    renderEligibilityChecker(container) {
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-8 flex flex-col gap-6">
                <div>
                    <h3 class="font-headline-md text-headline-md text-primary mb-1">AI Donation Eligibility Checker</h3>
                    <p class="text-sm text-on-surface-variant">Answer the diagnostic questions below to evaluate your biological parameters.</p>
                </div>
                <form id="eligibility-form" class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-primary mb-2">BIOLOGICAL AGE</label>
                            <input type="number" id="elig-age" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-0" placeholder="e.g. 25" required />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-primary mb-2">WEIGHT (KG)</label>
                            <input type="number" id="elig-weight" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-0" placeholder="e.g. 68" required />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-primary mb-2">DAYS SINCE LAST DONATION</label>
                            <input type="number" id="elig-days" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-0" placeholder="e.g. 120 (Type 999 if first time)" required />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-primary mb-2">TATTOOS/PIERCINGS IN LAST 6 MONTHS?</label>
                            <select id="elig-tattoos" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-0">
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-primary mb-2">CURRENTLY ON PRESCRIPTION MEDICATIONS?</label>
                        <select id="elig-meds" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:ring-0">
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-primary-container text-on-primary-container font-bold py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
                        Execute Diagnostic Sequence
                    </button>
                </form>
                <div id="eligibility-result" class="hidden p-4 rounded-xl border"></div>
            </div>
        `;

        document.getElementById("eligibility-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const resultDiv = document.getElementById("eligibility-result");
            
            const params = {
                age: document.getElementById("elig-age").value,
                weight: document.getElementById("elig-weight").value,
                daysSinceLast: document.getElementById("elig-days").value,
                tattoos: document.getElementById("elig-tattoos").value,
                medications: document.getElementById("elig-meds").value
            };

            try {
                const res = await window.ApiEngine.checkEligibility(params);
                resultDiv.classList.remove("hidden");
                resultDiv.innerHTML = "";
                
                if (res.eligible) {
                    resultDiv.className = "p-4 rounded-xl border border-success-cyan/30 bg-success-cyan/10 text-success-cyan space-y-2";
                    resultDiv.innerHTML = `
                        <div class="flex items-center gap-2 font-bold">
                            <span class="material-symbols-outlined">check_circle</span>
                            ELIGIBILITY PASSED
                        </div>
                        <p class="text-sm">${res.reasons[0]}</p>
                    `;
                } else {
                    resultDiv.className = "p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary space-y-2";
                    let reasonList = res.reasons.map(r => `<li>• ${r}</li>`).join("");
                    resultDiv.innerHTML = `
                        <div class="flex items-center gap-2 font-bold">
                            <span class="material-symbols-outlined">cancel</span>
                            ELIGIBILITY DENIED
                        </div>
                        <ul class="text-sm space-y-1">${reasonList}</ul>
                    `;
                }
            } catch (err) {
                alert("AI checker error: " + err.message);
            }
        });
    },

    // Renders the Health Tips Chatbot UI (Feature 5)
    renderHealthTipsChat(container) {
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-6 flex flex-col h-[480px]">
                <div class="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div class="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">psychology</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-white">HemoAI Diagnostic Advisor</h4>
                        <p class="text-xs text-success-cyan">Online • Secure Health Assistant</p>
                    </div>
                </div>
                <div id="chat-messages" class="flex-1 overflow-y-auto py-4 space-y-4 pr-2 custom-scrollbar">
                    <div class="flex gap-3 max-w-[80%]">
                        <div class="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary flex-shrink-0 text-sm font-bold">AI</div>
                        <div class="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-on-surface">
                            Greetings. I am HemoAI. How can I assist you with your donation preparation, recovery diet, hydration guidelines, or biology compatibility?
                        </div>
                    </div>
                </div>
                <form id="chat-form" class="flex gap-2 border-t border-white/5 pt-4">
                    <input type="text" id="chat-input" class="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-tertiary focus:ring-0 placeholder:text-on-surface-variant/40" placeholder="Ask about 'spinach', 'hydration', 'interval'..." required />
                    <button type="submit" class="bg-tertiary text-on-tertiary-container px-4 py-3 rounded-lg font-bold hover:scale-105 active:scale-95 transition-transform flex items-center">
                        <span class="material-symbols-outlined">send</span>
                    </button>
                </form>
            </div>
        `;

        const form = document.getElementById("chat-form");
        const messagesContainer = document.getElementById("chat-messages");
        const input = document.getElementById("chat-input");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userText = input.value.trim();
            if (!userText) return;

            // Render user message
            const userMsgDiv = document.createElement("div");
            userMsgDiv.className = "flex gap-3 max-w-[80%] ml-auto justify-end";
            userMsgDiv.innerHTML = `
                <div class="bg-primary/20 border border-primary/20 rounded-2xl rounded-tr-none p-3 text-sm text-on-surface text-right">
                    ${userText}
                </div>
                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 text-sm font-bold">ME</div>
            `;
            messagesContainer.appendChild(userMsgDiv);
            input.value = "";
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            try {
                const res = await window.ApiEngine.chatWithAI(userText);
                
                // Render bot reply
                const botMsgDiv = document.createElement("div");
                botMsgDiv.className = "flex gap-3 max-w-[80%]";
                botMsgDiv.innerHTML = `
                    <div class="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary flex-shrink-0 text-sm font-bold">AI</div>
                    <div class="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-3 text-sm text-on-surface">
                        ${res.reply}
                    </div>
                `;
                messagesContainer.appendChild(botMsgDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } catch (err) {
                console.error(err);
            }
        });
    },

    // Renders AI demand prediction (Feature 3)
    async renderDemandPredictions(container) {
        try {
            const data = await window.ApiEngine.getDemandPrediction();
            let predictionsHtml = data.predictions.map(p => {
                let badgeClass = "bg-success-cyan/20 text-success-cyan";
                if (p.threatLevel === "CRITICAL") badgeClass = "bg-primary/20 text-primary animate-pulse";
                else if (p.threatLevel === "STABLE") badgeClass = "bg-data-blue/20 text-data-blue";
                
                return `
                    <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <span class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">${p.bloodGroup}</span>
                            <div>
                                <p class="text-white font-bold">Forecast Variance: ${p.demandChange}</p>
                                <p class="text-xs text-on-surface-variant">Accuracy Index: ${p.confidence}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 rounded text-xs font-bold ${badgeClass}">${p.threatLevel}</span>
                    </div>
                `;
            }).join("");

            container.innerHTML = `
                <div class="glass-card rounded-2xl p-6">
                    <h4 class="font-headline-md text-headline-md text-white mb-2 flex items-center gap-2">
                        <span class="material-symbols-outlined text-tertiary">online_prediction</span>
                        AI Blood Demand Prediction
                    </h4>
                    <p class="text-xs text-on-surface-variant mb-6 uppercase tracking-wider">Evaluation Vector: ${data.forecastPeriod}</p>
                    <div class="space-y-4">
                        ${predictionsHtml}
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<p class="text-primary">Failed to load predictions: ${err.message}</p>`;
        }
    }
};

// Global expose
window.AIEngine = AIEngine;
