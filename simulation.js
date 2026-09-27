// EcoVerse Simulation & State Management Engine

class EcoVerseSimulator {
  constructor() {
    this.storageKey = "ecoverse_user_state";
    this.state = this.loadState();
    this.activeStream = null;
    this.municipalInterval = null;
    this.initMunicipalSimulation();
  }

  // Load state from local storage or set default values
  loadState() {
    const defaultState = {
      points: 0,
      level: 1,
      totalTrees: 0,
      totalGarbage: 0,
      totalEWaste: 0,
      totalComplaints: 0,
      trees: [], // Array of { id, species, lat, lng, timestamp, status }
      garbageReports: [], // Array of { id, description, severity, lat, lng, timestamp, status, image }
      ewasteDisposals: [], // Array of { id, centerName, items, timestamp, pointsEarned }
      emergencyTickets: [], // Array of { id, category, description, lat, lng, timestamp, status, logs }
      redeemedVouchers: [] // Array of { id, title, code, timestamp }
    };

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load local storage state", e);
    }
    return defaultState;
  }

  // Save state to local storage
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save state to local storage", e);
    }
    
    // Dispatch custom event to notify app UI of state changes
    window.dispatchEvent(new CustomEvent("ecoverseStateChanged", { detail: this.state }));
  }

  // Reset state
  resetState() {
    localStorage.removeItem(this.storageKey);
    this.state = this.loadState();
    this.saveState();
  }

  // Geolocation wrapper
  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            // Fallback to randomized coordinates around Bangalore center
            const randomOffsetLat = (Math.random() - 0.5) * 0.05;
            const randomOffsetLng = (Math.random() - 0.5) * 0.05;
            resolve({ lat: 12.9716 + randomOffsetLat, lng: 77.5946 + randomOffsetLng });
          },
          { timeout: 5000 }
        );
      } else {
        const randomOffsetLat = (Math.random() - 0.5) * 0.05;
        const randomOffsetLng = (Math.random() - 0.5) * 0.05;
        resolve({ lat: 12.9716 + randomOffsetLat, lng: 77.5946 + randomOffsetLng });
      }
    });
  }

  // Simulated AI Image verification using HTML5 Canvas drawing
  drawSimulatedObject(canvas, type) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = "#0c120e";
    ctx.fillRect(0, 0, w, h);
    
    // Grid overlay lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (type === "tree") {
      // Draw a simulated sapling
      // Soil mound
      ctx.fillStyle = "#4a2d11";
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 30, 80, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wooden Trunk
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(w / 2 - 8, h - 130, 16, 100);
      
      // Leaves/Canopy
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(w / 2, h - 140, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(w / 2 - 20, h - 150, 30, 0, Math.PI * 2);
      ctx.arc(w / 2 + 20, h - 135, 35, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw small sapling leaf
      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.ellipse(w / 2 - 10, h - 60, 15, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(w / 2 + 15, h - 85, 12, 5, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "garbage") {
      // Draw garbage heap
      ctx.fillStyle = "#374151"; // Trash bags
      ctx.beginPath();
      ctx.arc(w / 2 - 30, h - 45, 30, 0, Math.PI * 2);
      ctx.arc(w / 2 + 20, h - 50, 35, 0, Math.PI * 2);
      ctx.fill();
      
      // Scattered items
      ctx.fillStyle = "#ef4444"; // plastic cup
      ctx.beginPath();
      ctx.moveTo(w / 2 - 60, h - 30);
      ctx.lineTo(w / 2 - 50, h - 30);
      ctx.lineTo(w / 2 - 52, h - 15);
      ctx.lineTo(w / 2 - 58, h - 15);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3b82f6"; // crumpled plastic bottle
      ctx.fillRect(w / 2 - 10, h - 25, 25, 12);
      ctx.fillStyle = "#fff"; // cap
      ctx.fillRect(w / 2 + 15, h - 22, 4, 6);
      
      // Flies dots
      ctx.fillStyle = "#000";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 - 40 + Math.random() * 80, h - 90 - Math.random() * 40, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "emergency_pothole") {
      // Pothole
      ctx.fillStyle = "#030712";
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 60, 90, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cracked lines
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 90, h - 60);
      ctx.lineTo(w / 2 - 120, h - 70);
      ctx.moveTo(w / 2 + 90, h - 60);
      ctx.lineTo(w / 2 + 130, h - 50);
      ctx.stroke();
    } else {
      // General abstract icon
      ctx.strokeStyle = varColorHex("--primary");
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, w - 100, h - 100);
    }
  }

  // Start real webcam stream or fallback to simulation
  async startCamera(videoElement, canvasElement, scanType) {
    if (this.activeStream) {
      this.stopCamera();
    }
    
    const context = canvasElement.getContext("2d");
    canvasElement.width = 400;
    canvasElement.height = 250;
    
    // Attempt standard webcam stream
    try {
      this.activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      videoElement.srcObject = this.activeStream;
      videoElement.style.display = "block";
      videoElement.play();
      
      // Periodically copy frame to canvas
      const drawFrame = () => {
        if (this.activeStream) {
          context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          requestAnimationFrame(drawFrame);
        }
      };
      videoElement.onloadedmetadata = () => {
        drawFrame();
      };
      return true; // webcam active
    } catch (e) {
      // Fallback: draw animated simulation scene on canvas
      videoElement.style.display = "none";
      this.drawSimulatedObject(canvasElement, scanType);
      return false; // using simulation fallback
    }
  }

  // Stop camera stream
  stopCamera() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
  }

  // Points and level manager logic
  addPoints(amount, activityDesc, activityType = "points-gain") {
    this.state.points += amount;
    
    // Determine level thresholds (e.g., Lvl 1: 0-499, Lvl 2: 500-999, Lvl 3: 1000-1499, etc.)
    const oldLevel = this.state.level;
    this.state.level = Math.floor(this.state.points / 500) + 1;
    
    // Create activity record
    this.addActivityRecord(activityDesc, activityType);

    if (this.state.level > oldLevel) {
      this.addActivityRecord(`Level Up! You are now Level ${this.state.level} (${this.getBadgeName(this.state.level)})!`, "system-alert");
      this.triggerConfettiToast(`Level Up! You reached Level ${this.state.level}! 🎉`);
    }
    
    this.saveState();
  }

  getBadgeName(level) {
    if (level >= 10) return "🌳 Grand Eco-Guardian";
    if (level >= 7) return "🌿 Leaf Legend";
    if (level >= 4) return "🗑&zwj;♂️ Spotless Knight";
    if (level >= 2) return "♻️ Recycle Ranger";
    return "🌱 Green Novice";
  }

  addActivityRecord(desc, type) {
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const feed = document.getElementById("activity-feed");
    
    if (feed) {
      // Remove empty message if any
      const empty = feed.querySelector(".empty-msg");
      if (empty) empty.remove();
      
      const itemHtml = `
        <div class="activity-item ${type}">
          <span class="activity-desc">${desc}</span>
          <span class="activity-time">${timestampStr}</span>
        </div>
      `;
      feed.insertAdjacentHTML("afterbegin", itemHtml);
    }
  }

  triggerConfettiToast(message) {
    // Generate notification toast
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast toast-success";
    toast.innerHTML = `
      <i class="fa-solid fa-trophy green-glow"></i>
      <div class="toast-message">${message}</div>
      <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  // Simulated background worker representing municipal cleanup and validation
  initMunicipalSimulation() {
    this.municipalInterval = setInterval(() => {
      let stateChanged = false;
      
      // Simulate garbage complaints cleanup cycles
      this.state.garbageReports.forEach(report => {
        if (report.status === "submitted" && Math.random() < 0.3) {
          report.status = "progress";
          this.addActivityRecord(`Municipal staff assigned to clean garbage at ${report.description}`, "system-alert");
          this.showToast(`Staff Dispatched: Cleanup initiated at '${report.description}'`, "info");
          stateChanged = true;
        } else if (report.status === "progress" && Math.random() < 0.25) {
          report.status = "cleaned";
          stateChanged = true;
          this.state.totalComplaints++;
          // Credit points automatically for verified cleanup
          this.addPoints(50, `Municipal clean-up verified at ${report.description} (+50 pts)`, "cleanup");
          this.showToast(`Cleanup Verified! Trash at '${report.description}' cleared. +50 Pts credited!`, "success");
        }
      });

      // Simulate Emergency tickets repair cycles
      this.state.emergencyTickets.forEach(ticket => {
        if (ticket.status === "submitted" && Math.random() < 0.35) {
          ticket.status = "progress";
          ticket.logs.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Municipal maintenance dispatch unit has been deployed to the site."
          });
          this.showToast(`Emergency crew deployed to fix: ${this.formatEmergencyCategory(ticket.category)}`, "warning");
          stateChanged = true;
        } else if (ticket.status === "progress" && Math.random() < 0.3) {
          ticket.status = "cleaned"; // Cleaned represents "Resolved"
          ticket.logs.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: "Repair completed. Site inspected and confirmed operational by city inspectors."
          });
          this.state.totalComplaints++;
          this.addPoints(100, `Civic emergency ticket #${ticket.id} resolved (+100 pts)`, "system-alert");
          this.showToast(`Issue resolved! Ticket #${ticket.id} is closed. +100 Pts credited!`, "success");
          stateChanged = true;
        }
      });

      if (stateChanged) {
        this.saveState();
      }
    }, 20000); // Trigger checks every 20 seconds
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const iconMap = {
      success: "fa-circle-check",
      info: "fa-circle-info",
      warning: "fa-triangle-exclamation",
      danger: "fa-skull-crossbones"
    };
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${iconMap[type]}"></i>
      <div class="toast-message">${message}</div>
      <div class="toast-close"><i class="fa-solid fa-xmark"></i></div>
    `;
    
    container.appendChild(toast);
    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    setTimeout(() => toast.remove(), 4500);
  }

  formatEmergencyCategory(cat) {
    const mapping = {
      water_leak: "Water Leakage",
      electricity: "Power Spark",
      streetlight: "Broken Streetlight",
      pothole: "Severe Pothole",
      sewage: "Sewage Overflow",
      illegal_dump: "Illegal waste dump"
    };
    return mapping[cat] || cat;
  }
}

// Make globally available
window.EcoVerseSimulator = new EcoVerseSimulator();
