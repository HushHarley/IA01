(() => {
  const list = document.querySelector('#book-list');
  const books = window.HARRY_HUB_DATA?.books ?? [];
  const i18n = window.HarryHubI18n;
  if (!list) return;

  const render = () => {
    const isEnglish = i18n?.language === 'en';
    const cards = books.map((book, index) => {
      const title = isEnglish ? book.originalTitle : book.title;
      const description = isEnglish ? book.descriptionEn : book.description;
      const releaseDate = isEnglish ? book.releaseDateEn : book.releaseDate;
      const alternateTitle = isEnglish ? book.title : book.originalTitle;
      const article = document.createElement('article');
      article.className = 'book-card';
      article.innerHTML = `
        <span class="book-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <div class="book-cover-wrap">
          <img class="book-cover" src="assets/images/books/${book.cover}" alt="${i18n?.t('book.cover', { title }) ?? title}" ${index < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}>
        </div>
        <div class="book-info">
          <p class="book-kicker">${i18n?.t('book.volume', { number: index + 1 }) ?? `Tome ${index + 1}`}</p>
          <h2>${title}</h2>
          <p class="book-description">${description}</p>
          <div class="book-details"><span>${i18n?.t('book.release', { date: releaseDate })}</span><span>${i18n?.t('book.pages', { pages: book.pages })}</span><span lang="${isEnglish ? 'fr' : 'en'}">${alternateTitle}</span></div>
        </div>`;
      return article;
    });

    list.replaceChildren(...cards);
  };

  render();
  window.addEventListener('languagechange', render);
})();
