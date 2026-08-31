import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = 'http://127.0.0.1:4175';
const targets = await fetch('http://127.0.0.1:9223/json/list').then((response) => response.json());
const pageTarget = targets.find((target) => target.type === 'page');
if (!pageTarget) throw new Error('No Chrome page target found.');

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();
const browserErrors = [];
const requestFailures = [];

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const resolver = pending.get(message.id);
    if (!resolver) return;
    pending.delete(message.id);
    if (message.error) resolver.reject(new Error(message.error.message));
    else resolver.resolve(message.result);
    return;
  }

  const waiters = eventWaiters.get(message.method) ?? [];
  eventWaiters.delete(message.method);
  waiters.forEach((resolve) => resolve(message.params));

  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    browserErrors.push(message.params.entry.text);
  }
  if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
    requestFailures.push(`${message.params.errorText}: ${message.params.type}`);
  }
  if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
    requestFailures.push(`${message.params.response.status}: ${message.params.response.url}`);
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const waitForEvent = (method, timeout = 8000) => new Promise((resolve, reject) => {
  const timeoutId = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
  const wrappedResolve = (value) => {
    clearTimeout(timeoutId);
    resolve(value);
  };
  const waiters = eventWaiters.get(method) ?? [];
  waiters.push(wrappedResolve);
  eventWaiters.set(method, waiters);
});

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression, userGesture = false) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

const navigate = async (path) => {
  const loaded = waitForEvent('Page.loadEventFired');
  await send('Page.navigate', { url: `${baseUrl}/${path}` });
  await loaded;
  await delay(250);
};

const capture = async (name) => {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await mkdir(new URL('./screenshots/', import.meta.url), { recursive: true });
  await writeFile(new URL(`./screenshots/${name}.png`, import.meta.url), Buffer.from(result.data, 'base64'));
};

await Promise.all([
  send('Page.enable'), send('Runtime.enable'), send('Network.enable'), send('Log.enable')
]);
await delay(100);
browserErrors.length = 0;
requestFailures.length = 0;
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const results = {};

await navigate('index.html');
await evaluate(`document.querySelector('[data-language="fr"]').click()`);
results.home = await evaluate(`({
  title: document.title,
  heading: document.querySelector('h1')?.textContent.trim(),
  internalLinks: [...document.querySelectorAll('a[href]')].every((link) => !/^https?:/.test(link.getAttribute('href'))),
  noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
})`);
results.languageHome = await evaluate(`(() => {
  document.querySelector('[data-language="en"]').click();
  return {
    language: document.documentElement.lang,
    title: document.title,
    navigation: document.querySelector('.site-nav a')?.textContent,
    heading: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    enActive: document.querySelector('[data-language="en"]').getAttribute('aria-pressed')
  };
})()`);
results.audioFiles = await evaluate(`(async () => {
  const context = new AudioContext();
  const sources = ['home.mp3', 'characters.mp3', 'books.mp3', 'upcoming.mp3'];
  const measurements = {};
  for (const source of sources) {
    const response = await fetch('assets/audio/' + source);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    let peak = 0;
    let energy = 0;
    let samples = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      const step = Math.max(1, Math.floor(data.length / 50000));
      for (let index = 0; index < data.length; index += step) {
        const value = Math.abs(data[index]);
        peak = Math.max(peak, value);
        energy += value * value;
        samples += 1;
      }
    }
    measurements[source] = {
      decoded: true,
      duration: Number(buffer.duration.toFixed(1)),
      peak: Number(peak.toFixed(4)),
      rms: Number(Math.sqrt(energy / samples).toFixed(4))
    };
  }
  await context.close();
  return measurements;
})()`);
results.audio = await evaluate(`(async () => {
  const button = document.querySelector('.audio-toggle');
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const started = button.classList.contains('is-playing');
  const slider = document.querySelector('.volume-slider');
  slider.value = '67';
  slider.dispatchEvent(new Event('input', { bubbles: true }));
  button.focus();
  await new Promise((resolve) => setTimeout(resolve, 220));
  const volume = {
    value: slider.value,
    output: document.querySelector('.volume-popover output').textContent,
    popoverExists: Boolean(document.querySelector('.volume-popover')),
    triggerFocused: document.activeElement === button,
    visibleWhileFocused: getComputedStyle(document.querySelector('.volume-popover')).opacity === '1'
  };
  button.click();
  return { started, muted: button.classList.contains('is-muted'), volume };
})()`, true);
await capture('desktop-home');
await evaluate(`window.scrollTo(0, window.innerHeight * 0.72)`);
await delay(180);
await capture('desktop-home-transition');
await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
await delay(180);
await capture('desktop-home-footer');

await navigate('harryCharacters.html');
results.charactersInitial = await evaluate(`({ cards: document.querySelectorAll('.character-card').length, count: document.querySelector('#character-count')?.textContent, language: document.documentElement.lang, actorLabel: document.querySelector('.character-meta dt')?.textContent, house: document.querySelector('.house-badge')?.textContent })`);
results.charactersSlytherin = await evaluate(`(() => { document.querySelector('[data-house="Slytherin"]').click(); return document.querySelectorAll('.character-card').length; })()`);
results.charactersSearch = await evaluate(`(() => { document.querySelector('[data-house="all"]').click(); const search = document.querySelector('#character-search'); search.value = 'Hermione'; search.dispatchEvent(new Event('input', { bubbles: true })); return document.querySelectorAll('.character-card').length; })()`);
await capture('desktop-characters');
await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
await delay(180);
await capture('desktop-characters-footer');

await navigate('harryBooks.html');
results.books = await evaluate(`({ cards: document.querySelectorAll('.book-card').length, first: document.querySelector('.book-card h2')?.textContent, description: document.querySelector('.book-description')?.textContent.slice(0, 38), volume: document.querySelector('.book-kicker')?.textContent })`);
await capture('desktop-books');

await navigate('harryUpcoming.html');
results.emptyForm = await evaluate(`(() => { document.querySelector('#signup-form').requestSubmit(); return { errors: [...document.querySelectorAll('.field-error')].filter((node) => node.textContent.trim()).length, invalid: document.querySelectorAll('[aria-invalid="true"]').length, nameError: document.querySelector('#name-error').textContent }; })()`);
results.validForm = await evaluate(`(() => { const form = document.querySelector('#signup-form'); form.elements.name.value = 'Luna Lovegood'; form.elements.email.value = 'luna@example.ca'; form.elements.phone.value = '514 555-0123'; form.elements.password.value = 'lumos1234'; form.querySelector('input[name="interests"]').checked = true; form.requestSubmit(); return { visible: document.querySelector('#form-status').classList.contains('is-visible'), message: document.querySelector('#form-status').textContent }; })()`);
results.languageFrenchRestore = await evaluate(`(() => { document.querySelector('[data-language="fr"]').click(); return { language: document.documentElement.lang, title: document.title, nameLabel: document.querySelector('label[for="name"]').childNodes[0].nodeValue.trim(), status: document.querySelector('#form-status').textContent }; })()`);
await capture('desktop-upcoming');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
for (const [key, path] of Object.entries({ home: 'index.html', characters: 'harryCharacters.html', books: 'harryBooks.html', upcoming: 'harryUpcoming.html' })) {
  await navigate(path);
  results[`mobile_${key}`] = await evaluate(`({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    menuInitiallyClosed: !document.querySelector('.site-nav').classList.contains('is-open')
  })`);
  if (key === 'home') {
    results.mobileMenu = await evaluate(`(() => {
      const button = document.querySelector('.menu-toggle');
      button.click();
      const opened = button.getAttribute('aria-expanded') === 'true' && document.querySelector('.site-nav').classList.contains('is-open');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { opened, closedWithEscape: button.getAttribute('aria-expanded') === 'false' };
    })()`);
  }
  if (key === 'home' || key === 'characters') await capture(`mobile-${key}`);
}

results.browserErrors = [...new Set(browserErrors)];
results.requestFailures = [...new Set(requestFailures)];
console.log(JSON.stringify(results, null, 2));
await send('Browser.close');
