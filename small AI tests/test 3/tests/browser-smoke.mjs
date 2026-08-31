import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const target = targets.find((candidate) => candidate.type === "page" && candidate.url.includes("127.0.0.1:4173"));
assert.ok(target, "A Crystal Labyrinth browser target must be open.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const browserErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(
      message.params.exceptionDetails.exception?.description
      || message.params.exceptionDetails.exception?.value
      || message.params.exceptionDetails.text,
    );
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    browserErrors.push(message.params.entry.text);
  }
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function tap(code, key = code) {
  await keyDown(code, key);
  await sleep(70);
  await keyUp(code, key);
  await sleep(90);
}

async function keyDown(code, key = code) {
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { code: ${JSON.stringify(code)}, key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
}

async function keyUp(code, key = code) {
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keyup", { code: ${JSON.stringify(code)}, key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
}

await command("Runtime.enable");
await command("Log.enable");
await command("Page.enable");

await evaluate(`localStorage.setItem("crystal-labyrinth-save-v1", JSON.stringify({
  version: 1,
  unlockedLevel: 1.5,
  selectedLevel: 1.5,
  difficulty: "normal",
  muted: false,
  reducedMotion: false
}))`);
await command("Page.reload", { ignoreCache: true });
await sleep(900);
browserErrors.length = 0;

assert.equal(await evaluate("Boolean(window.crystalLabyrinth)"), true, "Game should expose its test/debug handle.");
assert.equal(await evaluate("document.querySelector('.fatal-error') === null"), true, "Boot should not show a fatal error.");
assert.equal(await evaluate("document.getElementById('menuScreen').hidden"), false, "Menu should be visible at boot.");
assert.deepEqual(
  await evaluate("({ selected: window.crystalLabyrinth.selectedLevel, unlocked: window.crystalLabyrinth.save.unlockedLevel })"),
  { selected: 1, unlocked: 1 },
  "Malformed fractional save levels should normalize safely.",
);

await command("Emulation.setDeviceMetricsOverride", {
  width: 1366,
  height: 768,
  deviceScaleFactor: 1,
  mobile: false,
});
await sleep(200);
const responsiveMenu = await evaluate(`(() => {
  const panel = document.querySelector(".menu-panel").getBoundingClientRect();
  return {
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    panelTop: panel.top,
    panelBottom: panel.bottom,
  };
})()`);
assert.ok(responsiveMenu.scrollWidth <= responsiveMenu.viewportWidth, "The 1366px menu must not overflow horizontally.");
assert.ok(responsiveMenu.panelTop >= 0 && responsiveMenu.panelBottom <= 768, "The primary menu panel should fit a 1366x768 viewport.");

const menuScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./menu-smoke.png", import.meta.url), Buffer.from(menuScreenshot.data, "base64"));

await tap("Space", " ");
await sleep(800);

const bootState = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    state: game.state,
    gameVisible: !document.getElementById("gameScreen").hidden,
    width: game.world.width,
    height: game.world.height,
    lives: game.player.lives,
    shards: game.player.shards,
    hotbar: game.player.hotbar,
    focusIds: game.player.laserFocusIds,
    equippedFocus: game.player.equippedFocusId,
    focusPickupCount: game.pickups.filter((pickup) => pickup.kind === "laser-focus").length,
    focusHud: (() => {
      const focus = document.getElementById("laserFocusSlot").getBoundingClientRect();
      const hotbar = document.getElementById("hotbar").getBoundingClientRect();
      return {
        immediatelyLeft: focus.right <= hotbar.left && hotbar.left - focus.right < 16,
        name: document.getElementById("laserFocusName").textContent,
      };
    })(),
    enemies: game.enemies.length,
    atlasReady: game.renderer.atlasReady,
    atlasWidth: game.renderer.gameplayAtlas.naturalWidth,
    pickupAtlasReady: game.renderer.pickupAtlasReady,
    pickupAtlasWidth: game.renderer.pickupAtlas.naturalWidth,
    gateAtlasReady: game.renderer.gateAtlasReady,
    gateAtlasWidth: game.renderer.gateAtlas.naturalWidth,
    playerWalkAtlasReady: game.renderer.playerWalkAtlasReady,
    playerWalkAtlasWidth: game.renderer.playerWalkAtlas.naturalWidth,
    playerWalkAtlasHeight: game.renderer.playerWalkAtlas.naturalHeight,
    walkRows: ["down", "left", "right", "up"].map((facing) =>
      game.renderer.getPlayerWalkFrame({ facing, moving: false }, 0).row
    ),
    walkCycle: [0, 0.13, 0.26, 0.39].map((time) =>
      game.renderer.getPlayerWalkFrame({ facing: "down", moving: true }, time).column
    ),
    idleWalkFrame: game.renderer.getPlayerWalkFrame({ facing: "down", moving: false }, 0.26).column,
    reducedMotionWalkFrame: game.renderer.getPlayerWalkFrame({ facing: "down", moving: true }, 0.26, true).column,
    oldDoorBarRemoved: typeof game.renderer.drawDoorChannel === "undefined",
  };
})()`);
assert.equal(bootState.state, "playing");
assert.equal(bootState.gameVisible, true);
assert.ok(bootState.width >= 61 && bootState.height >= 39, "World should be several viewports large.");
assert.equal(bootState.lives, 3);
assert.equal(bootState.shards, 0);
assert.deepEqual(bootState.hotbar, Array(6).fill(null));
assert.deepEqual(bootState.focusIds, ["standard"], "Every fresh run should begin with only Standard Focus attuned.");
assert.equal(bootState.equippedFocus, "standard");
assert.equal(bootState.focusPickupCount, 1, "A fresh labyrinth should contain one rare Focus Chamber.");
assert.deepEqual(bootState.focusHud, { immediatelyLeft: true, name: "Standard" }, "The dedicated Laser Focus slot should sit immediately left of item slot 1.");
assert.ok(bootState.enemies >= 5);
assert.equal(bootState.atlasReady, true, "The transparent gameplay atlas should load before the first playable view.");
assert.equal(bootState.atlasWidth, 1254, "The renderer should use the expected gameplay atlas version.");
assert.equal(bootState.pickupAtlasReady, true, "The transparent mined-crystal pickup atlas should load before play.");
assert.equal(bootState.pickupAtlasWidth, 1254, "The renderer should use the expected mined-crystal atlas version.");
assert.equal(bootState.gateAtlasReady, true, "The empty-socket gate atlas should load before play.");
assert.equal(bootState.gateAtlasWidth, 1254, "The renderer should use the expected empty-socket gate atlas version.");
assert.equal(bootState.playerWalkAtlasReady, true, "The directional player walk atlas should load before play.");
assert.deepEqual(
  [bootState.playerWalkAtlasWidth, bootState.playerWalkAtlasHeight],
  [1236, 1272],
  "The renderer should use the expected 3x4 player walk atlas.",
);
assert.deepEqual(bootState.walkRows, [0, 1, 2, 3], "Each facing direction should use its own sprite row.");
assert.deepEqual(bootState.walkCycle, [0, 1, 2, 1], "Moving should play the three-frame walk cycle in order.");
assert.equal(bootState.idleWalkFrame, 1, "An idle player should hold the neutral walk frame.");
assert.equal(bootState.reducedMotionWalkFrame, 1, "Reduced-motion mode should hold the neutral walk frame.");
assert.equal(bootState.oldDoorBarRemoved, true, "Door activation should no longer use the old filling progress bar.");

const doorBeacon = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const original = {
    shards: game.player.shards,
    doorX: game.door.x,
    doorY: game.door.y,
  };
  game.door.x = game.camera.x + 1560;
  game.door.y = game.player.y;
  game.player.shards = 9;
  const beforeGoal = game.renderer.getDoorBeaconState(game);
  game.player.shards = 10;
  const atGoal = game.renderer.getDoorBeaconState(game);
  game.door.x = game.player.x + 32;
  game.door.y = game.player.y;
  const doorOnScreen = game.renderer.getDoorBeaconState(game);
  game.player.shards = original.shards;
  game.door.x = original.doorX;
  game.door.y = original.doorY;
  return { beforeGoal, atGoal, doorOnScreen };
})()`);
assert.equal(doorBeacon.beforeGoal, null, "The exit beacon should stay hidden before all ten shards are held.");
assert.ok(doorBeacon.atGoal.x >= 930 && doorBeacon.atGoal.x <= 934, "A distant eastward gate should place the beacon along the right edge.");
assert.ok(Math.abs(doorBeacon.atGoal.y - 270) < 80, "The beacon should preserve the gate's direction from the player.");
assert.equal(doorBeacon.doorOnScreen, null, "The edge beacon should yield to the visible gate.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game._beaconPreviewState = {
    state: game.state,
    shards: game.player.shards,
    doorX: game.door.x,
    doorY: game.door.y,
  };
  game.state = "paused";
  game.player.shards = 10;
  game.door.x = game.camera.x + 1560;
  game.door.y = game.player.y;
  game.updateHud();
})()`);
await sleep(120);
const doorBeaconScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./door-beacon-smoke.png", import.meta.url), Buffer.from(doorBeaconScreenshot.data, "base64"));
await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const preview = game._beaconPreviewState;
  game.state = preview.state;
  game.player.shards = preview.shards;
  game.door.x = preview.doorX;
  game.door.y = preview.doorY;
  game.updateHud();
  delete game._beaconPreviewState;
})()`);

assert.equal(
  await evaluate(`(() => {
    const game = window.crystalLabyrinth;
    const cell = game.world.floorCells.find(({ x, y }) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !game.isTileWalkable(x + dx, y + dy))
    );
    return game.canOccupy((cell.x + 0.5) * 32, (cell.y + 0.5) * 32, 16);
  })()`),
  true,
  "A 16px-radius Brute centered on a floor tile may touch, but not penetrate, an adjacent wall.",
);

const screenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./gameplay-smoke.png", import.meta.url), Buffer.from(screenshot.data, "base64"));

await command("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await sleep(250);
const mobileLayout = await evaluate(`(() => {
  const viewport = document.getElementById("gameViewport").getBoundingClientRect();
  const hotbar = document.getElementById("loadoutBar").getBoundingClientRect();
  const pause = document.getElementById("pauseButton").getBoundingClientRect();
  const overlap = !(hotbar.right <= pause.left || pause.right <= hotbar.left || hotbar.bottom <= pause.top || pause.bottom <= hotbar.top);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    viewportLeft: viewport.left,
    viewportRight: viewport.right,
    overlap,
    loadoutBounds: { left: hotbar.left, right: hotbar.right, top: hotbar.top, bottom: hotbar.bottom },
    pauseBounds: { left: pause.left, right: pause.right, top: pause.top, bottom: pause.bottom },
    messageDisplay: getComputedStyle(document.getElementById("gameMessage")).display,
  };
})()`);
assert.ok(mobileLayout.scrollWidth <= mobileLayout.innerWidth, "The 390px game view must not overflow horizontally.");
assert.ok(mobileLayout.viewportLeft >= 0 && mobileLayout.viewportRight <= 390, "The mobile canvas frame must fit onscreen.");
assert.equal(mobileLayout.overlap, false, `The mobile pause control must not overlap the hotbar: ${JSON.stringify(mobileLayout)}`);
assert.equal(mobileLayout.messageDisplay, "none", "The tutorial card should yield scarce space on narrow gameplay screens.");
const mobileScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./mobile-smoke.png", import.meta.url), Buffer.from(mobileScreenshot.data, "base64"));
await command("Emulation.setDeviceMetricsOverride", {
  width: 1366,
  height: 768,
  deviceScaleFactor: 1,
  mobile: false,
});
await sleep(180);

const enemyEyeGeometry = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const radii = { basic: 11, crawler: 8, brute: 16 };
  return ["basic", "crawler", "brute"].map((type) => {
    const enemy = { type, x: game.player.x, y: game.player.y + 80, radius: radii[type], facingAngle: 0 };
    const normal = game.renderer.getEnemyAtlasLayout(game, enemy);
    const flipped = game.renderer.getEnemyAtlasLayout(game, { ...enemy, facingAngle: Math.PI });
    return {
      type,
      eyeCount: normal.eyes.length,
      facesMovementDirection: normal.flipX === true && flipped.flipX === false,
      contained: normal.eyes.every((eye) =>
        eye.x >= normal.left && eye.y >= normal.top
        && eye.x + eye.width <= normal.left + normal.width
        && eye.y + eye.height <= normal.top + normal.height
      ),
      mirrorsExactly: normal.eyes.every((eye, index) => {
        const mirroredEye = flipped.eyes[index];
        return Math.abs((eye.x + eye.width / 2) + (mirroredEye.x + mirroredEye.width / 2) - normal.screen.x * 2) < 0.01;
      }),
    };
  });
})()`);
for (const geometry of enemyEyeGeometry) {
  assert.equal(geometry.eyeCount, 2, `${geometry.type} should reuse both eyes from its atlas sprite.`);
  assert.equal(geometry.facesMovementDirection, true, `${geometry.type} artwork should face its movement direction.`);
  assert.equal(geometry.contained, true, `${geometry.type} eye crops must stay inside the rendered sprite.`);
  assert.equal(geometry.mirrorsExactly, true, `${geometry.type} eye crops must mirror with the sprite.`);
}

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const radii = { basic: 11, crawler: 8, brute: 16 };
  const health = { basic: 1, crawler: 1, brute: 2 };
  game.enemies = ["basic", "crawler", "brute"].map((type, index) => ({
    id: "eye-check-" + type,
    type,
    x: game.player.x + (index - 1) * 76,
    y: game.player.y + 82,
    radius: radii[type],
    health: health[type],
    maxHealth: health[type],
    state: "wander",
    stateTimer: 99,
    facingAngle: index === 1 ? Math.PI : 0,
    home: { x: Math.floor(game.player.x / 32), y: Math.floor(game.player.y / 32) },
    target: null,
    lastSeen: null,
    path: [],
    pathIndex: 0,
    pathCooldown: 99,
    scanDirection: 1,
    scanOriginAngle: 0,
    lostSightTimer: 0,
    stun: 99,
    contactCooldown: 99,
    dead: false,
  }));
})()`);
await sleep(180);
const enemyEyesScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./enemy-eyes-smoke.png", import.meta.url), Buffer.from(enemyEyesScreenshot.data, "base64"));

const coordinationState = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const playerTile = { x: Math.floor(game.player.x / 32), y: Math.floor(game.player.y / 32) };
  for (const enemy of game.enemies) {
    enemy.state = "chase";
    enemy.dead = false;
    enemy.coordinationMode = "solo";
    enemy.coordinationRole = "solo";
    enemy.coordinationGroupId = null;
    enemy.coordinationPartnerId = null;
  }
  game.assignEnemyCoordination();
  const packRoles = game.enemies.map((enemy) => enemy.coordinationRole);
  const flankPlans = game.enemies
    .filter((enemy) => enemy.coordinationRole === "pack-flanker")
    .map((enemy) => game.getEnemyChasePlan(enemy, playerTile));

  game.enemies = game.enemies.slice(0, 2);
  game.assignEnemyCoordination();
  const firstStriker = game.enemies.find((enemy) => enemy.coordinationRole === "duo-striker");
  const firstReserve = game.enemies.find((enemy) => enemy.coordinationRole === "duo-reserve");
  game.advanceDuoAttack(firstStriker);
  const reservePlan = game.getEnemyChasePlan(firstStriker, playerTile);
  return {
    packPressureCount: packRoles.filter((role) => role === "pack-pressure").length,
    packFlankerCount: packRoles.filter((role) => role === "pack-flanker").length,
    flankersLeaveDirectLane: flankPlans.every((plan) => plan.targetCell.x !== playerTile.x || plan.targetCell.y !== playerTile.y),
    duoRolesBefore: [firstStriker.id, firstReserve.id],
    duoRolesAfter: [
      game.enemies.find((enemy) => enemy.coordinationRole === "duo-striker").id,
      game.enemies.find((enemy) => enemy.coordinationRole === "duo-reserve").id,
    ],
    reserveWaits: reservePlan.speedMultiplier < 1 && (reservePlan.targetCell.x !== playerTile.x || reservePlan.targetCell.y !== playerTile.y),
  };
})()`);
assert.equal(coordinationState.packPressureCount, 1, "A browser-side pack should keep one direct pursuer.");
assert.equal(coordinationState.packFlankerCount, 2, "A three-enemy pack should send two members around the player.");
assert.equal(coordinationState.flankersLeaveDirectLane, true, "Pack flankers should target surrounding lanes instead of piling onto the player tile.");
assert.notDeepEqual(coordinationState.duoRolesAfter, coordinationState.duoRolesBefore, "The reserve should take over after the first duo striker lands a hit.");
assert.equal(coordinationState.reserveWaits, true, "The first duo attacker should fall back to a slower waiting position.");

await evaluate("window.crystalLabyrinth.enemies = []");
const movementSetup = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const tile = { x: Math.floor(game.player.x / 32), y: Math.floor(game.player.y / 32) };
  const options = [
    ["KeyD", "d", 1, 0], ["KeyA", "a", -1, 0],
    ["KeyS", "s", 0, 1], ["KeyW", "w", 0, -1],
  ];
  const choice = options.find((entry) => game.isTileWalkable(tile.x + entry[2], tile.y + entry[3]));
  return { code: choice[0], key: choice[1], x: game.player.x, y: game.player.y };
})()`);
await evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { code: ${JSON.stringify(movementSetup.code)}, key: ${JSON.stringify(movementSetup.key)}, bubbles: true, cancelable: true }))`);
await sleep(170);
assert.equal(await evaluate("window.crystalLabyrinth.player.moving"), true, "The player walk cycle should be active while movement is held.");
const walkingScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./walking-smoke.png", import.meta.url), Buffer.from(walkingScreenshot.data, "base64"));
await sleep(160);
await evaluate(`window.dispatchEvent(new KeyboardEvent("keyup", { code: ${JSON.stringify(movementSetup.code)}, key: ${JSON.stringify(movementSetup.key)}, bubbles: true, cancelable: true }))`);
await sleep(100);
const movedDistance = await evaluate(`Math.hypot(window.crystalLabyrinth.player.x - ${movementSetup.x}, window.crystalLabyrinth.player.y - ${movementSetup.y})`);
assert.ok(movedDistance > 10, "Held movement should move the player smoothly.");

const centerHit = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.lives = 3;
  game.player.shards = 1;
  game.player.invulnerability = 0;
  const before = { x: game.player.x, y: game.player.y };
  const enemy = { x: before.x, y: before.y, radius: 11, facingAngle: 0, contactCooldown: 0, stun: 0, state: "chase", stateTimer: 0 };
  game.damagePlayer(enemy);
  return {
    lives: game.player.lives,
    shards: game.player.shards,
    displacement: Math.hypot(game.player.x - before.x, game.player.y - before.y) + Math.hypot(enemy.x - before.x, enemy.y - before.y),
  };
})()`);
assert.equal(centerHit.lives, 2);
assert.equal(centerHit.shards, 0);
assert.ok(centerHit.displacement > 0, "An exact-center contact must still separate the player and enemy.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.lives = 3;
  game.player.invulnerability = 0;
  game.player.shards = 2;
  game.door.x = -1000;
  game.door.y = -1000;
})()`);
await tap("Space", " ");
assert.equal(await evaluate("window.crystalLabyrinth.player.shards"), 1, "Firing should consume one shard.");

const standardFocusShot = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.equippedFocusId = "standard";
  game.player.shards = 3;
  game.player.fireCooldown = 0;
  game.projectiles = [];
  const focus = game.getEquippedLaserFocus();
  const fired = game.fireLaser(focus);
  const shot = { ...game.projectiles[0] };
  const normal = { type: "basic", health: 1, dead: false, x: game.player.x, y: game.player.y };
  const brute = { type: "brute", health: 2, dead: false, x: game.player.x, y: game.player.y };
  game.damageEnemy(normal, { ...shot });
  game.damageEnemy(brute, { ...shot });
  game.projectiles = [];
  return {
    fired,
    shardCost: shot.shardCost,
    damage: shot.damage,
    beamWidth: shot.beamWidth,
    range: shot.life * Math.hypot(shot.vx, shot.vy),
    normalDead: normal.dead,
    bruteHealth: brute.health,
    bruteDead: brute.dead,
  };
})()`);
assert.equal(standardFocusShot.fired, true);
assert.equal(standardFocusShot.shardCost, 1);
assert.equal(standardFocusShot.damage, 1);
assert.equal(standardFocusShot.beamWidth, 4);
assert.ok(Math.abs(standardFocusShot.range - 360) < 0.01, "Standard Focus should keep good configured range.");
assert.equal(standardFocusShot.normalDead, true, "Standard Focus should one-shot normal enemies.");
assert.deepEqual(
  { health: standardFocusShot.bruteHealth, dead: standardFocusShot.bruteDead },
  { health: 1, dead: false },
  "Standard Focus should require two hits against Brutes.",
);

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const pickup = game.pickups.find((candidate) => candidate.kind === "laser-focus");
  game._focusPreviewState = { state: game.state, camera: { ...game.camera } };
  game.state = "paused";
  game.camera.x = Math.max(0, Math.min(game.world.pixelWidth - 960, pickup.x - 480));
  game.camera.y = Math.max(0, Math.min(game.world.pixelHeight - 540, pickup.y - 270));
})()`);
await sleep(120);
const focusChamberScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./focus-chamber-smoke.png", import.meta.url), Buffer.from(focusChamberScreenshot.data, "base64"));
await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.state = game._focusPreviewState.state;
  game.camera = game._focusPreviewState.camera;
  delete game._focusPreviewState;
})()`);

const focusDiscovery = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const pickup = game.pickups.find((candidate) => candidate.kind === "laser-focus");
  pickup.x = game.player.x;
  pickup.y = game.player.y;
  game.updatePickups();
  game.updateHud();
  return {
    collected: pickup.collected,
    focusIds: game.player.laserFocusIds,
    equipped: game.player.equippedFocusId,
    hudName: document.getElementById("laserFocusName").textContent,
    hotbarStillSixSlots: document.querySelectorAll(".hotbar-slot").length,
  };
})()`);
assert.deepEqual(
  focusDiscovery,
  { collected: true, focusIds: ["standard", "heavy"], equipped: "heavy", hudName: "Heavy", hotbarStillSixSlots: 6 },
  "The Focus Chamber should equip Heavy without consuming a normal item slot.",
);

await evaluate("window.crystalLabyrinth.player.selectedSlot = 0");
await keyDown("Tab", "Tab");
await sleep(110);
const focusPickerState = await evaluate(`(() => ({
  visible: !document.getElementById("focusPicker").hidden,
  options: document.querySelectorAll("#focusPicker .focus-option").length,
}))()`);
assert.deepEqual(focusPickerState, { visible: true, options: 2 }, "Holding Tab should reveal the two attuned Laser Focus choices.");
const focusPickerScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./focus-picker-smoke.png", import.meta.url), Buffer.from(focusPickerScreenshot.data, "base64"));
await tap("Digit1", "1");
assert.deepEqual(
  await evaluate("({ focus: window.crystalLabyrinth.player.equippedFocusId, itemSlot: window.crystalLabyrinth.player.selectedSlot })"),
  { focus: "standard", itemSlot: 0 },
  "Tab + 1 should equip Standard without changing the item hotbar selection.",
);
await keyUp("Tab", "Tab");
await sleep(100);
await tap("Digit2", "2");
assert.deepEqual(
  await evaluate("({ focus: window.crystalLabyrinth.player.equippedFocusId, itemSlot: window.crystalLabyrinth.player.selectedSlot })"),
  { focus: "standard", itemSlot: 1 },
  "A number key without Tab should remain exclusive to the item hotbar.",
);
await keyDown("Tab", "Tab");
await tap("Digit2", "2");
await keyUp("Tab", "Tab");
await sleep(100);
assert.deepEqual(
  await evaluate("({ focus: window.crystalLabyrinth.player.equippedFocusId, itemSlot: window.crystalLabyrinth.player.selectedSlot })"),
  { focus: "heavy", itemSlot: 1 },
  "Tab + 2 should equip the later-discovered Heavy Focus without changing the item slot.",
);

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.shards = 3;
  game.player.fireCooldown = 0;
  game.projectiles = [];
  game.door.x = -1000;
  game.door.y = -1000;
})()`);
await keyDown("Space", " ");
await sleep(300);
const partialHeavyCharge = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    charging: game.player.focusCharging,
    ready: game.player.focusChargeReady,
    shards: game.player.shards,
    slotCharging: document.getElementById("laserFocusSlot").classList.contains("is-charging"),
  };
})()`);
assert.deepEqual(partialHeavyCharge, { charging: true, ready: false, shards: 3, slotCharging: true }, "Heavy Focus should visibly charge without spending its shard early.");
await keyUp("Space", " ");
await sleep(130);
assert.deepEqual(browserErrors, [], `Browser errors during Heavy Focus release: ${browserErrors.join(" | ")}`);
assert.deepEqual(
  await evaluate("({ state: window.crystalLabyrinth.state, charging: window.crystalLabyrinth.player.focusCharging, shards: window.crystalLabyrinth.player.shards, shots: window.crystalLabyrinth.projectiles.length, actionHeld: window.crystalLabyrinth.input.isHeld('action') })"),
  { state: "playing", charging: false, shards: 3, shots: 0, actionHeld: false },
  "Releasing Heavy Focus before it is ready should cancel without consuming ammunition.",
);

await keyDown("Space", " ");
await sleep(1250);
const readyHeavyCharge = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    charging: game.player.focusCharging,
    ready: game.player.focusChargeReady,
    shards: game.player.shards,
    chargeCss: document.getElementById("focusChargeFill").style.getPropertyValue("--charge"),
    readyPulse: document.getElementById("laserFocusSlot").classList.contains("is-ready"),
  };
})()`);
assert.deepEqual(
  readyHeavyCharge,
  { charging: true, ready: true, shards: 3, chargeCss: "100%", readyPulse: true },
  "A held Heavy Focus should reach a clear fully charged state before spending a shard.",
);
const focusChargeScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./focus-charge-smoke.png", import.meta.url), Buffer.from(focusChargeScreenshot.data, "base64"));
await keyUp("Space", " ");
await sleep(120);
assert.deepEqual(
  await evaluate("({ charging: window.crystalLabyrinth.player.focusCharging, shards: window.crystalLabyrinth.player.shards, coolingDown: window.crystalLabyrinth.player.fireCooldown > 0 })"),
  { charging: false, shards: 2, coolingDown: true },
  "Releasing a fully charged Heavy Focus should fire and spend exactly one shard.",
);

const heavyFocusShot = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.fireCooldown = 0;
  game.player.shards = 2;
  game.projectiles = [];
  const focus = game.getEquippedLaserFocus();
  const fired = game.fireLaser(focus, { charged: true });
  const shot = { ...game.projectiles[0] };
  const brute = { type: "brute", health: 2, dead: false, x: game.player.x, y: game.player.y };
  game.damageEnemy(brute, { ...shot });
  game.projectiles = [];
  return {
    fired,
    shardCost: shot.shardCost,
    damage: shot.damage,
    beamWidth: shot.beamWidth,
    range: shot.life * Math.hypot(shot.vx, shot.vy),
    bruteHealth: brute.health,
    bruteDead: brute.dead,
    shards: game.player.shards,
  };
})()`);
assert.equal(heavyFocusShot.fired, true);
assert.equal(heavyFocusShot.shardCost, 1, "Heavy Focus should never be balanced by a two-shard cost.");
assert.equal(heavyFocusShot.damage, 2);
assert.equal(heavyFocusShot.beamWidth, 8);
assert.ok(Math.abs(heavyFocusShot.range - 390) < 0.01, "Heavy Focus should retain good configured range.");
assert.deepEqual(
  { health: heavyFocusShot.bruteHealth, dead: heavyFocusShot.bruteDead, shards: heavyFocusShot.shards },
  { health: 0, dead: true, shards: 1 },
  "One Heavy shot should trade one shard for enough damage to kill a Brute.",
);

const collectedRespawn = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const crystal = game.pickups.find((pickup) => pickup.kind === "regular-crystal");
  game.player.shards = 0;
  crystal.x = game.player.x;
  crystal.y = game.player.y;
  crystal.tileX = Math.floor(game.player.x / 32);
  crystal.tileY = Math.floor(game.player.y / 32);
  crystal.collected = false;
  crystal.respawnAt = null;
  game.updatePickups();
  return { collected: crystal.collected, delay: crystal.respawnAt - game.time, shards: game.player.shards };
})()`);
assert.equal(collectedRespawn.collected, true, "Collecting a crystal should make its vein dormant.");
assert.equal(collectedRespawn.shards, 1, "A regular crystal should still grant one shard.");
assert.ok(collectedRespawn.delay >= 8.99 && collectedRespawn.delay <= 15.01, "Normal-mode crystals should receive their configured respawn delay.");

const emergencyRespawn = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.shards = 0;
  const crystals = game.pickups.filter((pickup) => game.isCrystalPickup(pickup));
  for (const crystal of crystals) {
    crystal.collected = true;
    crystal.respawnAt = Infinity;
  }
  game.updateCrystalRespawns();
  const scheduled = crystals.filter((crystal) => Number.isFinite(crystal.respawnAt));
  const wait = Math.min(...scheduled.map((crystal) => crystal.respawnAt - game.time));
  game.time += wait + 0.05;
  game.updateCrystalRespawns();
  const active = crystals.filter((crystal) => !crystal.collected);
  const first = active[0];
  return {
    scheduled: scheduled.length,
    wait,
    active: active.length,
    walkable: first ? game.isTileWalkable(first.tileX, first.tileY) : false,
    playerDistance: first ? Math.hypot(first.tileX - Math.floor(game.player.x / 32), first.tileY - Math.floor(game.player.y / 32)) : 0,
  };
})()`);
assert.equal(emergencyRespawn.scheduled, 1, "An exhausted cave should schedule one emergency vein.");
assert.ok(emergencyRespawn.wait <= 3.01, "The emergency crystal should return within three seconds.");
assert.ok(emergencyRespawn.active >= 1, "A crystal must reform after the emergency timer.");
assert.equal(emergencyRespawn.walkable, true, "A reformed crystal must occupy a walkable tile.");
assert.ok(emergencyRespawn.playerDistance >= 6, "A reformed crystal should not pop in directly beside the player.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.lives = 2;
  game.player.healProgress = 0;
  game.player.hotbar = ["half-heart", "half-heart", null, null, null, null];
  game.player.selectedSlot = 0;
  game.updateHud();
})()`);
const halfHeartIcon = await evaluate(`(() => {
  const icon = document.querySelector("#hotbarSlot1 .slot-icon");
  const style = getComputedStyle(icon);
  return {
    hasSpriteClass: icon.classList.contains("is-half-heart"),
    text: icon.textContent,
    backgroundImage: style.backgroundImage,
    aspectRatio: style.aspectRatio,
  };
})()`);
assert.equal(halfHeartIcon.hasSpriteClass, true, "A stored Half Heart should use its atlas sprite in the hotbar.");
assert.equal(halfHeartIcon.text, "", "The hotbar should not substitute a text heart glyph for the pickup artwork.");
assert.match(halfHeartIcon.backgroundImage, /gameplay-atlas-v3\.png/, "The hotbar should reuse the same gameplay atlas as the floor Half Heart.");
assert.equal(halfHeartIcon.aspectRatio, "156 / 148", "The hotbar sprite should preserve the floor Half Heart's proportions.");
await tap("KeyF", "f");
assert.equal(await evaluate("window.crystalLabyrinth.player.healProgress"), 1, "First Half Heart should store half a heal.");
const halfLifeHud = await evaluate(`(() => {
  const nextHeart = document.getElementById("heart3");
  const storedHeart = document.getElementById("storedHalfHeart");
  return {
    oldPanelPresent: Boolean(document.getElementById("healPanel")),
    nextHeartIsHalf: nextHeart.classList.contains("is-half"),
    nextHeartGlyph: nextHeart.textContent,
    storedHeartHidden: storedHeart.hidden,
    label: document.getElementById("livesDisplay").getAttribute("aria-label"),
  };
})()`);
assert.equal(halfLifeHud.oldPanelPresent, false, "The separate healing meter should be removed.");
assert.equal(halfLifeHud.nextHeartIsHalf, true, "One used Half Heart should fill half of the next life slot.");
assert.equal(halfLifeHud.nextHeartGlyph, "♥", "The half life should retain a filled-heart silhouette.");
assert.equal(halfLifeHud.storedHeartHidden, true, "The extra stored slot is only needed when all lives are full.");
assert.equal(halfLifeHud.label, "2 and a half lives", "The lives display should announce the partial life.");
await tap("Digit2", "2");
await tap("KeyF", "f");
const healed = await evaluate(`({ lives: window.crystalLabyrinth.player.lives, charge: window.crystalLabyrinth.player.healProgress, items: window.crystalLabyrinth.player.hotbar.slice(0, 2) })`);
assert.deepEqual(healed, { lives: 3, charge: 0, items: [null, null] });

const fullLifeStoredHalf = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.player.healProgress = 1;
  game.updateHud();
  const storedHeart = document.getElementById("storedHalfHeart");
  return {
    visible: !storedHeart.hidden,
    isHalf: storedHeart.classList.contains("is-half"),
    label: document.getElementById("livesDisplay").getAttribute("aria-label"),
  };
})()`);
assert.equal(fullLifeStoredHalf.visible, true, "A Half Heart stored at full lives should remain visible beside the life slots.");
assert.equal(fullLifeStoredHalf.isHalf, true, "The full-health overflow slot should use the same half-heart treatment.");
assert.equal(fullLifeStoredHalf.label, "3 lives, one Half Heart stored", "The full-health stored half should be announced clearly.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  const originalDoor = game.world.door;
  game.door.x = originalDoor.worldX;
  game.door.y = originalDoor.worldY;
  game.door.progress = 0;
  game.door.activating = false;
  game.door.chargeStep = 0;
  game.player.lives = 2;
  game.player.hotbar = ["half-heart", null, null, null, null, null];
  game.player.healProgress = 1;
  game.player.shards = 10;
  game.player.equippedFocusId = "heavy";
  game.player.x = game.door.x;
  game.player.y = game.door.y + 32;
  game.player.facing = "up";
  game.player.facingVector = { x: 0, y: -1 };
})()`);
await sleep(300);
const emptyDoorScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./door-empty-smoke.png", import.meta.url), Buffer.from(emptyDoorScreenshot.data, "base64"));
await tap("Space", " ");
assert.deepEqual(
  await evaluate("({ activating: window.crystalLabyrinth.door.activating, charging: window.crystalLabyrinth.player.focusCharging, shards: window.crystalLabyrinth.player.shards })"),
  { activating: true, charging: false, shards: 10 },
  "A faced door should take Space priority over Heavy Focus without spending a shard.",
);
await sleep(950);
const midDoorActivation = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return { state: game.state, chargeStep: game.door.chargeStep, progress: game.door.progress / game.door.activationSeconds };
})()`);
assert.equal(midDoorActivation.state, "playing", "The door should still be channeling halfway through its sequence.");
assert.ok(midDoorActivation.chargeStep >= 4 && midDoorActivation.chargeStep <= 6, "The original gate sockets should fill one at a time through the two-second channel.");
assert.ok(midDoorActivation.progress > 0.4 && midDoorActivation.progress < 0.7, "The sampled center glow should be partially charged.");
const doorScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./door-smoke.png", import.meta.url), Buffer.from(doorScreenshot.data, "base64"));
const cancelledDoor = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.cancelDoorActivation();
  return { activating: game.door.activating, progress: game.door.progress, chargeStep: game.door.chargeStep };
})()`);
assert.deepEqual(cancelledDoor, { activating: false, progress: 0, chargeStep: 0 }, "Interrupting the channel should empty every original frame socket.");
await tap("Space", " ");
assert.equal(await evaluate("window.crystalLabyrinth.door.activating"), true, "The emptied socket sequence should restart cleanly.");
await sleep(2250);
assert.equal(await evaluate("window.crystalLabyrinth.state"), "complete", "An uninterrupted two-second activation should complete Level 1.");
assert.equal(await evaluate("window.crystalLabyrinth.door.chargeStep"), 10, "Nine frame sockets plus the center crystal should complete all ten charge steps.");
assert.equal(await evaluate("window.crystalLabyrinth.save.unlockedLevel"), 2, "Completing Level 1 should unlock Level 2.");
const completionEffect = await evaluate(`(() => {
  const overlay = document.getElementById("levelCompleteOverlay");
  const crystal = overlay.querySelector(".victory-crystal");
  const gem = crystal.querySelector(".victory-gem").getBoundingClientRect();
  const auraElement = crystal.querySelector(".victory-aura");
  const aura = auraElement.getBoundingClientRect();
  return {
    visible: !overlay.hidden,
    centerDeltaX: Math.abs((gem.left + gem.width / 2) - (aura.left + aura.width / 2)),
    centerDeltaY: Math.abs((gem.top + gem.height / 2) - (aura.top + aura.height / 2)),
    animationName: getComputedStyle(auraElement).animationName,
    circular: getComputedStyle(auraElement).borderRadius === "50%",
    oldSpinningLayerPresent: Boolean(overlay.querySelector(".modal-rays")),
  };
})()`);
assert.equal(completionEffect.visible, true, "The completion overlay should appear after the gate awakens.");
assert.ok(completionEffect.centerDeltaX < 1 && completionEffect.centerDeltaY < 1, "The completion aura must stay centered on the crystal.");
assert.equal(completionEffect.animationName, "victory-aura-pulse", "The completion crystal should pulse instead of spin.");
assert.equal(completionEffect.circular, true, "The completion aura should be circular rather than square.");
assert.equal(completionEffect.oldSpinningLayerPresent, false, "The old rotating line-square should be removed.");
const completionScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./completion-smoke.png", import.meta.url), Buffer.from(completionScreenshot.data, "base64"));
await evaluate("document.getElementById('levelCompleteOverlay').hidden = true");
const fullDoorScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./door-full-smoke.png", import.meta.url), Buffer.from(fullDoorScreenshot.data, "base64"));

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.showMenu();
  game.startRun(game.selectedLevel);
})()`);
await sleep(650);
const carried = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    level: game.levelId,
    lives: game.player.lives,
    shards: game.player.shards,
    item: game.player.hotbar[0],
    heal: game.player.healProgress,
    focusIds: game.player.laserFocusIds,
    equippedFocus: game.player.equippedFocusId,
  };
})()`);
assert.deepEqual(
  carried,
  { level: 2, lives: 2, shards: 0, item: "half-heart", heal: 1, focusIds: ["standard", "heavy"], equippedFocus: "heavy" },
  "Lives, items, heal charge, and the equipped Focus should carry; shards should reset.",
);

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.fullDeath();
})()`);
await sleep(900);
const deathCrystalEffect = await evaluate(`(() => {
  const overlay = document.getElementById("deathOverlay");
  const intact = overlay.querySelector(".death-crystal-intact");
  const crystal = overlay.querySelector(".death-crystal");
  const left = overlay.querySelector(".death-crystal-piece-left");
  const right = overlay.querySelector(".death-crystal-piece-right");
  const images = [...overlay.querySelectorAll(".death-crystal-piece img")];
  const leftBox = left.getBoundingClientRect();
  const rightBox = right.getBoundingClientRect();
  const glowStyle = getComputedStyle(crystal, "::before");
  return {
    visible: !overlay.hidden,
    imagesReady: images.length === 2 && images.every((image) => image.complete && image.naturalWidth === 1254 && image.naturalHeight === 1254),
    assetMatched: images.every((image) => image.currentSrc.endsWith("/assets/death-crystal-cracked-v1.png")),
    intactOpacity: Number.parseFloat(getComputedStyle(intact).opacity),
    leftOpacity: Number.parseFloat(getComputedStyle(left).opacity),
    rightOpacity: Number.parseFloat(getComputedStyle(right).opacity),
    leftIsLower: leftBox.top > rightBox.top,
    leftIsLeftward: leftBox.left < rightBox.left,
    leftAnimation: getComputedStyle(left).animationName,
    rightAnimation: getComputedStyle(right).animationName,
    piecesHaveNoGlowFilter: getComputedStyle(left).filter === "none" && getComputedStyle(right).filter === "none",
    glowIsContinuous: glowStyle.backgroundImage.includes("radial-gradient") && glowStyle.clipPath === "none",
    glowAnimation: glowStyle.animationName,
  };
})()`);
assert.equal(deathCrystalEffect.visible, true, "Death should reveal the cracked-crystal overlay.");
assert.equal(deathCrystalEffect.imagesReady, true, "Both death-crystal halves should load from the new transparent sprite.");
assert.equal(deathCrystalEffect.assetMatched, true, "Both independently animated halves should reuse the cracked crystal asset.");
assert.equal(deathCrystalEffect.intactOpacity, 0, "The intact red crystal should disappear after the crack.");
assert.equal(deathCrystalEffect.leftOpacity, 1);
assert.equal(deathCrystalEffect.rightOpacity, 1);
assert.equal(deathCrystalEffect.leftIsLower, true, "The left cracked half should settle lower than the right half.");
assert.equal(deathCrystalEffect.leftIsLeftward, true, "The two cracked halves should separate horizontally.");
assert.equal(deathCrystalEffect.leftAnimation, "death-crystal-left-break");
assert.equal(deathCrystalEffect.rightAnimation, "death-crystal-right-break");
assert.equal(deathCrystalEffect.piecesHaveNoGlowFilter, true, "Clipped crystal halves should not clip their own background glow.");
assert.equal(deathCrystalEffect.glowIsContinuous, true, "One unclipped radial glow should sit behind both crystal halves.");
assert.equal(deathCrystalEffect.glowAnimation, "death-crystal-glow");
const deathScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./death-smoke.png", import.meta.url), Buffer.from(deathScreenshot.data, "base64"));
await evaluate(`(() => {
  document.documentElement.dataset.reducedMotion = "true";
  const overlay = document.getElementById("deathOverlay");
  overlay.hidden = true;
  void overlay.offsetWidth;
  overlay.hidden = false;
})()`);
await sleep(30);
const reducedDeathCrystal = await evaluate(`(() => {
  const overlay = document.getElementById("deathOverlay");
  const intact = overlay.querySelector(".death-crystal-intact");
  const left = overlay.querySelector(".death-crystal-piece-left");
  const right = overlay.querySelector(".death-crystal-piece-right");
  return {
    intactOpacity: Number.parseFloat(getComputedStyle(intact).opacity),
    leftOpacity: Number.parseFloat(getComputedStyle(left).opacity),
    rightOpacity: Number.parseFloat(getComputedStyle(right).opacity),
    leftIsLower: left.getBoundingClientRect().top > right.getBoundingClientRect().top,
  };
})()`);
assert.deepEqual(
  reducedDeathCrystal,
  { intactOpacity: 0, leftOpacity: 1, rightOpacity: 1, leftIsLower: true },
  "Reduced motion should skip directly to the correctly separated crystal halves.",
);
await evaluate("document.documentElement.dataset.reducedMotion = 'false'");
await evaluate("window.crystalLabyrinth.retryAfterDeath()");
await sleep(550);
const standardRetry = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    level: game.levelId,
    lives: game.player.lives,
    shards: game.player.shards,
    hotbarEmpty: game.player.hotbar.every((item) => item === null),
    focusIds: game.player.laserFocusIds,
    equippedFocus: game.player.equippedFocusId,
  };
})()`);
assert.deepEqual(
  standardRetry,
  { level: 2, lives: 3, shards: 0, hotbarEmpty: true, focusIds: ["standard"], equippedFocus: "standard" },
  "Standard death should restart the current level with a reset inventory and Standard Focus.",
);

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.selectedDifficulty = "nightmare";
  game.startRun(2);
  game.player.hotbar[0] = "half-heart";
  game.player.laserFocusIds = ["standard", "heavy"];
  game.player.equippedFocusId = "heavy";
  game.completeLevel();
  game._savedUnlockBeforeNightmareDeath = game.save.unlockedLevel;
  game.fullDeath();
  game.showMenu();
  game.selectLevel(3);
  game.startRun(game.selectedLevel);
})()`);
await sleep(650);
const nightmareRetry = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return {
    level: game.levelId,
    selected: game.selectedLevel,
    savedUnlock: game._savedUnlockBeforeNightmareDeath,
    difficulty: game.difficultyId,
    lives: game.player.lives,
    hotbarEmpty: game.player.hotbar.every((item) => item === null),
    focusIds: game.player.laserFocusIds,
    equippedFocus: game.player.equippedFocusId,
  };
})()`);
assert.deepEqual(
  nightmareRetry,
  { level: 1, selected: 1, savedUnlock: 2, difficulty: "nightmare", lives: 3, hotbarEmpty: true, focusIds: ["standard"], equippedFocus: "standard" },
  "Nightmare death should discard intermediate checkpoints, special Focuses, and force Level 1 through the menu.",
);

assert.deepEqual(browserErrors, [], `Browser errors: ${browserErrors.join(" | ")}`);
console.log("Browser smoke test passed: boot, ten-shard door beacon, Laser Focus HUD and controls, Standard and Heavy combat, charging feedback, Focus Chamber discovery, door priority, directional movement, enemy coordination, crystal respawn, Half Hearts, completion, death, carryover, and reset rules.");

await command("Browser.close").catch(() => {});
socket.close();
