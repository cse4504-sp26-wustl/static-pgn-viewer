const state = {
  games: [],
  rounds: [],
  players: {},
  activeRound: null,
  activeGameId: null,
  searchTerm: "",
};

const elements = {
  roundList: document.getElementById("round-list"),
  gameList: document.getElementById("game-list"),
  gameDetail: document.getElementById("game-detail"),
  standings: document.getElementById("standings"),
  searchInput: document.getElementById("search-player"),
  status: document.getElementById("status-message"),
  loadSample: document.getElementById("load-sample"),
  clearButton: document.getElementById("clear-data"),
};

const staticRoundFiles = ["round1.pgn", "round2.pgn", "round3.pgn"];

function normalizeText(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function parsePGNFile(fileName, text) {
  const normalized = normalizeText(text);
  const gamePattern = /((?:\[[^\]]+\]\s*\n)+)\s*([\s\S]*?)(?=(?:\n\s*\n\[[^\]]+\])|$)/g;
  const games = [];
  let match;

  while ((match = gamePattern.exec(normalized))) {
    const tagBlock = match[1].trim();
    const movetext = match[2].trim();
    if (!tagBlock) continue;

    const tags = {};
    tagBlock.split(/\n+/).forEach(line => {
      const parsed = line.match(/^\[([^\s]+)\s+"([\s\S]*)"\]$/);
      if (parsed) {
        tags[parsed[1]] = parsed[2];
      }
    });

    const roundNumber = Number(tags.Round) || Number((fileName.match(/round(\d+)/i) || [])[1]) || 1;
    const white = tags.White || "White";
    const black = tags.Black || "Black";
    const result = tags.Result || "*";
    const rawMoves = movetext.replace(/\s+/g, " ").trim();

    const game = {
      id: `${fileName}:${games.length + 1}`,
      fileName,
      round: roundNumber,
      white,
      black,
      whiteElo: tags.WhiteElo || "",
      blackElo: tags.BlackElo || "",
      result,
      rawPGN: `${tagBlock}\n\n${movetext}`.trim(),
      moves: rawMoves || "(no moves available)",
      tags,
    };

    games.push(game);
  }

  return games;
}

function computePoints(result) {
  if (result === "1-0") return [1, 0];
  if (result === "0-1") return [0, 1];
  if (result === "1/2-1/2" || result === "½-½") return [0.5, 0.5];
  return [0, 0];
}

function updateStateWithGames(newGames) {
  state.games = state.games.concat(newGames);
  state.players = {};

  state.games.forEach(game => {
    const [whitePoints, blackPoints] = computePoints(game.result);
    if (!state.players[game.white]) {
      state.players[game.white] = { name: game.white, points: 0, games: [] };
    }
    if (!state.players[game.black]) {
      state.players[game.black] = { name: game.black, points: 0, games: [] };
    }

    state.players[game.white].points += whitePoints;
    state.players[game.white].games.push(game);
    state.players[game.black].points += blackPoints;
    state.players[game.black].games.push(game);
  });

  const roundMap = new Map();
  state.games.forEach(game => {
    if (!roundMap.has(game.round)) roundMap.set(game.round, []);
    roundMap.get(game.round).push(game);
  });

  state.rounds = Array.from(roundMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, games]) => ({ round, games }));

  if (state.activeRound === null && state.rounds.length > 0) {
    state.activeRound = state.rounds[0].round;
  }

  if (!state.activeGameId && state.rounds.length > 0) {
    const games = state.rounds[0].games;
    if (games.length > 0) state.activeGameId = games[0].id;
  }
}

function filterPlayer(name) {
  const term = state.searchTerm.toLowerCase();
  return !term || name.toLowerCase().includes(term);
}

function renderRounds() {
  elements.roundList.innerHTML = "";
  state.rounds.forEach(({ round }) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `pill ${round === state.activeRound ? "active" : ""}`;
    pill.textContent = `Round ${round}`;
    pill.addEventListener("click", () => {
      state.activeRound = round;
      const roundGames = state.rounds.find(r => r.round === round)?.games || [];
      state.activeGameId = roundGames[0]?.id || null;
      renderUI();
    });
    elements.roundList.appendChild(pill);
  });
}

function renderGames() {
  elements.gameList.innerHTML = "";
  const roundGames = state.rounds.find(r => r.round === state.activeRound)?.games || [];
  const filtered = roundGames.filter(game => {
    const term = state.searchTerm.toLowerCase();
    return !term || game.white.toLowerCase().includes(term) || game.black.toLowerCase().includes(term);
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-item";
    empty.textContent = "No games found for this round and filter.";
    elements.gameList.appendChild(empty);
    return;
  }

  filtered.forEach(game => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `list-item ${game.id === state.activeGameId ? "active" : ""}`;
    item.innerHTML = `<strong>${game.white}</strong> vs <strong>${game.black}</strong><br><span>${game.result} · ${game.fileName}</span>`;
    item.addEventListener("click", () => {
      state.activeGameId = game.id;
      renderUI();
    });
    elements.gameList.appendChild(item);
  });
}

function formatNumber(value) {
  return Number.isInteger(value) ? `${value}.0` : value.toFixed(1);
}

function renderStandings() {
  elements.standings.innerHTML = "";
  const players = Object.values(state.players)
    .filter(player => filterPlayer(player.name))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  if (players.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list-item";
    empty.textContent = "No players match the search term.";
    elements.standings.appendChild(empty);
    return;
  }

  players.forEach(player => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `<strong>${player.name}</strong><div>Points: ${formatNumber(player.points)}</div>`;
    elements.standings.appendChild(item);
  });
}

function renderGameDetail() {
  const game = state.games.find(g => g.id === state.activeGameId);
  if (!game) {
    elements.gameDetail.innerHTML = '<p class="empty">Select a game to view details.</p>';
    return;
  }

  elements.gameDetail.innerHTML = "";
  const rows = document.createElement("div");
  rows.className = "detail-row";
  rows.innerHTML = `
    <strong>White</strong><span>${game.white}</span>
    <strong>Black</strong><span>${game.black}</span>
    <strong>Round</strong><span>${game.round}</span>
    <strong>Result</strong><span>${game.result}</span>
    <strong>White Elo</strong><span>${game.whiteElo || "—"}</span>
    <strong>Black Elo</strong><span>${game.blackElo || "—"}</span>
    <strong>Source</strong><span>${game.fileName}</span>
  `;
  elements.gameDetail.appendChild(rows);

  const tagBar = document.createElement("div");
  tagBar.className = "tag-list";
  const tags = ["Event", "Site", "Date", "Round", "Result"].filter(key => game.tags[key]);
  tags.forEach(key => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = `${key}: ${game.tags[key]}`;
    tagBar.appendChild(chip);
  });
  elements.gameDetail.appendChild(tagBar);

  const movesBox = document.createElement("pre");
  movesBox.className = "moves";
  movesBox.textContent = game.moves || "(no move text available)";
  elements.gameDetail.appendChild(movesBox);
}

function renderUI() {
  renderRounds();
  renderGames();
  renderGameDetail();
  renderStandings();

  if (state.games.length === 0) {
    elements.status.textContent = "No PGN loaded yet.";
  } else {
    elements.status.textContent = `Loaded ${state.games.length} games across ${state.rounds.length} round(s).`;
  }
}

function clearState() {
  state.games = [];
  state.rounds = [];
  state.players = {};
  state.activeRound = null;
  state.activeGameId = null;
  state.searchTerm = "";
  elements.searchInput.value = "";
  renderUI();
}

async function loadFiles(files) {
  const fileArray = Array.from(files);
  const loadedGames = [];

  for (const file of fileArray) {
    try {
      const text = await file.text();
      const games = parsePGNFile(file.name, text);
      loadedGames.push(...games);
    } catch (error) {
      console.error(`Unable to read ${file.name}:`, error);
    }
  }

  if (loadedGames.length === 0) {
    elements.status.textContent = "No valid games were found in the selected files.";
    return;
  }

  updateStateWithGames(loadedGames);
  renderUI();
}

async function loadSampleData() {
  const loadedGames = [];

  for (const roundFile of staticRoundFiles) {
    try {
      const response = await fetch(`data/${roundFile}`);
      if (!response.ok) throw new Error(response.statusText);
      const text = await response.text();
      loadedGames.push(...parsePGNFile(roundFile, text));
    } catch (error) {
      console.warn(`Unable to fetch sample file ${roundFile}:`, error);
    }
  }

  if (loadedGames.length === 0) {
    elements.status.textContent = "Cannot load static data from this environment. Please verify the data files are present in /data/.";
    return;
  }

  updateStateWithGames(loadedGames);
  renderUI();
}

elements.searchInput.addEventListener("input", event => {
  state.searchTerm = event.target.value.trim();
  renderUI();
});

elements.loadSample.addEventListener("click", async () => {
  clearState();
  await loadSampleData();
});

window.addEventListener("DOMContentLoaded", async () => {
  clearState();
  await loadSampleData();
});

elements.clearButton.addEventListener("click", () => {
  clearState();
});

renderUI();
