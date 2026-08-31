/**
 * Google Apps Script that writes the site's two forms into a Google Sheet.
 *
 * This file is NOT part of the Next.js build. It is the code you paste into
 * Apps Script — it lives in the repo so the thing receiving your enquiries and
 * subscribers is version-controlled alongside the forms that send them, rather
 * than existing only inside one person's Google account.
 *
 * TWO LISTS, ONE DEPLOYMENT. Partnership enquiries and newsletter subscribers go
 * to separate tabs of the same sheet, chosen by the `list` field in the payload.
 * One script means one /exec URL and one secret to keep straight, which is worth
 * more than the tidiness of two deployments.
 *
 * WHY SUBSCRIBERS LAND HERE AND NOT IN SUBSTACK. Substack has no supported API
 * for adding one, and the undocumented endpoint their embed uses now sits behind
 * Cloudflare bot management, which blocks any server-side POST — measured: the
 * identical request succeeds from a browser and fails from every server, on any
 * publication. So the site collects addresses itself and they are imported into
 * Substack in batches. See the note on the Subscribers tab below.
 *
 * SETUP — about five minutes, once.
 *
 *  1. Create a Google Sheet. The tabs are created for you on first write.
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
 *     The names say PARTNER for historical reasons — they were added when this
 *     was the enquiry form's script alone. Both forms use them now.
 *  7. Redeploy.
 *
 * ALREADY RUNNING AN OLDER VERSION OF THIS SCRIPT? Replace the code, then
 * Manage deployments -> edit the existing deployment -> Deploy. Editing the
 * existing one KEEPS THE URL; "New deployment" mints a different one and the
 * site keeps posting to the old one. A payload with no `list` field still lands
 * in Enquiries exactly as before, so the partnership form cannot break while you
 * do this.
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

/**
 * One entry per list. `list` in the payload picks one; anything unrecognised —
 * including a payload from before this field existed — falls back to enquiries.
 */
const LISTS = {
  enquiries: {
    sheet: "Enquiries",
    headers: ["Received", "Name", "Email", "Organisation", "About", "Message"],
    row: function (body) {
      return [
        body.receivedAt || new Date().toISOString(),
        body.name || "",
        body.email || "",
        body.organisation || "",
        body.kind || "",
        body.message || "",
      ];
    },
  },
  /**
   * Newsletter subscribers, waiting to be imported into Substack.
   *
   * "Imported" is the whole point of the Status column: nothing here is on the
   * mailing list yet. Export the un-imported rows as CSV, add them in Substack
   * (Subscribers -> Import), then mark them. Without that column it is guesswork
   * which addresses have been carried across, and somebody eventually imports
   * the same batch twice or misses one.
   */
  subscribers: {
    sheet: "Subscribers",
    headers: ["Received", "Email", "Source", "Status"],
    row: function (body) {
      return [
        body.receivedAt || new Date().toISOString(),
        body.email || "",
        body.source || "",
        "Not imported",
      ];
    },
  },
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return reply({ ok: false, error: "unauthorised" });
    }

    const list = LISTS[body.list] || LISTS.enquiries;
    getSheet(list).appendRow(list.row(body));

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

/** A GET is only ever a human checking the deployment is alive. */
function doGet() {
  return reply({ ok: true, note: "Memes & Markets form endpoint" });
}

function getSheet(list) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(list.sheet);
  if (!sheet) sheet = book.insertSheet(list.sheet);

  // Write the header row once, and freeze it so the sheet stays readable as it
  // fills. Checked every time because the first call may be on an empty sheet.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(list.headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, list.headers.length).setFontWeight("bold");
  }
  return sheet;
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
