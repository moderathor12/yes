// ============================================================
//  YES Community — Email List Collector
//  Google Apps Script — Web App
//  Making The World great again.
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Başlık satırı yoksa ekle
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Email"]);
      sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    }

    var email = "";
    // Form data veya JSON body desteği
    if (e.parameter && e.parameter.email) {
      email = e.parameter.email.trim();
    } else if (e.postData && e.postData.contents) {
      var body = JSON.parse(e.postData.contents);
      email = body.email ? body.email.trim() : "";
    }

    // Basit email doğrulama
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return buildResponse({ result: "error", message: "Geçersiz email adresi." });
    }

    // Aynı email daha önce eklenmiş mi?
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        return buildResponse({ result: "duplicate", message: "Bu email zaten kayıtlı!" });
      }
    }

    // Add new row
    sheet.appendRow([new Date(), email]);

    // NEW: Send Automatic Welcome Email
    try {
      sendWelcomeEmail(email);
    } catch (e) {
      Logger.log('Welcome email could not be sent: ' + e.message);
    }

    return buildResponse({ result: "success", message: "Successfully subscribed!" });

  } catch (err) {
    return buildResponse({ result: "error", message: err.message });
  }
}

/**
 * Sends a welcome email to a new subscriber.
 */
function sendWelcomeEmail(toEmail) {
  var subject = "🌱 Welcome to the YES Community!";
  var body = "Hi there,\n\n" +
             "We're thrilled to have you join the Youth Environment Society (YES) community! 🌱\n\n" +
             "You're now on the list to be the first to hear about our environmental projects, upcoming events, and the steps we're taking toward a greener future.\n\n" +
             "There's so much we can achieve together for a more sustainable world. You can always reach out to us by replying to this email or visiting our Instagram.\n\n" +
             "Stay green,\n" +
             "The YES Community Team";
             
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    body: body
  });
}

function doGet(e) {
  return buildResponse({ result: "ok", message: "YES Email Collector is running." });
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  BULK EMAIL FEATURE
// ============================================================

/**
 * Creates a custom menu in Google Sheets.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 YES Community')
    .addItem('Send Bulk Message', 'sendBulkEmail')
    .addToUi();
}

/**
 * Sends a bulk email to everyone in the list.
 */
function sendBulkEmail() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    ui.alert('Error', 'No email addresses found in the sheet!', ui.ButtonSet.OK);
    return;
  }

  // 1. Ask for Subject
  var subjectResponse = ui.prompt('Send Email', 'Enter the email subject:', ui.ButtonSet.OK_CANCEL);
  if (subjectResponse.getSelectedButton() !== ui.Button.OK) return;
  var subject = subjectResponse.getResponseText();

  // 2. Ask for Message
  var messageResponse = ui.prompt('Send Email', 'Enter your message (this will be sent to everyone):', ui.ButtonSet.OK_CANCEL);
  if (messageResponse.getSelectedButton() !== ui.Button.OK) return;
  var message = messageResponse.getResponseText();

  // 3. Confirm
  var confirm = ui.alert('Confirm', 'Email will be sent to ' + (data.length - 1) + ' people. Are you ready?', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var sentCount = 0;
  var errorCount = 0;

  // Start from row 1 since row 0 is headers
  for (var i = 1; i < data.length; i++) {
    var email = data[i][1];
    if (email && email.indexOf('@') > -1) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          body: message
        });
        sentCount++;
      } catch (e) {
        errorCount++;
        Logger.log('Could not send to: ' + email + ' - Error: ' + e.message);
      }
    }
  }

  ui.alert('Completed', sentCount + ' messages sent successfully. ' + (errorCount > 0 ? errorCount + ' errors occurred.' : ''), ui.ButtonSet.OK);
}

