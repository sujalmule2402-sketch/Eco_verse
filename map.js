// EcoVerse Leaflet Map Integration

class EcoVerseMapManager {
  constructor() {
    this.treeMap = null;
    this.ewasteMap = null;
    this.treeMarkers = [];
    this.garbageMarkers = [];
    this.ewasteMarkers = [];
    
    // Custom DIV Icons using FontAwesome for zero-dependency glowing markers
    this.icons = {
      tree: L.divIcon({
        className: 'custom-map-marker marker-tree',
        html: '<div class="marker-pin"><i class="fa-solid fa-tree"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      }),
      garbageSubmitted: L.divIcon({
        className: 'custom-map-marker marker-garbage submitted',
        html: '<div class="marker-pin"><i class="fa-solid fa-trash-can"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      }),
      garbageProgress: L.divIcon({
        className: 'custom-map-marker marker-garbage progress',
        html: '<div class="marker-pin"><i class="fa-solid fa-person-digging"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      }),
      garbageCleaned: L.divIcon({
        className: 'custom-map-marker marker-garbage cleaned',
        html: '<div class="marker-pin"><i class="fa-solid fa-circle-check"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      }),
      ewaste: L.divIcon({
        className: 'custom-map-marker marker-ewaste',
        html: '<div class="marker-pin"><i class="fa-solid fa-charging-station"></i></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      }),
      user: L.divIcon({
        className: 'custom-map-marker marker-user',
        html: '<div class="marker-pulse"></div><div class="marker-core"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    };
  }

  // Initialize both maps
  initMaps() {
    const defaultCenter = [12.9716, 77.5946]; // Bangalore center
    
    // 1. Tree & Incident Map
    if (document.getElementById("tree-map") && !this.treeMap) {
      this.treeMap = L.map("tree-map", { attributionControl: false }).setView(defaultCenter, 13);
      
      // Beautiful Dark Matter Tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(this.treeMap);

      this.plotTreesAndGarbage();
    }

    // 2. E-Waste Centers Map
    if (document.getElementById("ewaste-map") && !this.ewasteMap) {
      this.ewasteMap = L.map("ewaste-map", { attributionControl: false }).setView(defaultCenter, 13);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(this.ewasteMap);

      this.plotEWasteCenters();
    }
  }

  // Forces Leaflet to recalculate canvas sizing when tab switches
  invalidateMapSizes() {
    setTimeout(() => {
      if (this.treeMap) this.treeMap.invalidateSize();
      if (this.ewasteMap) this.ewasteMap.invalidateSize();
    }, 50);
  }

  // Center maps around user coordinates
  setUserCenter(lat, lng) {
    if (this.treeMap) {
      this.treeMap.setView([lat, lng], 14);
      L.marker([lat, lng], { icon: this.icons.user }).addTo(this.treeMap)
        .bindPopup("<h3>Your Current Location</h3><p>Verified City Citizen</p>").openPopup();
    }
    if (this.ewasteMap) {
      this.ewasteMap.setView([lat, lng], 14);
      L.marker([lat, lng], { icon: this.icons.user }).addTo(this.ewasteMap)
        .bindPopup("<h3>Your Current Location</h3>");
    }
  }

  // Plot trees and garbage reports on the Tree Map
  plotTreesAndGarbage() {
    if (!this.treeMap) return;
    
    // Clear old markers
    this.treeMarkers.forEach(m => this.treeMap.removeLayer(m));
    this.garbageMarkers.forEach(m => this.treeMap.removeLayer(m));
    this.treeMarkers = [];
    this.garbageMarkers = [];

    const state = window.EcoVerseSimulator.state;

    // Plot Trees
    state.trees.forEach(tree => {
      const dateStr = new Date(tree.timestamp).toLocaleDateString();
      const marker = L.marker([tree.lat, tree.lng], { icon: this.icons.tree })
        .addTo(this.treeMap)
        .bindPopup(`
          <h3>🌳 ${tree.species}</h3>
          <p><strong>Planted by:</strong> You</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Status:</strong> Active & Monitored</p>
        `);
      this.treeMarkers.push(marker);
    });

    // Plot Garbage
    state.garbageReports.forEach(report => {
      let icon = this.icons.garbageSubmitted;
      let statusStr = "Submitted (Awaiting Staff)";
      if (report.status === "progress") {
        icon = this.icons.garbageProgress;
        statusStr = "In Progress (Staff Working)";
      } else if (report.status === "cleaned") {
        icon = this.icons.garbageCleaned;
        statusStr = "Cleaned (Resolved)";
      }

      const marker = L.marker([report.lat, report.lng], { icon: icon })
        .addTo(this.treeMap)
        .bindPopup(`
          <h3>🗑️ Garbage Spot Report</h3>
          <p><strong>Location:</strong> ${report.description}</p>
          <p><strong>Size:</strong> ${report.severity.toUpperCase()}</p>
          <p><strong>Status:</strong> ${statusStr}</p>
        `);
      this.garbageMarkers.push(marker);
    });
  }

  // Plot static authorized e-waste centers on the E-Waste Map
  plotEWasteCenters() {
    if (!this.ewasteMap) return;

    this.ewasteMarkers.forEach(m => this.ewasteMap.removeLayer(m));
    this.ewasteMarkers = [];

    const centers = window.EcoVerseData.eWasteCenters;

    centers.forEach(center => {
      const itemsList = center.acceptedItems.join(", ");
      const marker = L.marker([center.lat, center.lng], { icon: this.icons.ewaste })
        .addTo(this.ewasteMap)
        .bindPopup(`
          <h3>⚡ ${center.name}</h3>
          <p><strong>Address:</strong> ${center.address}</p>
          <p><strong>Accepts:</strong> ${itemsList}</p>
          <p><strong>Rewards Rate:</strong> ${center.pointsPerKg} Pts/Kg</p>
          <p><strong>Phone:</strong> ${center.phone}</p>
        `);
      
      // Storing center ID on marker object for interactivity
      marker.centerId = center.id;
      this.ewasteMarkers.push(marker);
    });
  }

  // Highlight a specific e-waste center marker
  focusEwasteCenter(centerId) {
    const marker = this.ewasteMarkers.find(m => m.centerId === centerId);
    if (marker && this.ewasteMap) {
      this.ewasteMap.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }
}

// Add map styles directly to CSS or inject via code.
// Let's inject custom marker styling in stylesheet, but we can verify it's covered in styles.css.
window.EcoVerseMap = new EcoVerseMapManager();
