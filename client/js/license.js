/**
 * EditFlow Pro - License Key Management Module
 * Exposes a global License object to manage activation, validation, and deactivation.
 * Integrates with Lemon Squeezy License API with offline grace periods and local testing mock keys.
 */

(function () {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const crypto = require('crypto');

    // Resolve storage paths
    const userData = path.join(os.homedir(), "Library", "Application Support", "EditFlowPro");
    const configPath = path.join(userData, "editflow_config.json");

    // Lemon Squeezy API Endpoints
    const LS_ACTIVATE_URL = "https://api.lemonsqueezy.com/v1/licenses/activate";
    const LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
    const LS_DEACTIVATE_URL = "https://api.lemonsqueezy.com/v1/licenses/deactivate";

    // Standard translation strings for bilingual support
    const TRANSLATIONS = {
        ar: {
            title: "تفعيل EditFlow Pro",
            desc: "أدخل مفتاح الترخيص الذي وصلك في بريدك الإلكتروني لتنشيط الميزات الاحترافية.",
            placeholder: "أدخل مفتاح الترخيص هنا...",
            btn_activate: "⚡ تفعيل الأداة",
            btn_deactivate: "إلغاء التفعيل 🔓",
            btn_activating: "جاري التحقق... ⏳",
            buy_link: "لم تشترِ بعد؟ احصل على EditFlow Pro الآن ←",
            support_link: "تحتاج مساعدة؟ راسلني واتساب 💬",
            success: "✓ تم التفعيل بنجاح! جاري تنشيط الأداة...",
            status_pro: "⭐ Pro Activated ✓",
            status_unlicensed: "🔒 Unlicensed",
            err_invalid: "مفتاح غير صحيح. تحقق من بريدك الإلكتروني",
            err_max_devices: "تجاوزت الحد الأقصى للأجهزة (2). يرجى إلغاء تفعيل جهاز آخر أولاً",
            err_disabled: "تم إلغاء هذا الترخيص. تواصل مع الدعم",
            err_network: "خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى",
            err_offline_activation: "يجب أن تكون متصلاً بالإنترنت لتفعيل الأداة لأول مرة",
            err_grace_expired: "انتهت فترة الصلاحية دون اتصال (7 أيام). يرجى الاتصال بالإنترنت للمتابعة"
        },
        en: {
            title: "Activate EditFlow Pro",
            desc: "Enter the license key received in your email to unlock all professional features.",
            placeholder: "Enter license key here...",
            btn_activate: "⚡ Activate Panel",
            btn_deactivate: "Deactivate 🔓",
            btn_activating: "Verifying... ⏳",
            buy_link: "Haven't purchased yet? Get EditFlow Pro here ←",
            support_link: "Need help? Contact support on WhatsApp 💬",
            success: "✓ Activated successfully! Loading panel...",
            status_pro: "⭐ Pro Activated ✓",
            status_unlicensed: "🔒 Unlicensed",
            err_invalid: "Invalid key. Please check your purchase email",
            err_max_devices: "Max devices reached (2). Please deactivate another machine first",
            err_disabled: "This license has been disabled or refunded. Contact support",
            err_network: "Connection error. Please check your internet and try again",
            err_offline_activation: "An internet connection is required for first-time activation",
            err_grace_expired: "Offline grace period (7 days) expired. Please connect to validate your license"
        }
    };

    // Helper to get active language
    function getLang() {
        if (window.currentLang === 'ar') return 'ar';
        if (window.currentLang === 'en') return 'en';
        // Fallback check on config/settings
        try {
            const config = loadConfig();
            if (config.language === 'ar') return 'ar';
        } catch (e) {}
        return 'en';
    }

    // Stable machine unique ID generation
    function getMachineId() {
        const interfaces = os.networkInterfaces();
        const macs = [];
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macs.push(iface.mac);
                }
            }
        }
        const input = macs.sort().join('-') + '|' + os.hostname();
        return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
    }

    // Load & Write editflow_config.json safely
    function loadConfig() {
        try {
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (e) {
            console.error("[License] Error loading config:", e);
        }
        return {};
    }

    function writeConfig(config) {
        try {
            if (!fs.existsSync(userData)) {
                fs.mkdirSync(userData, { recursive: true });
            }
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        } catch (e) {
            console.error("[License] Error writing config:", e);
        }
    }

    // Global License Object
    window.License = {
        // Init logic on startup
        async init() {
            const config = loadConfig();
            this.updateBadge();

            // Bind Settings menu Deactivate button if it exists or create one inside about section
            this.bindDeactivateUI();

            if (!config.license || config.license.status !== 'active') {
                this.showActivationScreen();
                return;
            }

            const lastCheck = new Date(config.license.last_validated_at);
            const hoursSinceCheck = (Date.now() - lastCheck.getTime()) / 3600000;

            // Optimistic Unlock (Offline-friendly UI)
            this.hideActivationScreen();

            // Check offline grace period expiration (more than 7 days offline)
            if (hoursSinceCheck > 168) {
                console.warn("[License] Offline grace period expired. Forcing validation.");
                const stillValid = await this.validate();
                if (!stillValid) {
                    this.clearLicenseStorage();
                    this.showActivationScreen(TRANSLATIONS[getLang()].err_grace_expired);
                }
                return;
            }

            // Run background check if more than 24h since last validation
            if (hoursSinceCheck > 24) {
                console.log("[License] Background revalidation triggered (>24h)...");
                this.validate().then((valid) => {
                    if (!valid) {
                        console.warn("[License] Background revalidation failed. Locking panel.");
                        this.clearLicenseStorage();
                        this.showActivationScreen(TRANSLATIONS[getLang()].err_disabled);
                    } else {
                        console.log("[License] Background validation successful.");
                    }
                });
            }
        },

        // Returns Pro license status
        isProUnlocked() {
            const config = loadConfig();
            return !!(config.license && config.license.status === 'active');
        },

        // Core activation
        async activate(key) {
            if (!key || key.trim() === "") {
                return { success: false, error: TRANSLATIONS[getLang()].err_invalid };
            }
            key = key.trim();

            const machineId = getMachineId();

            // ── LOCAL MOCK KEYS FOR TESTING ──
            if (key.startsWith("MOCK-")) {
                await new Promise(r => setTimeout(r, 1000)); // Simulate async network call
                if (key === "MOCK-VALID-PRO" || key === "MOCK-KEY-REVOKED-LATER") {
                    const mockLicense = {
                        key: key,
                        instance_id: "mock-instance-12345",
                        customer_email: "tester@najmedia.com",
                        customer_name: "Ahmed Tester",
                        product_name: "EditFlow Pro",
                        activated_at: new Date().toISOString(),
                        last_validated_at: new Date().toISOString(),
                        status: "active"
                    };
                    const config = loadConfig();
                    config.license = mockLicense;
                    writeConfig(config);
                    this.updateBadge();
                    return { success: true };
                } else if (key === "MOCK-MAX-DEVICES") {
                    return { success: false, error: TRANSLATIONS[getLang()].err_max_devices };
                } else if (key === "MOCK-DISABLED-REVOKED") {
                    return { success: false, error: TRANSLATIONS[getLang()].err_disabled };
                } else {
                    return { success: false, error: TRANSLATIONS[getLang()].err_invalid };
                }
            }

            // Real network activation via Lemon Squeezy
            try {
                const response = await fetch(LS_ACTIVATE_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `license_key=${encodeURIComponent(key)}&instance_name=${encodeURIComponent(machineId)}`
                });

                if (!response.ok) {
                    return { success: false, error: TRANSLATIONS[getLang()].err_network };
                }

                const data = await response.json();
                if (data.activated === true) {
                    const newLicense = {
                        key: key,
                        instance_id: data.instance.id,
                        customer_email: data.meta.customer_email || "customer@example.com",
                        customer_name: data.meta.customer_name || "Ahmed Najm",
                        product_name: data.meta.product_name || "EditFlow Pro",
                        activated_at: data.instance.created_at || new Date().toISOString(),
                        last_validated_at: new Date().toISOString(),
                        status: "active"
                    };
                    const config = loadConfig();
                    config.license = newLicense;
                    writeConfig(config);
                    this.updateBadge();
                    return { success: true };
                } else {
                    const errStr = data.error ? String(data.error).toLowerCase() : "";
                    let friendlyErr = TRANSLATIONS[getLang()].err_invalid;
                    if (errStr.includes("maximum") || errStr.includes("limit") || errStr.includes("device")) {
                        friendlyErr = TRANSLATIONS[getLang()].err_max_devices;
                    } else if (errStr.includes("disabled") || errStr.includes("revoked") || errStr.includes("refund")) {
                        friendlyErr = TRANSLATIONS[getLang()].err_disabled;
                    }
                    return { success: false, error: friendlyErr };
                }
            } catch (networkErr) {
                console.error("[License] Activation network error:", networkErr);
                return { success: false, error: TRANSLATIONS[getLang()].err_network };
            }
        },

        // Core validation
        async validate() {
            const config = loadConfig();
            if (!config.license || !config.license.key) return false;

            const key = config.license.key;
            const instanceId = config.license.instance_id;

            // Mock Validation
            if (key.startsWith("MOCK-")) {
                if (key === "MOCK-KEY-REVOKED-LATER") {
                    // Simulate key got revoked/refunded
                    return false;
                }
                // Renew validation time
                config.license.last_validated_at = new Date().toISOString();
                writeConfig(config);
                return true;
            }

            try {
                const response = await fetch(LS_VALIDATE_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `license_key=${encodeURIComponent(key)}&instance_id=${encodeURIComponent(instanceId)}`
                });

                if (!response.ok) {
                    // Network down: return true optimistically if within 7 days offline
                    return true;
                }

                const data = await response.json();
                if (data.valid === true) {
                    config.license.last_validated_at = new Date().toISOString();
                    config.license.status = "active";
                    writeConfig(config);
                    return true;
                } else {
                    return false;
                }
            } catch (err) {
                console.warn("[License] Validation network check failed, preserving offline validation:", err);
                return true; // Optimistic offline validation preserved
            }
        },

        // Core deactivation (release instance slot)
        async deactivate() {
            const config = loadConfig();
            if (!config.license) return { success: true };

            const key = config.license.key;
            const instanceId = config.license.instance_id;

            if (key.startsWith("MOCK-")) {
                this.clearLicenseStorage();
                this.updateBadge();
                return { success: true };
            }

            try {
                const response = await fetch(LS_DEACTIVATE_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `license_key=${encodeURIComponent(key)}&instance_id=${encodeURIComponent(instanceId)}`
                });

                // Clear license locally regardless of response
                this.clearLicenseStorage();
                this.updateBadge();
                return { success: true };
            } catch (err) {
                console.error("[License] Deactivation error:", err);
                // Force local clearing anyway
                this.clearLicenseStorage();
                this.updateBadge();
                return { success: true };
            }
        },

        // Get status object
        getStatus() {
            const config = loadConfig();
            if (!config.license) return null;
            return {
                key: config.license.key,
                email: config.license.customer_email,
                product: config.license.product_name,
                activatedAt: config.license.activated_at,
                lastChecked: config.license.last_validated_at
            };
        },

        // Clear config license details
        clearLicenseStorage() {
            const config = loadConfig();
            delete config.license;
            writeConfig(config);
        },

        // Update Pro Activation Badge in top header
        updateBadge() {
            const badge = document.getElementById("proBadge");
            if (!badge) return;

            const isPro = this.isProUnlocked();
            const lang = getLang();

            if (isPro) {
                badge.className = "pro-badge";
                badge.textContent = TRANSLATIONS[lang].status_pro;
            } else {
                badge.className = "pro-badge unlicensed";
                badge.textContent = TRANSLATIONS[lang].status_unlicensed;
            }
        },

        // Show/Hide activation overlays
        showActivationScreen(forcedErrMessage = "") {
            const overlay = document.getElementById("licenseOverlay");
            if (!overlay) return;

            const lang = getLang();

            // Block scroll
            document.body.style.overflow = "hidden";
            overlay.classList.remove("hidden");

            // Populate HTML dynamically to guarantee bilingual rendering
            overlay.innerHTML = `
                <div class="license-card">
                    <img src="img/splash_logo.png" class="license-logo" alt="EditFlow Pro">
                    <h2 class="license-title">${TRANSLATIONS[lang].title}</h2>
                    <p class="license-subtitle">${TRANSLATIONS[lang].desc}</p>
                    
                    <div class="license-input-wrapper">
                        <input type="text" id="licenseInputText" class="license-input" placeholder="${TRANSLATIONS[lang].placeholder}">
                    </div>

                    <div id="licenseErrorText" class="license-error">${forcedErrMessage}</div>
                    <div id="licenseSuccessText" class="license-success"></div>

                    <button id="btnLicenseSubmit" class="license-btn">${TRANSLATIONS[lang].btn_activate}</button>

                    <div class="license-footer-links">
                        <a href="#" class="license-link" onclick="if(window.csInterface) { window.csInterface.openURLInDefaultBrowser('https://najmedia.com/editflow'); } return false;">${TRANSLATIONS[lang].buy_link}</a>
                        <a href="#" class="license-link" onclick="if(window.csInterface) { window.csInterface.openURLInDefaultBrowser('https://wa.me/96894939544'); } return false;">${TRANSLATIONS[lang].support_link}</a>
                    </div>
                </div>
            `;

            if (forcedErrMessage) {
                document.getElementById("licenseErrorText").style.display = "block";
            }

            // Bind submit action
            const btn = document.getElementById("btnLicenseSubmit");
            const input = document.getElementById("licenseInputText");
            const errDiv = document.getElementById("licenseErrorText");
            const successDiv = document.getElementById("licenseSuccessText");

            btn.onclick = async () => {
                const key = input.value;
                errDiv.style.display = "none";
                successDiv.style.display = "none";

                btn.disabled = true;
                btn.textContent = TRANSLATIONS[lang].btn_activating;

                const result = await this.activate(key);

                if (result.success) {
                    successDiv.textContent = TRANSLATIONS[lang].success;
                    successDiv.style.display = "block";
                    setTimeout(() => {
                        this.hideActivationScreen();
                        location.reload();
                    }, 1500);
                } else {
                    errDiv.textContent = result.error || TRANSLATIONS[lang].err_invalid;
                    errDiv.style.display = "block";
                    btn.disabled = false;
                    btn.textContent = TRANSLATIONS[lang].btn_activate;
                }
            };
        },

        hideActivationScreen() {
            const overlay = document.getElementById("licenseOverlay");
            if (overlay) {
                overlay.classList.add("hidden");
                document.body.style.overflow = "";
            }
        },

        // Append Deactivate option to Settings (About page tab) dynamically
        bindDeactivateUI() {
            // Find settings tabs container or standard sections
            const aboutSection = document.querySelector(".settings-section[data-section='about']");
            if (!aboutSection) return;

            // Check if deactivation button is already appended
            if (document.getElementById("btn-efp-deactivate-container")) return;

            const container = document.createElement("div");
            container.id = "btn-efp-deactivate-container";
            container.style.marginTop = "14px";
            container.style.width = "100%";

            const divider = document.createElement("hr");
            divider.className = "about-divider";
            container.appendChild(divider);

            const isPro = this.isProUnlocked();
            const lang = getLang();

            if (isPro) {
                const config = loadConfig();
                const deacBtn = document.createElement("button");
                deacBtn.id = "btn-license-deactivate";
                deacBtn.className = "secondary";
                deacBtn.style.width = "100%";
                deacBtn.style.color = "#ff4d4d";
                deacBtn.style.borderColor = "rgba(255, 77, 77, 0.3)";
                deacBtn.textContent = TRANSLATIONS[lang].btn_deactivate + ` (${config.license.key.substring(0, 8)}...)`;

                deacBtn.onclick = async () => {
                    deacBtn.disabled = true;
                    deacBtn.textContent = "...";
                    await this.deactivate();
                    location.reload();
                };

                container.appendChild(deacBtn);
            }

            aboutSection.appendChild(container);
        }
    };

    // Auto load on document readied
    document.addEventListener("DOMContentLoaded", function () {
        window.License.init();
    });

})();
