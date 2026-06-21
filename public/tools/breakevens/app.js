const ENDPOINTS = ["api/breakevens-data.json", "/api/breakevens-data.json", "/.netlify/functions/breakevens-data", "/api/breakevens-data"];

const TEAM_COLOURS = {
  BRI: ["#6a1e3a", "#f7c948"],
  BRO: ["#6a1e3a", "#f7c948"],
  CAN: ["#00a651", "#233a85"],
  CBR: ["#00a651", "#233a85"],
  CBY: ["#0054a6", "#ffffff"],
  BUL: ["#0054a6", "#ffffff"],
  CRO: ["#00a3e0", "#111111"],
  SHA: ["#00a3e0", "#111111"],
  DOL: ["#e2231a", "#f7c948"],
  GLD: ["#00aeef", "#f7c948"],
  GCT: ["#00aeef", "#f7c948"],
  MAN: ["#6f263d", "#ffffff"],
  MNL: ["#6f263d", "#ffffff"],
  MEL: ["#6a1b9a", "#f7c948"],
  NEW: ["#0054a6", "#d71920"],
  NQL: ["#0b1f3a", "#f7c948"],
  NQC: ["#0b1f3a", "#f7c948"],
  PAR: ["#0054a6", "#f7c948"],
  PEN: ["#111111", "#ff5ca8"],
  PTH: ["#111111", "#ff5ca8"],
  SGI: ["#d71920", "#ffffff"],
  STG: ["#d71920", "#ffffff"],
  SOU: ["#00843d", "#d71920"],
  STH: ["#00843d", "#d71920"],
  SYD: ["#0033a0", "#d71920"],
  WAR: ["#003b5c", "#00a3a1"],
  NZL: ["#003b5c", "#00a3a1"],
  WST: ["#f58220", "#111111"]
};

const state = {
  data: null,
  platformId: "fantasy",
  filterMode: "search",
  query: "",
  team: "all",
  position: "all",
  confidence: "all",
  sort: "be",
  loading: true,
  error: null
};

const elements = {
  platformButtons: [...document.querySelectorAll("[data-platform]")],
  filterModeSelect: document.querySelector("#filterModeSelect"),
  filterControls: [...document.querySelectorAll("[data-filter-control]")],
  searchInput: document.querySelector("#searchInput"),
  teamSelect: document.querySelector("#teamSelect"),
  positionSelect: document.querySelector("#positionSelect"),
  confidenceSelect: document.querySelector("#confidenceSelect"),
  sortSelect: document.querySelector("#sortSelect"),
  refreshButton: document.querySelector("#refreshButton"),
  tableTitle: document.querySelector("#tableTitle"),
  resultCount: document.querySelector("#resultCount"),
  playersBody: document.querySelector("#playersBody")
};

init();

function init() {
  elements.platformButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.platformId = button.dataset.platform;
      state.team = "all";
      state.position = "all";
      syncControls();
      render();
    });
  });

  elements.filterModeSelect.addEventListener("change", (event) => {
    state.filterMode = event.target.value;
    renderFilterControls();
    renderTable();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderTable();
  });

  elements.teamSelect.addEventListener("change", (event) => {
    state.team = event.target.value;
    renderTable();
  });

  elements.positionSelect.addEventListener("change", (event) => {
    state.position = event.target.value;
    renderTable();
  });

  elements.confidenceSelect.addEventListener("change", (event) => {
    state.confidence = event.target.value;
    renderTable();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderTable();
  });

  elements.refreshButton.addEventListener("click", () => {
    loadData({ refresh: true });
  });

  syncControls();
  loadData();
}

async function loadData(options = {}) {
  state.loading = true;
  state.error = null;
  elements.refreshButton.disabled = true;
  renderTable();

  try {
    state.data = await fetchData(options.refresh);
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.loading = false;
    elements.refreshButton.disabled = false;
    syncControls();
    render();
  }
}

async function fetchData(refresh = false) {
  const errors = [];
  for (const endpoint of ENDPOINTS) {
    const url = refresh ? `${endpoint}?refresh=1` : endpoint;
    try {
      const response = await fetch(url, {
        cache: refresh ? "reload" : "no-cache",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`${endpoint} returned ${response.status}`);
      const text = await response.text();
      const trimmed = text.trimStart();
      if (trimmed.startsWith("<")) throw new Error(`${endpoint} returned HTML, not JSON`);
      return JSON.parse(text);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(errors.join(" | "));
}

function syncControls() {
  elements.platformButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.platform === state.platformId);
    button.setAttribute("aria-selected", String(button.dataset.platform === state.platformId));
  });

  elements.filterModeSelect.value = state.filterMode;
  elements.searchInput.value = state.query;
  elements.confidenceSelect.value = state.confidence;
  elements.sortSelect.value = state.sort;
  renderTeamOptions();
  renderPositionOptions();
  renderFilterControls();
}

function renderFilterControls() {
  elements.filterControls.forEach((control) => {
    const isActive = control.dataset.filterControl === state.filterMode;
    control.classList.toggle("is-hidden", !isActive);
  });
}

function render() {
  renderTable();
}

function renderTeamOptions() {
  const platform = getPlatform();
  const currentValue = state.team;
  const teams = platform
    ? [...new Map(platform.players.map((player) => [player.team.abbrev, player.team])).values()].sort((a, b) =>
        a.abbrev.localeCompare(b.abbrev)
      )
    : [];

  elements.teamSelect.innerHTML = [
    `<option value="all">All teams</option>`,
    ...teams.map((team) => `<option value="${escapeAttribute(team.abbrev)}">${escapeHtml(team.abbrev)} - ${escapeHtml(team.name)}</option>`)
  ].join("");

  const hasValue = teams.some((team) => team.abbrev === currentValue);
  elements.teamSelect.value = hasValue ? currentValue : "all";
  state.team = elements.teamSelect.value;
}

function renderPositionOptions() {
  const platform = getPlatform();
  const currentValue = state.position;
  const positions = platform
    ? [...new Set(platform.players.flatMap((player) => player.positions).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    : [];

  elements.positionSelect.innerHTML = [
    `<option value="all">All positions</option>`,
    ...positions.map((position) => `<option value="${escapeAttribute(position)}">${escapeHtml(position)}</option>`)
  ].join("");

  const hasValue = positions.includes(currentValue);
  elements.positionSelect.value = hasValue ? currentValue : "all";
  state.position = elements.positionSelect.value;
}

function renderTable() {
  if (state.loading) {
    elements.playersBody.innerHTML = `<tr><td colspan="8" class="empty-cell">Loading players...</td></tr>`;
    elements.resultCount.textContent = "";
    return;
  }

  if (state.error) {
    elements.playersBody.innerHTML = `<tr><td colspan="8" class="empty-cell">Could not load data.</td></tr>`;
    elements.resultCount.textContent = "";
    return;
  }

  const platform = getPlatform();
  if (!platform) return;

  const players = filteredPlayers(platform.players);
  elements.tableTitle.textContent = `${platform.label} estimated breakevens`;
  elements.resultCount.textContent = `${formatInteger(players.length)} of ${formatInteger(platform.players.length)} players`;

  if (!players.length) {
    elements.playersBody.innerHTML = `<tr><td colspan="8" class="empty-cell">No players match those filters.</td></tr>`;
    return;
  }

  elements.playersBody.innerHTML = players.map(renderPlayerRow).join("");
}

function filteredPlayers(players) {
  return players
    .filter((player) => {
      if (state.filterMode === "search" && state.query && !player.name.toLowerCase().includes(state.query)) return false;
      if (state.filterMode === "team" && state.team !== "all" && player.team.abbrev !== state.team) return false;
      if (state.filterMode === "position" && state.position !== "all" && !player.positions.includes(state.position)) return false;
      if (state.confidence !== "all" && player.estimateConfidence !== state.confidence) return false;
      return true;
    })
    .sort(sortPlayers);
}

function sortPlayers(left, right) {
  switch (state.sort) {
    case "be-desc":
      return compareNullable(right.estimatedBe, left.estimatedBe) || left.name.localeCompare(right.name);
    case "price-desc":
      return compareNullable(right.price, left.price) || left.name.localeCompare(right.name);
    case "price":
      return compareNullable(left.price, right.price) || left.name.localeCompare(right.name);
    case "name":
      return left.name.localeCompare(right.name);
    case "team":
      return left.team.abbrev.localeCompare(right.team.abbrev) || left.name.localeCompare(right.name);
    case "be":
    default:
      return compareNullable(left.estimatedBe, right.estimatedBe) || left.name.localeCompare(right.name);
  }
}

function renderPlayerRow(player) {
  const beClass = player.estimatedBe === null ? "" : player.estimatedBe < 25 ? "good" : player.estimatedBe > 75 ? "risk" : "warn";
  const status = player.statusText || player.status || player.playedStatus || "";
  const [primary, secondary] = getTeamColours(player.team.abbrev);
  return `
    <tr>
      <td>
        <div class="player-name">${escapeHtml(player.name)}</div>
        <div class="player-sub">${escapeHtml(status)}</div>
      </td>
      <td>
        <span
          class="team-pill"
          style="--team-primary: ${escapeAttribute(primary)}; --team-secondary: ${escapeAttribute(secondary)}"
          title="${escapeAttribute(player.team.fullName || player.team.name || player.team.abbrev)}"
        >
          <span class="team-swatch" aria-hidden="true"></span>
          <span>
            <span class="team-code">${escapeHtml(player.team.abbrev)}</span>
            <span class="team-name">${escapeHtml(player.team.name)}</span>
          </span>
        </span>
      </td>
      <td><span class="positions">${escapeHtml(player.positions.join("/"))}</span></td>
      <td class="num">${formatMoney(player.price)}</td>
      <td class="num">${formatNumber(player.average, 1)}</td>
      <td class="num"><span class="be-value ${beClass}">${player.estimatedBe === null ? "-" : formatInteger(player.estimatedBe)}</span></td>
      <td><span class="pill ${escapeAttribute(player.estimateConfidence)}">${escapeHtml(player.estimateConfidence)}</span></td>
      <td class="note">${escapeHtml(player.estimateNote ?? "")}</td>
    </tr>
  `;
}

function getPlatform() {
  return state.data?.platforms?.[state.platformId] ?? null;
}

function getTeamColours(abbrev) {
  return TEAM_COLOURS[abbrev] ?? ["#294036", "#adff55"];
}

function compareNullable(left, right) {
  const leftOk = Number.isFinite(left);
  const rightOk = Number.isFinite(right);
  if (!leftOk && !rightOk) return 0;
  if (!leftOk) return 1;
  if (!rightOk) return -1;
  return left - right;
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatInteger(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value, decimals = 0) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
