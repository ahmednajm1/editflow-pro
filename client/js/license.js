// license.js
// Handles licensing state and 7-day persistent trial validation

class LicenseManager {
    constructor() {
        this.licenseTier = 'free'; // Default fallback
        this.daysLeft = 0;
    }

    init() {
        this.validateLicense();
        this.updateBadge();
        this.enforceRestrictions();
    }

    validateLicense() {
        // 1. Check for real license key (mock logic)
        const savedKey = localStorage.getItem('editflow_license_key');
        if (savedKey === 'SUPER_SECRET_PRO_KEY') {
            this.licenseTier = 'pro';
            return;
        } else if (savedKey === 'SUPER_SECRET_STUDIO_KEY') {
            this.licenseTier = 'studio';
            return;
        }

        // 2. Fallback to Trial Persistence
        let trialStart = localStorage.getItem('editflow_trial_start');
        
        if (!trialStart) {
            // First time opening the plugin
            trialStart = new Date().toISOString();
            localStorage.setItem('editflow_trial_start', trialStart);
        }

        const startDate = new Date(trialStart);
        const now = new Date();
        const msPassed = now - startDate;
        const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));

        if (daysPassed < 7) {
            this.licenseTier = 'trial';
            this.daysLeft = 7 - daysPassed;
        } else {
            this.licenseTier = 'free';
        }
    }

    updateBadge() {
        const badge = document.getElementById('license-badge');
        if (!badge) return;

        if (this.licenseTier === 'trial') {
            badge.className = 'badge badge-trial';
            badge.innerText = `Trial (${this.daysLeft} Days Left)`;
        } else if (this.licenseTier === 'pro' || this.licenseTier === 'studio') {
            badge.className = 'badge badge-pro';
            badge.innerText = this.licenseTier.toUpperCase();
        } else {
            badge.className = 'badge';
            badge.innerText = 'FREE TIER';
            badge.style.color = '#777';
            badge.style.backgroundColor = '#111';
        }
    }

    enforceRestrictions() {
        // Disable AI features if trial expires
        if (this.licenseTier === 'free') {
            const aiButtons = document.querySelectorAll('.ai-feature');
            aiButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.title = "Requires Pro License";
            });
            
            const batchBtn = document.getElementById('btn-batch-export');
            if(batchBtn) {
                batchBtn.disabled = true;
                batchBtn.style.opacity = '0.5';
            }
        }
    }

    get isPro() {
         return ['trial', 'pro', 'studio'].includes(this.licenseTier);
    }

    get isStudio() {
         return ['trial', 'studio'].includes(this.licenseTier);
    }
    
    get isTrial() {
        return this.licenseTier === 'trial';
    }
}

window.LicenseManager = LicenseManager;
