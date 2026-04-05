# Static PGN Viewer

This is a static HTML/JS viewer for chess PGN files.

## Features

- Load one or more `.pgn` round files using local file input
- Browse rounds and games
- View player pairings, color assignment, results, and move text
- See computed standings by player
- Search for players across loaded rounds

## Usage

### Running a Local Server

To load PGN files from the `data/` folder, you need to run a local server:

```bash
# From the static-pgn-viewer directory
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Loading Data

1. Open `http://localhost:8000/index.html` in your browser (or just `http://localhost:8000`).
2. Click **Reload static rounds** to load the demo data files from the `data/` folder, or click **Select PGN files** to upload your own `*.pgn` files.
3. Choose a round and a game to inspect the metadata and moves.
4. Use the search input to filter by player name.

## GitHub Pages

To host on GitHub Pages, publish the `static-pgn-viewer` folder as the site root or use a repository containing this folder. The sample files are available under `data/`.

## Notes

- The viewer does not modify upstream PGN files.
- A local server is required to load demo data files from the `data/` folder. Opening `index.html` directly with the `file://` protocol will not work for fetching the data files.
- You can still manually select and upload PGN files using the file picker, which works over `file://` protocol.
- The sample rounds are provided in `data/round1.pgn`, `data/round2.pgn`, and `data/round3.pgn`.
