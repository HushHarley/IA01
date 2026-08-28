import assert from "node:assert/strict";

import {
  DIFFICULTY_CONFIG,
  RULES,
  VIEWPORT,
} from "../js/config.js";
import { createPlayer, populateWorld } from "../js/entities.js";
import { InputManager } from "../js/input.js";
import { generateMaze, validateMaze } from "../js/maze.js";
import { findPath, hasLineOfSight } from "../js/pathfinding.js";
import { hash2D } from "../js/utils.js";

assert.deepEqual(
  Object.values(DIFFICULTY_CONFIG).map((profile) => profile.enemySpeedMultiplier),
  [0.8, 0.9, 1, 1.2],
  "Enemy speed multipliers must match the design rules.",
);
assert.deepEqual(
  Object.values(DIFFICULTY_CONFIG).map((profile) => profile.crystalRespawnMultiplier),
  [0.75, 1, 1.25, 1.45],
  "Crystal respawns should slow predictably as difficulty rises.",
);
assert.ok(RULES.crystalRespawn.emergencySeconds < RULES.crystalRespawn.regularSeconds, "Emergency recovery must beat the normal shard timer.");
assert.notEqual(hash2D(4, 7, "cave-alpha"), hash2D(4, 7, "cave-beta"), "String seeds should produce distinct visual variation.");

const sealedCorner = new Set(["0,0", "1,1"]);
assert.equal(
  hasLineOfSight({ x: 0, y: 0 }, { x: 1, y: 1 }, (x, y) => sealedCorner.has(`${x},${y}`)),
  false,
  "Sight must not pass diagonally between sealed wall corners.",
);

const repeatInput = new InputManager({ autoAttach: false });
const keyEvent = (repeat) => ({
  code: "Escape",
  key: "Escape",
  repeat,
  cancelable: true,
  isComposing: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: null,
  preventDefault() {},
});
repeatInput._onKeyDown(keyEvent(false));
assert.equal(repeatInput.wasPressed("pause"), true);
repeatInput.reset();
repeatInput._onKeyDown(keyEvent(true));
assert.equal(repeatInput.wasPressed("pause"), false, "A held Escape repeat must not undo a pause-state reset.");

let generatedCount = 0;
for (const level of [1, 2, 3]) {
  for (const difficulty of Object.keys(DIFFICULTY_CONFIG)) {
    for (let sample = 0; sample < 4; sample += 1) {
      const seed = `smoke-${level}-${difficulty}-${sample}`;
      const world = generateMaze({ level, difficulty, seed });
      const validation = validateMaze(world);
      assert.equal(validation.valid, true, validation.errors.join(" "));
      assert.ok(world.width > VIEWPORT.visibleColumns * 2 - 1, "World should span more than two view widths.");
      assert.ok(world.height > VIEWPORT.visibleRows * 2, "World should span more than two view heights.");

      const path = findPath(
        world.spawn,
        world.door,
        (x, y) => world.tiles[y]?.[x] === 1,
        world.width * world.height,
      );
      assert.ok(path.length > 0, "The exit must have a navigable path from spawn.");

      const population = populateWorld(world, level, difficulty, seed);
      const totalShardValue = population.pickups.reduce((sum, pickup) => {
        if (pickup.kind === "regular-crystal") return sum + 1;
        if (pickup.kind === "crystal-chunk") return sum + 2;
        return sum;
      }, 0);
      assert.ok(totalShardValue >= RULES.shardGoal + 7, "Each map needs objective shards plus usable ammunition.");
      assert.ok(population.pickups.some((pickup) => pickup.kind === "half-heart"), "Each map should have a Half Heart.");
      const expectedEnemies = Math.max(5, Math.round((5 + level * 3.4) * DIFFICULTY_CONFIG[difficulty].enemyDensityMultiplier));
      assert.ok(population.enemies.length >= expectedEnemies, "Each map should meet its configured enemy pressure.");
      if (level > 1) assert.ok(population.enemies.some((enemy) => enemy.type === "brute"), "Deeper maps should include a Brute.");

      const player = createPlayer(world.spawn);
      assert.equal(player.lives, 3);
      assert.equal(player.shards, 0);
      assert.deepEqual(player.hotbar, Array(6).fill(null));
      generatedCount += 1;
    }
  }
}

console.log(`Logic smoke test passed across ${generatedCount} generated levels.`);
