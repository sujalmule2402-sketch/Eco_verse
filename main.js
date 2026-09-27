// EcoVerse Shared Header & AQI Widget Controller
// Works on every page (index, portal, education, calculator).
// Must be loaded last, after auth.js (and simulation.js where applicable).

document.addEventListener("DOMContentLoaded", () => {
  // EcoVerseAuth is either the simulator alias or the lite adapter — either way works
  const auth = window.EcoVerseAuth;
  if (!auth) return;

  // Sync header stats immediately + on any profile change
  updateGlobalHeaderStats();
  window.addEventListener("ecoverseStateChanged", updateGlobalHeaderStats);

  // Fetch live Air Quality for the header widget
  fetchAQI();

  function updateGlobalHeaderStats() {
    const state  = auth.state || auth.user; // handle both simulator & adapter
    const ptsEl  = document.getElementById("header-points");
    const lvlEl  = document.getElementById("header-level");
    if (ptsEl && state) ptsEl.textContent = state.points.toLocaleString();
    if (lvlEl && state) lvlEl.textContent = state.level;
  }

  async function fetchAQI() {
    // Default to Bangalore if no location stored
    let lat = 12.9716, lng = 77.5946;

    try {
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5`
      );
      if (!res.ok) throw new Error("AQI fetch failed");
      const data = await res.json();

      const aqi  = data?.current?.us_aqi;
      const pm25 = data?.current?.pm2_5;
      if (aqi === undefined) return;

      const valEl  = document.querySelector(".aqi-val");
      const dotEl  = document.querySelector(".aqi-dot");
      const descEl = document.querySelector(".aqi-desc");

      if (valEl) valEl.textContent = aqi;

      let rating = "Good", cls = "good";
      if (aqi > 150) { rating = "Unhealthy"; cls = "poor"; }
      else if (aqi > 50) { rating = "Moderate"; cls = "moderate"; }

      if (dotEl)  dotEl.className = `aqi-dot ${cls}`;
      if (descEl) descEl.textContent = `${rating} • PM2.5: ${pm25?.toFixed(1) ?? "--"} µg/m³`;
    } catch (e) {
      console.warn("AQI widget error:", e.message);
      const descEl = document.querySelector(".aqi-desc");
      if (descEl) descEl.textContent = "Live data unavailable";
    }
  }
});
