
const SPREADSHEET_ID = '1grAQPnzoyqz_1DDgMcEoTySrJrNrth473l84SgGbWZg';

const SHEET_NAME = 'leads';

const HEADERS = [
  'request_id',
  'created_at',
  'name',
  'email',
  'direction',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'status'
];

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};

    const name = String(params.name || '').trim();
    const email = String(params.email || '').trim();
    const direction = String(params.direction || '').trim();

    if (!name || !email || !direction) {
      return response({
        success: false,
        message: 'Заполните обязательные поля'
      });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    const requestId = Utilities.getUuid();
    const createdAt = new Date();

    sheet.appendRow([
      requestId,
      createdAt,
      name,
      email,
      direction,
      params.utm_source || '',
      params.utm_medium || '',
      params.utm_campaign || '',
      'new'
    ]);

    return response({
      success: true,
      message: 'Заявка успешно принята'
    });

  } catch (error) {
    return response({
      success: false,
      message: String(error)
    });
  }
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
