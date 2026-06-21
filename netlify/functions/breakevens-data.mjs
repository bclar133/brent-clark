const SEASON = 2026;

const FANTASY_BASE = "https://fantasy.nrl.com/data/nrl";
const SUPERCOACH_BASE = `https://www.supercoach.com.au/${SEASON}/api/nrl/classic/v1`;

const REQUEST_HEADERS = {
  Accept: "application/json",
  "User-Agent": "brent-clark-nrl-be-lab/0.1 (+https://www.brent-clark.com/)"
};

const FANTASY_POSITION_LABELS = {
  1: "HOK",
  2: "MID",
  3: "EDG",
  4: "HLF",
  5: "CTR",
  6: "WFB"
};

const cache = {
  timestamp: 0,
  payload: null
};

const CACHE_TTL_MS = 15 * 60 * 1000;

export async function handler(event = {}) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders()
    };
  }

  try {
    const refresh = event.queryStringParameters?.refresh === "1";
    const payload = await getPayload(refresh);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=900"
      },
      body: JSON.stringify(payload)
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        ...corsHeaders(),
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      },
      body: JSON.stringify({
        error: "Unable to load public rugby league fantasy data.",
        detail: error instanceof Error ? error.message : String(error)
      })
    };
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}

async function getPayload(refresh) {
  const now = Date.now();
  if (!refresh && cache.payload && now - cache.timestamp < CACHE_TTL_MS) {
    return {
      ...cache.payload,
      cache: { status: "hit", cachedAt: new Date(cache.timestamp).toISOString() }
    };
  }

  const [fantasy, supercoach] = await Promise.all([loadFantasy(), loadSuperCoach()]);
  const payload = {
    generatedAt: new Date().toISOString(),
    season: SEASON,
    dataPolicy: {
      mode: "official-public-only",
      summary:
        "This endpoint fetches only public, unauthenticated official feeds. Official paid breakeven fields are not requested. Values shown as estimated BE are calculated from public price and score data and are not official Coach or SuperCoach Plus numbers."
    },
    platforms: { fantasy, supercoach }
  };

  cache.timestamp = now;
  cache.payload = payload;
  return {
    ...payload,
    cache: { status: "miss", cachedAt: new Date(now).toISOString() }
  };
}

async function loadFantasy() {
  const [checksums, squads, players] = await Promise.all([
    fetchJson(`${FANTASY_BASE}/checksums.json`),
    fetchJson(`${FANTASY_BASE}/squads.json`),
    fetchJson(`${FANTASY_BASE}/players.json`)
  ]);

  const teamsById = new Map(
    squads.map((team) => [
      team.id,
      {
        id: team.id,
        name: team.name,
        fullName: team.full_name,
        abbrev: team.short_name
      }
    ])
  );

  const magicNumber = median(
    players
      .map((player) => {
        const pricedAt = numeric(player.stats?.wpr) || numeric(player.stats?.avg_points);
        const price = numeric(player.cost);
        return price > 0 && pricedAt > 0 ? price / pricedAt : null;
      })
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  const normalizedPlayers = players
    .map((player) => normalizeFantasyPlayer(player, teamsById, magicNumber))
    .sort(compareByEstimatedBe);

  return {
    id: "fantasy",
    label: "NRL Fantasy",
    sourceType: "official-public-feed",
    officialBreakevenAccess: "paid-coach-field-not-requested",
    estimateModel: "three-score-public-price-estimate",
    magicNumber: round(magicNumber, 2),
    version: checksums.players ?? null,
    sourceUrls: [
      `${FANTASY_BASE}/checksums.json`,
      `${FANTASY_BASE}/squads.json`,
      `${FANTASY_BASE}/players.json`
    ],
    players: normalizedPlayers
  };
}

function normalizeFantasyPlayer(player, teamsById, magicNumber) {
  const team = teamsById.get(player.squad_id) ?? {
    id: player.squad_id,
    name: "Unknown",
    fullName: "Unknown",
    abbrev: "UNK"
  };
  const price = numeric(player.cost);
  const scores = sortedNumberEntries(player.stats?.scores);
  const lastScores = scores.map((entry) => entry.value).filter((value) => Number.isFinite(value));
  const lastTwoScores = lastScores.slice(-2);
  const pricedAt = price > 0 && magicNumber > 0 ? price / magicNumber : null;
  const estimate = estimateFromLastScores(pricedAt, lastTwoScores);

  return {
    id: String(player.id),
    name: `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim(),
    firstName: player.first_name ?? "",
    lastName: player.last_name ?? "",
    team,
    positions: (player.positions ?? []).map((position) => FANTASY_POSITION_LABELS[position] ?? String(position)),
    price,
    status: player.status ?? "available",
    currentPriceRound: maxNumericKey(player.stats?.prices),
    lastScoreRound: scores.at(-1)?.round ?? null,
    gamesPlayed: numeric(player.stats?.games_played),
    average: numeric(player.stats?.avg_points),
    last3Average: numeric(player.stats?.last_3_avg),
    projectedAverage: numeric(player.stats?.proj_avg),
    ownedBy: numeric(player.stats?.owned_by),
    estimatedBe: estimate.value,
    estimateConfidence: estimate.confidence,
    estimateNote: estimate.note,
    officialBe: null
  };
}

async function loadSuperCoach() {
  const settings = await fetchJson(`${SUPERCOACH_BASE}/settings`);
  const competition = settings.game?.competitions?.find((item) => item.competition_id === 2) ?? settings.game?.competitions?.[0];
  const currentRound = numeric(competition?.status?.current_round);
  const nextRound = numeric(competition?.status?.next_round) || currentRound;
  const status = competition?.status?.status ?? "unknown";
  const players = await fetchJson(
    `${SUPERCOACH_BASE}/players?round=${encodeURIComponent(nextRound)}&embed=positions,player_stats`
  );

  const magicNumber = median(
    players
      .map((player) => {
        const stats = player.player_stats?.[0];
        const price = numeric(stats?.price);
        const average = numeric(stats?.avg);
        const games = numeric(stats?.total_games);
        return price > 0 && average > 0 && games >= 3 ? price / average : null;
      })
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  const normalizedPlayers = players
    .map((player) => normalizeSuperCoachPlayer(player, magicNumber))
    .sort(compareByEstimatedBe);

  return {
    id: "supercoach",
    label: "NRL SuperCoach",
    sourceType: "official-public-api",
    officialBreakevenAccess: "supercoach-plus-field-not-requested",
    estimateModel: "avg3-public-price-estimate",
    currentRound,
    nextRound,
    status,
    magicNumber: round(magicNumber, 2),
    sourceUrls: [
      `${SUPERCOACH_BASE}/settings`,
      `${SUPERCOACH_BASE}/players?round=${nextRound}&embed=positions,player_stats`
    ],
    players: normalizedPlayers
  };
}

function normalizeSuperCoachPlayer(player, magicNumber) {
  const stats = player.player_stats?.[0] ?? {};
  const price = numeric(stats.price);
  const average = numeric(stats.avg);
  const avg3 = numeric(stats.avg3);
  const pricedAt = price > 0 && magicNumber > 0 ? price / magicNumber : null;
  const estimate = estimateFromAverage(pricedAt, avg3, average, numeric(stats.total_games));

  return {
    id: String(player.id),
    name: `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim(),
    firstName: player.first_name ?? "",
    lastName: player.last_name ?? "",
    team: {
      id: player.team?.id ?? player.team_id,
      name: player.team?.name ?? "Unknown",
      fullName: player.team?.feed_name ?? player.team?.name ?? "Unknown",
      abbrev: player.team?.abbrev ?? "UNK"
    },
    positions: (player.positions ?? []).map((position) => position.position ?? position.abbrev ?? String(position)),
    price,
    status: player.injury_suspension_status ?? "available",
    statusText: player.injury_suspension_status_text ?? "",
    playedStatus: player.played_status?.display ?? "",
    currentPriceRound: numeric(stats.round),
    lastScoreRound: numeric(stats.round),
    gamesPlayed: numeric(stats.total_games),
    average,
    last3Average: avg3,
    projectedScore: numeric(stats.ppts1),
    ownedBy: numeric(stats.owned),
    estimatedBe: estimate.value,
    estimateConfidence: estimate.confidence,
    estimateNote: estimate.note,
    officialBe: null
  };
}

function estimateFromLastScores(pricedAt, lastTwoScores) {
  if (!Number.isFinite(pricedAt) || pricedAt <= 0) {
    return unavailable("No usable public price baseline.");
  }

  if (lastTwoScores.length >= 2) {
    return {
      value: Math.round(pricedAt * 3 - lastTwoScores[0] - lastTwoScores[1]),
      confidence: "medium",
      note: "Estimate from current public price and the last two public scores."
    };
  }

  if (lastTwoScores.length === 1) {
    return {
      value: Math.round(pricedAt * 2 - lastTwoScores[0]),
      confidence: "low",
      note: "Estimate from current public price and one public score."
    };
  }

  return unavailable("Not enough public score history.");
}

function estimateFromAverage(pricedAt, avg3, average, totalGames) {
  if (!Number.isFinite(pricedAt) || pricedAt <= 0) {
    return unavailable("No usable public price baseline.");
  }

  if (Number.isFinite(avg3) && avg3 > 0 && totalGames >= 3) {
    return {
      value: Math.round(pricedAt * 3 - avg3 * 2),
      confidence: "low",
      note: "Estimate from public price and public three-game average, not exact last scores."
    };
  }

  if (Number.isFinite(average) && average > 0 && totalGames > 0) {
    return {
      value: Math.round(pricedAt * 2 - average),
      confidence: "low",
      note: "Estimate from public price and season average."
    };
  }

  return unavailable("Not enough public scoring history.");
}

function unavailable(note) {
  return {
    value: null,
    confidence: "unavailable",
    note
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

function sortedNumberEntries(value) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .map(([roundKey, itemValue]) => ({ round: Number(roundKey), value: numeric(itemValue) }))
    .filter((entry) => Number.isFinite(entry.round))
    .sort((left, right) => left.round - right.round);
}

function maxNumericKey(value) {
  const keys = Object.keys(value ?? {})
    .map((key) => Number(key))
    .filter((key) => Number.isFinite(key));
  return keys.length ? Math.max(...keys) : null;
}

function numeric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(value, decimals = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function compareByEstimatedBe(left, right) {
  if (left.estimatedBe === null && right.estimatedBe === null) return left.name.localeCompare(right.name);
  if (left.estimatedBe === null) return 1;
  if (right.estimatedBe === null) return -1;
  return left.estimatedBe - right.estimatedBe || left.name.localeCompare(right.name);
}
