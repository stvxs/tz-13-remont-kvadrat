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