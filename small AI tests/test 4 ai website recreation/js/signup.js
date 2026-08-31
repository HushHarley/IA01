(() => {
  const form = document.querySelector('#signup-form');
  if (!form) return;

  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    password: form.elements.password
  };
  const status = document.querySelector('#form-status');
  const passwordButton = document.querySelector('.show-password');
  const i18n = window.HarryHubI18n;
  let successfulReset = false;

  const message = (name) => {
    const keys = { name: 'form.name', email: 'form.email', phone: 'form.phone', password: 'form.password', interests: 'form.interests' };
    return i18n?.t(keys[name]) ?? '';
  };

  const setError = (name, message = '') => {
    const error = document.querySelector(`#${name}-error`);
    if (error) error.textContent = message;
    if (fields[name]) fields[name].setAttribute('aria-invalid', String(Boolean(message)));
  };

  const validateField = (name) => {
    const field = fields[name];
    if (!field) return true;
    const value = field.value.trim();
    let isValid = true;

    if (name === 'name') isValid = value.length >= 2;
    if (name === 'email') isValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      isValid = value === '' || (digits.length >= 10 && digits.length <= 15);
    }
    if (name === 'password') isValid = value.length >= 8;

    setError(name, isValid ? '' : message(name));
    return isValid;
  };

  const validateInterests = () => {
    const isValid = form.querySelectorAll('input[name="interests"]:checked').length > 0;
    const error = document.querySelector('#interests-error');
    error.textContent = isValid ? '' : message('interests');
    return isValid;
  };

  Object.entries(fields).forEach(([name, field]) => {
    field.addEventListener('blur', () => validateField(name));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  form.querySelectorAll('input[name="interests"]').forEach((checkbox) => {
    checkbox.addEventListener('change', validateInterests);
  });

  passwordButton?.addEventListener('click', () => {
    const willShow = fields.password.type === 'password';
    fields.password.type = willShow ? 'text' : 'password';
    passwordButton.textContent = i18n?.t(willShow ? 'form.hide' : 'form.show');
    passwordButton.setAttribute('aria-label', i18n?.t(willShow ? 'form.hidePassword' : 'form.showPassword'));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const validity = Object.keys(fields).map(validateField);
    validity.push(validateInterests());

    if (validity.every(Boolean)) {
      const firstName = fields.name.value.trim().split(/\s+/)[0];
      successfulReset = true;
      form.reset();
      Object.keys(fields).forEach((name) => setError(name));
      document.querySelector('#interests-error').textContent = '';
      fields.password.type = 'password';
      if (passwordButton) passwordButton.textContent = i18n?.t('form.show');
      status.dataset.name = firstName;
      status.textContent = i18n?.t('form.success', { name: firstName });
      status.classList.add('is-visible');
      status.focus();
      return;
    }

    status.classList.remove('is-visible');
    const firstInvalid = form.querySelector('[aria-invalid="true"]') || form.querySelector('input[name="interests"]');
    firstInvalid?.focus();
  });

  form.addEventListener('reset', () => {
    if (successfulReset) {
      successfulReset = false;
      return;
    }
    window.setTimeout(() => {
      Object.keys(fields).forEach((name) => setError(name));
      document.querySelector('#interests-error').textContent = '';
      status.classList.remove('is-visible');
      fields.password.type = 'password';
      if (passwordButton) passwordButton.textContent = i18n?.t('form.show');
    });
  });

  window.addEventListener('languagechange', () => {
    Object.keys(fields).forEach((name) => {
      if (fields[name].getAttribute('aria-invalid') === 'true') setError(name, message(name));
    });
    const interestError = document.querySelector('#interests-error');
    if (interestError.textContent) interestError.textContent = message('interests');
    const passwordVisible = fields.password.type === 'text';
    if (passwordButton) {
      passwordButton.textContent = i18n?.t(passwordVisible ? 'form.hide' : 'form.show');
      passwordButton.setAttribute('aria-label', i18n?.t(passwordVisible ? 'form.hidePassword' : 'form.showPassword'));
    }
    if (status.classList.contains('is-visible')) status.textContent = i18n?.t('form.success', { name: status.dataset.name });
  });
})();
