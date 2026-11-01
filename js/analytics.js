
// Проверяем, доступна ли Google Analytics.
function trackEvent(eventName, eventParams = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventParams);
  }
}

// Отправка заявки.
function trackLead() {
  trackEvent('generate_lead', {
    event_category: 'form',
    event_label: 'Форма заявки'
  });
}

// Нажатие на телефон или электронную почту.
function trackContactClick(type) {
  trackEvent('contact_click', {
    contact_type: type
  });
}

// Нажатие на мессенджер.
function trackMessengerClick(messenger) {
  trackEvent('messenger_click', {
    messenger: messenger
  });
}

// Отслеживание переходов на внешние сайты.
document.addEventListener('click', function(event) {
  const link = event.target.closest('a');

  if (!link) return;

    // Отслеживание нажатий на основные CTA-кнопки.
  if (link.matches('.button, .header-button')) {
    trackEvent('cta_click', {
      cta_text: link.textContent.trim(),
      link_url: link.href
    });
  }

  const url = link.href;

  if (url && link.hostname !== window.location.hostname) {
    trackEvent('click', {
      link_url: url,
      outbound: true
    });
  }
});

