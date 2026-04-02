# Static PGN Viewer

This is a static HTML/JS viewer for chess PGN files.

## Features

- Load one or more `.pgn` round files using local file input
- Browse rounds and games
- View player pairings, color assignment, results, and move text
- See computed standings by player
- Search for players across loaded rounds

## Usage

1. Open `static-pgn-viewer/index.html` in your browser.
2. Click **Select PGN files** and choose one or more `*.pgn` files.
3. Choose a round and a game to inspect the metadata and moves.
4. Use the search input to filter by player name.

## GitHub Pages

To host on GitHub Pages, publish the `static-pgn-viewer` folder as the site root or use a repository containing this folder. The sample files are available under `data/`.

## Notes

- The viewer does not modify upstream PGN files.
- Local file input works even when the browser is opened from `file://`.
- The sample rounds are provided in `data/round1.pgn`, `data/round2.pgn`, and `data/round3.pgn`.
