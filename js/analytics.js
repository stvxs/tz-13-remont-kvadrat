// Проверяем, доступна ли функция Google Analytics.
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
    messenger_name: messenger
  });
}

// Переходы между страницами сайта.
function trackNavigationClick(pageName) {
  trackEvent('navigation_click', {
    page_name: pageName
  });
}

// Отслеживание кликов по внутренним ссылкам.
document.addEventListener('click', function(event) {
  const link = event.target.closest('a');

  if (!link) return;

  const href = link.getAttribute('href');

  if (href && href.endsWith('.html')) {
    trackNavigationClick(href);
  }
});