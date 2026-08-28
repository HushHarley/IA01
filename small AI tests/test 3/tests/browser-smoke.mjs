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
    browserErrors.push(message.params.exceptionDetails.text);
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
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keydown", { code: ${JSON.stringify(code)}, key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
  await sleep(70);
  await evaluate(`window.dispatchEvent(new KeyboardEvent("keyup", { code: ${JSON.stringify(code)}, key: ${JSON.stringify(key)}, bubbles: true, cancelable: true }))`);
  await sleep(90);
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
  const hotbar = document.getElementById("hotbar").getBoundingClientRect();
  const pause = document.getElementById("pauseButton").getBoundingClientRect();
  const overlap = !(hotbar.right <= pause.left || pause.right <= hotbar.left || hotbar.bottom <= pause.top || pause.bottom <= hotbar.top);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    viewportLeft: viewport.left,
    viewportRight: viewport.right,
    overlap,
    messageDisplay: getComputedStyle(document.getElementById("gameMessage")).display,
  };
})()`);
assert.ok(mobileLayout.scrollWidth <= mobileLayout.innerWidth, "The 390px game view must not overflow horizontally.");
assert.ok(mobileLayout.viewportLeft >= 0 && mobileLayout.viewportRight <= 390, "The mobile canvas frame must fit onscreen.");
assert.equal(mobileLayout.overlap, false, "The mobile pause control must not overlap the hotbar.");
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
await tap("Digit2", "2");
await tap("KeyF", "f");
const healed = await evaluate(`({ lives: window.crystalLabyrinth.player.lives, charge: window.crystalLabyrinth.player.healProgress, items: window.crystalLabyrinth.player.hotbar.slice(0, 2) })`);
assert.deepEqual(healed, { lives: 3, charge: 0, items: [null, null] });

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
  game.player.x = game.door.x;
  game.player.y = game.door.y + 32;
  game.player.facing = "up";
  game.player.facingVector = { x: 0, y: -1 };
})()`);
await sleep(300);
const emptyDoorScreenshot = await command("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(new URL("./door-empty-smoke.png", import.meta.url), Buffer.from(emptyDoorScreenshot.data, "base64"));
await tap("Space", " ");
assert.equal(await evaluate("window.crystalLabyrinth.door.activating"), true, "Facing the full-charged door should start activation.");
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
  return { level: game.levelId, lives: game.player.lives, shards: game.player.shards, item: game.player.hotbar[0], heal: game.player.healProgress };
})()`);
assert.deepEqual(carried, { level: 2, lives: 2, shards: 0, item: "half-heart", heal: 1 }, "Lives, items, and heal charge should carry; shards should reset.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.fullDeath();
  game.retryAfterDeath();
})()`);
await sleep(550);
const standardRetry = await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  return { level: game.levelId, lives: game.player.lives, shards: game.player.shards, hotbarEmpty: game.player.hotbar.every((item) => item === null) };
})()`);
assert.deepEqual(standardRetry, { level: 2, lives: 3, shards: 0, hotbarEmpty: true }, "Standard death should restart the current level with a reset inventory.");

await evaluate(`(() => {
  const game = window.crystalLabyrinth;
  game.selectedDifficulty = "nightmare";
  game.startRun(2);
  game.player.hotbar[0] = "half-heart";
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
  return { level: game.levelId, selected: game.selectedLevel, savedUnlock: game._savedUnlockBeforeNightmareDeath, difficulty: game.difficultyId, lives: game.player.lives, hotbarEmpty: game.player.hotbar.every((item) => item === null) };
})()`);
assert.deepEqual(nightmareRetry, { level: 1, selected: 1, savedUnlock: 2, difficulty: "nightmare", lives: 3, hotbarEmpty: true }, "Nightmare death should discard intermediate checkpoints and force Level 1 through the menu.");

assert.deepEqual(browserErrors, [], `Browser errors: ${browserErrors.join(" | ")}`);
console.log("Browser smoke test passed: boot, directional walk animation, atlas-aligned enemy eyes, mined pickups, movement, firing, crystal respawn, Half Hearts, animated door sockets, crystal-centered completion aura, carryover, standard retry, and Nightmare reset.");

await command("Browser.close").catch(() => {});
socket.close();
