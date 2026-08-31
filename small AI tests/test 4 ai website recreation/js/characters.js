(() => {
  const grid = document.querySelector('#character-grid');
  const search = document.querySelector('#character-search');
  const filters = [...document.querySelectorAll('.filter-button')];
  const count = document.querySelector('#character-count');
  const emptyState = document.querySelector('#character-empty');
  const characters = window.HARRY_HUB_DATA?.characters ?? [];
  const i18n = window.HarryHubI18n;

  if (!grid) return;

  const houseDetails = {
    Gryffindor: { fr: 'Gryffondor', en: 'Gryffindor', color: '#b6473a' },
    Slytherin: { fr: 'Serpentard', en: 'Slytherin', color: '#4b9463' },
    Ravenclaw: { fr: 'Serdaigle', en: 'Ravenclaw', color: '#4b77b8' },
    Hufflepuff: { fr: 'Poufsouffle', en: 'Hufflepuff', color: '#d2ad45' }
  };

  const englishMonths = {
    janvier: 'January', février: 'February', mars: 'March', avril: 'April', mai: 'May', juin: 'June',
    juillet: 'July', août: 'August', septembre: 'September', octobre: 'October', novembre: 'November', décembre: 'December'
  };

  const englishBirthdate = (birthdate) => {
    const [day, month, year] = birthdate.split(' ');
    return `${englishMonths[month] ?? month} ${day.replace('er', '')}, ${year}`;
  };

  const localizedNickname = (nickname) => {
    if (i18n?.language !== 'en') return nickname;
    return ({ Drago: 'Draco', Rogue: 'Snape' })[nickname] ?? nickname;
  };

  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');

  let selectedHouse = 'all';

  const createCard = (character, index) => {
    const language = i18n?.language ?? 'fr';
    const house = houseDetails[character.house] ?? { fr: character.house, en: character.house, color: '#d7ae55' };
    const nickname = localizedNickname(character.nickname);
    const actor = language === 'en' && character.actor === 'Non représenté' ? 'Not portrayed' : character.actor;
    const birthdate = language === 'en' ? englishBirthdate(character.birthdate) : character.birthdate;
    const article = document.createElement('article');
    article.className = 'character-card';
    article.style.setProperty('--house-color', house.color);

    article.innerHTML = `
      <div class="character-image">
        <span class="house-badge">${house[language]}</span>
        <img src="assets/images/characters/${character.image}" alt="${i18n?.t('character.portrait', { name: character.fullName }) ?? character.fullName}" ${index < 4 ? 'fetchpriority="high"' : 'loading="lazy"'}>
      </div>
      <div class="character-info">
        <h3>${nickname}</h3>
        <p class="full-name">${character.fullName}</p>
        <dl class="character-meta">
          <dt>${i18n?.t('character.actor') ?? 'Interprète'}</dt><dd>${actor}</dd>
          <dt>${i18n?.t('character.birth') ?? 'Naissance'}</dt><dd>${birthdate}</dd>
        </dl>
      </div>`;
    return article;
  };

  const render = () => {
    const query = normalize(search?.value.trim() ?? '');
    const visibleCharacters = characters.filter((character) => {
      const matchesHouse = selectedHouse === 'all' || character.house === selectedHouse;
      const searchableText = normalize(`${character.nickname} ${localizedNickname(character.nickname)} ${character.fullName} ${character.actor}`);
      return matchesHouse && searchableText.includes(query);
    });

    grid.replaceChildren(...visibleCharacters.map(createCard));
    count.textContent = String(visibleCharacters.length);
    emptyState.hidden = visibleCharacters.length !== 0;
  };

  search?.addEventListener('input', render);
  filters.forEach((button) => {
    button.addEventListener('click', () => {
      selectedHouse = button.dataset.house;
      filters.forEach((filter) => {
        const isSelected = filter === button;
        filter.classList.toggle('is-active', isSelected);
        filter.setAttribute('aria-pressed', String(isSelected));
      });
      render();
    });
  });

  render();
  window.addEventListener('languagechange', render);
})();
