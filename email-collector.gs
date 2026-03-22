// ============================================================
//  YES Community — Email List Collector
//  Google Apps Script — Web App
// ============================================================

// ──────────────────────────────────────────────────
//  1) UPDATE THIS URL after your first deployment!
// ──────────────────────────────────────────────────
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzwhCtFc3mXKNeuzS80XtbjBPQ4t0-CjuV1g6Q2v3M96cTNJednBJ8sXedvooSD8wjhbg/exec';

// ──────────────────────────────────────────────────
//  2) WELCOME EMAIL IMAGE (Base64)
//  Paste your image's Base64 string below between the quotes.
// ──────────────────────────────────────────────────
var WELCOME_IMAGE_DATA = ''; // Example: 'data:image/png;base64,iVBORw...'

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add header if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Email"]);
      sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    }

    var email = "";
    if (e.parameter && e.parameter.email) {
      email = e.parameter.email.trim();
    } else if (e.postData && e.postData.contents) {
      var body = JSON.parse(e.postData.contents);
      email = body.email ? body.email.trim() : "";
    }

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return buildResponse({ result: "error", message: "Invalid email address." });
    }

    // Check for duplicates
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        return buildResponse({ result: "duplicate", message: "This email is already registered!" });
      }
    }

    // Add new row
    sheet.appendRow([new Date(), email]);

    // NEW: Send Automatic Welcome Email
    if (email) {
      try {
        sendWelcomeEmail(email);
      } catch (e) {
        Logger.log('Welcome email error: ' + e.message);
      }
    }

    return buildResponse({ result: "success", message: "Successfully subscribed!" });

  } catch (err) {
    Logger.log('General error: ' + err.message);
    return buildResponse({ result: "error", message: err.message });
  }
}

/**
 * Sends a welcome email to a new subscriber.
 */
function sendWelcomeEmail(toEmail) {
  if (!toEmail || toEmail.indexOf('@') === -1) {
    Logger.log('Skipping email: Invalid recipient.');
    return;
  }

  var unsubscribeLink = WEB_APP_URL + "?action=unsubscribe&email=" + encodeURIComponent(toEmail);

  var subject = "🌱 Welcome to the YES Community!";
  
  // Use image if data is provided, otherwise fallback to text
  var bodyContent = "";
  var inlineImages = {};
  
  if (WELCOME_IMAGE_DATA && WELCOME_IMAGE_DATA.indexOf('base64,') > -1) {
    var cid = "welcome_poster";
    var base64Data = WELCOME_IMAGE_DATA.split(',')[1];
    var mimeType = WELCOME_IMAGE_DATA.split(',')[0].split(':')[1].split(';')[0];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, "welcome-poster");
    
    inlineImages[cid] = blob;
    bodyContent = '<div style="text-align:center;"><img src="cid:' + cid + '" style="width:100%; max-width:600px; border-radius:12px;"></div>';
  } else {
    bodyContent = "Hi there,<br><br>" +
                  "We're thrilled to have you join the Youth Environment Society (YES) community! 🌱<br><br>" +
                  "You're now on the list to be the first to hear about our environmental projects, upcoming events, and the steps we're taking toward a greener future.<br><br>" +
                  "Stay green,<br>" +
                  "The YES Community Team";
  }

  var htmlBody = bodyContent + 
                 "<br><br><hr><br>" +
                 "<div style='text-align:center;'><small style='color: #666;'>If you wish to stop receiving these emails, you can <a href='" + unsubscribeLink + "'>unsubscribe here</a>.</small></div>";
             
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody,
    inlineImages: inlineImages
  });
}

/**
 * Handles GET requests (for unsubscription links).
 */
function doGet(e) {
  var action = e.parameter.action;
  var email = e.parameter.email;

  Logger.log('GET request received. Action: ' + action + ', Email: ' + email);

  if (action === 'unsubscribe' && email) {
    var result = unsubscribeUser(email);
    var title = result ? "Unsubscribed Successfully" : "Unsubscribe Error";
    var color = result ? "#2d6a4f" : "#e07a5f";
    var icon = result ? "🌿" : "⚠️";
    var heading = result ? "We're sorry to see you go!" : "Something went wrong";
    var subtext = result ? 
      "You have been successfully removed from the YES Community mailing list. We hope to see you again soon!" : 
      "We couldn't find your email address or you've already unsubscribed.";

    var htmlContent = 
      "<!DOCTYPE html><html><head>" +
      "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
      "<link href='https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=DM+Sans:wght@400;500&display=swap' rel='stylesheet'>" +
      "<style>" +
      "body { font-family: 'DM Sans', sans-serif; background: #f0f4f0; color: #1a2e1a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }" +
      ".container { background: white; padding: 3rem 2rem; border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.06); max-width: 400px; width: 90%; }" +
      ".icon { font-size: 3rem; margin-bottom: 1rem; }" +
      "h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; margin-bottom: 1rem; color: " + color + "; }" +
      "p { color: #555; line-height: 1.6; margin-bottom: 2rem; }" +
      ".btn { display: inline-block; background: #2d6a4f; color: white; padding: 0.8rem 1.6rem; border-radius: 50px; text-decoration: none; font-weight: 600; transition: transform 0.2s; }" +
      ".btn:hover { transform: translateY(-2px); }" +
      "</style></head><body>" +
      "<div class='container'>" +
      "<div class='icon'>" + icon + "</div>" +
      "<h1>" + heading + "</h1>" +
      "<p>" + subtext + "</p>" +
      "<a href='https://moderathor12.github.io/yes/' class='btn'>Return to Website</a>" +
      "</div></body></html>";
    
    return HtmlService.createHtmlOutput(htmlContent)
      .setTitle(title + " — YES")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return buildResponse({ result: "ok", message: "YES Email Collector is running." });
}

/**
 * Removes a user's email from the sheet.
 */
function unsubscribeUser(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
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
    .addItem('Send Bulk Message (New)', 'showBulkEmailDialog')
    .addToUi();
}

/**
 * Shows the custom HTML dialog for bulk emails.
 */
function showBulkEmailDialog() {
  var html = HtmlService.createHtmlOutputFromFile('email-dialog')
      .setWidth(600)
      .setHeight(550)
      .setTitle('🚀 Send Bulk Message — YES');
  SpreadsheetApp.getUi().showModalDialog(html, '🚀 Send Bulk Message — YES');
}

/**
 * Processes and sends the bulk email from the HTML dialog.
 */
function processBulkEmail(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetData = sheet.getDataRange().getValues();
  
  if (sheetData.length <= 1) throw new Error('No email addresses found!');

  var subject = data.subject;
  var message = data.message;
  var imagePacks = data.images || []; // Array of { name: str, data: base64 }

  var inlineImages = {};
  var imageHtml = "";

  // Process images
  imagePacks.forEach(function(img, index) {
    var cid = "img_" + index;
    var base64Data = img.data.split(',')[1];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), img.type, img.name);
    inlineImages[cid] = blob;
    imageHtml += '<br><img src="cid:' + cid + '" style="max-width:100%; border-radius:12px; margin-top:1rem;"><br>';
  });

  var sentCount = 0;
  var errorCount = 0;

  for (var i = 1; i < sheetData.length; i++) {
    var email = sheetData[i][1];
    if (email && email.indexOf('@') > -1) {
      try {
        var unsubscribeLink = WEB_APP_URL + "?action=unsubscribe&email=" + encodeURIComponent(email);
        var finalHtml = message.replace(/\n/g, '<br>') + 
                        imageHtml + 
                        "<br><br><hr><br><small style='color: #666;'>To stop receiving these, <a href='" + unsubscribeLink + "'>unsubscribe</a>.</small>";

        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: finalHtml,
          inlineImages: inlineImages
        });
        sentCount++;
      } catch (e) {
        errorCount++;
      }
    }
  }

  return { sent: sentCount, errors: errorCount };
}

