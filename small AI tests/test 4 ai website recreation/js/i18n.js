(() => {
  const storageKey = 'harryhub-language';
  const textNodeOriginals = new WeakMap();
  const attributeOriginals = new WeakMap();

  const english = {
    'Aller au contenu': 'Skip to content',
    'Accueil': 'Home',
    'Personnages': 'Characters',
    'Livres': 'Books',
    'À venir': 'Coming soon',
    'Projet hommage non officiel, conçu à des fins éducatives.': 'Unofficial fan project created for educational purposes.',
    'Découvrez le monde des sorciers': 'Discover the wizarding world',
    'Le monde de': 'The world of',
    'Une histoire d’amitié, de choix et de courage, cachée juste au-delà du quai neuf trois quarts.': 'A story of friendship, choices and courage, hidden just beyond Platform Nine and Three-Quarters.',
    'Rencontrer les personnages': 'Meet the characters',
    'Défiler': 'Scroll',
    'Bienvenue à HarryHub': 'Welcome to HarryHub',
    'Entrez dans le monde magique': 'Enter the wizarding world',
    'Retrouvez les repères essentiels de la saga, ses figures marquantes et les huit ouvrages qui composent l’aventure publiée.': 'Explore the saga’s essential landmarks, its most memorable figures and the eight published works that make up the adventure.',
    'Le garçon qui a survécu': 'The boy who lived',
    'Qui est Harry Potter ?': 'Who is Harry Potter?',
    'Harry Potter est un garçon orphelin qui découvre, le jour de ses onze ans, qu’il est un sorcier. Élevé par sa tante et son oncle dans le monde ordinaire des Moldus, il ignore tout de son héritage magique jusqu’à son invitation à l’école de sorcellerie Poudlard.': 'Harry Potter is an orphan who discovers on his eleventh birthday that he is a wizard. Raised by his aunt and uncle in the ordinary Muggle world, he knows nothing about his magical heritage until he is invited to attend Hogwarts School of Witchcraft and Wizardry.',
    'Dans le monde des sorciers, il est déjà célèbre pour avoir survécu, alors qu’il était bébé, à une attaque de Lord Voldemort. L’événement lui a laissé une cicatrice en forme d’éclair et une étrange connexion avec son ennemi.': 'In the wizarding world, he is already famous for surviving an attack by Lord Voldemort as a baby. The event left him with a lightning-shaped scar and a strange connection to his enemy.',
    'Un monde caché': 'A hidden world',
    'Où se déroule l’histoire ?': 'Where does the story take place?',
    'La série se déroule surtout dans une version secrète et magique de la Grande-Bretagne, parallèle au monde quotidien. Une grande partie de l’histoire prend place à Poudlard, un château-école rejoint depuis le quai neuf trois quarts de la gare de King’s Cross.': 'The series mainly unfolds in a secret, magical version of Great Britain that exists alongside the everyday world. Much of the story takes place at Hogwarts, a castle school reached from Platform Nine and Three-Quarters at King’s Cross station.',
    'L’aventure s’étend aussi au Chemin de Traverse, au ministère de la Magie et à de nombreux lieux où la communauté sorcière tente de résister au retour de Voldemort.': 'The adventure also reaches Diagon Alley, the Ministry of Magic and many places where the wizarding community tries to resist Voldemort’s return.',
    'Sept années à Poudlard': 'Seven years at Hogwarts',
    'Une aventure qui grandit avec ses héros': 'An adventure that grows with its heroes',
    'Au fil des sept romans, Harry passe d’un élève de première année complètement perdu au personnage central de la lutte contre Voldemort. Avec Ron Weasley et Hermione Granger, il découvre des secrets liés à son passé et comprend peu à peu pourquoi le mage noir l’a pris pour cible.': 'Across seven novels, Harry grows from a completely lost first-year student into the central figure in the fight against Voldemort. With Ron Weasley and Hermione Granger, he uncovers secrets from his past and gradually learns why the dark wizard targeted him.',
    'La série mène à une guerre qui met à l’épreuve le courage, la loyauté et l’identité de chacun — tout en gardant l’amitié au cœur de l’histoire.': 'The series builds toward a war that tests everyone’s courage, loyalty and identity—while keeping friendship at the heart of the story.',
    'Parcourir tous les livres': 'Browse all books',
    'Poursuivez l’exploration': 'Keep exploring',
    'Chaque nom cache une histoire': 'Every name holds a story',
    'Voir les 25 personnages': 'View all 25 characters',
    'Rencontrez les sorcières et les sorciers': 'Meet the witches and wizards',
    'Les alliés, professeurs, familles et adversaires qui donnent vie au monde des sorciers.': 'The allies, professors, families and adversaries who bring the wizarding world to life.',
    'Portraits de sorciers': 'Wizard portraits',
    'Les figures de la saga': 'The faces of the saga',
    'personnages': 'characters',
    'Tous': 'All',
    'Gryffondor': 'Gryffindor',
    'Serpentard': 'Slytherin',
    'Serdaigle': 'Ravenclaw',
    'Poufsouffle': 'Hufflepuff',
    'Aucun personnage ne correspond à cette recherche.': 'No characters match this search.',
    'Sept romans ont accompagné des millions de lecteurs à Poudlard, puis une pièce a prolongé l’histoire d’une nouvelle génération.': 'Seven novels took millions of readers to Hogwarts, followed by a play that continued the story with a new generation.',
    'La collection': 'The collection',
    'Une aventure en huit volumes': 'An adventure in eight volumes',
    'Le premier livre,': 'The first book,',
    'Harry Potter à l’école des sorciers': "Harry Potter and the Philosopher’s Stone",
    ', paraît chez Bloomsbury en 1997 et rencontre un succès immédiat. La série est aujourd’hui traduite dans plus de 80 langues et compte parmi les sagas littéraires les plus lues au monde.': ', was published by Bloomsbury in 1997 and became an immediate success. The series is now translated into more than 80 languages and ranks among the most widely read literary sagas in the world.',
    'Le Courrier des hiboux': 'The Owl Post',
    'Restez au courant': 'Stay in the know',
    'Créez votre profil HarryHub et choisissez les nouvelles du monde des sorciers que vous souhaitez recevoir.': 'Create your HarryHub profile and choose which wizarding-world news you would like to receive.',
    'Votre invitation': 'Your invitation',
    'Rejoignez le cercle': 'Join the circle',
    'Films, romans et découvertes du monde magique : sélectionnez vos sujets préférés. Ce formulaire de démonstration fonctionne entièrement dans votre navigateur et n’envoie aucune donnée.': 'Films, books and discoveries from the wizarding world: select your favourite topics. This demonstration form runs entirely in your browser and sends no data.',
    'Préférences personnalisées': 'Personalized preferences',
    'Validation claire et instantanée': 'Clear, instant validation',
    'Aucune donnée transmise': 'No data transmitted',
    'Formulaire d’inscription': 'Registration form',
    'Vos coordonnées': 'Your details',
    'Nom complet': 'Full name',
    'Courriel': 'Email',
    'Cellulaire': 'Mobile phone',
    'Facultatif': 'Optional',
    'Mot de passe': 'Password',
    'Utilisez au moins 8 caractères.': 'Use at least 8 characters.',
    'Afficher': 'Show',
    'Les nouvelles qui vous intéressent': 'News you are interested in',
    'Films et séries': 'Films and series',
    'Annonces, bandes-annonces et coulisses': 'Announcements, trailers and behind the scenes',
    'Livres et histoires': 'Books and stories',
    'Nouvelles éditions et monde littéraire': 'New editions and the literary world',
    'Créer mon profil': 'Create my profile',
    'Effacer': 'Clear',
    'Rechercher un personnage…': 'Search for a character…',
    'Ex. Luna Lovegood': 'E.g. Luna Lovegood',
    'hibou@exemple.ca': 'owl@example.ca',
    '8 caractères minimum': '8 characters minimum',
    'Navigation principale': 'Main navigation',
    'Navigation de pied de page': 'Footer navigation',
    'HarryHub — Accueil': 'HarryHub — Home',
    'Filtrer les personnages': 'Filter characters',
    'Filtrer par maison': 'Filter by house',
    'Liste des livres': 'Book list',
    'Harry Potter dans les couloirs de Poudlard': 'Harry Potter in the corridors of Hogwarts',
    'Le château de Poudlard au bord du lac': 'Hogwarts castle beside the lake',
    'Des élèves face au château de Poudlard': 'Students facing Hogwarts castle'
  };

  const messages = {
    'language.selector': { fr: 'Sélection de la langue', en: 'Language selector' },
    'menu.open': { fr: 'Ouvrir le menu', en: 'Open menu' },
    'menu.close': { fr: 'Fermer le menu', en: 'Close menu' },
    'audio.play': { fr: 'Activer l’ambiance musicale', en: 'Play ambient music' },
    'audio.mute': { fr: 'Couper l’ambiance musicale', en: 'Mute ambient music' },
    'audio.unavailable': { fr: 'La lecture audio est indisponible', en: 'Audio playback is unavailable' },
    'audio.listen': { fr: 'Écouter', en: 'Listen' },
    'audio.resume': { fr: 'Reprendre', en: 'Resume' },
    'audio.stop': { fr: 'Couper', en: 'Mute' },
    'audio.retry': { fr: 'Réessayer', en: 'Retry' },
    'audio.volume': { fr: 'Volume de la musique', en: 'Music volume' },
    'character.actor': { fr: 'Interprète', en: 'Actor' },
    'character.birth': { fr: 'Naissance', en: 'Born' },
    'character.portrait': { fr: 'Portrait de {name}', en: 'Portrait of {name}' },
    'book.volume': { fr: 'Tome {number}', en: 'Volume {number}' },
    'book.cover': { fr: 'Couverture de {title}', en: 'Cover of {title}' },
    'book.release': { fr: 'Parution : {date}', en: 'Published: {date}' },
    'book.pages': { fr: '{pages} pages', en: '{pages} pages' },
    'form.name': { fr: 'Veuillez entrer votre nom complet.', en: 'Please enter your full name.' },
    'form.email': { fr: 'Veuillez entrer une adresse courriel valide.', en: 'Please enter a valid email address.' },
    'form.phone': { fr: 'Veuillez entrer un numéro de téléphone valide.', en: 'Please enter a valid phone number.' },
    'form.password': { fr: 'Le mot de passe doit contenir au moins 8 caractères.', en: 'The password must contain at least 8 characters.' },
    'form.interests': { fr: 'Choisissez au moins un type de nouvelles.', en: 'Choose at least one type of news.' },
    'form.show': { fr: 'Afficher', en: 'Show' },
    'form.hide': { fr: 'Masquer', en: 'Hide' },
    'form.showPassword': { fr: 'Afficher le mot de passe', en: 'Show password' },
    'form.hidePassword': { fr: 'Masquer le mot de passe', en: 'Hide password' },
    'form.success': { fr: 'Merci {name}! Votre profil de démonstration est prêt.', en: 'Thank you, {name}! Your demonstration profile is ready.' }
  };

  const titles = {
    home: { fr: 'HarryHub — Le monde de Harry Potter', en: 'HarryHub — The world of Harry Potter' },
    characters: { fr: 'Personnages — HarryHub', en: 'Characters — HarryHub' },
    books: { fr: 'Livres — HarryHub', en: 'Books — HarryHub' },
    upcoming: { fr: 'À venir — HarryHub', en: 'Coming soon — HarryHub' }
  };

  const descriptions = {
    home: { fr: 'Explorez l’histoire, les personnages et les livres du monde de Harry Potter.', en: 'Explore the story, characters and books of the Harry Potter world.' },
    characters: { fr: 'Découvrez 25 personnages emblématiques du monde de Harry Potter.', en: 'Discover 25 iconic characters from the Harry Potter world.' },
    books: { fr: 'Parcourez les huit livres de la collection Harry Potter.', en: 'Browse the eight books in the Harry Potter collection.' },
    upcoming: { fr: 'Inscrivez-vous aux nouvelles de HarryHub.', en: 'Sign up for HarryHub news.' }
  };

  const readStoredLanguage = () => {
    try { return localStorage.getItem(storageKey) === 'en' ? 'en' : 'fr'; } catch { return 'fr'; }
  };

  let locale = readStoredLanguage();

  const t = (key, variables = {}) => {
    let value = messages[key]?.[locale] ?? (locale === 'en' ? english[key] : key) ?? key;
    Object.entries(variables).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
    return value;
  };

  const translateTextNodes = () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest('script, style') || !node.nodeValue.trim()
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!textNodeOriginals.has(node)) textNodeOriginals.set(node, node.nodeValue);
      const original = textNodeOriginals.get(node);
      if (locale === 'fr') {
        node.nodeValue = original;
        continue;
      }
      const trimmed = original.trim();
      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];
      node.nodeValue = `${leading}${english[trimmed] ?? trimmed}${trailing}`;
    }
  };

  const translateAttributes = () => {
    document.querySelectorAll('[placeholder], [aria-label], [alt], [title]').forEach((element) => {
      if (!attributeOriginals.has(element)) {
        const originals = {};
        ['placeholder', 'aria-label', 'alt', 'title'].forEach((attribute) => {
          if (element.hasAttribute(attribute)) originals[attribute] = element.getAttribute(attribute);
        });
        attributeOriginals.set(element, originals);
      }
      const originals = attributeOriginals.get(element);
      Object.entries(originals).forEach(([attribute, original]) => {
        element.setAttribute(attribute, locale === 'en' ? (english[original] ?? original) : original);
      });
    });
  };

  const translatePage = () => {
    document.documentElement.lang = locale;
    const page = document.body.dataset.page;
    if (titles[page]) document.title = titles[page][locale];
    const description = document.querySelector('meta[name="description"]');
    if (description && descriptions[page]) description.content = descriptions[page][locale];
    translateTextNodes();
    translateAttributes();
  };

  const setLanguage = (nextLocale) => {
    if (!['fr', 'en'].includes(nextLocale)) return;
    locale = nextLocale;
    try { localStorage.setItem(storageKey, locale); } catch { /* Storage can be unavailable on file URLs. */ }
    translatePage();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: locale } }));
  };

  window.HarryHubI18n = {
    get language() { return locale; },
    setLanguage,
    t,
    translatePage
  };

  translatePage();
})();
