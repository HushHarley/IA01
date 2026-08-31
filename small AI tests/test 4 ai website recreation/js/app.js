(() => {
  const translate = (key, variables) => window.HarryHubI18n?.t(key, variables) ?? key;
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.sr-only').textContent = translate('menu.open');
    navigation.classList.remove('is-open');
  };

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.querySelector('.sr-only').textContent = isOpen ? translate('menu.open') : translate('menu.close');
      navigation.classList.toggle('is-open', !isOpen);
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) closeMenu();
    });
  }

  const audioButton = document.querySelector('.audio-toggle');
  const audioSource = document.body.dataset.audio;
  let languageSwitch;

  if (audioButton) {
    const headerActions = document.createElement('div');
    languageSwitch = document.createElement('div');
    headerActions.className = 'header-actions';
    languageSwitch.className = 'language-switch';
    languageSwitch.setAttribute('role', 'group');
    languageSwitch.innerHTML = `
      <button type="button" data-language="fr">FR</button>
      <span aria-hidden="true">/</span>
      <button type="button" data-language="en">EN</button>
    `;
    audioButton.before(headerActions);
    headerActions.append(languageSwitch, audioButton);

    const syncLanguageSwitch = () => {
      const language = window.HarryHubI18n?.language ?? 'fr';
      languageSwitch.setAttribute('aria-label', translate('language.selector'));
      languageSwitch.querySelectorAll('[data-language]').forEach((button) => {
        const isActive = button.dataset.language === language;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    };

    languageSwitch.addEventListener('click', (event) => {
      const button = event.target.closest('[data-language]');
      if (button) window.HarryHubI18n?.setLanguage(button.dataset.language);
    });
    window.addEventListener('languagechange', syncLanguageSwitch);
    syncLanguageSwitch();
  }

  if (audioButton && audioSource) {
    const audio = new Audio(audioSource);
    const label = audioButton.querySelector('.audio-label');
    const preferenceKey = 'harryhub-audio-enabled';
    const volumeKey = 'harryhub-audio-volume';
    const audioControl = document.createElement('div');
    const volumePanel = document.createElement('div');
    const volumeId = `volume-${document.body.dataset.page || 'page'}`;

    audioControl.className = 'audio-control';
    volumePanel.className = 'volume-popover';
    volumePanel.innerHTML = `
      <div class="volume-heading">
        <label for="${volumeId}">Volume</label>
        <output for="${volumeId}">38%</output>
      </div>
      <input class="volume-slider" id="${volumeId}" type="range" min="0" max="100" step="1" value="38" aria-label="${translate('audio.volume')}">
    `;
    audioButton.before(audioControl);
    audioControl.append(audioButton, volumePanel);

    const volumeSlider = volumePanel.querySelector('.volume-slider');
    const volumeOutput = volumePanel.querySelector('output');
    const saveAudioPreference = (value) => {
      try { sessionStorage.setItem(preferenceKey, String(value)); } catch { /* Storage can be unavailable on file URLs. */ }
    };
    const getAudioPreference = () => {
      try { return sessionStorage.getItem(preferenceKey); } catch { return null; }
    };
    const saveVolume = (value) => {
      try { localStorage.setItem(volumeKey, String(value)); } catch { /* Storage can be unavailable on file URLs. */ }
    };
    const getSavedVolume = () => {
      try {
        const value = localStorage.getItem(volumeKey);
        return value === null ? NaN : Number(value);
      } catch { return NaN; }
    };
    const savedVolume = getSavedVolume();
    const initialVolume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : 0.38;
    audio.loop = true;
    audio.preload = 'metadata';
    audio.volume = initialVolume;
    volumeSlider.value = String(Math.round(initialVolume * 100));
    volumeOutput.value = `${volumeSlider.value}%`;
    volumeOutput.textContent = volumeOutput.value;

    const updateAudioButton = () => {
      const audible = !audio.paused && !audio.muted;
      audioButton.classList.toggle('is-playing', audible);
      audioButton.classList.toggle('is-muted', audio.muted);
      audioButton.setAttribute('aria-pressed', String(audible));
      audioButton.setAttribute('aria-label', audible ? translate('audio.mute') : translate('audio.play'));
      if (label) {
        if (audio.paused) label.textContent = translate('audio.listen');
        else label.textContent = audio.muted ? translate('audio.resume') : translate('audio.stop');
      }
    };

    const startAudio = async () => {
      try {
        audio.muted = false;
        await audio.play();
        saveAudioPreference(true);
        updateAudioButton();
        return true;
      } catch {
        updateAudioButton();
        return false;
      }
    };

    audioButton.addEventListener('click', async () => {
      if (audio.paused) {
        const started = await startAudio();
        if (!started) {
          audioButton.setAttribute('aria-label', translate('audio.unavailable'));
          if (label) label.textContent = translate('audio.retry');
        }
      } else {
        if (audio.muted && audio.volume === 0) {
          audio.volume = 0.38;
          volumeSlider.value = '38';
          volumeOutput.value = '38%';
          volumeOutput.textContent = '38%';
          saveVolume(0.38);
        }
        audio.muted = !audio.muted;
        saveAudioPreference(!audio.muted);
        updateAudioButton();
      }
    });

    volumeSlider.addEventListener('input', () => {
      const nextVolume = Number(volumeSlider.value) / 100;
      audio.volume = nextVolume;
      audio.muted = nextVolume === 0;
      volumeOutput.value = `${volumeSlider.value}%`;
      volumeOutput.textContent = volumeOutput.value;
      saveVolume(nextVolume);
      saveAudioPreference(!audio.paused && !audio.muted);
      updateAudioButton();
    });

    const startOnFirstInteraction = (event) => {
      if (event.target.closest('.audio-toggle, a, button, input, label')) return;
      startAudio();
    };

    document.addEventListener('pointerdown', startOnFirstInteraction, { once: true, capture: true });
    document.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.audio-toggle, a, button, input, label')) startAudio();
    }, { once: true });

    if (getAudioPreference() === 'true') startAudio();

    window.addEventListener('languagechange', () => {
      volumeSlider.setAttribute('aria-label', translate('audio.volume'));
      updateAudioButton();
      const isOpen = menuButton?.getAttribute('aria-expanded') === 'true';
      if (menuButton) menuButton.querySelector('.sr-only').textContent = isOpen ? translate('menu.close') : translate('menu.open');
    });

    window.addEventListener('pagehide', () => audio.pause());
    updateAudioButton();
  }
})();
