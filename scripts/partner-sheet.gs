/**
 * Google Apps Script that writes partnership enquiries into a Google Sheet.
 *
 * This file is NOT part of the Next.js build. It is the code you paste into
 * Apps Script — it lives in the repo so the thing receiving your enquiries is
 * version-controlled alongside the form that sends them, rather than existing
 * only inside one person's Google account.
 *
 * SETUP — about five minutes, once.
 *
 *  1. Create a Google Sheet. Name the first tab `Enquiries`.
 *  2. Extensions -> Apps Script. Delete the placeholder, paste this whole file.
 *  3. Edit SHARED_SECRET below to a long random string. Keep it to hand.
 *  4. Deploy -> New deployment -> type "Web app".
 *       Execute as:        Me
 *       Who has access:    Anyone
 *     "Anyone" is required — Vercel's servers post here without a Google login.
 *     It is why the shared secret exists; see the note on it.
 *  5. Copy the /exec URL it gives you.
 *  6. In Vercel -> Settings -> Environment Variables, add both, for Production
 *     and Preview:
 *       PARTNER_SHEET_WEBHOOK  = the /exec URL
 *       PARTNER_SHEET_SECRET   = the same string as SHARED_SECRET
 *  7. Redeploy.
 *
 * Re-deploying the script after an edit creates a NEW /exec URL unless you pick
 * "Manage deployments" and edit the existing one. If enquiries stop arriving
 * after you change something here, that is the first thing to check.
 */

/**
 * Must match PARTNER_SHEET_SECRET in Vercel.
 *
 * The web app has to be readable by "Anyone" for the site's server to reach it,
 * which means the URL alone is a write endpoint for anybody who learns it. The
 * secret is what stops a leaked URL from becoming an open spam funnel into the
 * sheet. It is not a password protecting anything sensitive — nothing is read
 * back — so a long random string is plenty.
 */
const SHARED_SECRET = "change-me-to-a-long-random-string";

const SHEET_NAME = "Enquiries";
const HEADERS = [
  "Received",
  "Name",
  "Email",
  "Organisation",
  "About",
  "Message",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return reply({ ok: false, error: "unauthorised" });
    }

    const sheet = getSheet();
    sheet.appendRow([
      body.receivedAt || new Date().toISOString(),
      body.name || "",
      body.email || "",
      body.organisation || "",
      body.kind || "",
      body.message || "",
    ]);

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

/** A GET is only ever a human checking the deployment is alive. */
function doGet() {
  return reply({ ok: true, note: "Memes & Markets enquiry endpoint" });
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);

  // Write the header row once, and freeze it so the sheet stays readable as it
  // fills. Checked every time because the first call may be on an empty sheet.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
