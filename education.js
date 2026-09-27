// EcoVerse Education Page Logic (Encyclopedia, Quiz & Leaderboard)

document.addEventListener("DOMContentLoaded", () => {
  // education.html does NOT load simulation.js — use auth.js adapter
  const sim  = window.EcoVerseAuth;
  const data = window.EcoVerseData;

  // Normalise state access: adapter stores it as .user, simulator as .state
  const getState = () => sim.state || sim.user;

  let currentQuizIndex = 0;
  let originalQuizMarkup = null;

  initEducation();

  function initEducation() {
    const quizBlock = document.getElementById("quiz-block");
    if (quizBlock) originalQuizMarkup = quizBlock.innerHTML;

    renderPlantEncyclopedia();
    setupQuiz();
    updateLeaderboard();
    setupEventHandlers();
  }

  function setupEventHandlers() {
    // Sub-navigation tabs
    document.querySelectorAll(".k-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".k-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-subtab");
        document.querySelectorAll(".subtab-panel").forEach(sp => sp.classList.remove("active"));
        const panel = document.getElementById(`${target}-subtab`);
        if (panel) panel.classList.add("active");
        if (target === "leaderboard") updateLeaderboard();
      });
    });

    // Wikipedia Plant Search
    const btnSearch  = document.getElementById("btn-search-plant");
    const inputPlant = document.getElementById("plant-search-input");
    if (btnSearch && inputPlant) {
      btnSearch.addEventListener("click",  () => queryWikipediaPlant(inputPlant.value.trim()));
      inputPlant.addEventListener("keypress", (e) => { if (e.key === "Enter") queryWikipediaPlant(inputPlant.value.trim()); });
    }

    // Plant detail modal close
    const cModal = document.getElementById("btn-close-modal");
    if (cModal) cModal.addEventListener("click", () => document.getElementById("plant-detail-modal").classList.remove("active"));
  }

  // ── Plant Encyclopedia ──────────────────────────────────────────────────────

  function renderPlantEncyclopedia() {
    const container = document.getElementById("plants-grid");
    if (!container) return;

    container.innerHTML = data.plants.map(p => `
      <div class="plant-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View ${p.name} details">
        <img src="${p.image}" class="plant-cover-img" alt="${p.name}" loading="lazy">
        <div class="plant-body">
          <div class="plant-title-row">
            <span class="plant-name">${p.name}</span>
          </div>
          <span class="plant-scientific">${p.scientificName}</span>
          <p class="plant-snippet">${p.funFact.substring(0, 120)}${p.funFact.length > 120 ? "…" : ""}</p>
          <div style="margin-top:auto; border-top:1px solid rgba(255,255,255,0.03); padding-top:10px; display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-secondary);">
            <span><i class="fa-solid fa-wind" style="color:var(--primary); margin-right:4px;"></i>O₂: High</span>
            <span><i class="fa-solid fa-droplet" style="color:var(--secondary); margin-right:4px;"></i>${p.waterRequirement.split(" ")[0]}</span>
          </div>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".plant-card").forEach(card => {
      card.addEventListener("click", () => showPlantModal(card.getAttribute("data-id")));
    });
  }

  function showPlantModal(id) {
    const plant = data.plants.find(p => p.id === id);
    if (!plant) return;

    const modalBody = document.getElementById("plant-detail-body");
    modalBody.innerHTML = `
      <div style="display:flex; gap:20px; margin-bottom:24px; flex-wrap:wrap;">
        <img src="${plant.image}" style="width:140px; height:140px; border-radius:var(--radius-md); object-fit:cover; border:1px solid var(--border-color);" alt="${plant.name}">
        <div style="flex:1; min-width:200px;">
          <h2 style="margin-bottom:4px;">${plant.name}</h2>
          <p style="font-style:italic; color:var(--text-secondary); margin-bottom:14px; font-size:0.9rem;">${plant.scientificName}</p>
          <div style="background:rgba(16,185,129,0.06); border:1px dashed var(--primary); border-radius:var(--radius-sm); padding:10px 14px; font-size:0.82rem; color:var(--primary); display:flex; gap:8px;">
            <i class="fa-solid fa-lightbulb"></i>
            <span>${plant.funFact}</span>
          </div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:12px;">
        ${[
          ["Medicinal Uses",        plant.medicinalUses],
          ["Root & Bark Uses",      plant.rootsBarkUses],
          ["Oxygen Production",     plant.oxygenProduction],
          ["Carbon Absorbed/Year",  plant.carbonAbsorbed],
          ["Water Requirement",     plant.waterRequirement],
          ["Best Planting Season",  plant.bestSeason]
        ].map(([lbl, val]) => `
          <div style="padding:12px; background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.03); border-radius:var(--radius-sm);">
            <span style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; display:block; margin-bottom:4px;">${lbl}</span>
            <span style="font-size:0.82rem; color:#fff; line-height:1.4;">${val}</span>
          </div>
        `).join("")}
      </div>
    `;
    document.getElementById("plant-detail-modal").classList.add("active");
  }

  // ── Quizzes ─────────────────────────────────────────────────────────────────

  function setupQuiz() {
    const quizBlock = document.getElementById("quiz-block");
    if (!quizBlock) return;

    const quiz = data.quizzes[currentQuizIndex];
    if (!quiz) {
      quizBlock.innerHTML = `
        <div style="text-align:center; padding:50px 20px;">
          <i class="fa-solid fa-champagne-glasses" style="font-size:3.5rem; color:var(--primary); filter:drop-shadow(0 0 10px var(--primary)); margin-bottom:20px; display:block;"></i>
          <h2 style="margin-bottom:12px;">All Quizzes Completed! 🎉</h2>
          <p class="text-muted" style="margin-bottom:24px;">Check back for new questions every week.</p>
          <button class="btn btn-primary" id="btn-restart-quiz">Retake Quizzes</button>
        </div>
      `;
      document.getElementById("btn-restart-quiz").addEventListener("click", () => {
        if (originalQuizMarkup) quizBlock.innerHTML = originalQuizMarkup;
        currentQuizIndex = 0;
        setupQuiz();
      });
      return;
    }

    // Update progress
    const elIdx   = document.getElementById("quiz-curr-idx");
    const elTotal = document.getElementById("quiz-total-count");
    const elQ     = document.getElementById("quiz-question-txt");
    if (elIdx)   elIdx.textContent   = currentQuizIndex + 1;
    if (elTotal) elTotal.textContent = data.quizzes.length;
    if (elQ)     elQ.textContent     = quiz.question;

    const feedbackBox = document.getElementById("quiz-feedback-box");
    if (feedbackBox) { feedbackBox.style.display = "none"; feedbackBox.className = "quiz-feedback-box"; }

    const skipBtn = document.getElementById("btn-skip-quiz");
    if (skipBtn) skipBtn.style.display = "block";

    // Render options
    const optionsContainer = document.getElementById("quiz-options-container");
    optionsContainer.innerHTML = quiz.options.map((opt, idx) => `
      <div class="quiz-option" data-idx="${idx}" style="padding:14px 18px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:var(--radius-sm); font-size:0.9rem; color:var(--text-primary); cursor:pointer; display:flex; align-items:center; gap:12px; transition:all var(--transition-fast);">
        <i class="fa-regular fa-circle"></i>
        <span>${opt}</span>
      </div>
    `).join("");

    let selectedOptionIdx = null;
    const options = document.querySelectorAll(".quiz-option");

    options.forEach(opt => {
      opt.addEventListener("click", () => {
        if (feedbackBox && feedbackBox.style.display === "block") return;
        options.forEach(o => {
          o.classList.remove("selected");
          o.style.borderColor = "rgba(255,255,255,0.05)";
          o.style.background  = "rgba(255,255,255,0.02)";
          o.querySelector("i").className = "fa-regular fa-circle";
        });
        opt.classList.add("selected");
        opt.style.borderColor = "var(--secondary)";
        opt.style.background  = "rgba(59,130,246,0.1)";
        opt.querySelector("i").className = "fa-regular fa-circle-dot";
        selectedOptionIdx = parseInt(opt.getAttribute("data-idx"));
        if (nextBtn) nextBtn.disabled = false;
      });
    });

    // Clone to reset listeners
    const oldNext = document.getElementById("btn-next-quiz");
    const nextBtn = oldNext.cloneNode(true);
    oldNext.parentNode.replaceChild(nextBtn, oldNext);
    nextBtn.disabled = true;
    nextBtn.textContent = "Verify Answer";

    nextBtn.addEventListener("click", () => {
      if (nextBtn.textContent === "Next Question") {
        currentQuizIndex++;
        setupQuiz();
        return;
      }

      // Reveal answers
      options.forEach(o => {
        const idx = parseInt(o.getAttribute("data-idx"));
        if (idx === quiz.correctAnswer) {
          o.style.background  = "rgba(16,185,129,0.1)";
          o.style.borderColor = "var(--primary)";
          o.querySelector("i").className = "fa-solid fa-circle-check";
          o.querySelector("i").style.color = "var(--primary)";
        } else if (idx === selectedOptionIdx) {
          o.style.background  = "rgba(239,68,68,0.1)";
          o.style.borderColor = "var(--danger)";
          o.querySelector("i").className = "fa-solid fa-circle-xmark";
          o.querySelector("i").style.color = "var(--danger)";
        }
      });

      const isCorrect = selectedOptionIdx === quiz.correctAnswer;

      feedbackBox.style.display = "block";
      if (skipBtn) skipBtn.style.display = "none";

      const icon = document.getElementById("feedback-icon");
      const head = document.getElementById("feedback-heading");
      const desc = document.getElementById("feedback-desc-txt");

      if (isCorrect) {
        feedbackBox.style.background  = "rgba(16,185,129,0.05)";
        feedbackBox.style.border      = "1px solid var(--border-color)";
        if (icon) { icon.className = "fa-solid fa-thumbs-up"; icon.style.color = "var(--primary)"; }
        if (head) { head.textContent = "Correct! +20 Eco Points"; head.style.color = "var(--primary)"; }
        sim.addPoints(20, `Answered eco-quiz question correctly (+20 pts)`, "points-gain");
        sim.triggerToastNotification("Correct answer! +20 Eco Points credited.", "success");
      } else {
        feedbackBox.style.background  = "rgba(239,68,68,0.05)";
        feedbackBox.style.border      = "1px solid var(--danger-glow)";
        if (icon) { icon.className = "fa-solid fa-triangle-exclamation"; icon.style.color = "var(--danger)"; }
        if (head) { head.textContent = "Incorrect"; head.style.color = "var(--danger)"; }
        sim.triggerToastNotification("Oops! That was incorrect.", "danger");
      }
      if (desc) desc.textContent = quiz.explanation;

      nextBtn.textContent  = "Next Question";
      nextBtn.disabled     = false;
    });

    // Skip button
    const oldSkip = document.getElementById("btn-skip-quiz");
    const newSkip = oldSkip.cloneNode(true);
    oldSkip.parentNode.replaceChild(newSkip, oldSkip);
    newSkip.addEventListener("click", () => { currentQuizIndex++; setupQuiz(); });
  }

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  function updateLeaderboard() {
    const listEl = document.getElementById("leaderboard-list-container");
    if (!listEl) return;

    const board = [...data.leaderboard];
    const state = getState();
    const youIdx = board.findIndex(u => u.name === "You");
    if (youIdx !== -1) {
      board[youIdx].points = state.points;
      board[youIdx].level  = state.level;
      board[youIdx].badge  = sim.getBadgeName(state.level);
    }

    board.sort((a, b) => b.points - a.points);

    listEl.innerHTML = board.map((u, i) => `
      <div class="leaderboard-row ${u.name === "You" ? "user-row" : ""}">
        <span class="row-rank">${i + 1}</span>
        <span class="row-name">${u.name}</span>
        <span class="row-level">${u.level}</span>
        <span class="row-pts">${u.points.toLocaleString()}</span>
        <span class="row-badge">${u.badge}</span>
      </div>
    `).join("");
  }

  // ── Wikipedia Plant Research ─────────────────────────────────────────────────

  async function queryWikipediaPlant(plantName) {
    if (!plantName) return;
    const searchBtn = document.getElementById("btn-search-plant");
    searchBtn.disabled = true;
    searchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Searching...`;

    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(plantName + " plant")}&format=json&origin=*`
      );
      if (!searchRes.ok) throw new Error("Search API error");
      const searchData = await searchRes.json();

      if (!searchData.query?.search?.length) {
        sim.triggerToastNotification("No plant found on Wikipedia. Try a different name.", "danger");
        return;
      }

      const bestTitle  = searchData.query.search[0].title;
      const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
      if (!summaryRes.ok) throw new Error("Summary error");
      const summary = await summaryRes.json();

      if (summary?.title) {
        const newPlant = {
          id: "wiki_" + Date.now(),
          name: summary.title,
          scientificName: summary.description || "Botanical species",
          oxygenProduction: "High (assimilated from leaf surface area)",
          carbonAbsorbed: "Approximately 8–15 kg CO₂ per year",
          fruitsFlowers: "Varies by subspecies",
          medicinalUses: "Contains therapeutic compounds documented in botanical studies.",
          leavesUses: "Used in organic mulching and soil enrichment.",
          rootsBarkUses: "Aids soil stabilisation and moisture retention.",
          diseasesHelped: "General antioxidant, environmental stress reducer.",
          waterRequirement: "Moderate (adapts to native precipitation)",
          fertilizerRequirement: "Balanced organic matter annually",
          bestSeason: "Early spring or pre-monsoon",
          funFact: summary.extract || "No additional description available.",
          image: summary.thumbnail?.source || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&auto=format&fit=crop&q=60"
        };

        data.plants.unshift(newPlant);
        renderPlantEncyclopedia();

        setTimeout(() => {
          const newCard = document.querySelector(`.plant-card[data-id="${newPlant.id}"]`);
          if (newCard) { newCard.scrollIntoView({ behavior: "smooth" }); newCard.click(); }
        }, 200);

        sim.addPoints(10, `Researched ${newPlant.name} on Wikipedia (+10 pts)`, "points-gain");
        sim.triggerToastNotification(`Added ${newPlant.name} from Wikipedia! +10 Eco Points`, "success");
        document.getElementById("plant-search-input").value = "";
      }
    } catch (err) {
      console.error("Wikipedia query error:", err);
      sim.triggerToastNotification("Could not retrieve plant details. Check your connection.", "danger");
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerHTML = `<i class="fa-solid fa-globe"></i> Query Wikipedia`;
    }
  }
});
