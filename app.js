// EcoVerse Application Logic Controller

document.addEventListener("DOMContentLoaded", async () => {
  // Global State Reference
  const simulator = window.EcoVerseSimulator;
  const data = window.EcoVerseData;
  const mapManager = window.EcoVerseMap;

  let currentQuizIndex = 0;
  let currentCoordinates = { lat: 12.9716, lng: 77.5946 };
  let selectedTreeSapling = null;
  let garbagePreviewData = null;
  let emergencyPreviewData = null;

  // Initialize Application
  await initApp();

  async function initApp() {
    // 1. Fetch user coordinates
    currentCoordinates = await simulator.getCurrentLocation();
    
    // 2. Initialize Maps
    mapManager.initMaps();
    mapManager.setUserCenter(currentCoordinates.lat, currentCoordinates.lng);

    // 3. Render dynamic content
    renderDashboard();
    renderPlantEncyclopedia();
    renderVouchers();
    renderEwasteDirectory();
    renderGarbageComplaints();
    renderEmergencyTickets();
    setupQuiz();
    updateLeaderboard();
    
    // Populate sapling selector
    const saplingSelect = document.getElementById("tree-species");
    saplingSelect.innerHTML = data.plants.map(p => `<option value="${p.id}">${p.name} (${p.scientificName})</option>`).join("");

    // 4. Bind UI Event Listeners
    setupEventHandlers();

    // 5. Initial stats draw
    updateUIStats();

    // 6. Fetch live real-world information
    fetchRealWorldAQI(currentCoordinates.lat, currentCoordinates.lng);
    fetchRealWorldRecyclingCenters(currentCoordinates.lat, currentCoordinates.lng);
  }

  // Update Points, level, and stats globally in UI
  function updateUIStats() {
    const pts = simulator.state.points;
    const lvl = simulator.state.level;
    const badge = simulator.getBadgeName(lvl);
    
    // Header
    document.getElementById("header-points").textContent = pts.toLocaleString();
    document.getElementById("header-level").textContent = lvl;

    // Profile Section
    document.getElementById("profile-level").textContent = lvl;
    document.getElementById("profile-badge").textContent = badge;
    document.getElementById("stats-total-points").textContent = pts.toLocaleString();

    // Stats Grid
    document.getElementById("stats-trees").textContent = simulator.state.trees.length;
    document.getElementById("stats-garbage").textContent = simulator.state.garbageReports.length;
    
    // Calculate total ewaste kg
    const totalKg = simulator.state.ewasteDisposals.reduce((sum, item) => sum + 1.5, 0); // 1.5kg avg per drop
    document.getElementById("stats-ewaste").textContent = totalKg.toFixed(1);
    
    // Civic Issues Resolved (cleaned garbage reports + resolved emergency tickets)
    const resolvedGarbage = simulator.state.garbageReports.filter(r => r.status === "cleaned").length;
    const resolvedEmergency = simulator.state.emergencyTickets.filter(t => t.status === "cleaned").length;
    document.getElementById("stats-complaints").textContent = resolvedGarbage + resolvedEmergency;

    // Level progress bar (threshold 500 points per level)
    const currentLevelPoints = pts % 500;
    const percent = Math.floor((currentLevelPoints / 500) * 100);
    document.getElementById("level-bar").style.width = percent + "%";
    document.getElementById("level-percentage").textContent = `${percent}% to Level ${lvl + 1}`;

    // Re-verify voucher buttons if user points updated
    renderVouchers();
    updateLeaderboard();
  }

  // Listen to simulator state changes
  window.addEventListener("ecoverseStateChanged", () => {
    updateUIStats();
    mapManager.plotTreesAndGarbage();
  });

  // Setup SPA page routing & sidebar interactions
  function setupEventHandlers() {
    // Tab switching
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Remove active class
        navItems.forEach(n => n.classList.remove("active"));
        item.classList.add("active");

        // Swap Panels
        const targetTab = item.getAttribute("data-tab");
        const panels = document.querySelectorAll(".tab-panel");
        panels.forEach(p => p.classList.remove("active"));
        
        const targetPanel = document.getElementById(`${targetTab}-tab`);
        if (targetPanel) {
          targetPanel.classList.add("active");
        }

        // Update Page Titles
        const pageTitle = document.getElementById("page-title");
        const pageSubtitle = document.getElementById("page-subtitle");
        
        const titleMap = {
          dashboard: { t: "Dashboard", s: "Welcome back, Eco-Citizen!" },
          "plant-tree": { t: "Plant a Tree", s: "Green the environment and map your sapling" },
          "garbage-spot": { t: "Garbage Spotter", s: "Report litter sites to civic authorities" },
          "e-waste": { t: "E-Waste Centers", s: "Locate authorized electronics recycling centers" },
          knowledge: { t: "Green Knowledge", s: "Learn about plants, take quizzes, view rankings" },
          emergency: { t: "Emergency Alerts", s: "File urgent civic complaints directly to municipal authorities" }
        };

        if (titleMap[targetTab]) {
          pageTitle.textContent = titleMap[targetTab].t;
          pageSubtitle.textContent = titleMap[targetTab].s;
        }

        // Force Map update due to hidden display visibility
        mapManager.invalidateMapSizes();
      });
    });

    // Sub-navigation inside Green Knowledge panel
    const kBtns = document.querySelectorAll(".k-nav-btn");
    kBns = kBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        kBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const targetSub = btn.getAttribute("data-subtab");
        const subpanels = document.querySelectorAll(".subtab-panel");
        subpanels.forEach(sp => sp.classList.remove("active"));
        document.getElementById(`${targetSub}-subtab`).classList.add("active");
      });
    });

    // --- WIKIPEDIA SEARCH INTERACTIONS ---
    const btnSearchPlant = document.getElementById("btn-search-plant");
    const inputSearchPlant = document.getElementById("plant-search-input");
    if (btnSearchPlant && inputSearchPlant) {
      btnSearchPlant.addEventListener("click", () => {
        queryWikipediaPlant(inputSearchPlant.value.trim());
      });
      inputSearchPlant.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          queryWikipediaPlant(inputSearchPlant.value.trim());
        }
      });
    }

    // --- PLANT A TREE INTERACTIONS ---
    const btnSelectFile = document.getElementById("btn-camera-select-file");
    const fileTreeImg = document.getElementById("tree-image-file");
    const btnCaptureScan = document.getElementById("btn-camera-capture");
    const btnSubmitTree = document.getElementById("btn-submit-tree");
    
    // File upload trigger
    btnSelectFile.addEventListener("click", () => fileTreeImg.click());
    fileTreeImg.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById("camera-placeholder-text").style.display = "none";
          const imgPreview = document.getElementById("captured-image-preview");
          imgPreview.src = event.target.result;
          imgPreview.style.display = "block";
          
          // Trigger AI Scan sequence
          runAIScanSequence();
        };
        reader.readAsDataURL(file);
      }
    });

    // Simulated Camera button
    btnCaptureScan.addEventListener("click", () => {
      // Toggle scanning state
      const viewport = document.getElementById("camera-viewport");
      viewport.classList.add("scanning");
      document.getElementById("camera-placeholder-text").style.display = "none";
      
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 250;
      simulator.drawSimulatedObject(canvas, "tree");
      
      const imgPreview = document.getElementById("captured-image-preview");
      imgPreview.src = canvas.toDataURL();
      imgPreview.style.display = "block";

      runAIScanSequence();
    });

    // Logging the tree
    btnSubmitTree.addEventListener("click", () => {
      const speciesId = document.getElementById("tree-species").value;
      const speciesObj = data.plants.find(p => p.id === speciesId);
      
      const treeRecord = {
        id: "tree_" + Date.now(),
        species: speciesObj ? speciesObj.name : "Custom Tree",
        lat: currentCoordinates.lat + (Math.random() - 0.5) * 0.005,
        lng: currentCoordinates.lng + (Math.random() - 0.5) * 0.005,
        timestamp: Date.now()
      };

      simulator.state.trees.push(treeRecord);
      simulator.addPoints(100, `Planted and logged a ${treeRecord.species} (+100 pts)`, "system-alert");
      
      // Toast notification
      simulator.showToast(`Logged: ${treeRecord.species} registered on city map!`, "success");
      
      // Reset view
      document.getElementById("scan-results-box").style.display = "none";
      document.getElementById("captured-image-preview").style.display = "none";
      document.getElementById("camera-placeholder-text").style.display = "flex";
      document.getElementById("ai-detection-box").style.display = "none";
      
      // Update displays
      renderDashboard();
      mapManager.plotTreesAndGarbage();
    });

    // --- GARBAGE SPOTTER INTERACTIONS ---
    const uploadZone = document.getElementById("garbage-upload-zone");
    const fileGarbage = document.getElementById("garbage-file-input");
    const formGarbage = document.getElementById("garbage-report-form");

    uploadZone.addEventListener("click", () => fileGarbage.click());
    fileGarbage.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          garbagePreviewData = event.target.result;
          const prev = document.getElementById("garbage-upload-preview");
          prev.src = garbagePreviewData;
          prev.style.display = "block";
          uploadZone.querySelector("i").style.display = "none";
          uploadZone.querySelector("span").style.display = "none";
          uploadZone.querySelector("p").style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    formGarbage.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // If no photo was uploaded, generate a simulated photo of trash
      if (!garbagePreviewData) {
        const canvas = document.createElement("canvas");
        canvas.width = 150;
        canvas.height = 100;
        simulator.drawSimulatedObject(canvas, "garbage");
        garbagePreviewData = canvas.toDataURL();
      }

      const desc = document.getElementById("garbage-desc").value;
      const severity = document.getElementById("garbage-severity").value;
      
      const newReport = {
        id: "garbage_" + Date.now(),
        description: desc,
        severity: severity,
        lat: currentCoordinates.lat + (Math.random() - 0.5) * 0.01,
        lng: currentCoordinates.lng + (Math.random() - 0.5) * 0.01,
        timestamp: Date.now(),
        status: "submitted",
        image: garbagePreviewData
      };

      simulator.state.garbageReports.push(newReport);
      simulator.saveState();
      
      simulator.showToast("Garbage Spot reported successfully to Municipal Corp!", "info");
      
      // Reset form
      formGarbage.reset();
      garbagePreviewData = null;
      const prev = document.getElementById("garbage-upload-preview");
      prev.style.display = "none";
      uploadZone.querySelector("i").style.display = "block";
      uploadZone.querySelector("span").style.display = "block";
      uploadZone.querySelector("p").style.display = "block";

      renderGarbageComplaints();
      mapManager.plotTreesAndGarbage();
    });

    // --- E-WASTE SCANNER INTERACTIONS ---
    const btnScanQr = document.getElementById("btn-scan-qr");
    btnScanQr.addEventListener("click", () => {
      const centerId = document.getElementById("qr-center-select").value;
      const center = data.eWasteCenters.find(c => c.id == centerId);
      const items = document.getElementById("ewaste-items").value || "Electronic parts";
      
      if (!center) return;

      const scanBox = document.getElementById("qr-scanner-box");
      scanBox.classList.add("scanning");
      
      setTimeout(() => {
        scanBox.classList.remove("scanning");
        document.getElementById("qr-success-overlay").style.display = "flex";
        
        setTimeout(() => {
          document.getElementById("qr-success-overlay").style.display = "none";
          
          // Complete disposal
          const disposalRecord = {
            id: "ewaste_" + Date.now(),
            centerName: center.name,
            items: items,
            timestamp: Date.now(),
            pointsEarned: 150
          };

          simulator.state.ewasteDisposals.push(disposalRecord);
          simulator.addPoints(150, `Recycled electronics at ${center.name} (+150 pts)`, "points-gain");
          simulator.showToast(`Disposal Complete: 150 Eco Points earned!`, "success");
          
          updateUIStats();
        }, 1500);
      }, 2000);
    });

    // --- EMERGENCY CIVIC ALERTS INTERACTIONS ---
    const formEmergency = document.getElementById("emergency-report-form");
    const uploadEmergency = document.getElementById("emergency-upload-zone");
    const fileEmergency = document.getElementById("emergency-file-input");

    uploadEmergency.addEventListener("click", () => fileEmergency.click());
    fileEmergency.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          emergencyPreviewData = event.target.result;
          const prev = document.getElementById("emergency-upload-preview");
          prev.src = emergencyPreviewData;
          prev.style.display = "block";
          uploadEmergency.querySelector("i").style.display = "none";
          uploadEmergency.querySelector("span").style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });

    formEmergency.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!emergencyPreviewData) {
        const canvas = document.createElement("canvas");
        canvas.width = 150;
        canvas.height = 100;
        simulator.drawSimulatedObject(canvas, "emergency_pothole");
        emergencyPreviewData = canvas.toDataURL();
      }

      const cat = document.getElementById("emergency-category").value;
      const desc = document.getElementById("emergency-desc").value;
      
      const newTicket = {
        id: "TICKET-" + Math.floor(100000 + Math.random() * 900000),
        category: cat,
        description: desc,
        lat: currentCoordinates.lat,
        lng: currentCoordinates.lng,
        timestamp: Date.now(),
        status: "submitted",
        image: emergencyPreviewData,
        logs: [
          {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Civic emergency logged and queued for inspection."
          }
        ]
      };

      simulator.state.emergencyTickets.push(newTicket);
      simulator.saveState();
      
      simulator.showToast("Emergency civic ticket registered! Dispatched to inspectors.", "warning");

      // Reset
      formEmergency.reset();
      emergencyPreviewData = null;
      document.getElementById("emergency-upload-preview").style.display = "none";
      uploadEmergency.querySelector("i").style.display = "block";
      uploadEmergency.querySelector("span").style.display = "block";

      renderEmergencyTickets();
    });

    // --- MODAL CONTROLS ---
    document.getElementById("btn-close-modal").addEventListener("click", () => {
      document.getElementById("plant-detail-modal").classList.remove("active");
    });
    
    document.getElementById("btn-close-reward-modal").addEventListener("click", () => {
      document.getElementById("reward-claim-modal").classList.remove("active");
    });
    
    document.getElementById("btn-close-reward-ok").addEventListener("click", () => {
      document.getElementById("reward-claim-modal").classList.remove("active");
    });
  }

  // AI scanning timeline simulation
  function runAIScanSequence() {
    const viewport = document.getElementById("camera-viewport");
    viewport.classList.add("scanning");
    
    // Disable capture during scan
    document.getElementById("btn-camera-capture").disabled = true;

    setTimeout(() => {
      viewport.classList.remove("scanning");
      document.getElementById("btn-camera-capture").disabled = false;
      
      // Draw simulated bounding box on tree
      const box = document.getElementById("ai-detection-box");
      box.style.display = "flex";
      box.style.top = "50px";
      box.style.left = "130px";
      box.style.width = "140px";
      box.style.height = "160px";
      
      // Show results
      document.getElementById("scan-results-box").style.display = "block";
      document.getElementById("tree-coord-val").textContent = `${currentCoordinates.lat.toFixed(4)}, ${currentCoordinates.lng.toFixed(4)}`;
      document.getElementById("tree-time-val").textContent = new Date().toLocaleString();
      document.getElementById("tree-confidence-val").textContent = (92 + Math.floor(Math.random() * 7)) + "%";

    }, 2000);
  }

  // --- RENDER FUNCTIONS ---

  // Dashboard content
  function renderDashboard() {
    const remindersDiv = document.getElementById("tree-reminders");
    const state = simulator.state;

    if (state.trees.length === 0) {
      remindersDiv.innerHTML = `<p class="empty-msg text-muted">No trees planted yet. Plant your first tree to set water/growth reminders!</p>`;
    } else {
      // Loop over trees and create water reminders
      remindersDiv.innerHTML = state.trees.map(tree => {
        const dateStr = new Date(tree.timestamp).toLocaleDateString();
        return `
          <div class="reminder-item" id="reminder-${tree.id}">
            <div class="reminder-info">
              <i class="fa-solid fa-droplet"></i>
              <div class="reminder-detail">
                <span class="name">${tree.species}</span>
                <span class="status-txt">Needs watering (reminded monthly). Logged on ${dateStr}</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm btn-water" data-id="${tree.id}">
              <i class="fa-solid fa-shower"></i> Watered
            </button>
          </div>
        `;
      }).join("");

      // Bind watering events
      document.querySelectorAll(".btn-water").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = btn.getAttribute("data-id");
          const tree = state.trees.find(t => t.id === id);
          if (tree) {
            simulator.addPoints(15, `Watered and cared for your ${tree.species} (+15 pts)`, "points-gain");
            simulator.showToast(`Water logged! Thank you for maintaining the ${tree.species}.`, "success");
            
            // Disable button for a bit
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Watered`;
          }
        });
      });
    }
  }

  // Rewards catalog redemptions
  function renderVouchers() {
    const container = document.getElementById("vouchers-container");
    const pts = simulator.state.points;

    container.innerHTML = data.vouchers.map(v => {
      const canAfford = pts >= v.pointsCost;
      return `
        <div class="voucher-card">
          <div class="voucher-info">
            <div class="voucher-icon">
              <i class="fa-solid ${v.icon}"></i>
            </div>
            <div class="voucher-text">
              <span class="voucher-title">${v.title}</span>
              <span class="voucher-desc">${v.description}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm btn-redeem" data-id="${v.id}" ${canAfford ? '' : 'disabled'}>
            ${v.pointsCost} Pts
          </button>
        </div>
      `;
    }).join("");

    // Bind click events to redeem
    document.querySelectorAll(".btn-redeem").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const voucher = data.vouchers.find(v => v.id === id);
        
        if (voucher && simulator.state.points >= voucher.pointsCost) {
          // Subtract points
          simulator.state.points -= voucher.pointsCost;
          
          const code = `EV-${Math.floor(100000 + Math.random() * 900000)}-${voucher.category.toUpperCase()}`;
          
          const redemption = {
            id: voucher.id,
            title: voucher.title,
            code: code,
            timestamp: Date.now()
          };

          simulator.state.redeemedVouchers.push(redemption);
          simulator.addActivityRecord(`Redeemed points for: ${voucher.title}`, "redemption");
          simulator.showToast(`Successfully Redeemed: ${voucher.title}!`, "success");
          
          // Open voucher ticket modal
          document.getElementById("ticket-title").textContent = voucher.title;
          document.getElementById("ticket-desc").textContent = voucher.description;
          document.getElementById("ticket-code-str").textContent = code;
          
          document.getElementById("reward-claim-modal").classList.add("active");
          
          simulator.saveState();
          updateUIStats();
        }
      });
    });
  }

  // Plant Encyclopedia Card Generator
  function renderPlantEncyclopedia() {
    const container = document.getElementById("plants-grid");
    container.innerHTML = data.plants.map(p => `
      <div class="plant-card" data-id="${p.id}">
        <img src="${p.image}" class="plant-cover-img" alt="${p.name}">
        <div class="plant-body">
          <div class="plant-title-row">
            <span class="plant-name">${p.name}</span>
          </div>
          <span class="plant-scientific">${p.scientificName}</span>
          <p class="plant-snippet">${p.funFact}</p>
          <div class="plant-stats-bar">
            <span class="plant-stat-item"><i class="fa-solid fa-wind"></i> O2: High</span>
            <span class="plant-stat-item"><i class="fa-solid fa-droplet"></i> Water: ${p.waterRequirement.split(" ")[0]}</span>
          </div>
        </div>
      </div>
    `).join("");

    // Bind click events to show detail modal
    document.querySelectorAll(".plant-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const plant = data.plants.find(p => p.id === id);
        
        if (plant) {
          const modalBody = document.getElementById("plant-detail-body");
          modalBody.innerHTML = `
            <div class="plant-modal-header">
              <img src="${plant.image}" class="plant-modal-img" alt="${plant.name}">
              <div class="plant-modal-title-block">
                <h2>${plant.name}</h2>
                <p class="scientific">${plant.scientificName}</p>
                <div class="plant-fact-badge">
                  <i class="fa-solid fa-lightbulb"></i>
                  <span>${plant.funFact}</span>
                </div>
              </div>
            </div>
            
            <div class="plant-detail-grid">
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-leaf"></i> Bark & Root Uses</span>
                <span class="val">${plant.rootsBarkUses}</span>
              </div>
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-notes-medical"></i> Medicinal Properties</span>
                <span class="val">${plant.medicinalUses}</span>
              </div>
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-wind"></i> Oxygen Output</span>
                <span class="val">${plant.oxygenProduction}</span>
              </div>
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-cloud-arrow-down"></i> Carbon Absorbed</span>
                <span class="val">${plant.carbonAbsorbed}</span>
              </div>
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-shower"></i> Water Needs</span>
                <span class="val">${plant.waterRequirement}</span>
              </div>
              <div class="plant-detail-item">
                <span class="lbl"><i class="fa-solid fa-calendar"></i> Best Planting Season</span>
                <span class="val">${plant.bestSeason}</span>
              </div>
            </div>
          `;
          
          document.getElementById("plant-detail-modal").classList.add("active");
        }
      });
    });
  }

  // Active Garbage spots list
  function renderGarbageComplaints() {
    const container = document.getElementById("garbage-complaints-container");
    const reports = simulator.state.garbageReports;

    if (reports.length === 0) {
      container.innerHTML = `<p class="empty-msg text-muted">No garbage complaints filed. Help clean the city by reporting trash spots!</p>`;
    } else {
      container.innerHTML = reports.map(r => {
        let badgeClass = "submitted";
        let badgeTxt = "Submitted";
        if (r.status === "progress") {
          badgeClass = "progress";
          badgeTxt = "In Progress";
        } else if (r.status === "cleaned") {
          badgeClass = "cleaned";
          badgeTxt = "Cleaned";
        }

        const dateStr = new Date(r.timestamp).toLocaleDateString();

        return `
          <div class="complaint-ticket" id="ticket-${r.id}">
            <div class="ticket-header">
              <span class="ticket-id">SPOT #${r.id.split("_")[1].slice(-6)}</span>
              <span class="status-badge ${badgeClass}">${badgeTxt}</span>
            </div>
            
            <div class="ticket-body">
              <img src="${r.image}" class="ticket-thumb" alt="Garbage spot">
              <div class="ticket-info">
                <span class="title">${r.description}</span>
                <span class="loc text-xs text-muted"><i class="fa-solid fa-location-crosshairs"></i> ${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}</span>
              </div>
            </div>
            
            <div class="ticket-footer">
              <span class="time">Reported: ${dateStr}</span>
              ${r.status !== 'cleaned' ? `
                <button class="btn btn-secondary btn-sm btn-force-clean" data-id="${r.id}">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> Sim Cleanup
                </button>
              ` : `
                <span class="text-xs text-success"><i class="fa-solid fa-check-double"></i> Cleaned & Verified</span>
              `}
            </div>
          </div>
        `;
      }).join("");

      // Bind force cleanup simulation event
      document.querySelectorAll(".btn-force-clean").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const report = reports.find(r => r.id === id);
          if (report) {
            report.status = "cleaned";
            simulator.state.totalComplaints++;
            simulator.addPoints(50, `Municipal clean-up verified at ${report.description} (+50 pts)`, "cleanup");
            simulator.showToast(`Simulated cleanup: spot marked as Resolved. +50 Pts credited!`, "success");
            simulator.saveState();
            renderGarbageComplaints();
          }
        });
      });
    }
  }

  // Active Emergency civic tickets list
  function renderEmergencyTickets() {
    const container = document.getElementById("emergency-tickets-container");
    const tickets = simulator.state.emergencyTickets;

    if (tickets.length === 0) {
      container.innerHTML = `<p class="empty-msg text-muted">No emergency civic complaints filed. Use the form to report pipeline leaks, potholes, and wiring issues.</p>`;
    } else {
      container.innerHTML = tickets.map(t => {
        let badgeClass = "submitted";
        let badgeTxt = "Queued";
        if (t.status === "progress") {
          badgeClass = "progress";
          badgeTxt = "Dispatched";
        } else if (t.status === "cleaned") {
          badgeClass = "cleaned";
          badgeTxt = "Resolved";
        }

        const logsHtml = t.logs.map(log => `
          <div class="dispatch-log-item">
            <span class="time-str">${log.time}</span>
            <span class="log-txt">${log.text}</span>
          </div>
        `).join("");

        return `
          <div class="complaint-ticket" id="emergency-${t.id}">
            <div class="ticket-header">
              <span class="ticket-id">${t.id} - ${simulator.formatEmergencyCategory(t.category)}</span>
              <span class="status-badge ${badgeClass}">${badgeTxt}</span>
            </div>
            
            <div class="ticket-body">
              <img src="${t.image}" class="ticket-thumb" alt="Emergency preview">
              <div class="ticket-info">
                <span class="title">${t.description}</span>
                <span class="loc text-xs text-muted"><i class="fa-solid fa-circle-info"></i> Dispatch Tracker Activated</span>
              </div>
            </div>
            
            <div class="dispatch-logs" style="margin-top: 10px;">
              ${logsHtml}
            </div>
            
            <div class="ticket-footer" style="margin-top: 5px;">
              <span class="time">${new Date(t.timestamp).toLocaleDateString()}</span>
              ${t.status !== 'cleaned' ? `
                <button class="btn btn-danger btn-sm btn-force-resolve" data-id="${t.id}">
                  <i class="fa-solid fa-wrench"></i> Sim Resolve
                </button>
              ` : `
                <span class="text-xs text-success"><i class="fa-solid fa-circle-check"></i> Resolved</span>
              `}
            </div>
          </div>
        `;
      }).join("");

      // Bind force resolve event
      document.querySelectorAll(".btn-force-resolve").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const ticket = tickets.find(t => t.id === id);
          if (ticket) {
            ticket.status = "cleaned";
            ticket.logs.push({
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: "Emergency repair confirmed completed by simulated engineering team."
            });
            simulator.state.totalComplaints++;
            simulator.addPoints(100, `Civic emergency ticket #${ticket.id} resolved (+100 pts)`, "system-alert");
            simulator.showToast(`Simulated resolution: Ticket resolved. +100 Pts credited!`, "success");
            simulator.saveState();
            renderEmergencyTickets();
          }
        });
      });
    }
  }

  // E-waste disposal centers directories
  function renderEwasteDirectory() {
    const listDiv = document.getElementById("ewaste-centers-list");
    const selectQr = document.getElementById("qr-center-select");

    const centers = data.eWasteCenters;
    
    // Directory cards
    listDiv.innerHTML = centers.map((c, idx) => `
      <div class="center-row-card ${idx === 0 ? 'active' : ''}" data-id="${c.id}">
        <div class="center-head">
          <h4>${c.name}</h4>
          <span class="pts-rate">${c.pointsPerKg} Pts/Kg</span>
        </div>
        <p>${c.address}</p>
        <div class="center-tags">
          ${c.acceptedItems.map(item => `<span class="tag">${item}</span>`).join("")}
        </div>
      </div>
    `).join("");

    // QR selection options
    selectQr.innerHTML = centers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

    // Bind selection clicks
    document.querySelectorAll(".center-row-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".center-row-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        
        const id = parseInt(card.getAttribute("data-id"));
        mapManager.focusEwasteCenter(id);
        
        // Sync the QR selection drop down
        selectQr.value = id;
      });
    });
  }

  // --- QUIZ MANAGEMENT ---
  function setupQuiz() {
    const quiz = data.quizzes[currentQuizIndex];
    if (!quiz) {
      // Quiz complete screen
      document.getElementById("quiz-block").innerHTML = `
        <div class="quiz-complete-card" style="text-align: center; padding: 40px 20px;">
          <i class="fa-solid fa-champagne-glasses green-glow" style="font-size: 4rem; color: var(--primary); margin-bottom: 20px;"></i>
          <h2>All Quizzes Completed!</h2>
          <p class="text-muted" style="margin: 10px 0 25px 0;">Awesome job! You have answered all environmental quizzes for the week. Check back next week for new questions.</p>
          <button class="btn btn-primary" id="btn-restart-quiz">Retake Quizzes</button>
        </div>
      `;
      
      document.getElementById("btn-restart-quiz").addEventListener("click", () => {
        currentQuizIndex = 0;
        setupQuiz();
      });
      return;
    }

    // Set numbers
    document.getElementById("quiz-curr-idx").textContent = currentQuizIndex + 1;
    document.getElementById("quiz-total-count").textContent = data.quizzes.length;
    document.getElementById("quiz-question-txt").textContent = quiz.question;
    
    // Hide feedback
    const feedbackBox = document.getElementById("quiz-feedback-box");
    feedbackBox.style.display = "none";
    feedbackBox.className = "quiz-feedback-box";
    
    // Enable Skip button
    document.getElementById("btn-skip-quiz").style.display = "block";

    // Set options
    const optionsContainer = document.getElementById("quiz-options-container");
    optionsContainer.innerHTML = quiz.options.map((opt, idx) => `
      <div class="quiz-option" data-idx="${idx}">
        <i class="fa-regular fa-circle"></i>
        <span>${opt}</span>
      </div>
    `).join("");

    // Bind option selections
    let selectedOptionIdx = null;
    const options = document.querySelectorAll(".quiz-option");
    options.forEach(opt => {
      opt.addEventListener("click", () => {
        // If already checked, block interaction
        if (feedbackBox.style.display === "block") return;

        options.forEach(o => {
          o.classList.remove("selected");
          o.querySelector("i").className = "fa-regular fa-circle";
        });

        opt.classList.add("selected");
        opt.querySelector("i").className = "fa-regular fa-circle-dot";
        
        selectedOptionIdx = parseInt(opt.getAttribute("data-idx"));
        document.getElementById("btn-next-quiz").disabled = false;
      });
    });

    // Check Answer action
    const btnNext = document.getElementById("btn-next-quiz");
    btnNext.disabled = true;
    btnNext.textContent = "Verify Answer";

    // Clear old click listeners on check answer button by cloning
    const newBtnNext = btnNext.cloneNode(true);
    btnNext.parentNode.replaceChild(newBtnNext, btnNext);
    
    newBtnNext.addEventListener("click", () => {
      if (newBtnNext.textContent === "Next Question") {
        currentQuizIndex++;
        setupQuiz();
        return;
      }

      // Perform check
      const correctIdx = quiz.correctAnswer;
      options.forEach(o => {
        const idx = parseInt(o.getAttribute("data-idx"));
        if (idx === correctIdx) {
          o.classList.add("correct");
          o.querySelector("i").className = "fa-solid fa-circle-check";
        } else if (idx === selectedOptionIdx) {
          o.classList.add("incorrect");
          o.querySelector("i").className = "fa-solid fa-circle-xmark";
        }
      });

      // Show feedback panel
      feedbackBox.style.display = "block";
      document.getElementById("btn-skip-quiz").style.display = "none";
      
      if (selectedOptionIdx === correctIdx) {
        feedbackBox.classList.add("correct-fb");
        document.getElementById("feedback-heading").textContent = "Correct! +20 Eco Points";
        document.getElementById("feedback-icon").className = "fa-solid fa-thumbs-up";
        
        // Award points
        simulator.addPoints(20, `Completed daily eco-quiz question (+20 pts)`, "points-gain");
        simulator.showToast("Correct Answer! +20 Eco Points credited.", "success");
      } else {
        feedbackBox.classList.add("incorrect-fb");
        document.getElementById("feedback-heading").textContent = "Incorrect";
        document.getElementById("feedback-icon").className = "fa-solid fa-triangle-exclamation";
        simulator.showToast("Oops! That was incorrect.", "danger");
      }

      document.getElementById("feedback-desc-txt").textContent = quiz.explanation;
      
      newBtnNext.textContent = "Next Question";
    });

    // Bind Skip
    const btnSkip = document.getElementById("btn-skip-quiz");
    const newBtnSkip = btnSkip.cloneNode(true);
    btnSkip.parentNode.replaceChild(newBtnSkip, btnSkip);
    newBtnSkip.addEventListener("click", () => {
      currentQuizIndex++;
      setupQuiz();
    });
  }

  // --- LEADERBOARD & USER SYNC ---
  function updateLeaderboard() {
    const listContainer = document.getElementById("leaderboard-list-container");
    const leaderboardData = data.leaderboard;
    
    // Find user record in leaderboard list
    const userIdx = leaderboardData.findIndex(u => u.name === "You");
    if (userIdx !== -1) {
      leaderboardData[userIdx].points = simulator.state.points;
      leaderboardData[userIdx].level = simulator.state.level;
      leaderboardData[userIdx].badge = simulator.getBadgeName(simulator.state.level);
    }

    // Sort leaderboard by points
    leaderboardData.sort((a, b) => b.points - a.points);
    
    // Re-rank
    leaderboardData.forEach((u, i) => u.rank = i + 1);

    // Render rows
    listContainer.innerHTML = leaderboardData.map(u => `
      <div class="leaderboard-row ${u.name === 'You' ? 'user-row' : ''}">
        <span class="row-rank">${u.rank}</span>
        <span class="row-name">${u.name}</span>
        <span class="row-level">${u.level}</span>
        <span class="row-pts">${u.points.toLocaleString()}</span>
        <span class="row-badge">${u.badge}</span>
      </div>
    `).join("");
  }

  // --- REAL-WORLD API IMPLEMENTATIONS ---

  async function fetchRealWorldAQI(lat, lng) {
    try {
      const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`);
      if (!res.ok) throw new Error("AQI fetch failed");
      const data = await res.json();
      if (data && data.current && data.current.us_aqi !== undefined) {
        const aqi = data.current.us_aqi;
        const pm25 = data.current.pm2_5;
        const pm10 = data.current.pm10;
        
        const valEl = document.querySelector(".aqi-val");
        const dotEl = document.querySelector(".aqi-dot");
        const descEl = document.querySelector(".aqi-desc");
        
        if (valEl) valEl.textContent = aqi;
        
        let rating = "Good";
        let ratingClass = "good";
        let ratingDesc = `Good (Fine Air) • PM2.5: ${pm25} • PM10: ${pm10}`;
        
        if (aqi > 300) {
          rating = "Hazardous";
          ratingClass = "poor";
        } else if (aqi > 200) {
          rating = "Very Unhealthy";
          ratingClass = "poor";
        } else if (aqi > 150) {
          rating = "Unhealthy";
          ratingClass = "poor";
        } else if (aqi > 100) {
          rating = "Unhealthy for Sensitive Groups";
          ratingClass = "moderate";
        } else if (aqi > 50) {
          rating = "Moderate";
          ratingClass = "moderate";
        }
        
        if (dotEl) {
          dotEl.className = `aqi-dot ${ratingClass}`;
        }
        if (descEl) {
          descEl.textContent = `${rating} • PM2.5: ${pm25} µg/m³`;
        }
        
        simulator.showToast(`Fetched live real-world Air Quality Index: ${aqi} (${rating})`, "info");
      }
    } catch (e) {
      console.error("Error fetching live AQI:", e);
    }
  }

  async function fetchRealWorldRecyclingCenters(lat, lng) {
    try {
      const query = `[out:json][timeout:25];node["amenity"="recycling"](around:10000,${lat},${lng});out body;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Overpass fetch failed");
      const result = await res.json();
      
      if (result && result.elements && result.elements.length > 0) {
        const fetchedCenters = result.elements.slice(0, 10).map((el) => {
          const tags = el.tags || {};
          const name = tags.name || tags.operator || `Civic Recycling Point #${el.id}`;
          const address = tags["addr:full"] || tags["addr:street"] || `Coordinates: ${el.lat.toFixed(4)}, ${el.lon.toFixed(4)}`;
          
          const accepted = [];
          if (tags["recycling:electrical"] === "yes" || tags["recycling:batteries"] === "yes" || tags["recycling:mobile_phones"] === "yes") {
            if (tags["recycling:electrical"] === "yes") accepted.push("Appliances");
            if (tags["recycling:mobile_phones"] === "yes") accepted.push("Mobile phones");
            if (tags["recycling:batteries"] === "yes") accepted.push("Batteries");
          }
          if (accepted.length === 0) {
            accepted.push("Mobile phones", "Laptops", "Batteries", "Chargers");
          }
          
          return {
            id: el.id,
            name: name,
            lat: el.lat,
            lng: el.lon,
            address: address,
            phone: tags.phone || "Municipal helpline: 1913",
            acceptedItems: accepted,
            pointsPerKg: 150
          };
        });
        
        data.eWasteCenters = fetchedCenters;
        simulator.showToast(`Found ${fetchedCenters.length} real-world recycling centers nearby!`, "success");
        
        renderEwasteDirectory();
        mapManager.plotEWasteCenters();
      } else {
        console.log("No OSM recycling nodes found, keeping static fallback centers.");
      }
    } catch (e) {
      console.error("Error fetching real recycling centers:", e);
    }
  }

  async function queryWikipediaPlant(plantName) {
    if (!plantName) return;
    
    const searchBtn = document.getElementById("btn-search-plant");
    searchBtn.disabled = true;
    searchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Querying...`;
    
    try {
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(plantName + " plant")}&format=json&origin=*`);
      if (!searchRes.ok) throw new Error("Search API error");
      const searchData = await searchRes.json();
      
      if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
        simulator.showToast("No plant species found on Wikipedia. Try another name!", "danger");
        return;
      }
      
      const bestTitle = searchData.query.search[0].title;
      
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
      if (!summaryRes.ok) throw new Error("Summary API error");
      const summaryData = await summaryRes.json();
      
      if (summaryData && summaryData.title) {
        const plantId = "wiki_" + Date.now();
        const newPlant = {
          id: plantId,
          name: summaryData.title,
          scientificName: summaryData.description || "Botanical Species",
          oxygenProduction: "High (assimilated from leaf area)",
          carbonAbsorbed: "Approximately 8-15 kg CO2 per year",
          fruitsFlowers: "Varies by sub-species",
          medicinalUses: "Contains therapeutic compounds commonly documented in botanical studies.",
          leavesUses: "Used in organic mulching and soil enrichments.",
          rootsBarkUses: "Aids soil stabilization and moisture retention.",
          diseasesHelped: "General antioxidant, environmental stress reducer.",
          waterRequirement: "Moderate (adapts to native precipitation)",
          fertilizerRequirement: "Balanced organic matter annually",
          bestSeason: "Early spring or pre-monsoon",
          funFact: summaryData.extract || "No description available.",
          image: summaryData.thumbnail ? summaryData.thumbnail.source : "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&auto=format&fit=crop&q=60"
        };
        
        data.plants.unshift(newPlant);
        renderPlantEncyclopedia();
        
        setTimeout(() => {
          const newCard = document.querySelector(`.plant-card[data-id="${plantId}"]`);
          if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth' });
            newCard.click();
          }
        }, 200);

        simulator.addPoints(10, `Researched ${newPlant.name} on Wikipedia (+10 pts)`, "points-gain");
        simulator.showToast(`Fetched Wikipedia details for ${newPlant.name}! +10 Eco Points earned!`, "success");
        
        document.getElementById("plant-search-input").value = "";
      }
    } catch (e) {
      console.error("Wikipedia search failed:", e);
      simulator.showToast("Could not retrieve plant details. Check your connection or search terms.", "danger");
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = `<i class="fa-solid fa-globe"></i> Query Wikipedia`;
    }
  }

});
