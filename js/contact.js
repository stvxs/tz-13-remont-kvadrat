
const form = document.getElementById('lead-form');
const message = document.getElementById('form-message');

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
    window.location.href = 'thanks.html';

  } catch (error) {
    message.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});
