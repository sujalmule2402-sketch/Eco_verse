// EcoVerse Auth Bridge
// Bridges multi-page scripts to canonical EcoVerseSimulator or standalone adapter.

(function () {
  const STORAGE_KEY = "ecoverse_user_state";

  function defaultProfile() {
    return {
      points: 0, level: 1, totalTrees: 0, totalGarbage: 0,
      totalEWaste: 0, totalComplaints: 0,
      trees: [], garbageReports: [], ewasteDisposals: [],
      emergencyTickets: [], redeemedVouchers: []
    };
  }

  // ── Lightweight stand-alone adapter (used when simulation.js isn't active) ──
  const adapter = {
    user: null,

    _load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return defaultProfile();
    },

    _init() {
      this.user = this._load();
    },

    saveUser() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
      window.dispatchEvent(new CustomEvent("ecoverseStateChanged", { detail: this.user }));
    },

    saveState() {
      this.saveUser();
    },

    getBadgeName(level) {
      if (level >= 10) return "🌳 Grand Eco-Guardian";
      if (level >= 7)  return "🌿 Leaf Legend";
      if (level >= 4)  return "🗑️ Spotless Knight";
      if (level >= 2)  return "♻️ Recycle Ranger";
      return "🌱 Green Novice";
    },

    addPoints(amount, desc, type) {
      this.user.points += amount;
      const oldLevel = this.user.level;
      this.user.level = Math.floor(this.user.points / 500) + 1;
      this.saveUser();
      if (desc) this.addActivityLog(desc, type || "points-gain");
      if (this.user.level > oldLevel) {
        this.triggerToastNotification(`Level Up! You are now Level ${this.user.level}! 🎉`, "success");
      }
    },

    addActivityLog(desc, type) {
      let logs = [];
      try { logs = JSON.parse(localStorage.getItem("ecoverse_activity_logs") || "[]"); } catch (e) {}
      logs.unshift({ desc, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      if (logs.length > 30) logs.pop();
      localStorage.setItem("ecoverse_activity_logs", JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent("ecoverseLogsChanged"));
    },

    addActivityRecord(desc, type) {
      this.addActivityLog(desc, type);
    },

    triggerToastNotification(message, type = "info") {
      const container = document.getElementById("toast-container");
      if (!container) return;
      const iconMap = { success: "fa-circle-check", info: "fa-circle-info", warning: "fa-triangle-exclamation", danger: "fa-skull-crossbones" };
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <i class="fa-solid ${iconMap[type] || "fa-circle-info"}"></i>
        <div class="toast-message">${message}</div>
        <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
      `;
      container.appendChild(toast);
      toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
      setTimeout(() => toast.remove(), 4500);
    },

    showToast(message, type = "info") {
      this.triggerToastNotification(message, type);
    },

    getCurrentLocation() {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve({ lat: 12.9716 + (Math.random() - 0.5) * 0.05, lng: 77.5946 + (Math.random() - 0.5) * 0.05 }),
            { timeout: 5000 }
          );
        } else {
          resolve({ lat: 12.9716, lng: 77.5946 });
        }
      });
    },

    drawSimulatedObject() {}
  };

  adapter._init();

  // Dynamic Bridge Object: delegates calls to window.EcoVerseSimulator if loaded, else fallback to adapter
  const ProxyAuth = {
    get target() {
      return window.EcoVerseSimulator || adapter;
    },
    get user() {
      const t = this.target;
      return t.state || t.user;
    },
    set user(v) {
      const t = this.target;
      if (t.state) t.state = v; else t.user = v;
    },
    get state() {
      const t = this.target;
      return t.state || t.user;
    },
    saveUser() {
      const t = this.target;
      if (t.saveState) t.saveState(); else if (t.saveUser) t.saveUser();
    },
    saveState() {
      const t = this.target;
      if (t.saveState) t.saveState(); else if (t.saveUser) t.saveUser();
    },
    getBadgeName(level) {
      return this.target.getBadgeName(level);
    },
    addPoints(amount, desc, type) {
      return this.target.addPoints(amount, desc, type);
    },
    addActivityLog(desc, type) {
      const t = this.target;
      if (t.addActivityRecord) t.addActivityRecord(desc, type);
      else if (t.addActivityLog) t.addActivityLog(desc, type);
    },
    addActivityRecord(desc, type) {
      const t = this.target;
      if (t.addActivityRecord) t.addActivityRecord(desc, type);
      else if (t.addActivityLog) t.addActivityLog(desc, type);
    },
    triggerToastNotification(msg, type) {
      const t = this.target;
      if (t.showToast) t.showToast(msg, type);
      else if (t.triggerToastNotification) t.triggerToastNotification(msg, type);
    },
    showToast(msg, type) {
      const t = this.target;
      if (t.showToast) t.showToast(msg, type);
      else if (t.triggerToastNotification) t.triggerToastNotification(msg, type);
    },
    getCurrentLocation() {
      return this.target.getCurrentLocation();
    },
    drawSimulatedObject(canvas, type) {
      const t = this.target;
      if (t.drawSimulatedObject) t.drawSimulatedObject(canvas, type);
    }
  };

  window.EcoVerseAuth = ProxyAuth;
})();
