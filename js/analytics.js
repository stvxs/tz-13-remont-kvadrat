// Сохраняем метки первой страницы визита, чтобы они дошли до формы после переходов по сайту.
(function saveSessionAttribution() {
  const storageKey = 'kvadrat_attribution';
  const query = new URLSearchParams(window.location.search);
  const taggedSource = query.get('utm_source');

  try {
    if (taggedSource) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        utm_source: taggedSource,
        utm_medium: query.get('utm_medium') || 'none',
        utm_campaign: query.get('utm_campaign') || 'not_set',
        utm_content: query.get('utm_content') || 'not_set'
      }));
    } else if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        utm_source: 'direct',
        utm_medium: 'none',
        utm_campaign: 'not_set',
        utm_content: 'not_set'
      }));
    }
  } catch (error) {
    // Если хранилище браузера недоступно, форма всё равно сможет отправить заявку.
  }
})();

function trackEvent(eventName, eventParams = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventParams);
  }
}

function trackLead(lead) {
  trackEvent('generate_lead', {
    lead_repair_type: lead.repair_type,
    area_m2: lead.area_m2,
    lead_source: lead.utm_source
  });
}

function trackContactClick(type) {
  trackEvent('contact_click', { contact_type: type });
}

function trackMessengerClick(messenger) {
  trackEvent('messenger_click', { messenger: messenger });
}

// GA4 Enhanced Measurement collects outbound click and form_start.
// form_submit is tracked in contact.js because the form is intercepted and sent with fetch.
document.addEventListener('click', function(event) {
  const link = event.target.closest('a');
  if (link && link.dataset.contactType) {
    trackContactClick(link.dataset.contactType);
  }
  if (link && link.dataset.messenger) {
    trackMessengerClick(link.dataset.messenger);
  }
  if (link && link.dataset.social) {
    trackEvent('social_click', {
      network: link.dataset.social,
      page_section: link.dataset.pageSection || (link.closest('footer') ? 'footer' : 'content')
    });
  }
  if (link && link.matches('.button, .header-button')) {
    trackEvent('cta_click', {
      button_name: link.textContent.trim(),
      page_section: link.closest('header') ? 'header' : 'content'
    });
  }

  const promoButton = event.target.closest('[data-event="promo_copy"]');
  if (promoButton && !promoButton.dataset.copying) {
    const promoCode = promoButton.dataset.promoCode;
    if (!promoCode) return;

    promoButton.dataset.copying = 'true';
    const status = document.getElementById('promo-copy-status');
    const showCopyResult = function(copied) {
      delete promoButton.dataset.copying;
      if (status) {
        status.textContent = copied
          ? 'Промокод скопирован и сохранён для этой вкладки. В заявке он подставится автоматически.'
          : 'Не удалось скопировать автоматически. Выделите и скопируйте код: ' + promoCode;
      }
      if (copied) {
        try {
          sessionStorage.setItem('kvadrat_promo_code', promoCode);
        } catch (error) {}
        trackEvent('promo_copy', { promo_code: promoCode });
      }
    };
    const fallbackCopy = function() {
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = promoCode;
      temporaryInput.setAttribute('readonly', '');
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }
      temporaryInput.remove();
      showCopyResult(copied);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promoCode).then(function() {
        showCopyResult(true);
      }).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  const projectButton = event.target.closest('[data-event="project_view"]');
  if (projectButton) {
    const card = projectButton.closest('.portfolio-card');
    if (card) {
      trackEvent('project_view', {
        project_id: card.dataset.projectId,
        repair_type: card.dataset.repairType
      });
    }
  }

  const galleryImage = event.target.closest('[data-event="gallery_view"]');
  if (galleryImage && galleryImage.dataset.projectId) {
    trackEvent('gallery_view', {
      project_id: galleryImage.dataset.projectId,
      photo_index: 1
    });
  }
});

document.addEventListener('change', function(event) {
  const filter = event.target.closest('[data-event="portfolio_filter"]');
  if (!filter) return;

  const objectType = document.getElementById('object-type-filter');
  trackEvent('portfolio_filter', {
    object_type: objectType ? objectType.value : 'all'
  });
});
