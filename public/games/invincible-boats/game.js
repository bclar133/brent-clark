(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const random = (min, max) => min + Math.random() * (max - min);
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const tintColor = (hex, amount = .38) => {
    const value = Number.parseInt(hex.slice(1), 16);
    const tint = (channel) => Math.round(channel + (255 - channel) * amount);
    return `rgb(${tint(value >> 16)}, ${tint((value >> 8) & 255)}, ${tint(value & 255)})`;
  };

  const BOAT_COLORS = [
    "#ff5f45", "#ffc83d", "#25bda8", "#855be8",
    "#8fcf3c", "#f05d9a", "#3c7de8", "#ff8a31",
    "#00a8e8", "#b62a5e"
  ];
  const HUMAN_NAMES = ["Maya", "Archie", "Zoe", "Finn", "Ruby", "Leo", "Nina", "Ollie", "Ivy", "Max", "Evie", "Sam"];
  const PC_NAMES = ["Buoy George", "Salty Bot", "Wave Dave", "Captain Byte", "Knot Today", "Sea Biscuit", "Gustavo", "Marina 2.0", "Bob Afloat", "Tack Attack", "Pier Pressure", "Sailor Swift"];
  const WATER_PALETTES = [
    { top: "#52c7cc", bottom: "#168ca3", deep: "#08758f", foam: "#bdf4ec", land: "#7cac5f", sand: "#f5dc9a" },
    { top: "#56cadb", bottom: "#237faf", deep: "#176493", foam: "#caeff7", land: "#70a765", sand: "#f2d48d" },
    { top: "#64cabe", bottom: "#188e98", deep: "#087681", foam: "#cff5df", land: "#79a85d", sand: "#f4dba0" },
    { top: "#50bed2", bottom: "#147f9a", deep: "#0a6a84", foam: "#c5f2f2", land: "#6fa064", sand: "#efd28e" }
  ];
  const FINISH_LINES = [
    "A masterclass on the water.",
    "Fast, fearless and first home.",
    "The wind picked a favourite!",
    "What a finish — take a bow.",
    "A tiny boat with a huge result."
  ];

  const dom = {
    setupView: $("#setupView"),
    raceView: $("#raceView"),
    setupForm: $("#setupForm"),
    boatCount: $("#boatCount"),
    humanCount: $("#humanCount"),
    pcCount: $("#pcCount"),
    tournamentRaceCount: $("#tournamentRaceCount"),
    tournamentOptions: $("#tournamentOptions"),
    roster: $("#roster"),
    shuffleNames: $("#shuffleNames"),
    soundToggleSetup: $("#soundToggleSetup"),
    soundToggleRace: $("#soundToggleRace"),
    exitRace: $("#exitRace"),
    raceCanvas: $("#raceCanvas"),
    courseName: $("#courseName"),
    courseIcon: $("#courseIcon"),
    courseContext: $("#courseContext"),
    standingsList: $("#standingsList"),
    raceTime: $("#raceTime"),
    countdown: $("#countdown"),
    gustNotice: $("#gustNotice"),
    finishOverlay: $("#finishOverlay"),
    resultKicker: $("#resultKicker"),
    resultTitle: $("#resultTitle"),
    winnerDetail: $("#winnerDetail"),
    winnerBoat: $("#winnerBoat"),
    finalPodium: $("#finalPodium"),
    tournamentResults: $("#tournamentResults"),
    tournamentTable: $("#tournamentTable"),
    raceAgain: $("#raceAgain"),
    newFleet: $("#newFleet")
  };

  const ctx = dom.raceCanvas.getContext("2d");
  const config = { boats: 6, humans: 2, sound: true, mode: "single", tournamentRaces: 5 };
  const TOURNAMENT_POINTS = [20, 16, 13, 10, 8, 6, 4, 2, 1, 0];
  let roster = [];
  let game = null;
  let tournament = null;
  let audioContext = null;
  let animationFrame = null;
  let lastFrame = performance.now();

  function defaultName(index, human) {
    return human ? HUMAN_NAMES[index % HUMAN_NAMES.length] : PC_NAMES[index % PC_NAMES.length];
  }

  function syncRoster(randomize = false) {
    const currentInputs = [...dom.roster.querySelectorAll("input")].map((input) => input.value.trim());
    const previewColors = BOAT_COLORS;
    roster = Array.from({ length: config.boats }, (_, index) => {
      const human = index < config.humans;
      const old = roster[index];
      const oldName = currentInputs[index] || old?.name;
      const shouldKeep = old && old.human === human && oldName && !randomize;
      return {
        name: shouldKeep ? oldName : defaultName(index + (randomize ? Math.floor(random(0, 10)) : 0), human),
        human
      };
    });

    dom.roster.innerHTML = "";
    roster.forEach((entrant, index) => {
      const label = document.createElement("label");
      label.className = "roster-entry";
      label.style.setProperty("--entry-color", previewColors[index]);
      label.innerHTML = `
        <span class="roster-number">${index + 1}</span>
        <input maxlength="18" value="${escapeHtml(entrant.name)}" aria-label="Boat ${index + 1} name">
        <span class="entrant-type ${entrant.human ? "human" : ""}">${entrant.human ? "Player" : "PC"}</span>
      `;
      label.querySelector("input").addEventListener("input", (event) => {
        roster[index].name = event.target.value;
      });
      dom.roster.appendChild(label);
    });
    syncCounts();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function syncCounts() {
    dom.boatCount.value = config.boats;
    dom.boatCount.textContent = config.boats;
    dom.humanCount.value = config.humans;
    dom.humanCount.textContent = config.humans;
    dom.pcCount.textContent = config.boats - config.humans;
    dom.tournamentRaceCount.textContent = `${config.tournamentRaces} races`;
    dom.tournamentOptions.hidden = config.mode !== "tournament";
    document.querySelectorAll("[data-race-mode]").forEach((button) => {
      const active = button.dataset.raceMode === config.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setupEvents() {
    document.querySelectorAll("[data-stepper]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = Number(button.dataset.delta);
        if (button.dataset.stepper === "boats") {
          config.boats = clamp(config.boats + delta, 2, 10);
          config.humans = clamp(config.humans, 0, config.boats);
          syncRoster(false);
        } else if (button.dataset.stepper === "humans") {
          config.humans = clamp(config.humans + delta, 0, config.boats);
          syncRoster(false);
        } else {
          config.tournamentRaces = clamp(config.tournamentRaces + delta, 3, 7);
          syncCounts();
        }
      });
    });

    document.querySelectorAll("[data-race-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        config.mode = button.dataset.raceMode;
        syncCounts();
      });
    });

    dom.shuffleNames.addEventListener("click", () => syncRoster(true));
    dom.soundToggleSetup.addEventListener("click", toggleSound);
    dom.soundToggleRace.addEventListener("click", toggleSound);
    dom.setupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      roster.forEach((entrant, index) => {
        const input = dom.roster.querySelectorAll("input")[index];
        entrant.name = input.value.trim() || defaultName(index, entrant.human);
      });
      startEvent();
    });
    dom.exitRace.addEventListener("click", returnToSetup);
    dom.newFleet.addEventListener("click", returnToSetup);
    dom.raceAgain.addEventListener("click", handleResultAction);
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", () => { lastFrame = performance.now(); });
  }

  function toggleSound() {
    config.sound = !config.sound;
    [dom.soundToggleSetup, dom.soundToggleRace].forEach((button) => {
      button.classList.toggle("is-muted", !config.sound);
      button.setAttribute("aria-label", config.sound ? "Turn sound off" : "Turn sound on");
    });
    if (config.sound) {
      ensureAudio();
      tone(520, .06, "sine", .035);
    }
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function tone(frequency, duration, type = "sine", volume = .045, delay = 0) {
    if (!config.sound) return;
    ensureAudio();
    if (!audioContext) return;
    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function resizeCanvas() {
    if (dom.raceView.hidden) return;
    const rect = dom.raceView.getBoundingClientRect();
    const oldWidth = game?.width || rect.width;
    const oldHeight = game?.height || rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dom.raceCanvas.width = Math.round(rect.width * dpr);
    dom.raceCanvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (game) {
      const sx = rect.width / oldWidth;
      const sy = rect.height / oldHeight;
      const scalePoint = (point) => { point.x *= sx; point.y *= sy; };
      game.course.points.forEach(scalePoint);
      scalePoint(game.course.finishPoint);
      game.course.markers.forEach(scalePoint);
      game.course.branches.forEach((branch) => {
        branch.routes.forEach((route) => route.forEach(scalePoint));
      });
      game.boats.forEach((boat) => {
        boat.x *= sx;
        boat.y *= sy;
      });
      game.scenery.islands.forEach((island) => { island.x *= sx; island.y *= sy; island.r *= Math.sqrt(sx * sy); });
      game.scenery.waves.forEach(scalePoint);
      game.particles.forEach(scalePoint);
      game.width = rect.width;
      game.height = rect.height;
      measureCourse(game.course);
    }
  }

  function startEvent() {
    if (config.mode === "tournament") initializeTournament();
    else tournament = null;
    beginRace();
  }

  function initializeTournament() {
    const colors = shuffle(BOAT_COLORS).slice(0, config.boats);
    tournament = {
      currentRace: 1,
      totalRaces: config.tournamentRaces,
      lastCourseType: null,
      colors,
      standings: roster.map((entrant, index) => ({
        entrantId: index,
        name: entrant.name,
        human: entrant.human,
        color: colors[index],
        totalPoints: 0,
        lastPoints: 0,
        wins: 0,
        places: []
      }))
    };
  }

  function handleResultAction() {
    if (!tournament) {
      beginRace();
      return;
    }
    if (tournament.currentRace < tournament.totalRaces) {
      tournament.currentRace += 1;
    } else {
      initializeTournament();
    }
    beginRace();
  }

  function beginRace() {
    ensureAudio();
    dom.setupView.hidden = true;
    dom.raceView.hidden = false;
    window.scrollTo(0, 0);
    dom.finishOverlay.hidden = true;
    dom.finalPodium.hidden = false;
    dom.tournamentResults.hidden = true;
    dom.countdown.textContent = "";
    dom.gustNotice.classList.remove("show");

    const rect = dom.raceView.getBoundingClientRect();
    game = createGame(rect.width, rect.height);
    resizeCanvas();
    dom.courseName.textContent = game.course.name;
    dom.courseIcon.textContent = game.course.icon;
    dom.courseContext.textContent = tournament
      ? `Race ${tournament.currentRace} of ${tournament.totalRaces}`
      : "Today’s course";
    dom.raceTime.textContent = "00:00.0";
    renderStandings(true);
    startCountdown();

    lastFrame = performance.now();
    if (!animationFrame) animationFrame = requestAnimationFrame(frame);
  }

  function returnToSetup() {
    game = null;
    tournament = null;
    dom.raceView.hidden = true;
    dom.setupView.hidden = false;
    dom.finishOverlay.hidden = true;
    dom.countdown.textContent = "";
  }

  function createGame(width, height) {
    const palette = pick(WATER_PALETTES);
    const course = generateCourse(width, height, tournament?.lastCourseType);
    if (tournament) tournament.lastCourseType = course.type;
    const colors = tournament?.colors || shuffle(BOAT_COLORS).slice(0, config.boats);
    const entrants = roster.map((entrant, index) => ({
      ...entrant,
      entrantId: index,
      name: entrant.name.trim() || defaultName(index, entrant.human),
      color: colors[index],
      hullColor: tintColor(colors[index])
    }));
    const scenery = generateScenery(width, height, course, palette);
    const first = course.points[0];
    const second = course.points[1];
    const routeAngle = Math.atan2(second.y - first.y, second.x - first.x);
    const sideAngle = routeAngle + Math.PI / 2;
    const centerOffset = (entrants.length - 1) / 2;
    // A deliberately longer race gives speed streaks and obstacle choices time to matter.
    const baseSpeed = course.length / random(38, 42);
    const boats = entrants.map((entrant, index) => {
      const lane = index - centerOffset;
      return {
        ...entrant,
        x: first.x - Math.cos(routeAngle) * 27 + Math.cos(sideAngle) * lane * 18,
        y: first.y - Math.sin(routeAngle) * 27 + Math.sin(sideAngle) * lane * 18,
        heading: routeAngle,
        nextIndex: 1,
        progress: -25,
        displayProgress: -25,
        finished: false,
        finishTime: null,
        baseSpeed: baseSpeed * random(.94, 1.06),
        speed: 0,
        speedMultiplier: .9,
        targetMultiplier: random(.88, 1.09),
        shiftTimer: random(.8, 1.8),
        tackPhase: random(0, Math.PI * 2),
        tackSide: index % 2 ? 1 : -1,
        tackTimer: random(1.1, 2.1),
        tackOffset: 0,
        tackStrength: random(.25, .38),
        bobPhase: random(0, Math.PI * 2),
        avoidSides: {},
        branchChoices: {},
        branchSteps: {},
        boatIndex: index,
        trackedTarget: 1,
        orbitAngle: null,
        orbitAccumulator: 0,
        bestTargetDistance: Infinity,
        noProgressTimer: 0,
        recoveryTimer: 0,
        trail: [],
        place: index + 1
      };
    });

    return {
      width,
      height,
      palette,
      course,
      scenery,
      boats,
      state: "ready",
      countdownStarted: 0,
      raceStarted: 0,
      elapsed: 0,
      leaderId: null,
      leaderChanges: 0,
      standingsTimer: 0,
      lastCountdownBeat: null,
      gustCooldown: 1.5,
      finalGustAnnounced: false,
      winner: null,
      firstFinishAt: null,
      finishOrder: [],
      finalResults: [],
      finishOverlayAt: 0,
      particles: [],
      fireworkTimer: 0
    };
  }

  function courseBounds(width, height) {
    const compact = width < 720;
    const left = compact ? 62 : clamp(width * .19, 210, 285);
    return {
      left,
      right: width - (compact ? 55 : 80),
      top: compact ? 105 : 100,
      bottom: height - (compact ? 100 : 78)
    };
  }

  function generateCourse(width, height, excludedType = null) {
    const bounds = courseBounds(width, height);
    const cx = (bounds.left + bounds.right) / 2;
    const cy = (bounds.top + bounds.bottom) / 2;
    const rx = Math.max(105, (bounds.right - bounds.left) * .44);
    const ry = Math.max(105, (bounds.bottom - bounds.top) * .42);
    // Intersecting and unusual routes are weighted heavily for visual variety.
    const coursePool = [
      "figure8", "figure8", "figure8", "bowtie", "bowtie",
      "abc", "abc", "abc", "lshape", "lshape", "split", "split",
      "oval", "circle", "polygon", "triangle", "star"
    ];
    const type = pick(excludedType ? coursePool.filter((courseType) => courseType !== excludedType) : coursePool);
    let points = [];
    let name;
    let icon;
    let markerEvery = 1;
    let branches = [];

    if (type === "oval" || type === "circle") {
      const count = type === "circle" ? 13 : 14;
      const localRx = type === "circle" ? Math.min(rx, ry * 1.15) : rx;
      const localRy = type === "circle" ? Math.min(ry, rx * .85) : ry * random(.75, 1);
      for (let i = 0; i < count; i += 1) {
        const angle = Math.PI / 2 + (i / count) * Math.PI * 2;
        const wobble = random(.94, 1.05);
        points.push({ x: cx + Math.cos(angle) * localRx * wobble, y: cy + Math.sin(angle) * localRy * wobble });
      }
      name = type === "circle" ? "The Roundabout" : "Spin Me Round";
      icon = type === "circle" ? "○" : "⬭";
    } else if (type === "figure8") {
      const count = 18;
      for (let i = 0; i < count; i += 1) {
        const t = (i / count) * Math.PI * 2;
        points.push({ x: cx + Math.sin(t) * rx, y: cy + Math.sin(t) * Math.cos(t) * ry * 1.35 });
      }
      points = rotateToBottom(points);
      name = "Eighty Matey";
      icon = "∞";
    } else if (type === "bowtie") {
      const corners = [
        { x: bounds.right - rx * .06, y: bounds.bottom - ry * .04 },
        { x: bounds.left + rx * .06, y: bounds.top + ry * .04 },
        { x: bounds.right - rx * .06, y: bounds.top + ry * .04 },
        { x: bounds.left + rx * .06, y: bounds.bottom - ry * .04 }
      ];
      points = subdivideClosed(corners, 3);
      name = "Hourglass";
      icon = "⋈";
    } else if (type === "abc") {
      const courseWidth = bounds.right - bounds.left;
      const courseHeight = bounds.bottom - bounds.top;
      const abcControlPoints = [
        [.035, .52], [.045, .25], [.13, .11], [.24, .17],
        [.39, .76], [.47, .87], [.55, .76], [.69, .17],
        [.79, .1], [.9, .18], [.94, .39], [.93, .67],
        [.84, .84], [.72, .78], [.58, .27], [.5, .2],
        [.42, .27], [.27, .78], [.16, .85], [.06, .72]
      ].map(([x, y]) => ({
        x: bounds.left + x * courseWidth,
        y: bounds.top + y * courseHeight
      }));
      points = catmullRomClosed(abcControlPoints, 2);
      markerEvery = 5;
      name = "The Intersector";
      icon = "〽";
    } else if (type === "lshape") {
      const left = bounds.left + rx * .12;
      const right = bounds.right - rx * .04;
      const top = bounds.top + ry * .06;
      const bottom = bounds.bottom - ry * .05;
      const innerRight = right - rx * .48;
      const innerTop = top + ry * .48;
      const corners = [
        { x: innerRight, y: bottom },
        { x: right, y: bottom },
        { x: right, y: top },
        { x: left, y: top },
        { x: left, y: innerTop },
        { x: innerRight, y: innerTop }
      ];
      points = subdivideClosed(corners, 2);
      name = "Lobster Loop";
      icon = "⌝";
    } else if (type === "split") {
      points = [
        { x: cx + rx * .72, y: bounds.bottom - ry * .03 },
        { x: bounds.right - rx * .03, y: cy + ry * .46 },
        { x: cx + rx * .78, y: cy },
        { x: cx - rx * .78, y: cy },
        { x: bounds.left + rx * .03, y: cy - ry * .56 },
        { x: bounds.left + rx * .03, y: bounds.bottom - ry * .14 },
        { x: cx - rx * .12, y: bounds.bottom - ry * .03 }
      ];
      branches = [{
        id: 1,
        segmentIndex: 2,
        colors: ["rgba(255,224,108,.62)", "rgba(255,116,80,.62)"],
        routes: [
          [
            { x: cx + rx * .3, y: cy - ry * .34 },
            { x: cx - rx * .3, y: cy - ry * .34 }
          ],
          [
            { x: cx + rx * .3, y: cy + ry * .34 },
            { x: cx - rx * .3, y: cy + ry * .34 }
          ]
        ],
        island: { x: cx, y: cy, r: Math.min(46, ry * .18) }
      }];
      name = "Split Decision";
      icon = "⇆";
    } else if (type === "triangle") {
      points = [
        { x: cx, y: bounds.bottom },
        { x: bounds.left + random(0, rx * .16), y: bounds.top + random(0, ry * .2) },
        { x: bounds.right - random(0, rx * .16), y: bounds.top + random(0, ry * .2) }
      ];
      points = subdivideClosed(points, 3);
      name = "Pizza Pirate";
      icon = "△";
    } else {
      const count = type === "star" ? 10 : Math.floor(random(7, 10));
      for (let i = 0; i < count; i += 1) {
        const angle = Math.PI / 2 + (i / count) * Math.PI * 2;
        const radial = type === "star" ? (i % 2 ? random(.56, .7) : random(.92, 1)) : random(.72, 1);
        points.push({ x: cx + Math.cos(angle) * rx * radial, y: cy + Math.sin(angle) * ry * radial });
      }
      name = type === "star" ? "Starry Seas" : "Harbour Hop";
      icon = type === "star" ? "☆" : "◇";
    }

    points = points.map((point) => ({
      x: clamp(point.x, bounds.left, bounds.right),
      y: clamp(point.y, bounds.top, bounds.bottom)
    }));
    if (!["figure8", "abc", "triangle", "bowtie", "lshape", "split"].includes(type)) points = rotateToBottom(points);

    branches.forEach((branch) => {
      branch.routes.forEach((route) => route.forEach((point) => {
        point.x = clamp(point.x, bounds.left, bounds.right);
        point.y = clamp(point.y, bounds.top, bounds.bottom);
      }));
    });
    const course = { type, name, icon, points, branches, markerEvery, finishPoint: null, markers: [], lengths: [], cumulative: [], length: 0 };
    positionFinishLine(course);
    buildMarkers(course);
    measureCourse(course);
    return course;
  }

  function rotateToBottom(points) {
    let start = 0;
    points.forEach((point, index) => { if (point.y > points[start].y) start = index; });
    return [...points.slice(start), ...points.slice(0, start)];
  }

  function subdivideClosed(corners, divisions) {
    const points = [];
    corners.forEach((corner, index) => {
      const next = corners[(index + 1) % corners.length];
      for (let step = 0; step < divisions; step += 1) {
        const amount = step / divisions;
        points.push({ x: lerp(corner.x, next.x, amount), y: lerp(corner.y, next.y, amount) });
      }
    });
    return points;
  }

  function catmullRomClosed(controlPoints, samplesPerSegment) {
    const result = [];
    const count = controlPoints.length;
    for (let index = 0; index < count; index += 1) {
      const p0 = controlPoints[(index - 1 + count) % count];
      const p1 = controlPoints[index];
      const p2 = controlPoints[(index + 1) % count];
      const p3 = controlPoints[(index + 2) % count];
      for (let sample = 0; sample < samplesPerSegment; sample += 1) {
        const t = sample / samplesPerSegment;
        const t2 = t * t;
        const t3 = t2 * t;
        result.push({
          x: .5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: .5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    return result;
  }

  function buildMarkers(course) {
    course.markers = course.points.map((point, index, points) => {
      const markerEvery = course.markerEvery || 1;
      if (index === 0 || index % markerEvery !== 0) return { ...point, hidden: true, number: 0 };
      const previous = points[(index - 1 + points.length) % points.length];
      const next = points[(index + 1) % points.length];
      const inX = point.x - previous.x;
      const inY = point.y - previous.y;
      const outX = next.x - point.x;
      const outY = next.y - point.y;
      const cross = inX * outY - inY * outX;
      const inLength = Math.hypot(inX, inY) || 1;
      const normalX = -inY / inLength;
      const normalY = inX / inLength;
      const side = cross >= 0 ? 1 : -1;
      return {
        x: point.x + normalX * side * 24,
        y: point.y + normalY * side * 24,
        number: Math.ceil(index / markerEvery),
        side,
        color: side > 0 ? "#ff6650" : "#f5d453"
      };
    });
  }

  function positionFinishLine(course) {
    const start = course.points[0];
    const last = course.points[course.points.length - 1];
    const dx = last.x - start.x;
    const dy = last.y - start.y;
    const closingLength = Math.hypot(dx, dy) || 1;
    const separation = Math.min(closingLength * .55, clamp(closingLength * .44, 72, 115));
    course.finishPoint = {
      x: start.x + (dx / closingLength) * separation,
      y: start.y + (dy / closingLength) * separation
    };
  }

  function measureCourse(course) {
    course.lengths = [];
    course.cumulative = [0];
    let total = 0;
    course.points.forEach((point, index) => {
      const next = index === course.points.length - 1 ? course.finishPoint : course.points[index + 1];
      const segmentLength = distance(point, next);
      course.lengths.push(segmentLength);
      total += segmentLength;
      course.cumulative.push(total);
    });
    course.length = total;
  }

  function generateScenery(width, height, course, palette) {
    const waves = Array.from({ length: Math.floor((width * height) / 17000) }, () => ({
      x: random(30, width - 30), y: random(35, height - 30), size: random(5, 14), alpha: random(.08, .28), phase: random(0, Math.PI * 2)
    }));
    const islands = course.branches.map((branch) => ({
      ...branch.island,
      seed: random(0, 10),
      obstacle: false,
      branchObstacle: true
    }));
    const desired = width < 650 ? 1 : Math.floor(random(2, 4));
    let attempts = 0;
    while (islands.length < desired && attempts < 80) {
      attempts += 1;
      const candidate = { x: random(width * .25, width * .88), y: random(height * .17, height * .83), r: random(24, 48), seed: random(0, 10), obstacle: false };
      const routeDistance = distanceToCourse(candidate, course);
      if (routeDistance > candidate.r + 78 && islands.every((island) => distance(island, candidate) > island.r + candidate.r + 35)) islands.push(candidate);
    }

    // Most races contain one tactical island directly on a long run; large screens
    // occasionally get two. Boats deliberately split to opposite sides of it.
    const obstacleCount = course.branches.length ? 0 : (Math.random() < .84 ? (width > 900 && Math.random() < .38 ? 2 : 1) : 0);
    const minimumSegment = width < 650 ? 120 : 155;
    const eligibleSegments = shuffle(course.lengths
      .map((segmentLength, index) => ({ segmentLength, index }))
      .filter(({ segmentLength, index }) => segmentLength > minimumSegment && index > 1 && index < course.points.length - 2));

    let placedObstacles = 0;
    while (placedObstacles < obstacleCount && eligibleSegments.length) {
      const { index } = eligibleSegments.shift();
      const start = course.points[index];
      const end = course.points[(index + 1) % course.points.length];
      const segmentLength = distance(start, end) || 1;
      const normalX = -(end.y - start.y) / segmentLength;
      const normalY = (end.x - start.x) / segmentLength;
      const maximumRadius = Math.min(width < 650 ? 30 : 38, segmentLength * .45 - 50);
      if (maximumRadius < 22) continue;
      const r = random(22, maximumRadius);
      const amount = random(.46, .54);
      const nudge = random(-5, 5);
      const candidate = {
        x: lerp(start.x, end.x, amount) + normalX * nudge,
        y: lerp(start.y, end.y, amount) + normalY * nudge,
        r,
        seed: random(0, 10),
        obstacle: true,
        id: placedObstacles + 1,
        segmentIndex: index
      };
      const clearOfOthers = islands.every((island) => distance(island, candidate) > island.r + candidate.r + 34);
      const clearOfWaypoints = course.points.every((point) => distance(point, candidate) > candidate.r + 50);
      const clearOfBuoys = course.markers.every((marker) => marker.hidden || distance(marker, candidate) > candidate.r + 44);
      const clearOfLines = distance(course.points[0], candidate) > candidate.r + 70 && distance(course.finishPoint, candidate) > candidate.r + 70;
      if (clearOfOthers && clearOfWaypoints && clearOfBuoys && clearOfLines) {
        islands.push(candidate);
        placedObstacles += 1;
      }
    }
    return { waves, islands, palette };
  }

  function distanceToCourse(point, course) {
    return Math.min(...course.points.map((start, index) => {
      const end = index === course.points.length - 1 ? course.finishPoint : course.points[index + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy || 1;
      const amount = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
      return Math.hypot(point.x - lerp(start.x, end.x, amount), point.y - lerp(start.y, end.y, amount));
    }));
  }

  function startCountdown() {
    game.state = "countdown";
    game.countdownStarted = performance.now();
    game.lastCountdownBeat = null;
  }

  function updateCountdown(now) {
    const elapsed = (now - game.countdownStarted) / 1000;
    let text = "";
    if (elapsed < .8) text = "3";
    else if (elapsed < 1.6) text = "2";
    else if (elapsed < 2.4) text = "1";
    else if (elapsed < 3.15) text = "GO!";
    else {
      dom.countdown.textContent = "";
      game.state = "racing";
      game.raceStarted = now;
      tone(740, .12, "triangle", .055);
      tone(980, .18, "triangle", .045, .09);
      return;
    }
    if (game.lastCountdownBeat !== text) {
      game.lastCountdownBeat = text;
      dom.countdown.textContent = text;
      dom.countdown.classList.remove("pop");
      void dom.countdown.offsetWidth;
      dom.countdown.classList.add("pop");
      tone(text === "GO!" ? 660 : 360 + (3 - Number(text || 3)) * 60, .08, "sine", .04);
    }
  }

  function frame(now) {
    animationFrame = requestAnimationFrame(frame);
    if (!game || dom.raceView.hidden) return;
    const dt = Math.min((now - lastFrame) / 1000, .04);
    lastFrame = now;

    if (game.state === "countdown") updateCountdown(now);
    if (game.state === "racing") updateRace(dt, now);
    if (game.state === "finished") updateCelebration(dt, now);
    draw(now / 1000);
  }

  function updateRace(dt, now) {
    game.elapsed = (now - game.raceStarted) / 1000;
    game.gustCooldown -= dt;
    const active = game.boats.filter((boat) => !boat.finished);
    const leaderProgress = Math.max(...active.map((boat) => boat.progress), 0);

    if (!game.finalGustAnnounced && leaderProgress / game.course.length >= .72) {
      game.finalGustAnnounced = true;
      active.forEach((boat) => { boat.shiftTimer = Math.min(boat.shiftTimer, .35); });
      showGust("Final leg — the wind is wide open!");
      game.gustCooldown = 1.8;
    }

    active.forEach((boat) => {
      boat.shiftTimer -= dt;
      if (boat.shiftTimer <= 0) chooseSpeedShift(boat);

      const gap = Math.max(0, leaderProgress - boat.progress);
      const catchUp = clamp((gap / game.course.length) * .32, 0, .055);
      const leadEase = gap < 8 && boat.progress > game.course.length * .08 ? .99 : 1;
      const finishFactor = boat.progress > game.course.length * .9 ? lerp(1, .35, (boat.progress / game.course.length - .9) * 10) : 1;
      const balancedCatchUp = catchUp * finishFactor;
      const closingPhase = boat.progress / game.course.length >= .72;
      boat.speedMultiplier += (boat.targetMultiplier - boat.speedMultiplier) * Math.min(1, dt * (closingPhase ? 3.1 : 1.35));
      const targetSpeed = boat.baseSpeed * (boat.speedMultiplier + balancedCatchUp) * leadEase;
      boat.speed += (targetSpeed - boat.speed) * Math.min(1, dt * (closingPhase ? 3.5 : 1.9));
      sailBoat(boat, dt);
      updateBoatProgress(boat);
    });

    if (game.winner && (
      game.finishOrder.length === game.boats.length ||
      game.elapsed - game.firstFinishAt >= 8
    )) finalizeRace();

    game.gustCooldown = Math.max(game.gustCooldown, 0);
    game.standingsTimer -= dt;
    if (game.standingsTimer <= 0) {
      game.standingsTimer = .18;
      renderStandings(false);
    }
    dom.raceTime.textContent = formatTime(game.elapsed);
  }

  function chooseSpeedShift(boat) {
    const roll = Math.random();
    const closingPhase = boat.progress / game.course.length >= .72;
    let multiplier;
    if (closingPhase) {
      if (roll < .26) multiplier = random(1.42, 1.76);
      else if (roll < .51) multiplier = random(.42, .7);
      else multiplier = random(.78, 1.36);
    } else if (roll < .18) multiplier = random(1.25, 1.48);
    else if (roll < .38) multiplier = random(.58, .82);
    else multiplier = random(.84, 1.22);
    boat.targetMultiplier = multiplier;
    boat.shiftTimer = closingPhase ? random(.58, 1.38) : random(1.45, 3.35);
    if (multiplier > (closingPhase ? 1.46 : 1.25) && game.gustCooldown <= 0 && game.elapsed > 3) {
      showGust(closingPhase ? `${boat.name} launches a late charge!` : `${boat.name} found a gust!`);
      game.gustCooldown = closingPhase ? 1.9 : 3.3;
      tone(610, .08, "sine", .025);
    }
  }

  function sailBoat(boat, dt) {
    const points = game.course.points;
    const courseTarget = boat.nextIndex < points.length ? points[boat.nextIndex] : game.course.finishPoint;
    const marker = boat.nextIndex < points.length ? game.course.markers[boat.nextIndex] : null;
    const roundingMarker = marker && !marker.hidden;
    const target = roundingMarker ? getRoundingTarget(courseTarget, marker) : courseTarget;
    const dx = target.x - boat.x;
    const dy = target.y - boat.y;
    const targetDistance = Math.hypot(dx, dy);
    const branchTarget = getBranchTarget(boat, target);
    const avoidanceTarget = branchTarget === target ? getAvoidanceTarget(boat, target) : branchTarget;
    const recovering = updateUntangleRecovery(boat, target, targetDistance, dt);

    boat.tackTimer -= dt;
    if (boat.tackTimer <= 0) {
      boat.tackSide *= -1;
      boat.tackTimer = random(1.45, 2.55);
    }
    boat.tackOffset += (boat.tackSide * boat.tackStrength - boat.tackOffset) * Math.min(1, dt * 2.4);
    const nearMarkerEase = clamp((targetDistance - 34) / 105, 0, 1);
    const obstacleEase = avoidanceTarget === target ? 1 : .32;
    const targetAngle = Math.atan2(avoidanceTarget.y - boat.y, avoidanceTarget.x - boat.x);
    const recoveryEase = recovering ? 0 : 1;
    const delta = normalizeAngle(targetAngle + boat.tackOffset * nearMarkerEase * obstacleEase * recoveryEase - boat.heading);
    const maxTurn = (recovering ? 5.4 : 3.2) * dt;
    boat.heading += clamp(delta, -maxTurn, maxTurn);
    if (recovering) boat.speed = Math.max(boat.speed, boat.baseSpeed * 1.04);
    boat.x += Math.cos(boat.heading) * boat.speed * dt;
    boat.y += Math.sin(boat.heading) * boat.speed * dt;
    handleIslandContact(boat);

    boat.trail.unshift({ x: boat.x, y: boat.y });
    if (boat.trail.length > 12) boat.trail.pop();

    // Visible buoys need a precise pass on their outside. Ordinary hidden
    // waypoints retain a generous radius so boats still flow smoothly.
    const reach = roundingMarker
      ? Math.max(14, boat.speed * dt * 1.5)
      : Math.max(recovering ? 38 : 31, boat.speed * dt * 1.5);
    if (targetDistance < reach) {
      boat.x = lerp(boat.x, target.x, .38);
      boat.y = lerp(boat.y, target.y, .38);
      boat.nextIndex += 1;
      resetUntangleTracking(boat);
      tone(290 + boat.nextIndex * 18, .035, "sine", .009);
      if (boat.nextIndex > points.length) finishBoat(boat);
    }
  }

  function getRoundingTarget(courseTarget, marker) {
    const awayX = courseTarget.x - marker.x;
    const awayY = courseTarget.y - marker.y;
    const markerOffset = Math.hypot(awayX, awayY) || 1;
    const extraClearance = 16;
    return {
      x: courseTarget.x + (awayX / markerOffset) * extraClearance,
      y: courseTarget.y + (awayY / markerOffset) * extraClearance
    };
  }

  function getBranchTarget(boat, target) {
    const segmentIndex = clamp(boat.nextIndex - 1, 0, game.course.points.length - 1);
    const branch = game.course.branches.find((item) => item.segmentIndex === segmentIndex);
    if (!branch) return target;

    if (boat.branchChoices[branch.id] === undefined) {
      // Stable alternating assignment guarantees both routes are used in every race.
      boat.branchChoices[branch.id] = (boat.boatIndex + branch.id) % branch.routes.length;
      boat.branchSteps[branch.id] = 0;
    }
    const route = branch.routes[boat.branchChoices[branch.id]];
    let step = boat.branchSteps[branch.id] || 0;
    if (step >= route.length) return target;
    if (distance(boat, route[step]) < 34) {
      step += 1;
      boat.branchSteps[branch.id] = step;
    }
    return step >= route.length ? target : route[step];
  }

  function updateUntangleRecovery(boat, target, targetDistance, dt) {
    if (boat.trackedTarget !== boat.nextIndex) resetUntangleTracking(boat);
    const orbitAngle = Math.atan2(boat.y - target.y, boat.x - target.x);
    if (boat.orbitAngle !== null) boat.orbitAccumulator += normalizeAngle(orbitAngle - boat.orbitAngle);
    boat.orbitAngle = orbitAngle;

    if (targetDistance < boat.bestTargetDistance - 5) {
      boat.bestTargetDistance = targetDistance;
      boat.noProgressTimer = 0;
    } else {
      boat.noProgressTimer += dt;
    }

    // Intervene before a third small orbit can begin, or sooner if a boat is simply stuck.
    if (Math.abs(boat.orbitAccumulator) > Math.PI * 3.6 || boat.noProgressTimer > 3.1) {
      boat.recoveryTimer = 2.15;
      boat.orbitAccumulator = 0;
      boat.noProgressTimer = 0;
      boat.bestTargetDistance = targetDistance;
    }
    boat.recoveryTimer = Math.max(0, boat.recoveryTimer - dt);
    return boat.recoveryTimer > 0;
  }

  function resetUntangleTracking(boat) {
    boat.trackedTarget = boat.nextIndex;
    boat.orbitAngle = null;
    boat.orbitAccumulator = 0;
    boat.bestTargetDistance = Infinity;
    boat.noProgressTimer = 0;
    boat.recoveryTimer = 0;
  }

  function getAvoidanceTarget(boat, target) {
    const segmentIndex = clamp(boat.nextIndex - 1, 0, game.course.points.length - 1);
    const obstacle = game.scenery.islands.find((island) => island.obstacle && island.segmentIndex === segmentIndex);
    if (!obstacle) return target;

    const start = game.course.points[segmentIndex];
    const segmentX = target.x - start.x;
    const segmentY = target.y - start.y;
    const segmentLength = Math.hypot(segmentX, segmentY) || 1;
    const unitX = segmentX / segmentLength;
    const unitY = segmentY / segmentLength;
    const along = (obstacle.x - boat.x) * unitX + (obstacle.y - boat.y) * unitY;
    const sideDistance = Math.abs((obstacle.x - boat.x) * -unitY + (obstacle.y - boat.y) * unitX);
    const safeDistance = obstacle.r + 30;
    if (along < -safeDistance * .4 || along > 240 || sideDistance > safeDistance * 1.25) return target;

    if (!boat.avoidSides[obstacle.id]) boat.avoidSides[obstacle.id] = (boat.boatIndex + obstacle.id) % 2 ? 1 : -1;
    const side = boat.avoidSides[obstacle.id];
    const waypoint = {
      x: obstacle.x - unitY * safeDistance * side,
      y: obstacle.y + unitX * safeDistance * side
    };
    return distance(boat, waypoint) < 16 ? target : waypoint;
  }

  function handleIslandContact(boat) {
    game.scenery.islands.filter((island) => island.obstacle || island.branchObstacle).forEach((island) => {
      const dx = boat.x - island.x;
      const dy = boat.y - island.y;
      const currentDistance = Math.hypot(dx, dy) || 1;
      const edge = island.r + 8;
      if (currentDistance < edge) {
        boat.x = island.x + (dx / currentDistance) * edge;
        boat.y = island.y + (dy / currentDistance) * edge;
        boat.speed *= .55;
      }
    });
  }

  function updateBoatProgress(boat) {
    if (boat.finished) {
      boat.progress = game.course.length + Math.max(0, 10 - boat.finishTime * .01);
      return;
    }
    const segmentIndex = clamp(boat.nextIndex - 1, 0, game.course.points.length - 1);
    const start = game.course.points[segmentIndex];
    const end = segmentIndex === game.course.points.length - 1
      ? game.course.finishPoint
      : game.course.points[segmentIndex + 1];
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY || 1;
    const projection = clamp(((boat.x - start.x) * segmentX + (boat.y - start.y) * segmentY) / segmentLengthSquared, 0, 1);
    boat.progress = game.course.cumulative[segmentIndex] + projection * game.course.lengths[segmentIndex];
    boat.displayProgress += (boat.progress - boat.displayProgress) * .2;
  }

  function finishBoat(boat) {
    if (boat.finished) return;
    boat.finished = true;
    boat.finishTime = game.elapsed;
    boat.progress = game.course.length + Math.max(0, 10 - game.finishOrder.length);
    game.finishOrder.push(boat);
    if (!game.winner) {
      game.winner = boat;
      game.firstFinishAt = game.elapsed;
      showGust(`${boat.name} crosses first!`);
      tone(523, .16, "triangle", .045);
      tone(659, .18, "triangle", .045, .12);
    }
  }

  function finalizeRace() {
    if (game.state !== "racing") return;
    const remaining = game.boats
      .filter((boat) => !boat.finished)
      .sort((a, b) => b.progress - a.progress);
    remaining.forEach((boat, index) => {
      boat.finished = true;
      boat.finishTime = game.elapsed + (index + 1) * .01;
      boat.progress = game.course.length - (index + 1) * .01;
      game.finishOrder.push(boat);
    });

    game.finalResults = [...game.finishOrder];
    game.state = "finished";
    game.finishOverlayAt = performance.now() + 550;
    game.fireworkTimer = 0;
    if (tournament) scoreTournament(game.finalResults);
    renderRaceResults();
  }

  function scoreTournament(results) {
    tournament.standings.forEach((entrant) => { entrant.lastPoints = 0; });
    results.forEach((boat, index) => {
      const entrant = tournament.standings.find((item) => item.entrantId === boat.entrantId);
      const points = TOURNAMENT_POINTS[index] || 0;
      entrant.lastPoints = points;
      entrant.totalPoints += points;
      entrant.places.push(index + 1);
      if (index === 0) entrant.wins += 1;
    });
  }

  function getTournamentStandings() {
    return [...tournament.standings].sort((a, b) =>
      b.totalPoints - a.totalPoints ||
      b.wins - a.wins ||
      a.places.reduce((sum, place) => sum + place, 0) - b.places.reduce((sum, place) => sum + place, 0) ||
      a.entrantId - b.entrantId
    );
  }

  function getStandings() {
    return [...game.boats].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
  }

  function renderStandings(initial) {
    if (!game) return;
    const standings = getStandings();
    const leader = standings[0];
    if (!initial && game.leaderId && leader.name !== game.leaderId && game.elapsed > 1.2) game.leaderChanges += 1;
    game.leaderId = leader.name;
    standings.forEach((boat, index) => { boat.place = index + 1; });
    const leaderProgress = Math.max(leader.progress, 1);
    dom.standingsList.innerHTML = standings.map((boat, index) => {
      const gap = index === 0 ? "LEAD" : `−${Math.max(0, (leaderProgress - boat.progress) / Math.max(boat.baseSpeed, 1)).toFixed(1)}s`;
      return `<li class="standing-row ${index === 0 ? "is-leading" : ""}">
        <span class="standing-position">${index + 1}</span>
        <span class="standing-swatch" style="background:${boat.color}"></span>
        <span class="standing-name" style="color:${boat.color}">${escapeHtml(boat.name)}</span>
        <span class="standing-gap">${gap}</span>
      </li>`;
    }).join("");
  }

  function showGust(message) {
    dom.gustNotice.textContent = message;
    dom.gustNotice.classList.add("show");
    window.clearTimeout(showGust.timeout);
    showGust.timeout = window.setTimeout(() => dom.gustNotice.classList.remove("show"), 1400);
  }

  function renderRaceResults() {
    const winner = game.finalResults[0];
    renderStandings(false);
    if (!tournament) {
      dom.resultKicker.textContent = "First across the line";
      dom.resultTitle.textContent = `${winner.name} wins!`;
      dom.winnerDetail.textContent = pick(FINISH_LINES);
      dom.winnerBoat.style.setProperty("--winner-color", winner.color);
      dom.finalPodium.hidden = false;
      dom.tournamentResults.hidden = true;
      dom.finalPodium.innerHTML = game.finalResults.slice(0, Math.min(3, game.finalResults.length)).map((boat, index) => {
        const gap = Math.max(0, boat.finishTime - winner.finishTime);
        return `<li><b>${["1st", "2nd", "3rd"][index]} · ${escapeHtml(boat.name)}</b>${index === 0 ? formatTime(boat.finishTime) : `+${gap.toFixed(1)}s`}</li>`;
      }).join("");
      dom.raceAgain.textContent = "Race again";
      dom.newFleet.textContent = "New fleet";
    } else {
      const overall = getTournamentStandings();
      const complete = tournament.currentRace === tournament.totalRaces;
      const champion = overall[0];
      dom.resultKicker.textContent = complete
        ? "Tournament complete"
        : `Race ${tournament.currentRace} of ${tournament.totalRaces} complete`;
      dom.resultTitle.textContent = complete ? `${champion.name} is champion!` : `${winner.name} wins race ${tournament.currentRace}!`;
      dom.winnerDetail.textContent = complete
        ? `${champion.totalPoints} points across ${tournament.totalRaces} races.`
        : "Race points added — here’s the championship table.";
      dom.winnerBoat.style.setProperty("--winner-color", complete ? champion.color : winner.color);
      dom.finalPodium.hidden = true;
      dom.tournamentResults.hidden = false;
      dom.tournamentTable.innerHTML = overall.map((entrant, index) => `
        <li class="${index === 0 ? "is-leader" : ""}">
          <span class="tournament-name"><i style="background:${entrant.color}"></i><b>${index + 1}. ${escapeHtml(entrant.name)}</b></span>
          <span class="tournament-points">+${entrant.lastPoints}</span>
          <span>${entrant.totalPoints}</span>
        </li>
      `).join("");
      dom.raceAgain.textContent = complete ? "New tournament" : "Next race";
      dom.newFleet.textContent = complete ? "New fleet" : "End tournament";
    }
    tone(523, .18, "triangle", .05);
    tone(659, .18, "triangle", .05, .13);
    tone(784, .25, "triangle", .06, .27);
  }

  function updateCelebration(dt, now) {
    if (now >= game.finishOverlayAt && dom.finishOverlay.hidden) dom.finishOverlay.hidden = false;
    game.fireworkTimer -= dt;
    if (game.fireworkTimer <= 0) {
      spawnFirework();
      game.fireworkTimer = random(.28, .55);
    }
    game.particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 52 * dt;
      particle.life -= dt;
    });
    game.particles = game.particles.filter((particle) => particle.life > 0);
  }

  function spawnFirework() {
    const x = random(game.width * .28, game.width * .8);
    const y = random(game.height * .15, game.height * .55);
    const color = pick(["#ffe071", "#ff7554", "#8ff1de", "#ffffff", "#ef89c3"]);
    const count = 22;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + random(-.08, .08);
      const speed = random(45, 115);
      game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: random(.7, 1.25), maxLife: 1.25, color, size: random(1.5, 3.2) });
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs}.${tenths}`;
  }

  function draw(time) {
    ctx.clearRect(0, 0, game.width, game.height);
    drawWater(time);
    drawCourse();
    drawIslands(time);
    drawBoats(time);
    drawCoast(time);
    if (game.state === "finished") drawParticles();
  }

  function drawWater(time) {
    const { width, height, palette, scenery } = game;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.top);
    gradient.addColorStop(1, palette.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const sunGlow = ctx.createRadialGradient(width * .78, height * .14, 0, width * .78, height * .14, Math.min(width, height) * .5);
    sunGlow.addColorStop(0, "rgba(255,248,196,.22)");
    sunGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1.3;
    scenery.waves.forEach((wave) => {
      const drift = Math.sin(time * .6 + wave.phase) * 4;
      ctx.strokeStyle = `rgba(225,255,250,${wave.alpha})`;
      ctx.beginPath();
      ctx.arc(wave.x + drift, wave.y, wave.size, Math.PI * .12, Math.PI * .86);
      ctx.stroke();
    });
  }

  function drawIslands(time) {
    game.scenery.islands.forEach((island) => drawIsland(island, time));
  }

  function drawIsland(island, time) {
    const { palette } = game;
    ctx.save();
    ctx.translate(island.x, island.y);
    ctx.rotate(island.seed);
    const blob = (radius, wobble, fill) => {
      ctx.beginPath();
      for (let i = 0; i <= 18; i += 1) {
        const angle = (i / 18) * Math.PI * 2;
        const r = radius * (1 + Math.sin(angle * 3 + island.seed) * wobble + Math.sin(angle * 5) * wobble * .35);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * .72;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    };
    blob(island.r + 7, .09, "rgba(8,91,104,.18)");
    blob(island.r + 3, .08, palette.sand);
    blob(island.r * .72, .13, palette.land);
    ctx.fillStyle = "rgba(30,91,65,.35)";
    for (let i = 0; i < 3; i += 1) {
      const angle = island.seed + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * island.r * .32, Math.sin(angle) * island.r * .18, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (island.obstacle || island.branchObstacle) {
      ctx.rotate(-island.seed);
      ctx.strokeStyle = "#173f4b";
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -18); ctx.stroke();
      ctx.fillStyle = island.branchObstacle ? "#ffd65a" : "#ff6747";
      ctx.beginPath(); ctx.moveTo(1, -18); ctx.lineTo(13, -14); ctx.lineTo(1, -9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.88)";
      ctx.font = "900 7px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(island.branchObstacle ? "CHOOSE A ROUTE" : "GO AROUND", 0, island.r * .56 + 10);
    }
    ctx.restore();
  }

  function drawCourse() {
    const points = game.course.points;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([6, 10]);
    ctx.lineDashOffset = -game.elapsed * 12;
    ctx.lineWidth = 2;
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = index === points.length - 1 ? game.course.finishPoint : points[index + 1];
      const branch = game.course.branches.find((item) => item.segmentIndex === index);
      if (branch) {
        branch.routes.forEach((route, routeIndex) => {
          ctx.strokeStyle = branch.colors[routeIndex];
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          route.forEach((point) => ctx.lineTo(point.x, point.y));
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        });
      } else {
        ctx.strokeStyle = "rgba(255,255,255,.3)";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    game.course.branches.forEach((branch) => {
      branch.routes.forEach((route, routeIndex) => drawBranchBadge(route[0], String.fromCharCode(65 + routeIndex), branch.colors[routeIndex]));
    });

    game.course.markers.forEach((marker) => { if (!marker.hidden) drawBuoy(marker); });
    drawStartLine(points[0], points[1]);
    drawFinishLine(game.course.finishPoint, points[points.length - 1], points[0]);
    ctx.restore();
  }

  function drawBranchBadge(point, label, color) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.fillStyle = "rgba(5,58,72,.78)";
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, .5);
    ctx.restore();
  }

  function drawBuoy(marker) {
    ctx.save();
    ctx.translate(marker.x, marker.y);
    ctx.fillStyle = "rgba(4,64,78,.18)";
    ctx.beginPath(); ctx.ellipse(3, 8, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.62)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 8, 13, .05, Math.PI - .05); ctx.stroke();
    ctx.fillStyle = marker.color;
    ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(-3, -7); ctx.quadraticCurveTo(0, -12, 3, -7); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff8da";
    ctx.fillRect(-3.3, -3, 6.6, 3.5);
    ctx.fillStyle = "rgba(4,57,72,.82)";
    ctx.beginPath(); ctx.arc(0, -17, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 7px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(marker.number), 0, -16.5);
    ctx.restore();
  }

  function drawStartLine(start, next) {
    const angle = Math.atan2(next.y - start.y, next.x - start.x);
    const width = Math.max(88, game.boats.length * 18 + 28);
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, -width / 2); ctx.lineTo(0, width / 2); ctx.stroke();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "#ff6b3d";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -width / 2); ctx.lineTo(0, width / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(5,59,73,.82)";
    ctx.font = "900 8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("START", 0, width / 2 + 15);
    ctx.restore();
  }

  function drawFinishLine(finish, previous, courseStart) {
    const angle = Math.atan2(courseStart.y - previous.y, courseStart.x - previous.x);
    ctx.save();
    ctx.translate(finish.x, finish.y);
    ctx.rotate(angle);
    const width = Math.max(86, game.boats.length * 15 + 24);
    const tile = 8;
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-4, -width / 2 - 4, 8, width + 8);
    for (let row = 0; row < Math.ceil(width / tile); row += 1) {
      for (let col = 0; col < 2; col += 1) {
        ctx.fillStyle = (row + col) % 2 ? "#fff" : "#143f4e";
        ctx.fillRect(-tile + col * tile, -width / 2 + row * tile, tile, tile);
      }
    }
    ctx.fillStyle = "rgba(5,59,73,.78)";
    ctx.font = "900 8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FINISH", 0, -width / 2 - 10);
    ctx.restore();
  }

  function drawBoats(time) {
    const boats = [...game.boats].sort((a, b) => a.y - b.y);
    drawNames(game.boats);
    boats.forEach((boat) => drawBoat(boat, time));
  }

  function drawBoat(boat, time) {
    ctx.save();
    ctx.translate(boat.x, boat.y + Math.sin(time * 3 + boat.bobPhase) * 1.2);
    ctx.rotate(boat.heading + Math.PI / 2);
    const tackSide = boat.tackSide;

    if (boat.trail.length > 2 && game.state !== "countdown") {
      ctx.save();
      ctx.strokeStyle = "rgba(235,255,252,.46)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, 12); ctx.quadraticCurveTo(-7, 20, -12, 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 12); ctx.quadraticCurveTo(7, 20, 12, 26); ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "rgba(3,53,67,.22)";
    ctx.beginPath(); ctx.ellipse(3, 4, 12, 20, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = boat.hullColor;
    ctx.strokeStyle = "#16495a";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.quadraticCurveTo(10, -8, 9, 8); ctx.quadraticCurveTo(0, 16, -9, 8); ctx.quadraticCurveTo(-10, -8, 0, -18); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = boat.color;
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(7, -6, 6, 8); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = "#133e4e";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 8); ctx.stroke();
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(tackSide * 12, 4);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(19,62,78,.5)";
    ctx.stroke();
    ctx.fillStyle = "#ffd773";
    ctx.beginPath(); ctx.arc(0, 9, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawNames(boats) {
    ctx.save();
    ctx.font = "800 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = .58;
    ctx.shadowColor = "rgba(255,255,255,.55)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    boats.forEach((boat) => {
      ctx.fillStyle = boat.color;
      ctx.textAlign = "center";
      ctx.fillText(boat.name, boat.x, boat.y + 27);
    });
    ctx.restore();
  }

  function drawCoast(time) {
    const { width, height, palette } = game;
    const sand = 28;
    const land = 9;
    ctx.save();
    ctx.fillStyle = palette.sand;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(width, 0); ctx.lineTo(width, sand + waveEdge(width, time, 1));
    for (let x = width; x >= 0; x -= 24) ctx.lineTo(x, sand + Math.sin(x * .025 + 1.7) * 4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, height); ctx.lineTo(width, height); ctx.lineTo(width, height - sand);
    for (let x = width; x >= 0; x -= 24) ctx.lineTo(x, height - sand + Math.sin(x * .022 + 4.1) * 4);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(0, 0, sand, height);
    ctx.fillRect(width - sand, 0, sand, height);

    ctx.fillStyle = palette.land;
    ctx.fillRect(0, 0, width, land);
    ctx.fillRect(0, height - land, width, land);
    ctx.fillRect(0, 0, land, height);
    ctx.fillRect(width - land, 0, land, height);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.strokeRect(sand - 2, sand - 2, width - sand * 2 + 4, height - sand * 2 + 4);
    ctx.restore();
  }

  function waveEdge(width, time, offset) {
    return Math.sin(width * .01 + time * .1 + offset) * 3;
  }

  function drawParticles() {
    game.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  syncRoster(false);
  setupEvents();
})();
