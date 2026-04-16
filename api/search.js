const { google } = require('googleapis');

const SHEET_NAMES = ['3C-個人', '3C-公用&Demo'];

function normalizeText(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["']/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function cleanHeader(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets 環境變數未設定完整。');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({ version: 'v4', auth });
}

async function findRowByCode({ sheets, spreadsheetId, sheetName, lookupValue }) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'`
  });

  const values = response.data.values || [];
  if (!values.length) return null;

  const headers = values[0].map(cleanHeader);
  const normalizedHeaders = headers.map(normalizeText);
  const numberColumnIndex = normalizedHeaders.findIndex((header) => header === '編號');

  if (numberColumnIndex === -1) {
    return null;
  }

  for (let i = 1; i < values.length; i += 1) {
    const row = values[i] || [];
    const code = String(row[numberColumnIndex] || '').trim();

    if (code === lookupValue) {
      const rowData = headers
        .map((field, index) => ({
          field,
          value: row[index] ?? ''
        }))
        .filter((item) => item.field !== '');

      return {
        sheetName,
        rowIndex: i + 1,
        rowData
      };
    }
  }

  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '只支援 GET 查詢。'
    });
  }

  try {
    const lookupValue = String(req.query.code || '').trim();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!lookupValue) {
      return res.status(400).json({
        success: false,
        message: '缺少查詢編號。'
      });
    }

    if (!spreadsheetId) {
      throw new Error('尚未設定 GOOGLE_SHEET_ID。');
    }

    const sheets = createSheetsClient();

    for (const sheetName of SHEET_NAMES) {
      const found = await findRowByCode({
        sheets,
        spreadsheetId,
        sheetName,
        lookupValue
      });

      if (found) {
        return res.status(200).json({
          success: true,
          lookupValue,
          ...found
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: `查無編號為「${lookupValue}」的資料。`
    });
  } catch (error) {
    console.error('search api error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '系統錯誤，請稍後再試。'
    });
  }
};
