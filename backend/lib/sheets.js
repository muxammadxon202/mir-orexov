const { google } = require("googleapis");

// Google Sheets evaluates any cell that starts with = + - @ (or a leading
// tab/CR/LF that Sheets then trims down to one of those) as a FORMULA when the
// write uses valueInputOption: "USER_ENTERED". Since /api/requests takes fully
// attacker-controlled text, neutralize every cell by prefixing a single quote
// so Sheets always treats the value as literal text — this kills stored formula
// injection (e.g. =IMPORTXML(...) exfiltrating other leads).
function neutralizeFormula(value) {
  const s = value == null ? "" : String(value);
  return /^[\t\r\n]*[=+\-@]/.test(s) ? "'" + s : s;
}

let sheetsClient = null;
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Google Sheets not configured");

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

async function appendToSheet(record) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const range = process.env.GOOGLE_SHEET_RANGE || "Leads!A:I";
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID not configured");

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          record.receivedAt,
          record.name,
          record.company,
          record.country,
          record.phone,
          record.email,
          record.product,
          record.volume,
          record.message,
        ].map(neutralizeFormula),
      ],
    },
  });
}

module.exports = { appendToSheet };
