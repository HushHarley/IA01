import assert from "node:assert/strict";

import {
  DIFFICULTY_CONFIG,
  RULES,
  VIEWPORT,
} from "../js/config.js";
import { createPlayer, populateWorld } from "../js/entities.js";
import {
  canEnemyContactAttack,
  ENEMY_COORDINATION,
  planEnemyCoordination,
} from "../js/enemy-coordination.js";
import { InputManager } from "../js/input.js";
import { generateMaze, validateMaze } from "../js/maze.js";
import { findPath, hasLineOfSight } from "../js/pathfinding.js";
import { getWallAtlasTransform, getWallTileStyle } from "../js/renderer.js";
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

function wallStyleWithFloors(floors) {
  const tiles = Array.from({ length: 3 }, () => Array(3).fill(0));
  for (const [x, y] of floors) tiles[y][x] = 1;
  return getWallTileStyle({ tiles, width: 3, height: 3 }, 1, 1);
}

for (const testCase of [
  { floors: [[1, 2]], kind: "straight", spriteId: "wallFront", quarterTurns: 0 },
  { floors: [[0, 1]], kind: "straight", spriteId: "wallFront", quarterTurns: 1 },
  { floors: [[1, 0]], kind: "straight", spriteId: "wallFront", quarterTurns: 2 },
  { floors: [[2, 1]], kind: "straight", spriteId: "wallFront", quarterTurns: 3 },
  { floors: [[1, 0], [1, 2]], kind: "straight", spriteId: "wallFront", quarterTurns: 0 },
  { floors: [[0, 1], [2, 1]], kind: "straight", spriteId: "wallFront", quarterTurns: 1 },
  { floors: [[1, 2], [2, 1]], kind: "corner", spriteId: "wallSide", quarterTurns: 0 },
  { floors: [[1, 2], [0, 1]], kind: "corner", spriteId: "wallSide", quarterTurns: 1 },
  { floors: [[1, 0], [0, 1]], kind: "corner", spriteId: "wallSide", quarterTurns: 2 },
  { floors: [[1, 0], [2, 1]], kind: "corner", spriteId: "wallSide", quarterTurns: 3 },
  { floors: [[2, 2]], kind: "inner-corner", spriteId: "wallSide", quarterTurns: 0 },
  { floors: [[0, 2]], kind: "inner-corner", spriteId: "wallSide", quarterTurns: 1 },
  { floors: [[0, 0]], kind: "inner-corner", spriteId: "wallSide", quarterTurns: 2 },
  { floors: [[2, 0]], kind: "inner-corner", spriteId: "wallSide", quarterTurns: 3 },
]) {
  const style = wallStyleWithFloors(testCase.floors);
  assert.deepEqual(
    { kind: style.kind, spriteId: style.spriteId, quarterTurns: style.quarterTurns },
    { kind: testCase.kind, spriteId: testCase.spriteId, quarterTurns: testCase.quarterTurns },
    "Wall atlas artwork should follow the surrounding floor topology.",
  );
  assert.deepEqual(
    getWallAtlasTransform(style),
    {
      quarterTurns: (testCase.quarterTurns + (testCase.kind === "straight" ? 2 : 3)) % 4,
      flipX: true,
    },
    "Wall atlas lighting should face the floor while preserving the mapped topology.",
  );
}
assert.equal(wallStyleWithFloors([]).edge, false, "Walls without nearby floor should remain cave void.");
assert.deepEqual(
  getWallAtlasTransform(wallStyleWithFloors([])),
  { quarterTurns: 0, flipX: false },
  "Cave void should not receive a wall-lighting transform.",
);

const makeChaser = (id, x, y, overrides = {}) => ({
  id,
  x,
  y,
  state: "chase",
  dead: false,
  coordinationGroupId: null,
  coordinationRole: "solo",
  ...overrides,
});
const coordinationPlayer = { x: 0, y: 0 };
const duoEnemies = [makeChaser("duo-near", 32, 0), makeChaser("duo-far", 96, 0)];
const duoAssignments = planEnemyCoordination(duoEnemies, coordinationPlayer);
assert.deepEqual(
  [...duoAssignments.values()].map((assignment) => assignment.role).sort(),
  ["duo-reserve", "duo-striker"],
  "Exactly two nearby chasers should form a striker/reserve duo.",
);
assert.equal(duoAssignments.get("duo-near").role, "duo-striker", "The closer duo member should attack first.");
assert.equal(canEnemyContactAttack({ coordinationMode: "duo", coordinationRole: "duo-reserve" }), false);
assert.equal(canEnemyContactAttack({ coordinationMode: "duo", coordinationRole: "duo-striker" }), true);

const duoGroupId = duoAssignments.get("duo-near").groupId;
duoEnemies[0].coordinationGroupId = duoGroupId;
duoEnemies[0].coordinationRole = "duo-reserve";
duoEnemies[1].coordinationGroupId = duoGroupId;
duoEnemies[1].coordinationRole = "duo-striker";
assert.equal(
  planEnemyCoordination(duoEnemies, coordinationPlayer).get("duo-far").role,
  "duo-striker",
  "A duo's follow-up striker should persist after the first attacker hands off.",
);

const packEnemies = [
  makeChaser("pack-a", 48, 0),
  makeChaser("pack-b", -32, 64),
  makeChaser("pack-c", -48, -64),
  makeChaser("pack-d", 64, 80),
];
const packAssignments = planEnemyCoordination(packEnemies, coordinationPlayer);
const packRoles = [...packAssignments.values()].map((assignment) => assignment.role);
const flankAngles = [...packAssignments.values()]
  .filter((assignment) => assignment.role === "pack-flanker")
  .map((assignment) => assignment.slotAngle);
assert.equal(packRoles.filter((role) => role === "pack-pressure").length, 1, "A 3+ pack should keep one direct pursuer.");
assert.equal(packRoles.filter((role) => role === "pack-flanker").length, 3, "The rest of a pack should take flanking slots.");
assert.equal(new Set(flankAngles).size, flankAngles.length, "Every pack flanker should receive a unique cornering lane.");

const splitGroupEnemies = [
  makeChaser("split-a", 0, 0),
  makeChaser("split-b", 32, 0),
  makeChaser("split-distant", ENEMY_COORDINATION.linkDistance * 2, 0),
];
const splitAssignments = planEnemyCoordination(splitGroupEnemies, coordinationPlayer);
assert.equal(splitAssignments.size, 2, "A distant third chaser should not turn a nearby duo into a pack.");
assert.equal(splitAssignments.has("split-distant"), false);

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
