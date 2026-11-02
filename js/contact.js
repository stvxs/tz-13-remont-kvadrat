const form = document.getElementById('lead-form');
const message = document.getElementById('form-message');
const requestIdField = document.getElementById('request-id');
const attributionStorageKey = 'kvadrat_attribution';
const requestIdStorageKey = 'kvadrat_pending_request_id';
const lastRequestIdStorageKey = 'kvadrat_last_request_id';
const requestIdPattern = /^REQ-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function newRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return 'REQ-' + window.crypto.randomUUID();
  }
  return 'REQ-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
    const random = Math.random() * 16 | 0;
    return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
  });
}

function readAttribution() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(attributionStorageKey) || '{}');
    return {
      utm_source: saved.utm_source || 'direct',
      utm_medium: saved.utm_medium || 'none',
      utm_campaign: saved.utm_campaign || 'not_set',
      utm_content: saved.utm_content || 'not_set'
    };
  } catch (error) {
    return { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set' };
  }
}

function setAttributionFields(attribution) {
  form.elements.utm_source.value = attribution.utm_source;
  form.elements.utm_medium.value = attribution.utm_medium;
  form.elements.utm_campaign.value = attribution.utm_campaign;
  form.elements.utm_content.value = attribution.utm_content;
}

function applyCalculatorPrefill() {
  const params = new URLSearchParams(window.location.search);
  const repairType = params.get('repair_type');
  const area = Number(params.get('area_m2'));
  const allowedRepairTypes = ['cosmetic', 'capital', 'designer'];

  if (allowedRepairTypes.includes(repairType)) {
    form.elements.repair_type.value = repairType;
  }
  if (Number.isFinite(area) && area >= 10 && area <= 300) {
    form.elements.area_m2.value = String(area);
  }
}

function applyPromoCodePrefill() {
  try {
    const promoCode = sessionStorage.getItem('kvadrat_promo_code') || '';
    if (promoCode) form.elements.promo_code.value = promoCode;
  } catch (error) {}
}

function loadOrCreateRequestId() {
  let requestId = '';
  try {
    requestId = sessionStorage.getItem(requestIdStorageKey) || '';
    if (!requestIdPattern.test(requestId)) {
      requestId = newRequestId();
      sessionStorage.setItem(requestIdStorageKey, requestId);
    }
  } catch (error) {
    requestId = newRequestId();
  }
  requestIdField.value = requestId;
  return requestId;
}

function checkRequestStatus(requestId) {
  return new Promise(function(resolve) {
    const callbackName = 'handleLeadStatus';
    const script = document.createElement('script');
    let settled = false;
    const previousCallback = window[callbackName];

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      script.remove();
      if (previousCallback === undefined) delete window[callbackName];
      else window[callbackName] = previousCallback;
      resolve(result);
    }

    window[callbackName] = function(result) {
      if (!result || result.request_id !== requestId) {
        finish({ accepted: false, error: 'invalid_status_response' });
        return;
      }
      if (result.error) {
        finish({ accepted: false, error: result.error });
        return;
      }
      finish({ accepted: result.ok === true && result.received === true, error: '' });
    };

    const timeoutId = setTimeout(function() {
      finish({ accepted: false, error: 'status_timeout' });
    }, 2500);
    const query = new URLSearchParams({
      action: 'check',
      request_id: requestId,
      callback: callbackName,
      check: String(Date.now())
    });
    script.src = APPS_SCRIPT_URL + '?' + query.toString();
    script.onerror = function() {
      finish({ accepted: false, error: 'status_unavailable' });
    };
    document.head.appendChild(script);
  });
}

async function waitForAcceptedRequest(requestId) {
  const attempts = 10;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await checkRequestStatus(requestId);
    if (status.accepted || (status.error && status.error !== 'status_timeout' && status.error !== 'status_unavailable')) {
      return status;
    }
    if (attempt < attempts - 1) {
      await new Promise(function(resolve) { setTimeout(resolve, 750); });
    }
  }
  return { accepted: false, error: 'confirmation_timeout' };
}

setAttributionFields(readAttribution());
applyCalculatorPrefill();
applyPromoCodePrefill();
loadOrCreateRequestId();

const invalidFields = new Set();
let invalidEventTimer = null;

form.addEventListener('invalid', function(event) {
  const field = event.target;
  if (!field.name) return;

  field.setAttribute('aria-invalid', 'true');
  message.dataset.fieldName = field.name;
  if (field.name === 'phone') {
    message.textContent = 'Введите телефон в формате +7 и 10 цифр.';
  } else if (field.name === 'consent') {
    message.textContent = 'Подтвердите согласие на обработку персональных данных.';
  } else {
    message.textContent = 'Проверьте заполнение поля «' + (field.labels[0]?.textContent.trim() || field.name) + '».';
  }
  invalidFields.add(field.name);
  clearTimeout(invalidEventTimer);
  invalidEventTimer = setTimeout(function() {
    const fields = Array.from(invalidFields);
    invalidFields.clear();
    trackEvent('form_error', {
      field_name: fields.length === 1 ? fields[0] : 'multiple',
      error_type: 'validation'
    });
  }, 0);
}, true);

form.addEventListener('input', function(event) {
  const field = event.target;
  if (!field.name) return;
  field.removeAttribute('aria-invalid');
  if (message.dataset.fieldName === field.name) {
    message.textContent = '';
    delete message.dataset.fieldName;
  }
});
form.addEventListener('submit', async function(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  trackEvent('form_submit', { form_id: 'lead-form' });

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Отправка...';
  message.textContent = '';

  const requestId = loadOrCreateRequestId();
  const payload = new URLSearchParams({
    request_id: requestId,
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim(),
    email: form.elements.email.value.trim(),
    promo_code: form.elements.promo_code.value.trim().toUpperCase(),
    repair_type: form.elements.repair_type.value,
    area_m2: form.elements.area_m2.value,
    object_type: form.elements.object_type.value,
    utm_source: form.elements.utm_source.value,
    utm_medium: form.elements.utm_medium.value,
    utm_campaign: form.elements.utm_campaign.value,
    utm_content: form.elements.utm_content.value
  });

  try {
    // no-cors hides the POST response; the read-only JSONP check confirms the saved row.
    await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: payload });
    const receipt = await waitForAcceptedRequest(requestId);
    if (!receipt.accepted) throw new Error(receipt.error || 'confirmation_timeout');

    trackLead({
      repair_type: form.elements.repair_type.value,
      area_m2: Number(form.elements.area_m2.value),
      utm_source: form.elements.utm_source.value
    });

    try {
      sessionStorage.setItem(lastRequestIdStorageKey, requestId);
      sessionStorage.removeItem(requestIdStorageKey);
      sessionStorage.removeItem('kvadrat_promo_code');
    } catch (error) {}
    window.location.href = 'thanks.html';
  } catch (error) {
    trackEvent('form_error', {
      field_name: 'request',
      error_type: error.message === 'confirmation_timeout' ? 'confirmation_timeout' : 'server'
    });
    if (error.message === 'duplicate_request_id') {
      message.textContent = 'Эта заявка уже была принята ранее. Повторная строка не добавлена.';
    } else if (error.message === 'sheet_schema_mismatch') {
      message.textContent = 'Структура листа leads пока не совпадает с ТЗ. Заявка не записана; существующие данные не менялись.';
    } else {
      message.textContent = 'Не удалось подтвердить приём заявки. Повторная отправка с тем же ID не создаст дубль; попробуйте ещё раз позже.';
    }
    button.disabled = false;
    button.textContent = 'Отправить заявку';
  }
});
