
const form = document.getElementById('lead-form');
const message = document.getElementById('form-message');

form.addEventListener('focusin', function() {
  if (!form.dataset.started) {
    form.dataset.started = 'true';
    trackEvent('form_start');
  }
});

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Отправка...';
  message.textContent = '';

  const params = new URLSearchParams({
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    direction: form.elements.direction.value,
    utm_source: new URLSearchParams(location.search).get('utm_source') || '',
    utm_medium: new URLSearchParams(location.search).get('utm_medium') || '',
    utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || ''
  });

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: params
    });

    trackLead();

        trackEvent('form_submit', {
      form_name: 'Форма заявки'
    });

    window.location.href = 'thanks.html';

  } catch (error) {
        trackEvent('form_error', {
      error_message: 'Ошибка отправки заявки'
    });
    
    message.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});
