// EcoVerse Carbon Footprint Calculator Logic

document.addEventListener("DOMContentLoaded", () => {
  const auth = window.EcoVerseAuth;

  // Slider Elements
  const slideElectricity = document.getElementById("slide-electricity");
  const slideFuel = document.getElementById("slide-fuel");
  const slideTransit = document.getElementById("slide-transit");
  const slideWaste = document.getElementById("slide-waste");

  // Value Display Elements
  const valElectricity = document.getElementById("val-electricity");
  const valFuel = document.getElementById("val-fuel");
  const valTransit = document.getElementById("val-transit");
  const valWaste = document.getElementById("val-waste");

  // Result Displays
  const textScore = document.getElementById("carbon-total-score");
  const barUser = document.getElementById("bar-user");
  const barUserLabel = document.getElementById("lbl-user-bar");
  const containerRecs = document.getElementById("recs-container");

  // Bind Events
  if (slideElectricity && slideFuel && slideTransit && slideWaste) {
    const inputs = [slideElectricity, slideFuel, slideTransit, slideWaste];
    inputs.forEach(input => {
      input.addEventListener("input", calculateCarbonFootprint);
    });

    // Initial calculation
    calculateCarbonFootprint();
  }

  function calculateCarbonFootprint() {
    // 1. Get values
    const kwh = parseFloat(slideElectricity.value);
    const fuelKm = parseFloat(slideFuel.value);
    const transitKm = parseFloat(slideTransit.value);
    const recycleKg = parseFloat(slideWaste.value);

    // Update value labels
    valElectricity.textContent = `${kwh} KWh`;
    valFuel.textContent = `${fuelKm} Km`;
    valTransit.textContent = `${transitKm} Km`;
    valWaste.textContent = `${recycleKg} Kg`;

    // 2. Calculations (Monthly CO2 equivalents in Kg)
    // Electricity: Avg 0.82 Kg CO2 per KWh
    const cElectricity = kwh * 0.82;
    // Private Vehicle (Car): Avg 0.17 Kg CO2 per Km
    const cFuel = fuelKm * 0.17;
    // Public Transit (Bus/Metro): Avg 0.05 Kg CO2 per Km
    const cTransit = transitKm * 0.05;
    // Waste offset: recycling 1kg waste saves ~1.2kg CO2 emissions
    const cWasteOffset = recycleKg * 1.2;

    // Total monthly footprint in Kg (lower limit 0)
    let totalKg = cElectricity + cFuel + cTransit - cWasteOffset;
    if (totalKg < 0) totalKg = 0;

    // Convert to Metric Tons per year (Monthly Kg * 12 / 1000)
    const annualTons = (totalKg * 12) / 1000;

    // 3. Render Output
    textScore.textContent = annualTons.toFixed(1);

    // 4. Update Comparative Bar (Max display width represented by 10 Tons)
    const percent = Math.min((annualTons / 10) * 100, 100);
    barUser.style.width = `${percent}%`;
    barUserLabel.textContent = `${annualTons.toFixed(1)} Tons`;

    // Set colors of user bar based on footprint
    if (annualTons > 4.5) {
      barUser.style.background = "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)"; // Orange to Red (High)
    } else if (annualTons > 2.0) {
      barUser.style.background = "linear-gradient(90deg, #3b82f6 0%, #f59e0b 100%)"; // Blue to Orange (Moderate)
    } else {
      barUser.style.background = "linear-gradient(90deg, #10b981 0%, #34d399 100%)"; // Green (Excellent)
    }

    // 5. Generate Dynamic Recommendations
    generateRecommendations(cElectricity, cFuel, cTransit, recycleKg);
  }

  function generateRecommendations(elec, fuel, transit, recycle) {
    const recs = [];

    // Check major emission sources
    if (elec > 150) {
      recs.push({
        icon: "fa-lightbulb",
        text: "Your household electricity is a major contributor. Switch to energy-star appliances, install LED bulbs, and turn off standby devices."
      });
    }

    if (fuel > 120) {
      recs.push({
        icon: "fa-car",
        text: "Private vehicular travel is elevated. Try pooling, bicycle transit for distances under 3km, or schedule tasks to reduce individual trips."
      });
    }

    if (transit > 80) {
      recs.push({
        icon: "fa-bus",
        text: "You travel frequently via public transit. Keep it up! This is 70% cleaner per km than driving your own car."
      });
    }

    if (recycle < 15) {
      recs.push({
        icon: "fa-recycle",
        text: "Your organic and dry recycling rate is low. Begin separating plastic bottles, paper, and metal cans to save landfill emissions."
      });
    } else {
      recs.push({
        icon: "fa-circle-check",
        text: "Excellent waste separation habits! Composting household organic waste further mitigates methane release."
      });
    }

    // Render list
    containerRecs.innerHTML = recs.map(r => `
      <div class="rec-card">
        <div class="rec-icon">
          <i class="fa-solid ${r.icon}"></i>
        </div>
        <div class="rec-text">${r.text}</div>
      </div>
    `).join("");
  }
});
