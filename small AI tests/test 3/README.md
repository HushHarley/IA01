# Crystal Labyrinth

A dependency-free, top-down crystal-cave adventure built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Run the game

Open this folder in VS Code, then use **Live Server** on `index.html`. The game uses native JavaScript modules, so it should be served over `http://` rather than opened directly as a `file://` URL.

An alternative local server is:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/`.

## Controls

- `WASD` or arrow keys: smooth movement
- `Space`: interact with a nearby, faced exit gate; otherwise fire a crystal laser
- `1`–`6`: select a hotbar slot
- Mouse wheel: cycle hotbar slots
- `F`: use the selected item
- `Esc`: pause or resume

Shards are objective progress, laser ammunition, and light. Collect 10, return to the exit, face it, and survive the two-second activation as the nine original frame sockets fill one by one and the tenth charge fully awakens the center crystal. Collected crystal veins reform elsewhere after a difficulty-scaled delay, with a three-second emergency recovery if the cave is exhausted before the objective is charged. Half Hearts occupy individual hotbar slots; using two restores one life.

## Included systems

- Large seeded cave networks with rooms, loops, corridors, shortcuts, and guaranteed connectivity
- Three visual/light profiles: Upper Crystal Caverns, Deep Crystal Network, and The Abyss
- Four difficulties with exact 80% / 90% / 100% / 120% enemy-speed baselines
- Crystal Stalker, Shard Crawler, and two-hit Abyss Brute enemies
- Atlas-anchored emissive eyes that remain aligned when enemies turn and scale
- Wander, scan, alert, chase, search, and return AI with line-of-sight hiding
- Loose mined Shards, +2 Crystal Chunks, safe crystal-vein respawns, six non-stacking item slots, and Half Heart healing
- Three-frame walking cycles with distinct down, left, right, and up artwork
- Lives, knockback, invulnerability, standard retries, and Nightmare run resets
- Level unlocks and preference persistence through `localStorage`
- Responsive menu/HUD, generated crystal ambience, synthesized WebAudio cues, pause/death/clear/win states, and reduced-motion support

## Structure

- `index.html` / `style.css`: responsive menu, HUD, overlays, and presentation
- `assets/`: original menu backdrop, transparent gameplay, empty-gate, mined-pickup, and directional player sprite atlases, plus the favicon
- `js/config.js`: balancing and data definitions
- `js/maze.js`: deterministic cave generation and validation
- `js/game.js`: state machine and gameplay orchestration
- `js/renderer.js`: pixel-style Canvas rendering and lighting
- `js/entities.js`: player, population, pickup, and enemy factories
- `js/input.js` / `js/audio.js`: controls and synthesized soundscape
- `js/pathfinding.js`: grid paths, flood distances, and line of sight
- `tests/logic-smoke.mjs`: repeatable generation/population checks
- `tests/browser-smoke.mjs`: end-to-end browser checks for gameplay, progression, responsive layout, and shard recovery

Run the dependency-free logic smoke test with:

```powershell
node tests/logic-smoke.mjs
```
