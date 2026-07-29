(function () {
  const data = window.AFL_DATA;
  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const slots = data.positions.flatMap((position) =>
    Array.from({ length: position.count }, (_, index) => ({
      id: `${position.key}${index + 1}`,
      key: position.key,
      label: position.label,
      displayLabel: `${position.label} ${index + 1}`,
      player: null
    }))
  );
  const LEGEND_RUN_CHANCE = 1 / 20;
  const LEGEND_SPIN_CHANCE = 1 - Math.pow(1 - LEGEND_RUN_CHANCE, 1 / slots.length);

  let currentSpin = null;
  let selectedPlayer = null;
  let ratingMode = "career";
  let pendingGrandFinal = null;
  let legendRolledThisDraft = false;
  let rerollAvailable = true;
  let simTimer = null;
  let simulationActive = false;
  let seasonFinished = false;
  let seasonPrediction = null;
  let seasonStrategy = "balanced";
  let resultsTab = "player-stats";
  let currentCandidates = [];
  let candidateSort = "ALL";

  const els = {
    squadCount: document.getElementById("squadCount"),
    resetBtn: document.getElementById("resetBtn"),
    spinBtn: document.getElementById("spinBtn"),
    skipBtn: document.getElementById("skipBtn"),
    normalModeBtn: document.getElementById("normalModeBtn"),
    hardModeBtn: document.getElementById("hardModeBtn"),
    spinCard: document.getElementById("spinCard"),
    spinTitle: document.getElementById("spinTitle"),
    spinMeta: document.getElementById("spinMeta"),
    playerOptions: document.getElementById("playerOptions"),
    positionSort: document.getElementById("positionSort"),
    pickHelp: document.getElementById("pickHelp"),
    teamGrid: document.getElementById("teamGrid"),
    overallRating: document.getElementById("overallRating"),
    attackRating: document.getElementById("attackRating"),
    midRating: document.getElementById("midRating"),
    defenceRating: document.getElementById("defenceRating"),
    simulateBtn: document.getElementById("simulateBtn"),
    quickSimBtn: document.getElementById("quickSimBtn"),
    speechPanel: document.getElementById("speechPanel"),
    simSection: document.getElementById("simSection"),
    simLog: document.getElementById("simLog")
  };

  const roleStatBase = {
    FB: { gl: 0.05, ki: 8.7, hb: 6.3, mk: 5.8, tk: 3.1, ho: 0.2, cl: 0.35, i50: 0.65, r50: 3.2, ga: 0.05, cp: 5.4 },
    HB: { gl: 0.12, ki: 12.1, hb: 7.6, mk: 5.2, tk: 3.0, ho: 0.05, cl: 0.7, i50: 1.7, r50: 4.8, ga: 0.13, cp: 5.0 },
    M: { gl: 0.45, ki: 12.3, hb: 11.4, mk: 4.2, tk: 5.0, ho: 0.1, cl: 4.3, i50: 4.0, r50: 1.6, ga: 0.35, cp: 10.5 },
    R: { gl: 0.25, ki: 6.5, hb: 7.2, mk: 3.4, tk: 3.7, ho: 27.0, cl: 3.2, i50: 1.7, r50: 0.7, ga: 0.18, cp: 8.0 },
    HF: { gl: 0.95, ki: 10.5, hb: 6.5, mk: 4.8, tk: 3.5, ho: 0.1, cl: 1.1, i50: 3.7, r50: 0.8, ga: 0.65, cp: 6.3 },
    FF: { gl: 2.15, ki: 7.2, hb: 4.0, mk: 5.6, tk: 2.3, ho: 0.4, cl: 0.45, i50: 1.8, r50: 0.25, ga: 0.35, cp: 5.5 }
  };

  const mediaPanel = [
    { name: "Dennis Cometti", role: "Broadcast caller", lean: 0 },
    { name: "Bruce McAvaney", role: "Prime-time caller", lean: -1 },
    { name: "Rex Hunt", role: "Radio caller", lean: 1 }
  ];

  const strategies = {
    offensive: {
      key: "offensive",
      label: "Offensive",
      shortLabel: "Attack",
      description: "Scoreboard pressure, fast entries and bigger swings.",
      strengths: "Best with elite forwards and a strong midfield.",
      risk: "Can leak goals if the back six is thin."
    },
    balanced: {
      key: "balanced",
      label: "Balanced",
      shortLabel: "Balance",
      description: "Controlled ball movement with fewer wild swings.",
      strengths: "Best when all three lines are strong.",
      risk: "Less explosive if one line is carrying the side."
    },
    defensive: {
      key: "defensive",
      label: "Defensive",
      shortLabel: "Defence",
      description: "Territory, pressure and a tighter scoreboard.",
      strengths: "Best with elite defenders and contested mids.",
      risk: "Can leave forwards starved if the attack is light."
    }
  };

  const weatherOptions = ["Dry", "Wet", "Windy", "Hot", "Dewy", "Slippery"];
  const scoringProfiles = {
    Dry: { combined: 174, spread: 35, scrapChance: 0.06, scrapDrop: 19, minScore: 34 },
    Hot: { combined: 167, spread: 33, scrapChance: 0.08, scrapDrop: 21, minScore: 32 },
    Windy: { combined: 154, spread: 31, scrapChance: 0.17, scrapDrop: 24, minScore: 29 },
    Dewy: { combined: 149, spread: 29, scrapChance: 0.21, scrapDrop: 27, minScore: 27 },
    Wet: { combined: 145, spread: 28, scrapChance: 0.27, scrapDrop: 30, minScore: 25 },
    Slippery: { combined: 140, spread: 27, scrapChance: 0.30, scrapDrop: 32, minScore: 24 }
  };

  function rand(max) {
    return Math.floor(Math.random() * max);
  }

  function centeredRand(range) {
    return rand(range * 2 + 1) - range;
  }

  function sample(items) {
    return items[rand(items.length)];
  }

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scrollToElement(element, block = "start") {
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block });
    });
  }

  function shouldAutoScrollDraft() {
    return window.matchMedia ? window.matchMedia("(max-width: 1060px)").matches : false;
  }

  function scrollToFirstPlayerOption() {
    const firstOption = els.playerOptions.querySelector(".player-card") || els.playerOptions;
    const header = document.querySelector(".app-header");
    window.requestAnimationFrame(() => {
      const offset = header ? header.getBoundingClientRect().height + 10 : 10;
      const top = firstOption.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }

  function currentSeasonYear() {
    return Math.max(...data.years);
  }

  function playerIdentity(player) {
    return player.personId || player.id || `${player.name}|${player.team || player.displayTeam || ""}|${player.start || ""}|${player.end || ""}`;
  }

  function availableTeamsForYear(year) {
    return data.teams.filter((team) => team.joined <= year && (!team.ended || team.ended >= year));
  }

  function playerAvailable(player, team, year) {
    return player.team === team.id && player.start <= year && player.end >= year;
  }

  function seasonRating(player, year) {
    if (player.source === "legend") return 100;
    const careerLength = Math.max(1, player.end - player.start + 1);
    const yearIndex = Math.max(0, Math.min(careerLength - 1, year - player.start));
    const progress = careerLength === 1 ? 1 : yearIndex / (careerLength - 1);
    const peakCurve = 1 - Math.abs(progress - 0.58) * 1.35;
    const formPenalty = Math.round(Math.max(0, 10 - peakCurve * 10));
    return Math.max(68, player.rating - formPenalty);
  }

  function baseEffectiveRating(player) {
    if (player.source === "legend") return 100;
    if (ratingMode === "career") return player.rating;
    return seasonRating(player, Number(player.displayYear) || player.end);
  }

  function effectiveRating(player) {
    return Number.isFinite(player.assignedRating) ? player.assignedRating : baseEffectiveRating(player);
  }

  function positionRating(player, positionKey) {
    const base = baseEffectiveRating(player);
    if (player.source === "legend") return 100;
    const fitIndex = player.positions.indexOf(positionKey);
    const primary = player.positions[0];
    const sameLineFamily = (isDefensiveRole(primary) && isDefensiveRole(positionKey))
      || (isForwardRole(primary) && isForwardRole(positionKey));
    const penalty = fitIndex <= 0 ? 0 : fitIndex * (sameLineFamily ? 2 : 4);
    return Math.max(65, base - penalty);
  }

  function positionFitLabel(player, positionKey) {
    const fitIndex = player.positions.indexOf(positionKey);
    if (player.source === "legend") return "Legend";
    if (fitIndex === 0) return "Best fit";
    if (fitIndex === 1) return "Strong fit";
    return "Cover";
  }

  function draftedIndex() {
    const draftedPlayers = slots.filter((slot) => slot.player).map((slot) => slot.player);
    return {
      identities: new Set(draftedPlayers.map(playerIdentity))
    };
  }

  function isAlreadyDrafted(player, index) {
    return index.identities.has(playerIdentity(player));
  }

  function getCandidates(team, year, includeLegend = false) {
    const used = draftedIndex();
    const players = data.players
      .filter((player) => playerAvailable(player, team, year) && !isAlreadyDrafted(player, used))
      .sort((a, b) => b.rating - a.rating);

    const tuned = players.map((player) => ({
      ...player,
      source: "season",
      displayTeam: team.id,
      displayYear: year,
      effectiveRating: ratingMode === "career" ? player.rating : seasonRating(player, year)
    }));

    const legend = includeLegend ? getLegendCandidate(team, year, used) : null;
    const candidates = [...tuned];
    if (legend) {
      candidates.splice(rand(candidates.length + 1), 0, legend);
    }

    return candidates;
  }

  function getLegendCandidate(team, year, used) {
    const options = data.legends
      .map((legend) => ({ ...legend, rating: 100, source: "legend", displayTeam: team.id, displayYear: year, effectiveRating: 100 }))
      .filter((legend) => !isAlreadyDrafted(legend, used))
      .filter((legend) => legend.teams.includes("any") || legend.teams.includes(team.id))
      .filter((legend) => openPositionKeysFor(legend).length);

    return options.length ? sample(options) : null;
  }

  function sortPositionKeys(sortKey) {
    if (sortKey === "DEF") return ["FB", "HB"];
    if (sortKey === "FOR") return ["HF", "FF"];
    if (sortKey === "ALL") return data.positions.map((position) => position.key);
    return [sortKey];
  }

  function sortLabelFor(sortKey) {
    if (sortKey === "ALL") return "All";
    if (sortKey === "DEF") return "Def";
    if (sortKey === "FOR") return "For";
    if (sortKey === "M") return "Mid";
    if (sortKey === "R") return "Ruck";
    return labelFor(sortKey);
  }

  function bestOpenPositionForSort(player, sortKey) {
    const sortKeys = sortPositionKeys(sortKey);
    return openPositionKeysFor(player)
      .filter((positionKey) => sortKeys.includes(positionKey))
      .map((positionKey) => ({ positionKey, rating: positionRating(player, positionKey) }))
      .sort((a, b) => b.rating - a.rating)[0] || null;
  }

  function candidateFitsSort(player, sortKey) {
    if (sortKey === "ALL") return true;
    return Boolean(bestOpenPositionForSort(player, sortKey));
  }

  function sortRatingFor(player, sortKey) {
    if (sortKey === "ALL") return baseEffectiveRating(player);
    return bestOpenPositionForSort(player, sortKey)?.rating || 0;
  }

  function candidatesForSort() {
    const candidates = candidateSort === "ALL"
      ? [...currentCandidates]
      : currentCandidates.filter((player) => candidateFitsSort(player, candidateSort));

    return candidates.sort((a, b) =>
      sortRatingFor(b, candidateSort) - sortRatingFor(a, candidateSort)
      || baseEffectiveRating(b) - baseEffectiveRating(a)
      || a.name.localeCompare(b.name)
    );
  }

  function sortCountFor(sortKey) {
    if (sortKey === "ALL") return currentCandidates.length;
    return currentCandidates.filter((player) => candidateFitsSort(player, sortKey)).length;
  }

  function positionShortLabel(position) {
    if (position.key === "FB") return "FB";
    if (position.key === "HB") return "HB";
    if (position.key === "M") return "Mid";
    if (position.key === "HF") return "HF";
    if (position.key === "FF") return "FF";
    return position.label;
  }

  function isDefensiveRole(role) {
    return ["FB", "HB"].includes(role);
  }

  function isForwardRole(role) {
    return ["HF", "FF"].includes(role);
  }

  function renderPositionSort() {
    if (!currentCandidates.length) {
      els.positionSort.classList.add("hidden");
      els.positionSort.innerHTML = "";
      return;
    }

    const controls = [
      { key: "ALL", label: "All", count: currentCandidates.length },
      { key: "DEF", label: "Def", count: sortCountFor("DEF") },
      { key: "M", label: "Mid", count: sortCountFor("M") },
      { key: "R", label: "Ruck", count: sortCountFor("R") },
      { key: "FOR", label: "For", count: sortCountFor("FOR") }
    ];

    if (candidateSort !== "ALL" && !controls.some((control) => control.key === candidateSort && control.count)) {
      candidateSort = "ALL";
    }

    els.positionSort.classList.remove("hidden");
    els.positionSort.innerHTML = controls.map((control) => `
      <button
        type="button"
        data-sort-position="${control.key}"
        class="${candidateSort === control.key ? "active" : ""}"
        ${control.count ? "" : "disabled"}
      >
        <span>${control.label}</span>
        <strong>${control.count}</strong>
      </button>
    `).join("");

    els.positionSort.querySelectorAll("[data-sort-position]").forEach((button) => {
      button.addEventListener("click", () => {
        candidateSort = button.dataset.sortPosition;
        renderCandidateList();
      });
    });
  }

  function clearCandidates() {
    currentCandidates = [];
    candidateSort = "ALL";
    els.playerOptions.innerHTML = "";
    els.spinCard.classList.remove("legend-spin");
    setSpinCardTeam(null);
    renderPositionSort();
  }

  function setSpinCardTeam(team) {
    if (!team) {
      delete els.spinCard.dataset.team;
      els.spinCard.style.removeProperty("--team-primary");
      els.spinCard.style.removeProperty("--team-secondary");
      return;
    }

    els.spinCard.dataset.team = team.id;
    els.spinCard.style.setProperty("--team-primary", team.primary);
    els.spinCard.style.setProperty("--team-secondary", team.secondary);
  }

  function openPositionKeysFor(player) {
    return data.positions
      .filter((position) => player.positions.includes(position.key))
      .filter((position) => slots.some((slot) => !slot.player && slot.key === position.key))
      .map((position) => position.key);
  }

  function nextSlotFor(positionKey) {
    return slots.find((slot) => !slot.player && slot.key === positionKey);
  }

  function isTeamComplete() {
    return slots.every((slot) => slot.player);
  }

  function roleAverage(positionKeys) {
    const average = roleAverageValue(positionKeys);
    return average === null ? "--" : Math.round(average);
  }

  function renderSlot(slot) {
    const div = document.createElement("article");
    div.className = `slot ${slot.player ? "filled" : "open"}`;
    div.dataset.position = slot.key;
    if (slot.player) {
      const team = teamById.get(slot.player.displayTeam);
      div.dataset.team = team.id;
      div.style.setProperty("--team-primary", team.primary);
      div.style.setProperty("--team-secondary", team.secondary);
    }

    div.innerHTML = `
      <div class="slot-type">${slot.displayLabel}</div>
      <div class="slot-name">${slot.player ? slot.player.name : `${slot.label} needed`}</div>
      <div class="slot-tags">
        ${slot.player
          ? `<span class="pill club-pill">${teamById.get(slot.player.displayTeam).name}</span><span class="pill role-pill">Role ${effectiveRating(slot.player)}</span>`
          : `<span class="pill open-pill">Open slot</span>`}
      </div>
      ${slot.player ? `<span class="jersey-icon" aria-hidden="true"></span>` : ""}
    `;
    return div;
  }

  function renderTeam() {
    els.teamGrid.innerHTML = "";
    data.positions.forEach((position) => {
      const positionSlots = slots.filter((slot) => slot.key === position.key);
      const openCount = positionSlots.filter((slot) => !slot.player).length;
      const section = document.createElement("section");
      section.className = "position-section";
      section.dataset.position = position.key;
      section.innerHTML = `
        <div class="position-section-heading">
          <strong>${position.label}</strong>
          <span>${openCount ? `${openCount} open` : "filled"}</span>
        </div>
      `;

      const slotList = document.createElement("div");
      slotList.className = "position-slots";
      positionSlots.forEach((slot) => {
        slotList.appendChild(renderSlot(slot));
      });
      section.appendChild(slotList);
      els.teamGrid.appendChild(section);
    });

    const count = slots.filter((slot) => slot.player).length;
    const complete = count === slots.length;
    const spinMustBeResolved = Boolean(currentSpin && currentSpin.pickRequired);
    els.squadCount.textContent = `${count}/18 Drafted`;
    els.spinBtn.disabled = complete || simulationActive || seasonFinished || spinMustBeResolved;
    els.skipBtn.disabled = complete || !currentSpin || !currentSpin.pickRequired || !rerollAvailable || simulationActive || seasonFinished;
    els.simulateBtn.disabled = !complete || simulationActive || seasonFinished;
    els.quickSimBtn.disabled = !complete || simulationActive || seasonFinished;
    els.overallRating.textContent = count ? Math.round(teamStrength()) : "--";
    els.attackRating.textContent = roleAverage(["HF", "FF"]);
    els.midRating.textContent = roleAverage(["M", "R"]);
    els.defenceRating.textContent = roleAverage(["FB", "HB"]);

    if (complete) {
      currentSpin = null;
      clearCandidates();
      els.pickHelp.textContent = seasonFinished
        ? "Season complete. Reset to draft a new XVIII."
        : "Team complete. Simulate the season when ready.";
      els.spinTitle.textContent = seasonFinished ? "Season Complete" : "Team Complete";
      els.spinMeta.textContent = seasonFinished
        ? "Simulation is locked until you reset."
        : "Spin is locked. Your selected XVIII is ready for the season.";
      if (!simulationActive && !seasonFinished) {
        if (!seasonPrediction) seasonPrediction = createMediaPrediction();
        renderPreseasonSetup();
      }
    }
  }

  function renderCandidates(candidates) {
    currentCandidates = candidates;
    candidateSort = "ALL";
    return renderCandidateList();
  }

  function renderCandidateList() {
    els.playerOptions.innerHTML = "";
    selectedPlayer = null;
    renderPositionSort();

    if (!currentCandidates.length) {
      els.playerOptions.innerHTML = `<p>No eligible undrafted players for this spin. Spin again.</p>`;
      return false;
    }

    let hasPickableCandidate = false;
    const candidates = candidatesForSort();

    if (!candidates.length) {
      const label = sortLabelFor(candidateSort).toLowerCase();
      els.playerOptions.innerHTML = `<p>No ${label} fits an open slot in this spin.</p>`;
      return false;
    }

    candidates.forEach((player) => {
      const team = teamById.get(player.displayTeam);
      const card = document.createElement("article");
      card.className = `player-card${player.source === "legend" ? " legend-card" : ""}`;
      card.style.setProperty("--team-primary", team.primary);
      card.style.setProperty("--team-secondary", team.secondary);

      const availablePositions = openPositionKeysFor(player);
      if (availablePositions.length) hasPickableCandidate = true;
      card.innerHTML = `
        <div class="player-sash"></div>
        ${player.source === "legend" ? `
          <div class="legend-ribbon">
            <span>Rare Legend</span>
            <strong>100</strong>
          </div>
        ` : ""}
        <div class="player-body">
          <div class="player-meta">
            <span class="pill club-pill">${team.name}</span>
            <span>${player.displayYear}</span>
          </div>
          <h3>${player.name}</h3>
          <div class="rating-row">
            ${ratingMode === "season" ? `<span class="pill">Year form ${player.effectiveRating}</span>` : ""}
            ${player.source === "legend" ? `<span class="pill legend-pill">AFL Legend</span>` : ""}
          </div>
          <div class="tags">${player.positions.map((pos) => `<span class="pill">${labelFor(pos)}</span>`).join("")}</div>
          <div class="position-buttons" aria-label="Draft position for ${player.name}">
            ${availablePositions.length
              ? availablePositions.map((positionKey) => `
                <button type="button" data-position-key="${positionKey}">
                  <span>${labelFor(positionKey)}</span>
                  <strong>${positionRating(player, positionKey)}</strong>
                  <small>${positionFitLabel(player, positionKey)}</small>
                </button>
              `).join("")
              : `<span class="pill">No suitable open slot</span>`}
          </div>
        </div>
      `;

      card.querySelectorAll("[data-position-key]").forEach((button) => {
        button.addEventListener("click", () => draftPlayer(player, button.dataset.positionKey));
      });

      els.playerOptions.appendChild(card);
    });

    if (!hasPickableCandidate) {
      els.pickHelp.textContent = "No player in this spin fits an open position. Spin again.";
    }

    return hasPickableCandidate;
  }

  function labelFor(key) {
    return data.positions.find((position) => position.key === key).label;
  }

  function draftPlayer(player, positionKey) {
    const slot = nextSlotFor(positionKey);
    if (!slot || slot.player || !player.positions.includes(slot.key)) return;
    slot.player = {
      ...player,
      assignedPosition: positionKey,
      assignedRating: positionRating(player, positionKey)
    };
    currentSpin = null;
    els.skipBtn.disabled = true;
    els.spinTitle.textContent = "Drafted";
    els.spinMeta.textContent = `${player.name} placed as ${slot.displayLabel} at ${slot.player.assignedRating}. Spin again for the next pick.`;
    clearCandidates();
    els.pickHelp.textContent = "Spin again. Position buttons show the rating that player carries in that role.";
    els.simLog.innerHTML = "";
    renderTeam();
    if (isTeamComplete()) {
      scrollToElement(els.simSection, "center");
    } else if (shouldAutoScrollDraft()) {
      scrollToElement(els.spinCard, "center");
    }
  }

  function spin() {
    if (isTeamComplete() || simulationActive || seasonFinished || (currentSpin && currentSpin.pickRequired)) return;
    if (simTimer) window.clearTimeout(simTimer);
    if (slots.some((slot) => slot.player)) {
      els.normalModeBtn.disabled = true;
      els.hardModeBtn.disabled = true;
    }
    const year = sample(data.years);
    const team = sample(availableTeamsForYear(year));
    const legendRolled = !legendRolledThisDraft && Math.random() < LEGEND_SPIN_CHANCE;
    const candidates = getCandidates(team, year, legendRolled);
    const hasLegend = candidates.some((player) => player.source === "legend");
    const squadCount = candidates.length - (hasLegend ? 1 : 0);

    if (hasLegend) legendRolledThisDraft = true;
    currentSpin = { year, team, legendRolled: hasLegend, pickRequired: false };
    setSpinCardTeam(team);
    els.spinCard.classList.toggle("legend-spin", hasLegend);
    els.spinTitle.textContent = `${team.name} ${year}`;
    els.spinMeta.textContent = hasLegend
      ? `${squadCount} ${team.short} players are available from this squad. One Legend has entered the pool.`
      : `${squadCount} ${team.short} players are available from this squad. Pick one.`;
    els.pickHelp.textContent = "Choose a position button. Its number is the player rating in that role.";
    currentSpin.pickRequired = renderCandidates(candidates);
    if (!currentSpin.pickRequired) {
      els.spinMeta.textContent = "No suitable open-position player in this spin. Spin again.";
    }
    renderTeam();
    if (currentSpin.pickRequired && shouldAutoScrollDraft()) {
      scrollToFirstPlayerOption();
    }
  }

  function rerollSpin() {
    if (!currentSpin || !currentSpin.pickRequired || !rerollAvailable || simulationActive || seasonFinished) return;
    rerollAvailable = false;
    els.skipBtn.textContent = "Re-roll Used";
    els.skipBtn.disabled = true;
    currentSpin = null;
    spin();
  }

  function resetDraft() {
    slots.forEach((slot) => {
      slot.player = null;
    });
    currentSpin = null;
    selectedPlayer = null;
    pendingGrandFinal = null;
    legendRolledThisDraft = false;
    rerollAvailable = true;
    simulationActive = false;
    seasonFinished = false;
    seasonPrediction = null;
    seasonStrategy = "balanced";
    resultsTab = "player-stats";
    document.body.classList.remove("simulating");
    if (simTimer) window.clearTimeout(simTimer);
    simTimer = null;
    els.spinTitle.textContent = "Ready";
    els.spinMeta.textContent = "Spin to reveal a club and AFL-era season.";
    clearCandidates();
    els.pickHelp.textContent = "Spin first. Position buttons show the rating that player carries in that role.";
    els.skipBtn.textContent = "Re-roll";
    els.normalModeBtn.disabled = false;
    els.hardModeBtn.disabled = false;
    els.simLog.innerHTML = "";
    clearSpeech();
    renderTeam();
  }

  function teamStrength() {
    return slots.reduce((total, slot) => total + (slot.player ? effectiveRating(slot.player) : 0), 0) / 18;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ordinal(value) {
    const number = Math.round(value);
    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
    const suffix = number % 10 === 1 ? "st" : number % 10 === 2 ? "nd" : number % 10 === 3 ? "rd" : "th";
    return `${number}${suffix}`;
  }

  function createRecord() {
    return { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
  }

  function gamesPlayed(record) {
    return record.wins + record.losses + record.draws;
  }

  function recordText(record) {
    return `${record.wins}-${record.draws}-${record.losses}`;
  }

  function resultShort(result) {
    if (result === "win") return "W";
    if (result === "loss") return "L";
    return "D";
  }

  function regularSeasonDifficulty(index) {
    if (index >= 16) return 8;
    if (index >= 12) return 6;
    if (index >= 6) return 4;
    return 2;
  }

  function finalsDifficulty(index) {
    return [4, 5, 6][index] || 6;
  }

  function inverseResult(result) {
    if (result === "win") return "loss";
    if (result === "loss") return "win";
    return "draw";
  }

  function ladderPoints(record) {
    return record.wins * 4 + record.draws * 2;
  }

  function percentage(record) {
    if (!record.pointsAgainst) return "100.0";
    return ((record.pointsFor / record.pointsAgainst) * 100).toFixed(1);
  }

  function ladderPlaceFromRating(strength, teamCount) {
    const normalized = clamp((strength - 76) / 22, 0, 1);
    return Math.round(clamp(1 + (1 - normalized) * (teamCount - 1), 1, teamCount));
  }

  function ladderPlaceFromRecord(record, teamCount, games) {
    const points = record.wins * 4 + record.draws * 2;
    const maxPoints = Math.max(1, games * 4);
    const pointsRatio = points / maxPoints;
    let place = Math.round(clamp(1 + (1 - pointsRatio) * (teamCount - 1), 1, teamCount));
    const percentage = record.pointsAgainst ? (record.pointsFor / record.pointsAgainst) * 100 : 100;
    if (percentage >= 122 && place > 1) place -= 1;
    if (percentage <= 86 && place < teamCount) place += 1;
    return place;
  }

  function createLadderRecords(seasonTeams) {
    const records = new Map();
    records.set("invincible", {
      ...createRecord(),
      id: "invincible",
      name: "AFL Invincible XVIII",
      short: "Invincible",
      invincible: true
    });
    seasonTeams.forEach((team) => {
      records.set(team.id, {
        ...createRecord(),
        id: team.id,
        name: team.name,
        short: team.short,
        primary: team.primary,
        secondary: team.secondary,
        invincible: false
      });
    });
    return records;
  }

  function updateRecordLine(record, result, pointsFor, pointsAgainst) {
    if (result === "win") record.wins += 1;
    if (result === "loss") record.losses += 1;
    if (result === "draw") record.draws += 1;
    record.pointsFor += pointsFor;
    record.pointsAgainst += pointsAgainst;
  }

  function updateOpponentLadderRecord(ladderRecords, opponent, game) {
    if (!opponent?.id || !ladderRecords.has(opponent.id)) return;
    updateRecordLine(ladderRecords.get(opponent.id), inverseResult(game.result), game.scoreAgainst, game.scoreFor);
  }

  function scorelineForGame({ label = "", strength, opponentRating, marginModifier = 0, strategyPlan = null }) {
    const condition = sample(weatherOptions);
    const profile = scoringProfiles[condition] || scoringProfiles.Dry;
    const volatility = strategyPlan?.volatility || 1;
    const finalPressure = /final/i.test(label) ? -4 : 0;
    const strategyTempo = clamp(((strategyPlan?.forMod || 0) + (strategyPlan?.againstMod || 0)) * 0.7, -13, 13);
    const qualityTempo = (strength + opponentRating - 168) * 0.75;
    let combinedScore = Math.round(
      profile.combined
      + centeredRand(profile.spread)
      + qualityTempo
      + strategyTempo
      + finalPressure
    );

    if (Math.random() < profile.scrapChance) {
      combinedScore -= 12 + rand(profile.scrapDrop);
    }

    combinedScore = Math.round(clamp(combinedScore, 82, 220));

    const rawMargin = Math.round(
      (strength - opponentRating) * 1.85
      + centeredRand(18) * volatility
      + marginModifier
      + (strategyPlan?.marginMod || 0)
    );
    const marginCap = Math.max(2, combinedScore - profile.minScore * 2);
    const margin = Math.round(clamp(rawMargin, -marginCap, marginCap));
    const scoreFor = Math.round((combinedScore + margin) / 2);
    const scoreAgainst = combinedScore - scoreFor;
    const finalMargin = scoreFor - scoreAgainst;
    const result = finalMargin > 0 ? "win" : finalMargin < 0 ? "loss" : "draw";
    const resultText = result === "draw" ? "Draw" : result === "win" ? `Win by ${finalMargin}` : `Loss by ${Math.abs(finalMargin)}`;

    return {
      condition,
      result,
      resultText,
      scoreFor,
      scoreAgainst,
      finalMargin
    };
  }

  function simulateLeagueGame(teamA, teamB, ratings) {
    const ratingA = ratings.get(teamA.id) || 82;
    const ratingB = ratings.get(teamB.id) || 82;
    const game = scorelineForGame({ label: "League Game", strength: ratingA, opponentRating: ratingB });
    return { result: game.result, scoreFor: game.scoreFor, scoreAgainst: game.scoreAgainst };
  }

  function simulateRemainingLadder(ladderRecords, seasonTeams, targetGames) {
    const ratings = new Map(seasonTeams.map((team) => [team.id, 76 + rand(18)]));
    let guard = 0;

    while (guard < targetGames * seasonTeams.length * 3) {
      const available = seasonTeams
        .filter((team) => gamesPlayed(ladderRecords.get(team.id)) < targetGames)
        .sort((a, b) => gamesPlayed(ladderRecords.get(a.id)) - gamesPlayed(ladderRecords.get(b.id)));

      if (available.length < 2) break;
      const teamA = available[0];
      const teamB = sample(available.slice(1));
      const game = simulateLeagueGame(teamA, teamB, ratings);
      updateRecordLine(ladderRecords.get(teamA.id), game.result, game.scoreFor, game.scoreAgainst);
      updateRecordLine(ladderRecords.get(teamB.id), inverseResult(game.result), game.scoreAgainst, game.scoreFor);
      guard += 1;
    }
  }

  function buildLadderData(ladderRecords) {
    return [...ladderRecords.values()]
      .map((record) => ({
        id: record.id,
        name: record.name,
        short: record.short,
        invincible: record.invincible,
        played: gamesPlayed(record),
        wins: record.wins,
        losses: record.losses,
        draws: record.draws,
        pointsFor: record.pointsFor,
        pointsAgainst: record.pointsAgainst,
        percentage: percentage(record),
        points: ladderPoints(record)
      }))
      .sort((a, b) =>
        b.points - a.points
        || Number(b.percentage) - Number(a.percentage)
        || b.pointsFor - a.pointsFor
        || a.name.localeCompare(b.name)
      )
      .map((row, index) => ({ ...row, position: index + 1 }));
  }

  function finalsOpponentsFromLadder(ladderRows, seasonTeams) {
    const byId = new Map(seasonTeams.map((team) => [team.id, team]));
    const finalists = ladderRows
      .filter((row) => !row.invincible && row.position <= 8 && byId.has(row.id))
      .sort((a, b) => a.position - b.position);
    const pool = finalists.length
      ? finalists
      : seasonTeams.map((team, index) => ({ id: team.id, position: index + 1 }));
    const pick = (preferredIndex) => {
      const row = pool[Math.min(preferredIndex, pool.length - 1)] || pool[0];
      return byId.get(row.id) || sample(seasonTeams);
    };

    return [
      pick(3),
      pick(1),
      pick(0)
    ];
  }

  function roleAverageValue(positionKeys) {
    const roleSlots = slots.filter((slot) => positionKeys.includes(slot.key) && slot.player);
    if (!roleSlots.length) return null;
    return roleSlots.reduce((total, slot) => total + effectiveRating(slot.player), 0) / roleSlots.length;
  }

  function teamLineProfile() {
    const overall = teamStrength();
    const attack = roleAverageValue(["HF", "FF"]) || overall;
    const midfield = roleAverageValue(["M", "R"]) || overall;
    const defence = roleAverageValue(["FB", "HB"]) || overall;
    const spread = Math.max(attack, midfield, defence) - Math.min(attack, midfield, defence);

    return { overall, attack, midfield, defence, spread };
  }

  function strategyFitLabel(fit) {
    if (fit >= 94) return "Elite fit";
    if (fit >= 89) return "Strong fit";
    if (fit >= 84) return "Solid fit";
    return "Risky fit";
  }

  function strategyPlanFor(key) {
    const strategy = strategies[key] || strategies.balanced;
    const lines = teamLineProfile();
    let fit;
    let marginMod;
    let forMod;
    let againstMod;
    let volatility;
    let summary;

    if (strategy.key === "offensive") {
      fit = lines.attack * 0.52 + lines.midfield * 0.31 + lines.overall * 0.17 - Math.max(0, 84 - lines.defence) * 0.36;
      marginMod = (fit - 86) * 0.44 + (lines.attack - lines.defence) * 0.13;
      forMod = 5 + (lines.attack - 84) * 0.52 + (lines.midfield - 84) * 0.22;
      againstMod = 4 + Math.max(0, 86 - lines.defence) * 0.42 - Math.max(0, lines.defence - 90) * 0.12;
      volatility = 1.18;
      summary = `${strategyFitLabel(fit)} for ${Math.round(lines.attack)} forward power and ${Math.round(lines.midfield)} midfield supply.`;
    } else if (strategy.key === "defensive") {
      fit = lines.defence * 0.55 + lines.midfield * 0.27 + lines.overall * 0.18 - Math.max(0, 84 - lines.attack) * 0.28;
      marginMod = (fit - 86) * 0.44 + (lines.defence - lines.attack) * 0.12;
      forMod = -3 + (lines.midfield - 84) * 0.18 + Math.max(0, lines.attack - 90) * 0.12;
      againstMod = -6 - Math.max(0, lines.defence - 84) * 0.54 - Math.max(0, lines.midfield - 86) * 0.12;
      volatility = 0.9;
      summary = `${strategyFitLabel(fit)} for a ${Math.round(lines.defence)} defensive unit and stoppage support.`;
    } else {
      const balanceBonus = Math.max(-7, 7 - lines.spread * 0.68);
      fit = lines.overall * 0.72 + (100 - lines.spread) * 0.16 + lines.midfield * 0.12;
      marginMod = (fit - 86) * 0.34 + balanceBonus * 0.2;
      forMod = (lines.attack - 84) * 0.24 + (lines.midfield - 84) * 0.14;
      againstMod = -2 - Math.max(0, lines.defence - 84) * 0.22 + Math.max(0, lines.spread - 9) * 0.28;
      volatility = 1.04;
      summary = `${strategyFitLabel(fit)} with ${Math.round(lines.spread)} points between the strongest and weakest line.`;
    }

    return {
      ...strategy,
      fit: Math.round(clamp(fit, 68, 100)),
      fitLabel: strategyFitLabel(fit),
      marginMod: Math.round(clamp(marginMod, -7, 7)),
      forMod: Math.round(clamp(forMod, -9, 14)),
      againstMod: Math.round(clamp(againstMod, -15, 10)),
      volatility: clamp(volatility, 0.72, 1.3),
      lines: {
        attack: Math.round(lines.attack),
        midfield: Math.round(lines.midfield),
        defence: Math.round(lines.defence)
      },
      summary
    };
  }

  function strategyPlans() {
    return Object.keys(strategies).map(strategyPlanFor);
  }

  function strongestLine() {
    const lines = [
      { label: "forward line", value: roleAverageValue(["HF", "FF"]) || 0 },
      { label: "midfield", value: roleAverageValue(["M", "R"]) || 0 },
      { label: "defence", value: roleAverageValue(["FB", "HB"]) || 0 }
    ];
    return lines.sort((a, b) => b.value - a.value)[0];
  }

  function predictionBand(place) {
    if (place <= 2) return "minor premiership threat";
    if (place <= 4) return "top-four side";
    if (place <= 8) return "finals side";
    if (place <= 12) return "middle of the pack";
    return "rough year";
  }

  function predictionQuote(place, strength, line) {
    const band = predictionBand(place);
    const templates = [
      `I have them ${ordinal(place)}. The ${line.label} is the reason they look like a ${band}.`,
      `${ordinal(place)} for me. There is enough class to worry anyone, especially when the ${line.label} gets rolling.`,
      `Put them down for ${ordinal(place)}. The list profile screams ${band}, but the season still has to be earned.`,
      `I am landing on ${ordinal(place)}. At ${Math.round(strength)} overall, the ceiling is real, but so is the pressure.`
    ];
    return sample(templates);
  }

  function createMediaPrediction() {
    const teamCount = availableTeamsForYear(currentSeasonYear()).length + 1;
    const strength = teamStrength();
    const basePlace = ladderPlaceFromRating(strength, teamCount);
    const line = strongestLine();
    const panel = shuffle(mediaPanel).slice(0, 3).map((pundit) => {
      const predictedPlace = Math.round(clamp(basePlace + pundit.lean + rand(3) - 1, 1, teamCount));
      return {
        ...pundit,
        predictedPlace,
        quote: predictionQuote(predictedPlace, strength, line)
      };
    });
    const ordered = panel.map((pundit) => pundit.predictedPlace).sort((a, b) => a - b);
    const consensusPlace = ordered[Math.floor(ordered.length / 2)];

    return {
      kind: "media-prediction",
      consensusPlace,
      teamCount,
      strength: Math.round(strength),
      line: line.label,
      panel,
      summary: `Media consensus predicts ${ordinal(consensusPlace)}.`
    };
  }

  function predictionVerdict(predictedPlace, actualPlace) {
    const gap = actualPlace - predictedPlace;
    if (gap === 0) return "The panel nailed it.";
    if (Math.abs(gap) === 1) return "The panel was within one spot.";
    if (gap > 0) return `The panel was ${gap} spots too optimistic.`;
    return `The panel undersold them by ${Math.abs(gap)} spots.`;
  }

  function buildPredictionComparison(prediction, ladderRows) {
    if (!prediction || !ladderRows?.length) return null;
    const invincibleRow = ladderRows.find((row) => row.invincible);
    if (!invincibleRow) return null;
    const actualPlace = invincibleRow.position;
    return {
      prediction,
      predictedPlace: prediction.consensusPlace,
      actualPlace,
      ladderRecord: recordText(invincibleRow),
      verdict: predictionVerdict(prediction.consensusPlace, actualPlace),
      panel: prediction.panel.map((pundit) => ({
        name: pundit.name,
        predictedPlace: pundit.predictedPlace,
        verdict: predictionVerdict(pundit.predictedPlace, actualPlace)
      }))
    };
  }

  function gameVariance(spread = 0.3) {
    return 1 - spread + Math.random() * spread * 2;
  }

  function playerRole(player) {
    return player.assignedPosition || player.positions[0] || "M";
  }

  function profileRate(player, key) {
    const role = playerRole(player);
    const fallback = roleStatBase[role]?.[key] ?? roleStatBase.M[key] ?? 0;
    const profileValue = Number(player.profile?.[key]);

    if (!Number.isFinite(profileValue) || profileValue <= 0) return fallback;
    return profileValue * 0.72 + fallback * 0.28;
  }

  function gameStat(player, key, spread = 0.32, multiplier = 1) {
    const ratingFactor = clamp(0.82 + (effectiveRating(player) - 72) / 110, 0.78, 1.24);
    return Math.max(0, Math.round(profileRate(player, key) * ratingFactor * multiplier * gameVariance(spread)));
  }

  function weightedPick(items, weightFor) {
    const weighted = items.map((item) => ({ item, weight: Math.max(0.01, weightFor(item)) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * total;

    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) return entry.item;
    }

    return weighted[weighted.length - 1].item;
  }

  function createSeasonStats() {
    const stats = new Map();
    slots
      .filter((slot) => slot.player)
      .forEach((slot) => {
        const player = slot.player;
        stats.set(playerIdentity(player), {
          key: playerIdentity(player),
          player,
          name: player.name,
          teamName: teamById.get(player.displayTeam).name,
          role: player.assignedPosition || slot.key,
          roleLabel: labelFor(player.assignedPosition || slot.key),
          rating: effectiveRating(player),
          games: 0,
          goals: 0,
          behinds: 0,
          kicks: 0,
          handballs: 0,
          disposals: 0,
          marks: 0,
          tackles: 0,
          hitouts: 0,
          clearances: 0,
          inside50s: 0,
          rebound50s: 0,
          goalAssists: 0,
          contestedPossessions: 0,
          brownlowVotes: 0
        });
      });
    return stats;
  }

  function goalWeight(row) {
    const roleBias = { FB: 0.16, HB: 0.3, M: 0.85, R: 0.55, HF: 1.8, FF: 3.25 };
    return (profileRate(row.player, "gl") + 0.08)
      * (roleBias[row.role] || 1)
      * clamp(row.rating / 86, 0.78, 1.28);
  }

  function teamGoalsFromScore(scoreFor) {
    const maxGoals = Math.max(1, Math.floor(scoreFor / 6));
    return Math.round(clamp(Math.round(scoreFor / 6.7 + rand(3) - 1), 1, maxGoals));
  }

  function strategyStatMultiplier(strategyPlan, role, key) {
    if (!strategyPlan) return 1;

    if (strategyPlan.key === "offensive") {
      if (["i50", "ga"].includes(key)) return isForwardRole(role) || role === "M" ? 1.14 : 1.02;
      if (key === "ki") return isForwardRole(role) || role === "M" ? 1.06 : 1;
      if (["tk", "r50"].includes(key)) return 0.94;
    }

    if (strategyPlan.key === "defensive") {
      if (key === "tk") return isDefensiveRole(role) || role === "M" ? 1.14 : 1.06;
      if (key === "r50") return isDefensiveRole(role) ? 1.18 : 1.06;
      if (key === "mk") return isDefensiveRole(role) ? 1.08 : 1;
      if (["i50", "ga"].includes(key)) return 0.92;
      if (key === "ki") return isDefensiveRole(role) ? 1.04 : 0.98;
    }

    if (strategyPlan.key === "balanced") {
      if (["ki", "hb", "tk"].includes(key)) return 1.02;
    }

    return 1;
  }

  function statPhrase(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
  }

  function bestOnGroundReason(stats) {
    const options = [
      {
        value: stats.goals,
        min: 2,
        weight: stats.goals * 11,
        templates: [
          () => `tore the game open with ${statPhrase(stats.goals, "goal")}`,
          () => `finished everything with ${statPhrase(stats.goals, "goal")}`,
          () => `was unstoppable near goal with ${statPhrase(stats.goals, "major")}`
        ]
      },
      {
        value: stats.possessions,
        min: 22,
        weight: stats.possessions * 0.78,
        templates: [
          () => `found the footy ${stats.possessions} times`,
          () => `controlled the tempo with ${statPhrase(stats.possessions, "possession")}`,
          () => `kept showing up with ${statPhrase(stats.possessions, "touch", "touches")}`
        ]
      },
      {
        value: stats.kicks,
        min: 15,
        weight: stats.kicks * 1.05,
        templates: [
          () => `drove the play with ${statPhrase(stats.kicks, "kick")}`,
          () => `kept them moving with ${statPhrase(stats.kicks, "kick")}`
        ]
      },
      {
        value: stats.handballs,
        min: 12,
        weight: stats.handballs,
        templates: [
          () => `linked everything with ${statPhrase(stats.handballs, "handball")}`,
          () => `kept the chains moving with ${statPhrase(stats.handballs, "handball")}`
        ]
      },
      {
        value: stats.tackles,
        min: 5,
        weight: stats.tackles * 3,
        templates: [
          () => `set the pressure with ${statPhrase(stats.tackles, "tackle")}`,
          () => `made it brutal around the ball with ${statPhrase(stats.tackles, "tackle")}`
        ]
      },
      {
        value: stats.hitouts,
        min: 15,
        weight: stats.hitouts * 0.62,
        templates: [
          () => `owned the ruck with ${statPhrase(stats.hitouts, "hitout")}`,
          () => `gave the mids first use with ${statPhrase(stats.hitouts, "hitout")}`
        ]
      },
      {
        value: stats.clearances,
        min: 4,
        weight: stats.clearances * 3.4,
        templates: [
          () => `burst out of stoppage for ${statPhrase(stats.clearances, "clearance")}`,
          () => `won the contest with ${statPhrase(stats.clearances, "clearance")}`
        ]
      },
      {
        value: stats.marks,
        min: 7,
        weight: stats.marks * 1.7,
        templates: [
          () => `controlled the air with ${statPhrase(stats.marks, "mark")}`,
          () => `kept clunking it with ${statPhrase(stats.marks, "mark")}`
        ]
      },
      {
        value: stats.rebound50s,
        min: 4,
        weight: stats.rebound50s * 2.7,
        templates: [
          () => `launched from defence with ${statPhrase(stats.rebound50s, "rebound 50", "rebound 50s")}`,
          () => `turned defence into attack with ${statPhrase(stats.rebound50s, "rebound 50", "rebound 50s")}`
        ]
      },
      {
        value: stats.inside50s,
        min: 4,
        weight: stats.inside50s * 2.2,
        templates: [
          () => `kept driving it inside 50 with ${statPhrase(stats.inside50s, "entry", "entries")}`,
          () => `kept the forwards supplied with ${statPhrase(stats.inside50s, "inside 50", "inside 50s")}`
        ]
      }
    ].filter((option) => option.value >= option.min);

    if (!options.length) {
      if (stats.goals > 0) return `hit the scoreboard with ${statPhrase(stats.goals, "goal")}`;
      if (stats.possessions > 0) return `worked through traffic for ${statPhrase(stats.possessions, "possession")}`;
      return "made the key moments count";
    }
    const option = weightedPick(options, (item) => item.weight);
    return sample(option.templates)();
  }

  function addPlayerGameStats(game, seasonStats, strategyPlan = null) {
    if (!seasonStats) return null;
    const rows = [...seasonStats.values()];
    const teamGoals = teamGoalsFromScore(game.scoreFor);
    const teamBehinds = Math.max(0, game.scoreFor - teamGoals * 6);
    const goalsByPlayer = new Map();
    const previousTotals = new Map(rows.map((row) => [row.key, {
      goals: row.goals,
      kicks: row.kicks,
      handballs: row.handballs,
      disposals: row.disposals,
      tackles: row.tackles,
      clearances: row.clearances,
      hitouts: row.hitouts,
      marks: row.marks,
      inside50s: row.inside50s,
      rebound50s: row.rebound50s
    }]));

    rows.forEach((row) => {
      const player = row.player;
      const multiplier = (key) => strategyStatMultiplier(strategyPlan, row.role, key);
      const kicks = gameStat(player, "ki", 0.32, multiplier("ki"));
      const handballs = gameStat(player, "hb", 0.32, multiplier("hb"));

      row.games += 1;
      row.kicks += kicks;
      row.handballs += handballs;
      row.disposals += kicks + handballs;
      row.marks += gameStat(player, "mk", 0.32, multiplier("mk"));
      row.tackles += gameStat(player, "tk", 0.32, multiplier("tk"));
      row.hitouts += gameStat(player, "ho", 0.38, multiplier("ho"));
      row.clearances += gameStat(player, "cl", 0.32, multiplier("cl"));
      row.inside50s += gameStat(player, "i50", 0.32, multiplier("i50"));
      row.rebound50s += gameStat(player, "r50", 0.32, multiplier("r50"));
      row.goalAssists += gameStat(player, "ga", 0.42, multiplier("ga"));
      row.contestedPossessions += gameStat(player, "cp", 0.32, multiplier("cp"));
    });

    for (let index = 0; index < teamGoals; index += 1) {
      const scorer = weightedPick(rows, goalWeight);
      scorer.goals += 1;
      goalsByPlayer.set(scorer.key, (goalsByPlayer.get(scorer.key) || 0) + 1);
    }

    for (let index = 0; index < Math.min(teamBehinds, rows.length * 2); index += 1) {
      weightedPick(rows, goalWeight).behinds += 1;
    }

    const gameRows = rows.map((row) => {
      const previous = previousTotals.get(row.key);
      const stats = {
        goals: row.goals - previous.goals,
        kicks: row.kicks - previous.kicks,
        handballs: row.handballs - previous.handballs,
        possessions: row.disposals - previous.disposals,
        tackles: row.tackles - previous.tackles,
        clearances: row.clearances - previous.clearances,
        hitouts: row.hitouts - previous.hitouts,
        marks: row.marks - previous.marks,
        inside50s: row.inside50s - previous.inside50s,
        rebound50s: row.rebound50s - previous.rebound50s
      };

      return {
        row,
        stats,
        score: stats.goals * 10
          + stats.possessions * 0.62
          + stats.tackles * 2.1
          + stats.clearances * 2
          + stats.hitouts * 0.25
          + stats.marks * 0.55
          + stats.rebound50s * 1.2
          + Math.random() * 8
      };
    }).sort((a, b) => b.score - a.score);

    const goalLeaders = [...goalsByPlayer.entries()]
      .map(([key, goals]) => ({ goals, name: seasonStats.get(key).name }))
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 4);

    return {
      bestPlayer: gameRows[0]?.row.player,
      bestName: gameRows[0]?.row.name,
      bestReason: gameRows[0] ? bestOnGroundReason(gameRows[0].stats) : "",
      teamGoals,
      teamBehinds,
      goalText: goalLeaders.length
        ? goalLeaders.map((leader) => `${leader.name} ${leader.goals}`).join(", ")
        : ""
    };
  }

  function applyBrownlowVotesToStats(seasonStats, brownlowVotes) {
    if (!seasonStats) return;
    brownlowVotes.forEach((entry, key) => {
      if (!key.startsWith("invincible:")) return;
      const row = seasonStats.get(key.replace("invincible:", ""));
      if (row) row.brownlowVotes = entry.votes;
    });
  }

  function statLeader(rows, key) {
    return [...rows].sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name))[0];
  }

  function buildSeasonStatsData(
    seasonStats,
    record,
    predictionComparison = null,
    strategyPlan = null,
    ladderRows = [],
    gameResults = [],
    finalsResults = []
  ) {
    if (!seasonStats) return null;
    const rows = [...seasonStats.values()].map((row) => ({
      ...row,
      impact: row.goals * 6
        + row.disposals
        + row.tackles * 3
        + row.clearances * 3
        + row.hitouts * 0.45
        + row.marks * 1.1
        + row.rebound50s * 2
    })).sort((a, b) => b.impact - a.impact || b.rating - a.rating || a.name.localeCompare(b.name));
    const teamGames = Math.max(0, record.wins + record.losses + record.draws);
    const totalFor = (key) => rows.reduce((total, row) => total + row[key], 0);
    const leaders = [
      ["Goals", "goals"],
      ["Possessions", "disposals"],
      ["Kicks", "kicks"],
      ["Handballs", "handballs"],
      ["Tackles", "tackles"],
      ["Hitouts", "hitouts"],
      ["Clearances", "clearances"],
      ["Rebound 50s", "rebound50s"]
    ].map(([label, key]) => {
      const leader = statLeader(rows, key);
      return { label, name: leader?.name || "--", value: leader ? leader[key] : 0 };
    });

    return {
      kind: "season-stats",
      record: recordText(record),
      games: teamGames,
      predictionComparison,
      strategyPlan,
      ladderRows,
      gameResults,
      finalsResults,
      totals: [
        { label: "Goals", value: totalFor("goals") },
        { label: "Possessions", value: totalFor("disposals") },
        { label: "Kicks", value: totalFor("kicks") },
        { label: "Handballs", value: totalFor("handballs") },
        { label: "Marks", value: totalFor("marks") },
        { label: "Tackles", value: totalFor("tackles") },
        { label: "Hitouts", value: totalFor("hitouts") },
        { label: "Clearances", value: totalFor("clearances") }
      ],
      leaders,
      rows
    };
  }

  function simEntry(text, type = "", data = null) {
    return { text, type, data };
  }

  function renderMediaPrediction(prediction) {
    const panelHtml = prediction.panel.map((pundit) => `
      <div>
        <span>${escapeHtml(pundit.role)}</span>
        <strong>${escapeHtml(ordinal(pundit.predictedPlace))}</strong>
        <b>${escapeHtml(pundit.name)}</b>
        <small>${escapeHtml(pundit.quote)}</small>
      </div>
    `).join("");

    return `
      <article class="media-prediction">
        <span>Media Prediction</span>
        <strong>${escapeHtml(ordinal(prediction.consensusPlace))}</strong>
        <p>${escapeHtml(prediction.summary)} Best line: ${escapeHtml(prediction.line)}.</p>
        <div class="prediction-panel">
          ${panelHtml}
        </div>
      </article>
    `;
  }

  function renderStrategyPicker() {
    const plansHtml = strategyPlans().map((plan) => `
      <button
        type="button"
        class="${seasonStrategy === plan.key ? "active" : ""}"
        data-season-strategy="${plan.key}"
      >
        <span>${escapeHtml(plan.shortLabel)}</span>
        <strong>${escapeHtml(plan.label)}</strong>
        <b>${escapeHtml(plan.fit)}</b>
        <small>${escapeHtml(plan.summary)}</small>
      </button>
    `).join("");
    const selectedPlan = strategyPlanFor(seasonStrategy);

    return `
      <article class="strategy-picker">
        <div>
          <span>Season Strategy</span>
          <strong>${escapeHtml(selectedPlan.label)}</strong>
          <p>${escapeHtml(selectedPlan.description)}</p>
        </div>
        <div class="strategy-buttons">
          ${plansHtml}
        </div>
        <small>${escapeHtml(selectedPlan.strengths)} ${escapeHtml(selectedPlan.risk)}</small>
      </article>
    `;
  }

  function bindStrategyPicker() {
    els.simLog.querySelectorAll("[data-season-strategy]").forEach((button) => {
      button.addEventListener("click", () => {
        seasonStrategy = button.dataset.seasonStrategy;
        renderPreseasonSetup();
      });
    });
  }

  function renderPreseasonSetup() {
    if (!seasonPrediction || simulationActive || seasonFinished) return;
    els.simLog.innerHTML = `${renderMediaPrediction(seasonPrediction)}${renderStrategyPicker()}`;
    bindStrategyPicker();
  }

  function renderPredictionComparison(comparison) {
    if (!comparison) return "";
    const panelHtml = comparison.panel.map((pundit) => `
      <div>
        <span>${escapeHtml(pundit.name)}</span>
        <strong>${escapeHtml(ordinal(pundit.predictedPlace))}</strong>
        <small>${escapeHtml(pundit.verdict)}</small>
      </div>
    `).join("");

    return `
      <section class="prediction-comparison">
        <div>
          <span>Media Call</span>
          <strong>${escapeHtml(ordinal(comparison.predictedPlace))}</strong>
        </div>
        <div>
          <span>Actual Ladder</span>
          <strong>${escapeHtml(ordinal(comparison.actualPlace))}</strong>
        </div>
        <p>${escapeHtml(comparison.verdict)} Home-and-away record: ${escapeHtml(comparison.ladderRecord)}.</p>
        <div class="prediction-checks">
          ${panelHtml}
        </div>
      </section>
    `;
  }

  function renderStrategyResult(strategyPlan) {
    if (!strategyPlan) return "";

    return `
      <section class="strategy-result">
        <div>
          <span>Strategy</span>
          <strong>${escapeHtml(strategyPlan.label)}</strong>
        </div>
        <div>
          <span>Fit</span>
          <strong>${escapeHtml(strategyPlan.fit)}</strong>
        </div>
        <p>${escapeHtml(strategyPlan.summary)}</p>
      </section>
    `;
  }

  function renderResultsTabs() {
    const tabs = [
      ["player-stats", "Player Stats"],
      ["ladder", "Ladder"],
      ["games", "Game By Game"],
      ["finals", "Finals"]
    ];

    return `
      <div class="results-tabs" role="tablist" aria-label="Season results">
        ${tabs.map(([key, label]) => `
          <button
            type="button"
            role="tab"
            data-results-tab="${key}"
            aria-selected="${resultsTab === key ? "true" : "false"}"
            class="${resultsTab === key ? "active" : ""}"
          >
            ${escapeHtml(label)}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderOpponentCell(game) {
    const label = game.opponentAbbr || game.opponentShort || game.opponentName;
    return `
      <span
        title="${escapeHtml(game.opponentName)}"
        class="opponent-cell"
        style="--opponent-primary: ${escapeHtml(game.opponentPrimary || "#0b72d9")}; --opponent-secondary: ${escapeHtml(game.opponentSecondary || "#e31b35")};"
      >
        <span class="opponent-dot"></span>
        ${escapeHtml(label)}
      </span>
    `;
  }

  function renderResultPill(game) {
    return `<span class="result-pill ${escapeHtml(game.result)}">${escapeHtml(game.resultShort || resultShort(game.result))}</span>`;
  }

  function renderPlayerStatsPane(data, totalsHtml, leadersHtml, rowsHtml) {
    return `
      <section class="results-pane ${resultsTab === "player-stats" ? "active" : ""}" data-results-pane="player-stats">
        ${renderStrategyResult(data.strategyPlan)}
        ${renderPredictionComparison(data.predictionComparison)}
        <div class="season-stat-summary">
          ${totalsHtml}
        </div>
        <h3>Team Leaders</h3>
        <div class="season-leaders">
          ${leadersHtml}
        </div>
        <div class="season-stat-table-wrap">
          <table class="season-stat-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>G</th>
                <th>GL</th>
                <th>Poss</th>
                <th>K</th>
                <th>HB</th>
                <th>M</th>
                <th>T</th>
                <th>HO</th>
                <th>CLR</th>
                <th>I50</th>
                <th>R50</th>
                <th>BR</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderLadderPane(data) {
    const rowsHtml = (data.ladderRows || []).map((row) => `
      <tr class="${row.invincible ? "invincible-row" : ""}">
        <td>${row.position}</td>
        <td><b>${escapeHtml(row.name)}</b></td>
        <td>${row.played}</td>
        <td>${row.wins}</td>
        <td>${row.losses}</td>
        <td>${row.draws}</td>
        <td>${row.pointsFor}</td>
        <td>${row.pointsAgainst}</td>
        <td>${row.percentage}</td>
        <td>${row.points}</td>
      </tr>
    `).join("");

    return `
      <section class="results-pane ${resultsTab === "ladder" ? "active" : ""}" data-results-pane="ladder">
        <div class="results-table-wrap">
          <table class="results-table ladder-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>PF</th>
                <th>PA</th>
                <th>%</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderGameRows(games) {
    return games.map((game, index) => `
      <tr>
        <td>${game.gameNumber || index + 1}</td>
        <td>${escapeHtml(game.label)}</td>
        <td>${escapeHtml(game.condition)}</td>
        <td>${renderOpponentCell(game)}</td>
        <td>${escapeHtml(game.score)}</td>
        <td>${renderResultPill(game)}</td>
        <td>
          <b>${escapeHtml(game.bestName)}</b>
          <small>${escapeHtml(game.bestReason)}</small>
        </td>
        <td>${escapeHtml(game.goalText || "--")}</td>
      </tr>
    `).join("");
  }

  function renderGameByGamePane(data) {
    return `
      <section class="results-pane ${resultsTab === "games" ? "active" : ""}" data-results-pane="games">
        <div class="results-table-wrap">
          <table class="results-table game-table">
            <thead>
              <tr>
                <th>Gm</th>
                <th>Stage</th>
                <th>Wthr</th>
                <th>Opp</th>
                <th>Score</th>
                <th>Res</th>
                <th>Best</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>${renderGameRows(data.gameResults || [])}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderFinalsPane(data) {
    const finals = data.finalsResults || [];
    if (!finals.length) {
      return `
        <section class="results-pane ${resultsTab === "finals" ? "active" : ""}" data-results-pane="finals">
          <div class="empty-results">No finals were played this season.</div>
        </section>
      `;
    }

    return `
      <section class="results-pane ${resultsTab === "finals" ? "active" : ""}" data-results-pane="finals">
        <div class="results-table-wrap">
          <table class="results-table game-table">
            <thead>
              <tr>
                <th>Gm</th>
                <th>Stage</th>
                <th>Wthr</th>
                <th>Opp</th>
                <th>Score</th>
                <th>Res</th>
                <th>Best</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>${renderGameRows(finals)}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function bindResultsTabs() {
    const tabButtons = els.simLog.querySelectorAll("[data-results-tab]");
    const panes = els.simLog.querySelectorAll("[data-results-pane]");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        resultsTab = button.dataset.resultsTab;
        tabButtons.forEach((tab) => {
          const active = tab.dataset.resultsTab === resultsTab;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });
        panes.forEach((pane) => {
          pane.classList.toggle("active", pane.dataset.resultsPane === resultsTab);
        });
      });
    });
  }

  function renderSeasonStats(data) {
    const totalsHtml = data.totals.map((stat) => `
      <div>
        <strong>${escapeHtml(stat.value)}</strong>
        <span>${escapeHtml(stat.label)}</span>
      </div>
    `).join("");

    const leadersHtml = data.leaders.map((leader) => `
      <div>
        <span>${escapeHtml(leader.label)}</span>
        <strong>${escapeHtml(leader.value)}</strong>
        <small>${escapeHtml(leader.name)}</small>
      </div>
    `).join("");

    const rowsHtml = data.rows.map((row) => `
      <tr>
        <td>
          <div class="season-player-cell">
            <b>${escapeHtml(row.name)}</b>
            <span>${escapeHtml(row.roleLabel)} ${escapeHtml(row.rating)}</span>
          </div>
        </td>
        <td>${row.games}</td>
        <td>${row.goals}</td>
        <td>${row.disposals}</td>
        <td>${row.kicks}</td>
        <td>${row.handballs}</td>
        <td>${row.marks}</td>
        <td>${row.tackles}</td>
        <td>${row.hitouts}</td>
        <td>${row.clearances}</td>
        <td>${row.inside50s}</td>
        <td>${row.rebound50s}</td>
        <td>${row.brownlowVotes}</td>
      </tr>
    `).join("");

    return `
      <article class="sim-current season-stats">
        <span>Season Stats</span>
        <strong>${escapeHtml(data.record)}</strong>
        <p>${escapeHtml(data.games)} games played by your XVIII.</p>
        ${renderResultsTabs()}
        ${renderPlayerStatsPane(data, totalsHtml, leadersHtml, rowsHtml)}
        ${renderLadderPane(data)}
        ${renderGameByGamePane(data)}
        ${renderFinalsPane(data)}
      </article>
    `;
  }

  function renderSimEntries(entries) {
    const latest = entries[entries.length - 1];
    const history = latest ? entries.slice(0, -1) : entries;
    let currentHtml = "";

    if (latest && latest.data && latest.data.kind === "season-stats") {
      currentHtml = renderSeasonStats(latest.data);
    } else if (latest && latest.data && latest.data.kind === "brownlow") {
      currentHtml = `
        <article class="sim-current brownlow">
          <span>Brownlow Medal</span>
          <strong>${escapeHtml(latest.data.name)}</strong>
          <p>${escapeHtml(latest.data.votes)} votes</p>
          <h3>${escapeHtml(latest.data.teamName)}</h3>
          <small>${escapeHtml(latest.data.detail)}</small>
        </article>
      `;
    } else if (latest && latest.data && latest.data.kind === "grand-final-preview") {
      currentHtml = `
        <article
          class="sim-current grand-final-preview"
          style="--opponent-primary: ${escapeHtml(latest.data.opponentPrimary)}; --opponent-secondary: ${escapeHtml(latest.data.opponentSecondary)};"
        >
          <span>${escapeHtml(latest.data.label)}</span>
          <strong>v ${escapeHtml(latest.data.opponentName)}</strong>
          <p>${escapeHtml(latest.data.resultText)}</p>
          <h3>Premiership decider</h3>
          <small>${escapeHtml(latest.data.detail)}</small>
        </article>
      `;
    } else if (latest && latest.data) {
      currentHtml = `
          <article class="sim-current ${latest.type}">
            <span>${escapeHtml(latest.data.label)}</span>
            <strong>${escapeHtml(latest.data.score)}</strong>
            <p>v ${escapeHtml(latest.data.opponentName)}</p>
            <h3>${escapeHtml(latest.data.resultText)}</h3>
            <small>${escapeHtml(latest.data.bestName)} ${escapeHtml(latest.data.bestReason)}.</small>
          </article>
        `;
    } else if (latest) {
      currentHtml = `
          <article class="sim-current summary ${escapeHtml(latest.type)}">
            <span>Season Update</span>
            <strong>Summary</strong>
            <p>${escapeHtml(latest.text)}</p>
          </article>
        `;
    }

    const historyHtml = history.length
      ? `
        <div class="sim-history">
          ${history.map((entry, index) => `
            <p class="sim-entry ${entry.type}">
              <span>${index + 1}</span>
              ${escapeHtml(entry.text)}
            </p>
          `).join("")}
        </div>
      `
      : "";

    els.simLog.innerHTML = `${currentHtml}${historyHtml}`;
    if (latest && latest.data && latest.data.kind === "season-stats") {
      bindResultsTabs();
    }
    els.simLog.scrollTop = els.simLog.scrollHeight;
    if (latest && latest.data && latest.data.kind === "season-stats") {
      scrollToElement(els.simLog, "start");
    } else {
      scrollToElement(els.simSection, "center");
    }
  }

  function opponentNameFor(opponent) {
    return typeof opponent === "string" ? opponent : opponent.name;
  }

  function opponentAbbrFor(opponent) {
    const teamName = typeof opponent === "string" ? opponent : opponent.name || opponent.short;
    const overrides = {
      Adelaide: "Ade",
      Brisbane: "Bri",
      "Brisbane Bears": "BB",
      Carlton: "Car",
      Collingwood: "Col",
      Essendon: "Ess",
      Fremantle: "Fre",
      Geelong: "Gee",
      "Gold Coast": "GC",
      "Greater Western Sydney": "GWS",
      Hawthorn: "Haw",
      Melbourne: "Mel",
      "North Melbourne": "NM",
      "Port Adelaide": "Port",
      Richmond: "Rich",
      "St Kilda": "StK",
      Sydney: "Syd",
      "West Coast": "WC",
      "Western Bulldogs": "WB",
      Crows: "Ade",
      Bears: "BB",
      Lions: "Bri",
      Blues: "Car",
      Magpies: "Col",
      Bombers: "Ess",
      Dockers: "Fre",
      Cats: "Gee",
      Suns: "GC",
      Giants: "GWS",
      Hawks: "Haw",
      Demons: "Mel",
      Kangaroos: "NM",
      Power: "Port",
      Tigers: "Rich",
      Saints: "StK",
      Swans: "Syd",
      Eagles: "WC",
      Bulldogs: "WB"
    };
    return overrides[teamName] || teamName.slice(0, 3);
  }

  function grandFinalPreviewData(final) {
    const opponent = final.opponent;
    const opponentTeam = typeof opponent === "string" ? null : opponent;
    return {
      kind: "grand-final-preview",
      label: "Grand Final",
      opponentName: opponentNameFor(opponent),
      opponentShort: opponentTeam?.short || opponentNameFor(opponent),
      opponentPrimary: opponentTeam?.primary || "#0b72d9",
      opponentSecondary: opponentTeam?.secondary || "#e31b35",
      resultText: "Choose your pre-game speech before the bounce.",
      detail: "One message can still swing the scoreboard, but the match has to be won on the field."
    };
  }

  function playGame(label, opponent, strength, difficulty = 0, marginModifier = 0, seasonStats = null, strategyPlan = null) {
    const opponentTeam = typeof opponent === "string" ? null : opponent;
    const opponentName = opponentNameFor(opponent);
    const opponentRating = 76 + rand(18) + difficulty;
    const scoreline = scorelineForGame({ label, strength, opponentRating, marginModifier, strategyPlan });
    const { condition, result, resultText, scoreFor, scoreAgainst } = scoreline;
    const game = {
      result,
      label,
      opponentName,
      resultText,
      scoreFor,
      scoreAgainst,
      score: `${scoreFor}-${scoreAgainst}`,
      condition,
      opponentId: opponentTeam?.id || "",
      opponentShort: opponentTeam?.short || opponentName,
      opponentAbbr: opponentTeam ? opponentAbbrFor(opponentTeam) : opponentAbbrFor(opponentName),
      opponentPrimary: opponentTeam?.primary || "#0b72d9",
      opponentSecondary: opponentTeam?.secondary || "#e31b35"
    };
    const statLine = addPlayerGameStats(game, seasonStats, strategyPlan);
    const best = statLine?.bestPlayer || sample(slots.filter((slot) => slot.player)).player;
    const bestReason = statLine?.bestReason || "made the key moments count";
    const goalLine = statLine?.goalText ? ` Goals: ${statLine.goalText}.` : "";

    return {
      ...game,
      bestName: best.name,
      bestReason,
      bestPlayer: best,
      goalText: statLine?.goalText || "",
      resultShort: resultShort(result),
      text: `${label} v ${opponentName}: ${resultText}. ${scoreFor}-${scoreAgainst}. ${best.name} ${bestReason}.${goalLine}`
    };
  }

  function selectedBrownlowCandidates() {
    return slots
      .filter((slot) => slot.player)
      .map((slot) => ({
        key: `invincible:${playerIdentity(slot.player)}`,
        name: slot.player.name,
        teamName: "AFL Invincible XVIII",
        rating: effectiveRating(slot.player),
        fromSquad: true
      }));
  }

  function oppositionBrownlowCandidates(opponent) {
    const opponentTeam = typeof opponent === "string"
      ? data.teams.find((team) => team.name === opponent)
      : opponent;
    const pool = opponentTeam
      ? data.players.filter((player) => player.team === opponentTeam.id)
      : data.players;

    return shuffle(pool)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map((player) => ({
        key: `opponent:${player.team}:${player.name}`,
        name: player.name,
        teamName: teamById.get(player.team).name,
        rating: player.rating,
        fromSquad: false
      }));
  }

  function addBrownlowVotes(voteTable, game, opponent) {
    const candidates = [...selectedBrownlowCandidates(), ...oppositionBrownlowCandidates(opponent)]
      .map((candidate) => ({
        ...candidate,
        score: candidate.rating
          + rand(26)
          + (candidate.fromSquad && game.result === "win" ? 7 : 0)
          + (!candidate.fromSquad && game.result === "loss" ? 7 : 0)
          + (game.result === "draw" ? 3 : 0)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    [3, 2, 1].forEach((votes, index) => {
      const candidate = candidates[index];
      if (!candidate) return;
      const current = voteTable.get(candidate.key) || {
        key: candidate.key,
        name: candidate.name,
        teamName: candidate.teamName,
        rating: candidate.rating,
        votes: 0
      };
      current.votes += votes;
      voteTable.set(candidate.key, current);
    });
  }

  function brownlowWinner(voteTable) {
    const standings = [...voteTable.values()].sort((a, b) => b.votes - a.votes || b.rating - a.rating);
    return standings[0] || {
      name: "No winner",
      teamName: "Season incomplete",
      votes: 0,
      rating: 0
    };
  }

  function updateRecord(record, gameOrResult) {
    const result = typeof gameOrResult === "string" ? gameOrResult : gameOrResult.result;
    if (result === "win") record.wins += 1;
    if (result === "loss") record.losses += 1;
    if (result === "draw") record.draws += 1;
    if (typeof gameOrResult === "object") {
      record.pointsFor += gameOrResult.scoreFor;
      record.pointsAgainst += gameOrResult.scoreAgainst;
    }
  }

  function completeSimulation(
    entries,
    record,
    brownlowVotes,
    seasonStats,
    predictionComparison = null,
    strategyPlan = null,
    ladderRows = [],
    gameResults = [],
    finalsResults = []
  ) {
    const invincible = record.losses === 0 && record.draws === 0;
    const medalist = brownlowWinner(brownlowVotes);
    applyBrownlowVotesToStats(seasonStats, brownlowVotes);
    entries.push(simEntry(
      invincible
        ? `Season complete: ${recordText(record)}. AFL Invincible achieved.`
        : `Season complete: ${recordText(record)}. Re-draft and chase the perfect run.`,
      invincible ? "summary win" : "summary"
    ));
    entries.push(simEntry(
      `${medalist.name} wins the Brownlow Medal with ${medalist.votes} votes.`,
      "brownlow",
      {
        kind: "brownlow",
        name: medalist.name,
        teamName: medalist.teamName,
        votes: medalist.votes,
        detail: medalist.teamName === "AFL Invincible XVIII"
          ? "Your side produced the best player in the league."
          : "The medal can go outside your squad, even if your team makes the deepest run."
      }
    ));
    if (predictionComparison) {
      entries.push(simEntry(
        `Media prediction: tipped ${ordinal(predictionComparison.predictedPlace)}, finished ${ordinal(predictionComparison.actualPlace)}. ${predictionComparison.verdict}`,
        "prediction"
      ));
    }
    resultsTab = "player-stats";
    const seasonStatsData = buildSeasonStatsData(
      seasonStats,
      record,
      predictionComparison,
      strategyPlan,
      ladderRows,
      gameResults,
      finalsResults
    );
    if (seasonStatsData) {
      entries.push(simEntry("Season-end player statistics are ready.", "season-stats", seasonStatsData));
    }
    renderSimEntries(entries);
    simulationActive = false;
    seasonFinished = true;
    pendingGrandFinal = null;
    document.body.classList.remove("simulating");
    simTimer = null;
    clearSpeech();
    renderTeam();
  }

  function shuffledSpeechEffects() {
    return [4, 0, -3].sort(() => Math.random() - 0.5);
  }

  function showSpeech() {
    if (!pendingGrandFinal) return;
    const opponentName = opponentNameFor(pendingGrandFinal.final.opponent);
    const options = [
      ["Motivating Speech", "Belief, jumper pride, one more contest."],
      ["Strategic Speech", "Structure, matchups, clean exits."],
      ["Same As Season", "Trust the routine that got you here."]
    ];
    els.speechPanel.classList.remove("hidden");
    els.speechPanel.innerHTML = `
      <h3>Grand Final v ${escapeHtml(opponentName)}</h3>
      <p>The rooms go quiet before ${escapeHtml(opponentName)}. One message can swing the scoreboard by +4, 0 or -3 points.</p>
      <div class="speech-options">
        ${options.map(([label, text], index) => `
          <button type="button" data-speech="${index}">
            <strong>${label}</strong>
            <span>${text}</span>
          </button>
        `).join("")}
      </div>
    `;
    els.speechPanel.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => resolveGrandFinal(Number(button.dataset.speech)));
    });
    scrollToElement(els.simSection, "center");
  }

  function clearSpeech() {
    pendingGrandFinal = null;
    els.speechPanel.classList.add("hidden");
    els.speechPanel.innerHTML = "";
  }

  function speechOutcome(effect) {
    if (effect > 0) return "Landed perfectly";
    if (effect < 0) return "Missed the mark";
    return "Kept things steady";
  }

  function resolveGrandFinal(choiceIndex) {
    if (!pendingGrandFinal) return;
    const {
      final,
      strength,
      entries,
      record,
      brownlowVotes,
      seasonStats,
      predictionComparison,
      strategyPlan,
      ladderRows,
      gameResults,
      finalsResults,
      delay,
      effects
    } = pendingGrandFinal;
    const effect = effects[choiceIndex] || 0;
    const effectLabel = `${effect >= 0 ? "+" : ""}${effect}`;
    const speechLine = `Grand Final speech: ${speechOutcome(effect)} (${effectLabel} points).`;
    entries.push(simEntry(speechLine, effect > 0 ? "summary win" : effect < 0 ? "summary loss" : "summary"));
    renderSimEntries(entries);
    clearSpeech();

    const playFinal = () => {
      const game = playGame(final.label, final.opponent, strength, final.difficulty, effect, seasonStats, strategyPlan);
      updateRecord(record, game);
      finalsResults.push({ ...game, gameNumber: finalsResults.length + 1 });
      entries.push(simEntry(game.text, game.result, game));
      if (game.result !== "win") {
        entries.push(simEntry("Grand Final defeat. The speech mattered, but the game still had to be won.", "summary loss"));
      } else {
        entries.push(simEntry("Premiership won. The season now belongs to the medal count.", "summary win"));
      }
      completeSimulation(entries, record, brownlowVotes, seasonStats, predictionComparison, strategyPlan, ladderRows, gameResults, finalsResults);
    };

    if (delay === 0) {
      playFinal();
    } else {
      simTimer = window.setTimeout(playFinal, delay);
    }
  }

  function simulate(quick) {
    if (!isTeamComplete() || simulationActive || seasonFinished) return;
    if (simTimer) window.clearTimeout(simTimer);
    clearSpeech();
    simulationActive = true;
    document.body.classList.add("simulating");
    const strength = teamStrength();
    const entries = [];
    const record = createRecord();
    const brownlowVotes = new Map();
    const seasonStats = createSeasonStats();
    const delay = quick ? 0 : 650;
    const seasonTeams = availableTeamsForYear(currentSeasonYear());
    const ladderRecords = createLadderRecords(seasonTeams);
    const invincibleLadderRecord = ladderRecords.get("invincible");
    const gameResults = [];
    const finalsResults = [];
    let finalLadderRows = null;
    const preseasonPrediction = seasonPrediction || createMediaPrediction();
    seasonPrediction = preseasonPrediction;
    const strategyPlan = strategyPlanFor(seasonStrategy);
    const homeAndAway = shuffle(seasonTeams).map((team, index) => ({
      label: `Round ${index + 1}`,
      opponent: team,
      difficulty: regularSeasonDifficulty(index)
    }));
    const getFinalLadderRows = () => {
      if (!finalLadderRows) {
        simulateRemainingLadder(ladderRecords, seasonTeams, homeAndAway.length);
        finalLadderRows = buildLadderData(ladderRecords);
      }
      return finalLadderRows;
    };
    const predictionComparison = () => buildPredictionComparison(preseasonPrediction, getFinalLadderRows());
    let finals = null;
    const getFinals = () => {
      if (!finals) {
        const finalsOpponents = finalsOpponentsFromLadder(getFinalLadderRows(), seasonTeams);
        finals = ["Qualifying Final", "Preliminary Final", "Grand Final"].map((label, index) => ({
          label,
          opponent: finalsOpponents[index],
          difficulty: finalsDifficulty(index)
        }));
      }
      return finals;
    };
    els.simLog.innerHTML = "";
    renderTeam();
    scrollToElement(els.simSection, "start");
    entries.push(simEntry(`${strategyPlan.label} strategy locked in. ${strategyPlan.summary}`, "strategy"));

    const revealFinals = (index) => {
      const finalsSchedule = getFinals();
      if (index >= finalsSchedule.length) {
        completeSimulation(
          entries,
          record,
          brownlowVotes,
          seasonStats,
          predictionComparison(),
          strategyPlan,
          getFinalLadderRows(),
          gameResults,
          finalsResults
        );
        return;
      }

      const final = finalsSchedule[index];
      if (final.label === "Grand Final") {
        pendingGrandFinal = {
          final,
          strength,
          entries,
          record,
          brownlowVotes,
          seasonStats,
          predictionComparison: predictionComparison(),
          strategyPlan,
          ladderRows: getFinalLadderRows(),
          gameResults,
          finalsResults,
          delay,
          effects: shuffledSpeechEffects()
        };
        const preview = grandFinalPreviewData(final);
        entries.push(simEntry(
          `Grand Final v ${preview.opponentName}: choose your pre-game speech before the bounce.`,
          "summary grand-final-preview",
          preview
        ));
        renderSimEntries(entries);
        showSpeech();
        renderTeam();
        return;
      }

      const game = playGame(final.label, final.opponent, strength, final.difficulty, 0, seasonStats, strategyPlan);
      updateRecord(record, game);
      finalsResults.push({ ...game, gameNumber: finalsResults.length + 1 });
      entries.push(simEntry(game.text, game.result, game));
      renderSimEntries(entries);
      if (game.result !== "win") {
        entries.push(simEntry("Finals exit. The perfect season has to be earned again.", "summary"));
        completeSimulation(
          entries,
          record,
          brownlowVotes,
          seasonStats,
          predictionComparison(),
          strategyPlan,
          getFinalLadderRows(),
          gameResults,
          finalsResults
        );
      } else if (delay === 0) {
        revealFinals(index + 1);
      } else {
        simTimer = window.setTimeout(() => revealFinals(index + 1), delay);
      }
    };

    const revealRound = (index) => {
      if (index >= homeAndAway.length) {
        const ladderRows = getFinalLadderRows();
        const invincibleLadderRow = ladderRows.find((row) => row.invincible);
        entries.push(simEntry(`Home-and-away record: ${recordText(invincibleLadderRecord)}.`, "summary"));
        if (invincibleLadderRow && invincibleLadderRow.position <= 8) {
          entries.push(simEntry("Finals locked in. Three wins from immortality.", "summary"));
          renderSimEntries(entries);
          if (delay === 0) {
            revealFinals(0);
          } else {
            simTimer = window.setTimeout(() => revealFinals(0), delay);
          }
        } else {
          entries.push(simEntry("The side missed finals. Reset the draft and build a stronger squad.", "summary"));
          completeSimulation(
            entries,
            record,
            brownlowVotes,
            seasonStats,
            predictionComparison(),
            strategyPlan,
            getFinalLadderRows(),
            gameResults,
            finalsResults
          );
        }
        return;
      }

      const round = homeAndAway[index];
      const game = playGame(round.label, round.opponent, strength, round.difficulty, 0, seasonStats, strategyPlan);
      updateRecord(record, game);
      updateRecord(invincibleLadderRecord, game);
      updateOpponentLadderRecord(ladderRecords, round.opponent, game);
      gameResults.push({ ...game, gameNumber: index + 1 });
      addBrownlowVotes(brownlowVotes, game, round.opponent);
      entries.push(simEntry(game.text, game.result, game));
      renderSimEntries(entries);
      if (delay === 0) {
        revealRound(index + 1);
      } else {
        simTimer = window.setTimeout(() => revealRound(index + 1), delay);
      }
    };

    revealRound(0);
  }

  function setRatingMode(mode) {
    if (slots.some((slot) => slot.player)) return;
    ratingMode = mode;
    els.normalModeBtn.classList.toggle("active", mode === "career");
    els.hardModeBtn.classList.toggle("active", mode === "season");
    els.pickHelp.textContent = mode === "season"
      ? "Hard Mode: ratings use the specific spun year."
      : "Normal Mode: ratings use career performance.";
  }

  els.spinBtn.addEventListener("click", spin);
  els.skipBtn.addEventListener("click", rerollSpin);
  els.resetBtn.addEventListener("click", resetDraft);
  els.normalModeBtn.addEventListener("click", () => setRatingMode("career"));
  els.hardModeBtn.addEventListener("click", () => setRatingMode("season"));
  els.simulateBtn.addEventListener("click", () => simulate(false));
  els.quickSimBtn.addEventListener("click", () => simulate(true));

  renderTeam();
})();
