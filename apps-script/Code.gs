const SPREADSHEET_ID = '1grAQPnzoyqz_1DDgMcEoTySrJrNrth473l84SgGbWZg';
const SHEET_NAME = 'leads';
const HEADERS = [
  'request_id', 'created_at', 'name', 'phone', 'email', 'repair_type',
  'area_m2', 'object_type', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'status', 'promo_code'
];
const REPAIR_TYPES = ['cosmetic', 'capital', 'designer', 'bathroom'];
const OBJECT_TYPES = ['new_build', 'secondary'];
const UUID_PATTERN = /^REQ-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function doPost(e) {
  const params = (e && e.parameter) || {};
  const validationError = validateLead(params);
  if (validationError) {
    rememberFailure(params.request_id, validationError);
    return jsonResponse({ ok: false, error: validationError });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = getOrCreateSheet();
    if (!hasExpectedHeaders(sheet)) {
      rememberFailure(params.request_id, 'sheet_schema_mismatch');
      return jsonResponse({ ok: false, error: 'sheet_schema_mismatch' });
    }

    if (findRequestRow(sheet, params.request_id)) {
      rememberFailure(params.request_id, 'duplicate_request_id');
      return jsonResponse({ ok: false, error: 'duplicate_request_id', request_id: params.request_id });
    }

    const phone = String(params.phone).trim();
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 4).setNumberFormat('@');
    sheet.appendRow([
      params.request_id,
      new Date(),
      String(params.name).trim(),
      phone,
      String(params.email || '').trim(),
      params.repair_type,
      Number(params.area_m2),
      params.object_type,
      params.utm_source || 'direct',
      params.utm_medium || 'none',
      params.utm_campaign || 'not_set',
      params.utm_content || 'not_set',
      'new',
      String(params.promo_code || '').trim().toUpperCase()
    ]);
    // Restore the exact phone string after appendRow so Sheets does not parse +7 as a number.
    sheet.getRange(nextRow, 4).setNumberFormat('@').setValue(phone);
    forgetFailure(params.request_id);

    return jsonResponse({ ok: true, duplicate: false, request_id: params.request_id });
  } catch (error) {
    console.error('Lead receiver error:', error);
    rememberFailure(params.request_id, 'server_error');
    return jsonResponse({ ok: false, error: 'server_error' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

// Read-only receipt check. JSONP avoids reading the opaque no-cors POST response.
function doGet(e) {
  const params = (e && e.parameter) || {};
  const requestId = String(params.request_id || '');
  const validId = UUID_PATTERN.test(requestId);
  let received = false;
  let errorCode = '';

  if (params.action === 'check' && validId) {
    try {
      const sheet = getOrCreateSheet();
      if (!hasExpectedHeaders(sheet)) {
        errorCode = 'sheet_schema_mismatch';
      } else {
        received = Boolean(findRequestRow(sheet, requestId));
      }
    } catch (error) {
      errorCode = 'server_error';
    }
    if (!errorCode) errorCode = readFailure(requestId);
  }

  const result = {
    ok: validId,
    received: received,
    request_id: validId ? requestId : '',
    error: errorCode
  };
  const callback = String(params.callback || '');

  if (callback === 'handleLeadStatus') {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(result);
}

function rememberFailure(requestId, errorCode) {
  if (!UUID_PATTERN.test(String(requestId || ''))) return;
  try {
    CacheService.getScriptCache().put('lead-status:' + requestId, errorCode, 21600);
  } catch (error) {
    console.error('Could not cache lead status:', error);
  }
}

function readFailure(requestId) {
  try {
    return CacheService.getScriptCache().get('lead-status:' + requestId) || '';
  } catch (error) {
    return 'server_error';
  }
}

function forgetFailure(requestId) {
  try {
    CacheService.getScriptCache().remove('lead-status:' + requestId);
  } catch (error) {
    console.error('Could not clear cached lead status:', error);
  }
}

function validateLead(params) {
  const requestId = String(params.request_id || '');
  const name = String(params.name || '').trim();
  const phone = String(params.phone || '').trim();
  const email = String(params.email || '').trim();
  const repairType = String(params.repair_type || '');
  const area = Number(params.area_m2);
  const objectType = String(params.object_type || '');
  const promoCode = String(params.promo_code || '').trim().toUpperCase();

  if (!UUID_PATTERN.test(requestId)) return 'invalid_request_id';
  if (name.length < 2 || name.length > 60) return 'invalid_name';
  if (!/^\+7\d{10}$/.test(phone)) return 'invalid_phone';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'invalid_email';
  if (REPAIR_TYPES.indexOf(repairType) === -1) return 'invalid_repair_type';
  if (!Number.isFinite(area) || area < 10 || area > 300) return 'invalid_area';
  if (OBJECT_TYPES.indexOf(objectType) === -1) return 'invalid_object_type';
  if (promoCode && promoCode !== 'SMETA24') return 'invalid_promo_code';
  return '';
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function hasExpectedHeaders(sheet) {
  const actual = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  return HEADERS.every(function(header, index) { return actual[index] === header; });
}

function findRequestRow(sheet, requestId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const match = sheet.getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(requestId)
    .matchEntireCell(true)
    .findNext();
  return match ? match.getRow() : 0;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
