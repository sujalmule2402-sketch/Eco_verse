// EcoVerse Citizen Portal Logic Controller

document.addEventListener("DOMContentLoaded", async () => {
  // Use the canonical simulator (loaded before this script)
  const sim = window.EcoVerseSimulator;
  const data = window.EcoVerseData;
  const mapManager = window.EcoVerseMap;

  let currentCoordinates = { lat: 12.9716, lng: 77.5946 };
  let garbagePreviewData = null;
  let emergencyPreviewData = null;

  // --- Initialise portal ---
  await initPortal();

  async function initPortal() {
    currentCoordinates = await sim.getCurrentLocation();

    // Init Leaflet maps
    if (mapManager) {
      mapManager.initMaps();
      mapManager.setUserCenter(currentCoordinates.lat, currentCoordinates.lng);
    }

    renderDashboard();
    renderVouchers();
    renderEwasteDirectory();
    renderGarbageComplaints();
    renderEmergencyTickets();

    // Populate species dropdown
    const saplingSelect = document.getElementById("tree-species");
    if (saplingSelect) {
      saplingSelect.innerHTML = data.plants.map(p =>
        `<option value="${p.id}">${p.name} (${p.scientificName})</option>`
      ).join("");
    }

    setupEventHandlers();
    updatePortalStats();

    // Handle ?tab= query param from landing page links
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      const targetNav = document.querySelector(`.nav-item[data-tab="${tabParam}"]`);
      if (targetNav) targetNav.click();
    }
  }

  // --- Reactive state sync ---
  window.addEventListener("ecoverseStateChanged", () => {
    updatePortalStats();
    if (mapManager) mapManager.plotTreesAndGarbage();
  });

  function updatePortalStats() {
    const s = sim.state;
    const el = (id) => document.getElementById(id);

    if (el("stats-trees"))     el("stats-trees").textContent = s.trees.length;
    if (el("stats-garbage"))   el("stats-garbage").textContent = s.garbageReports.length;

    if (el("stats-ewaste")) {
      el("stats-ewaste").textContent = (s.ewasteDisposals.length * 1.5).toFixed(1);
    }
    if (el("stats-complaints")) {
      const cleaned =
        s.garbageReports.filter(r => r.status === "cleaned").length +
        s.emergencyTickets.filter(t => t.status === "cleaned").length;
      el("stats-complaints").textContent = cleaned;
    }

    // Profile card
    if (el("profile-level"))       el("profile-level").textContent = s.level;
    if (el("profile-badge"))       el("profile-badge").textContent = sim.getBadgeName(s.level);
    if (el("stats-total-points"))  el("stats-total-points").textContent = s.points.toLocaleString();

    if (el("level-bar") && el("level-percentage")) {
      const pct = Math.floor((s.points % 500) / 500 * 100);
      el("level-bar").style.width = `${pct}%`;
      el("level-percentage").textContent = `${pct}% to Level ${s.level + 1}`;
    }
  }

  // --- Tab Switching (SPA style within portal.html) ---
  function setupEventHandlers() {
    const navItems = document.querySelectorAll(".nav-item[data-tab]");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute("data-tab");
        const panel = document.getElementById(`${targetTab}-tab`);
        if (!panel) return;

        navItems.forEach(n => n.classList.remove("active"));
        item.classList.add("active");

        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        panel.classList.add("active");

        if (mapManager) setTimeout(() => mapManager.invalidateMapSizes(), 60);
      });
    });

    // === PLANT A TREE ===
    const btnSelectFile   = document.getElementById("btn-camera-select-file");
    const fileTreeImg     = document.getElementById("tree-image-file");
    const btnCaptureScan  = document.getElementById("btn-camera-capture");
    const btnSubmitTree   = document.getElementById("btn-submit-tree");

    if (btnSelectFile) btnSelectFile.addEventListener("click", () => fileTreeImg && fileTreeImg.click());

    if (fileTreeImg) {
      fileTreeImg.addEventListener("change", (e) => {
        if (!e.target.files.length) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById("camera-placeholder-text").style.display = "none";
          const img = document.getElementById("captured-image-preview");
          img.src = ev.target.result;
          img.style.display = "block";
          runAIScanSequence();
        };
        reader.readAsDataURL(e.target.files[0]);
      });
    }

    if (btnCaptureScan) {
      btnCaptureScan.addEventListener("click", () => {
        document.getElementById("camera-placeholder-text").style.display = "none";
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 250;
        sim.drawSimulatedObject(canvas, "tree");
        const img = document.getElementById("captured-image-preview");
        img.src = canvas.toDataURL();
        img.style.display = "block";
        runAIScanSequence();
      });
    }

    if (btnSubmitTree) {
      btnSubmitTree.addEventListener("click", () => {
        const speciesId = document.getElementById("tree-species").value;
        const speciesObj = data.plants.find(p => p.id === speciesId);
        const treeRecord = {
          id: "tree_" + Date.now(),
          species: speciesObj ? speciesObj.name : "Sapling",
          lat: currentCoordinates.lat + (Math.random() - 0.5) * 0.004,
          lng: currentCoordinates.lng + (Math.random() - 0.5) * 0.004,
          timestamp: Date.now()
        };
        sim.state.trees.push(treeRecord);
        sim.addPoints(100, `Planted and logged a ${treeRecord.species} (+100 pts)`, "system-alert");
        sim.showToast(`Logged: ${treeRecord.species} placed on city map! +100 Pts`, "success");

        // Reset camera UI
        document.getElementById("scan-results-box").style.display       = "none";
        document.getElementById("captured-image-preview").style.display = "none";
        document.getElementById("camera-placeholder-text").style.display = "flex";
        document.getElementById("ai-detection-box").style.display       = "none";

        renderDashboard();
        if (mapManager) mapManager.plotTreesAndGarbage();
      });
    }

    // === GARBAGE SPOTTER ===
    const uploadZone  = document.getElementById("garbage-upload-zone");
    const fileGarbage = document.getElementById("garbage-file-input");
    const formGarbage = document.getElementById("garbage-report-form");

    if (uploadZone) uploadZone.addEventListener("click", () => fileGarbage && fileGarbage.click());

    if (fileGarbage) {
      fileGarbage.addEventListener("change", (e) => {
        if (!e.target.files.length) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          garbagePreviewData = ev.target.result;
          const prev = document.getElementById("garbage-upload-preview");
          prev.src = garbagePreviewData;
          prev.style.display = "block";
          uploadZone.querySelector("i").style.display    = "none";
          uploadZone.querySelector("span").style.display = "none";
          uploadZone.querySelector("p").style.display    = "none";
        };
        reader.readAsDataURL(e.target.files[0]);
      });
    }

    if (formGarbage) {
      formGarbage.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!garbagePreviewData) {
          const canvas = document.createElement("canvas");
          canvas.width = 150; canvas.height = 100;
          sim.drawSimulatedObject(canvas, "garbage");
          garbagePreviewData = canvas.toDataURL();
        }
        const report = {
          id: "garbage_" + Date.now(),
          description: document.getElementById("garbage-desc").value,
          severity: document.getElementById("garbage-severity").value,
          lat: currentCoordinates.lat + (Math.random() - 0.5) * 0.008,
          lng: currentCoordinates.lng + (Math.random() - 0.5) * 0.008,
          timestamp: Date.now(),
          status: "submitted",
          image: garbagePreviewData
        };
        sim.state.garbageReports.push(report);
        sim.saveState();
        sim.showToast("Garbage spot reported successfully!", "info");

        formGarbage.reset();
        garbagePreviewData = null;
        const prev = document.getElementById("garbage-upload-preview");
        prev.src = ""; prev.style.display = "none";
        uploadZone.querySelector("i").style.display    = "block";
        uploadZone.querySelector("span").style.display = "block";
        uploadZone.querySelector("p").style.display    = "block";

        renderGarbageComplaints();
        if (mapManager) mapManager.plotTreesAndGarbage();
      });
    }

    // === E-WASTE SCANNER ===
    const btnScanQr = document.getElementById("btn-scan-qr");
    if (btnScanQr) {
      btnScanQr.addEventListener("click", () => {
        const centerId = parseInt(document.getElementById("qr-center-select").value);
        const center   = data.eWasteCenters.find(c => c.id === centerId);
        const items    = document.getElementById("ewaste-items").value || "Electronics";
        if (!center) return;

        const scanBox = document.getElementById("qr-scanner-box");
        scanBox.classList.add("scanning");

        setTimeout(() => {
          scanBox.classList.remove("scanning");
          const overlay = document.getElementById("qr-success-overlay");
          overlay.style.display = "flex";

          setTimeout(() => {
            overlay.style.display = "none";
            sim.state.ewasteDisposals.push({
              id: "ewaste_" + Date.now(),
              centerName: center.name,
              items,
              timestamp: Date.now(),
              pointsEarned: 150
            });
            sim.addPoints(150, `Recycled electronics at ${center.name} (+150 pts)`, "points-gain");
            sim.showToast(`Disposal complete at ${center.name}! +150 Eco Points`, "success");
            updatePortalStats();
          }, 1500);
        }, 2000);
      });
    }

    // === EMERGENCY ALERTS ===
    const formEmergency    = document.getElementById("emergency-report-form");
    const uploadEmergency  = document.getElementById("emergency-upload-zone");
    const fileEmergency    = document.getElementById("emergency-file-input");

    if (uploadEmergency) uploadEmergency.addEventListener("click", () => fileEmergency && fileEmergency.click());

    if (fileEmergency) {
      fileEmergency.addEventListener("change", (e) => {
        if (!e.target.files.length) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          emergencyPreviewData = ev.target.result;
          const prev = document.getElementById("emergency-upload-preview");
          prev.src = emergencyPreviewData; prev.style.display = "block";
          uploadEmergency.querySelector("i").style.display    = "none";
          uploadEmergency.querySelector("span").style.display = "none";
        };
        reader.readAsDataURL(e.target.files[0]);
      });
    }

    if (formEmergency) {
      formEmergency.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!emergencyPreviewData) {
          const canvas = document.createElement("canvas");
          canvas.width = 150; canvas.height = 100;
          sim.drawSimulatedObject(canvas, "emergency_pothole");
          emergencyPreviewData = canvas.toDataURL();
        }
        const ticket = {
          id: "TICKET-" + Math.floor(100000 + Math.random() * 900000),
          category: document.getElementById("emergency-category").value,
          description: document.getElementById("emergency-desc").value,
          lat: currentCoordinates.lat,
          lng: currentCoordinates.lng,
          timestamp: Date.now(),
          status: "submitted",
          image: emergencyPreviewData,
          logs: [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Civic emergency logged and queued for inspection." }]
        };
        sim.state.emergencyTickets.push(ticket);
        sim.saveState();
        sim.showToast("Emergency civic ticket registered!", "warning");

        formEmergency.reset();
        emergencyPreviewData = null;
        document.getElementById("emergency-upload-preview").style.display = "none";
        uploadEmergency.querySelector("i").style.display    = "block";
        uploadEmergency.querySelector("span").style.display = "block";

        renderEmergencyTickets();
      });
    }

    // Modal close buttons
    const cModal   = document.getElementById("btn-close-reward-modal");
    const cModalOk = document.getElementById("btn-close-reward-ok");
    if (cModal)   cModal.addEventListener("click",   () => document.getElementById("reward-claim-modal").classList.remove("active"));
    if (cModalOk) cModalOk.addEventListener("click", () => document.getElementById("reward-claim-modal").classList.remove("active"));
  }

  // --- AI Scan animation sequence ---
  function runAIScanSequence() {
    const viewport = document.getElementById("camera-viewport");
    if (viewport) viewport.classList.add("scanning");
    const btnCap = document.getElementById("btn-camera-capture");
    if (btnCap) btnCap.disabled = true;

    setTimeout(() => {
      if (viewport) viewport.classList.remove("scanning");
      if (btnCap) btnCap.disabled = false;

      const box = document.getElementById("ai-detection-box");
      if (box) {
        box.style.display = "flex";
        box.style.top = "50px"; box.style.left = "130px";
        box.style.width = "140px"; box.style.height = "160px";
      }
      const resultsBox = document.getElementById("scan-results-box");
      if (resultsBox) resultsBox.style.display = "block";

      const cv = document.getElementById("tree-coord-val");
      const tv = document.getElementById("tree-time-val");
      const cfv = document.getElementById("tree-confidence-val");
      if (cv)  cv.textContent  = `${currentCoordinates.lat.toFixed(4)}, ${currentCoordinates.lng.toFixed(4)}`;
      if (tv)  tv.textContent  = new Date().toLocaleString();
      if (cfv) cfv.textContent = (92 + Math.floor(Math.random() * 7)) + "%";
    }, 2000);
  }

  // --- Render Functions ---

  function renderDashboard() {
    const remindersDiv = document.getElementById("tree-reminders");
    if (remindersDiv) {
      if (!sim.state.trees.length) {
        remindersDiv.innerHTML = `<p class="empty-msg text-muted">No trees planted yet. Plant your first tree to set care reminders!</p>`;
      } else {
        remindersDiv.innerHTML = sim.state.trees.map(tree => {
          const dateStr = new Date(tree.timestamp).toLocaleDateString();
          return `
            <div class="reminder-item" id="reminder-${tree.id}">
              <div class="reminder-info">
                <i class="fa-solid fa-droplet" style="color:var(--secondary);"></i>
                <div class="reminder-detail">
                  <span class="name">${tree.species}</span>
                  <span class="status-txt">Monthly watering reminder active. Logged: ${dateStr}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm btn-water" data-id="${tree.id}">
                <i class="fa-solid fa-shower"></i> Watered
              </button>
            </div>
          `;
        }).join("");

        document.querySelectorAll(".btn-water").forEach(btn => {
          btn.addEventListener("click", () => {
            const id   = btn.getAttribute("data-id");
            const tree = sim.state.trees.find(t => t.id === id);
            if (tree) {
              sim.addPoints(15, `Watered and maintained the ${tree.species} (+15 pts)`, "points-gain");
              sim.showToast(`Water logged! Thank you for caring for your ${tree.species}.`, "success");
              btn.disabled = true;
              btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Done`;
            }
          });
        });
      }
    }

    // Activity feed — show persisted logs
    const feed = document.getElementById("activity-feed");
    if (feed) {
      try {
        const logs = JSON.parse(localStorage.getItem("ecoverse_activity_logs") || "[]");
        if (logs.length) {
          feed.innerHTML = logs.map(l => `
            <div class="activity-item ${l.type}">
              <span class="activity-desc">${l.desc}</span>
              <span class="activity-time">${l.time}</span>
            </div>
          `).join("");
        } else {
          feed.innerHTML = `<div class="activity-item system-alert"><span class="activity-desc">Welcome! File reports and clean up the city.</span><span class="activity-time">Now</span></div>`;
        }
      } catch (e) {}
    }
  }

  function renderVouchers() {
    const container = document.getElementById("vouchers-container");
    if (!container) return;

    container.innerHTML = data.vouchers.map(v => {
      const canAfford = sim.state.points >= v.pointsCost;
      return `
        <div class="voucher-card">
          <div class="voucher-info">
            <div class="voucher-icon"><i class="fa-solid ${v.icon}"></i></div>
            <div class="voucher-text">
              <span class="voucher-title">${v.title}</span>
              <span class="voucher-desc">${v.description}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm btn-redeem" data-id="${v.id}" ${canAfford ? "" : "disabled"}>
            ${v.pointsCost} Pts
          </button>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".btn-redeem").forEach(btn => {
      btn.addEventListener("click", () => {
        const id      = btn.getAttribute("data-id");
        const voucher = data.vouchers.find(v => v.id === id);
        if (!voucher || sim.state.points < voucher.pointsCost) return;

        sim.state.points -= voucher.pointsCost;
        sim.state.level   = Math.floor(sim.state.points / 500) + 1;
        const code = `EV-${Math.floor(100000 + Math.random() * 900000)}-${voucher.category.toUpperCase()}`;
        sim.state.redeemedVouchers.push({ id: voucher.id, title: voucher.title, code, timestamp: Date.now() });
        sim.saveState();
        sim.showToast(`Redeemed: ${voucher.title}!`, "success");

        // Show modal
        document.getElementById("ticket-title").textContent     = voucher.title;
        document.getElementById("ticket-desc").textContent      = voucher.description;
        document.getElementById("ticket-code-str").textContent  = code;
        document.getElementById("reward-claim-modal").classList.add("active");

        renderVouchers(); // Refresh affordability
      });
    });
  }

  function renderGarbageComplaints() {
    const container = document.getElementById("garbage-complaints-container");
    if (!container) return;

    if (!sim.state.garbageReports.length) {
      container.innerHTML = `<p class="empty-msg text-muted">No garbage complaints filed yet.</p>`;
      return;
    }
    container.innerHTML = sim.state.garbageReports.map(r => {
      const badge = r.status === "cleaned" ? "cleaned" : r.status === "progress" ? "progress" : "submitted";
      const badgeTxt = r.status === "cleaned" ? "Cleaned" : r.status === "progress" ? "In Progress" : "Submitted";
      return `
        <div class="complaint-ticket" id="ticket-${r.id}">
          <div class="ticket-header">
            <span class="ticket-id">SPOT #${r.id.split("_")[1].slice(-6)}</span>
            <span class="status-badge ${badge}">${badgeTxt}</span>
          </div>
          <div class="ticket-body">
            <img src="${r.image}" class="ticket-thumb" alt="">
            <div class="ticket-info">
              <span class="title">${r.description}</span>
              <span class="loc text-xs text-muted"><i class="fa-solid fa-location-crosshairs"></i> ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}</span>
            </div>
          </div>
          <div class="ticket-footer">
            <span class="time">${new Date(r.timestamp).toLocaleDateString()}</span>
            ${r.status !== "cleaned" ? `
              <button class="btn btn-secondary btn-sm btn-force-clean" data-id="${r.id}">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Sim Cleanup
              </button>` : `<span class="text-xs" style="color:var(--primary);"><i class="fa-solid fa-check-double"></i> Cleaned</span>`}
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".btn-force-clean").forEach(btn => {
      btn.addEventListener("click", () => {
        const report = sim.state.garbageReports.find(r => r.id === btn.getAttribute("data-id"));
        if (report) {
          report.status = "cleaned";
          sim.addPoints(50, `Spot cleaned at ${report.description} (+50 pts)`, "cleanup");
          sim.showToast(`Simulated cleanup: +50 Pts!`, "success");
          sim.saveState();
          renderGarbageComplaints();
        }
      });
    });
  }

  function renderEmergencyTickets() {
    const container = document.getElementById("emergency-tickets-container");
    if (!container) return;

    if (!sim.state.emergencyTickets.length) {
      container.innerHTML = `<p class="empty-msg text-muted">No emergency complaints filed yet.</p>`;
      return;
    }
    container.innerHTML = sim.state.emergencyTickets.map(t => {
      const badge = t.status === "cleaned" ? "cleaned" : t.status === "progress" ? "progress" : "submitted";
      const badgeTxt = t.status === "cleaned" ? "Resolved" : t.status === "progress" ? "Dispatched" : "Queued";
      const logsHtml = (t.logs || []).map(log => `
        <div class="dispatch-log-item">
          <span class="time-str">${log.time}</span>
          <span class="log-txt">${log.text}</span>
        </div>
      `).join("");
      return `
        <div class="complaint-ticket" id="emergency-${t.id}">
          <div class="ticket-header">
            <span class="ticket-id">${t.id}</span>
            <span class="status-badge ${badge}">${badgeTxt}</span>
          </div>
          <div class="ticket-body">
            <img src="${t.image}" class="ticket-thumb" alt="">
            <div class="ticket-info">
              <span class="title">${t.description}</span>
              <span class="loc text-xs text-muted"><i class="fa-solid fa-circle-info"></i> Dispatch Tracker Active</span>
            </div>
          </div>
          <div class="dispatch-logs" style="margin-top:10px;">${logsHtml}</div>
          <div class="ticket-footer" style="margin-top:5px;">
            <span class="time">${new Date(t.timestamp).toLocaleDateString()}</span>
            ${t.status !== "cleaned" ? `
              <button class="btn btn-danger btn-sm btn-force-resolve" data-id="${t.id}">
                <i class="fa-solid fa-wrench"></i> Sim Resolve
              </button>` : `<span class="text-xs" style="color:var(--primary);"><i class="fa-solid fa-circle-check"></i> Resolved</span>`}
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".btn-force-resolve").forEach(btn => {
      btn.addEventListener("click", () => {
        const ticket = sim.state.emergencyTickets.find(t => t.id === btn.getAttribute("data-id"));
        if (ticket) {
          ticket.status = "cleaned";
          ticket.logs.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Repair completed. Inspected by city engineers." });
          sim.addPoints(100, `Ticket ${ticket.id} resolved (+100 pts)`, "system-alert");
          sim.showToast(`Simulated resolution: Ticket closed! +100 Pts`, "success");
          sim.saveState();
          renderEmergencyTickets();
        }
      });
    });
  }

  function renderEwasteDirectory() {
    const listDiv   = document.getElementById("ewaste-centers-list");
    const selectQr  = document.getElementById("qr-center-select");
    if (!listDiv || !selectQr) return;

    const centers = data.eWasteCenters;
    listDiv.innerHTML = centers.map((c, idx) => `
      <div class="center-row-card ${idx === 0 ? "active" : ""}" data-id="${c.id}">
        <div class="center-head">
          <h4>${c.name}</h4>
          <span class="pts-rate">${c.pointsPerKg} Pts/Kg</span>
        </div>
        <p>${c.address}</p>
        <div style="margin-top:5px; display:flex; flex-wrap:wrap; gap:4px;">
          ${c.acceptedItems.map(item => `<span style="background:rgba(255,255,255,0.05); font-size:0.65rem; padding:2px 6px; border-radius:4px;">${item}</span>`).join("")}
        </div>
      </div>
    `).join("");

    selectQr.innerHTML = centers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

    document.querySelectorAll(".center-row-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".center-row-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const id = parseInt(card.getAttribute("data-id"));
        if (mapManager) mapManager.focusEwasteCenter(id);
        selectQr.value = id;
      });
    });
  }
});
