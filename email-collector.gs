// ============================================================
//  YES Community — Email List Collector
//  Google Apps Script — Web App
// ============================================================

// ──────────────────────────────────────────────────
//  1) UPDATE THIS URL after your first deployment!
// ──────────────────────────────────────────────────
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyBsjdx0bgUKSiF6Qk_KSc7vRihrib7ENGnDh5xxurPKGzJJ9mUoaVa7L9V3K1cSLNfEQ/exec';

// ──────────────────────────────────────────────────
//  2) WELCOME EMAIL IMAGE (Base64)
//  Paste your image's Base64 string below between the quotes.
// ──────────────────────────────────────────────────
var WELCOME_IMAGE_DATA_EN = ''; // Current English Poster
var WELCOME_IMAGE_DATA_AZ = ''; // New Azerbaijani Poster

// ──────────────────────────────────────────────────
//  3) ADMIN SETTINGS
// ──────────────────────────────────────────────────
var ADMIN_PASSWORD = 'YES_ADMIN_2026'; // Change this to your desired password

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add header if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Email", "Language preference",
        "Name", "City", "District", "Edu Type", "School Name", "School Grade",
        "Uni Name", "Uni Major", "Uni Year", "Other Activity",
        "Interests", "Source", "Note"
      ]);
      sheet.getRange(1, 1, 1, 16).setFontWeight("bold");
    }

    var email = "";
    var lang = "en"; // default
    var action = "";
    var body = {};

    if (e.parameter && e.parameter.email) {
      email = e.parameter.email.trim();
      lang = e.parameter.lang ? e.parameter.lang.trim().toLowerCase() : "en";
      action = e.parameter.action ? e.parameter.action.trim() : "";
    } else if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
      email = body.email ? body.email.trim() : "";
      lang = body.lang ? body.lang.trim().toLowerCase() : "en";
      action = body.action ? body.action.trim() : "";
    }

    // ──────────────────────────────────────────────────
    //  Action Handling (Gallery & Admin)
    // ──────────────────────────────────────────────────
    if (action === "getEvents") {
      return buildResponse({ result: "success", data: getEvents() });
    }

    if (action === "addEvent") {
      if (body.password !== ADMIN_PASSWORD) return buildResponse({ result: "error", message: "Invalid password" });
      addEvent(body.event);
      return buildResponse({ result: "success", message: "Event added!" });
    }

    if (action === "deleteEvent") {
      if (body.password !== ADMIN_PASSWORD) return buildResponse({ result: "error", message: "Invalid password" });
      deleteEvent(body.id);
      return buildResponse({ result: "success", message: "Event deleted!" });
    }

    // Default Email Collection Logic
    if (!email) {
      return buildResponse({ result: "error", message: "Email is required." });
    }

    // Check for duplicates
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        return buildResponse({ result: "duplicate", message: "This email is already registered!" });
      }
    }

    // Add new row with all survey fields
    sheet.appendRow([
      new Date(),
      email,
      lang.toUpperCase(),
      body.name || "",
      body.city || "",
      body.district || "",
      body.edu_type || "",
      body.school_name || "",
      body.school_grade || "",
      body.uni_name || "",
      body.uni_major || "",
      body.uni_year || "",
      body.other_activity || "",
      body.interests || "",
      body.source || "",
      body.note || ""
    ]);

    // NEW: Send Automatic Welcome Email
    if (email) {
      try {
        sendWelcomeEmail(email, lang);
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
function sendWelcomeEmail(toEmail, lang) {
  if (!toEmail || toEmail.indexOf('@') === -1) {
    Logger.log('Skipping email: Invalid recipient.');
    return;
  }

  lang = (lang || "en").toLowerCase();
  var unsubscribeLink = WEB_APP_URL + "?action=unsubscribe&email=" + encodeURIComponent(toEmail);

  var subjects = {
    en: "🌱 Welcome to the YES Community!",
    az: "🌱 YES İcmasına Xoş Gəlmisiniz!"
  };
  var subject = subjects[lang] || subjects.en;
  
  // Use image matching the language if data is provided, otherwise fallback to text
  var bodyContent = "";
  var inlineImages = {};
  
  var activeImageData = (lang === 'az') ? WELCOME_IMAGE_DATA_AZ : WELCOME_IMAGE_DATA_EN;
  
  if (activeImageData && activeImageData.indexOf('base64,') > -1) {
    var cid = "welcome_poster";
    var base64Data = activeImageData.split(',')[1];
    var mimeType = activeImageData.split(',')[0].split(':')[1].split(';')[0];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, "welcome-poster");
    
    inlineImages[cid] = blob;
    bodyContent = '<div style="text-align:center;"><img src="cid:' + cid + '" style="width:100%; max-width:600px; border-radius:12px;"></div>';
  } else {
    if (lang === 'az') {
      bodyContent = "Salam,<br><br>" +
                    "YES (Gənclərin Ekoloji Cəmiyyəti) icmasına qoşulduğunuz üçün şadıq! 🌱<br><br>" +
                    "Siz artıq ekoloji layihələrimiz, qarşıdan gələn tədbirlər və daha yaşıl gələcək üçün atdığımız addımlar barədə ilk məlumat alanlar siyahısındasınız.<br><br>" +
                    "Yaşıl qalın,<br>" +
                    "YES İcması Komandası";
    } else {
      bodyContent = "Hi there,<br><br>" +
                    "We're thrilled to have you join the Youth Environment Society (YES) community! 🌱<br><br>" +
                    "You're now on the list to be the first to hear about our environmental projects, upcoming events, and the steps we're taking toward a greener future.<br><br>" +
                    "Stay green,<br>" +
                    "The YES Community Team";
    }
  }

  var azUnsubscribe = "Abunəlikdən çıxmaq istəyirsinizsə, <a href='" + unsubscribeLink + "'>buradan</a> çıxa bilərsiniz.";
  var enUnsubscribe = "If you wish to stop receiving these emails, you can <a href='" + unsubscribeLink + "'>unsubscribe here</a>.";
  var activeUnsubscribe = (lang === 'az') ? azUnsubscribe : enUnsubscribe;

  var htmlBody = bodyContent + 
                 "<br><br><hr><br>" +
                 "<div style='text-align:center;'><small style='color: #666;'>" + activeUnsubscribe + "</small></div>";
             
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody,
    inlineImages: inlineImages
  });
}

// ──────────────────────────────────────────────────
//  EVENT MANAGEMENT FUNCTIONS
// ──────────────────────────────────────────────────

function getEventsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Events");
  if (!sheet) {
    sheet = ss.insertSheet("Events");
    sheet.appendRow(["ID", "Title EN", "Title AZ", "Desc EN", "Desc AZ", "ImageBase64", "Timestamp"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
  }
  return sheet;
}

function getEvents() {
  var sheet = getEventsSheet();
  var data = sheet.getDataRange().getValues();
  var events = [];
  for (var i = 1; i < data.length; i++) {
    events.push({
      id: data[i][0],
      title_en: data[i][1],
      title_az: data[i][2],
      desc_en: data[i][3],
      desc_az: data[i][4],
      image: data[i][5],
      timestamp: data[i][6]
    });
  }
  return events.reverse(); // Newest first
}

function addEvent(event) {
  var sheet = getEventsSheet();
  var id = "ev_" + new Date().getTime();
  sheet.appendRow([
    id,
    event.title_en,
    event.title_az,
    event.desc_en,
    event.desc_az,
    event.image,
    new Date()
  ]);
}

function deleteEvent(id) {
  var sheet = getEventsSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

/**
 * Handles GET requests (for unsubscription links).
 */
function doGet(e) {
  var action = e.parameter.action;
  var email = e.parameter.email;
  var articleId = e.parameter.id;

  Logger.log('GET request received. Action: ' + action + ', Email: ' + email + ', ID: ' + articleId);

  // 1) Handle Article Sharing Previews
  if (articleId) {
    return serveArticlePreview(articleId);
  }

  // 2) Handle Unsubscribe
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
      "<a href='https://youthensoc.org/' class='btn'>Return to Website</a>" +
      "</div></body></html>";
    
    return HtmlService.createHtmlOutput(htmlContent)
      .setTitle(title + " — YES")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return buildResponse({ result: "ok", message: "YES Email Collector is running." });
}

/**
 * Serves an HTML page with Open Graph tags for social media previews.
 * Then redirects the user to the main website with the article open.
 */
function serveArticlePreview(id) {
  var events = getEvents();
  var ev = null;
  for (var i = 0; i < events.length; i++) {
    if (events[i].id === id) {
      ev = events[i];
      break;
    }
  }
  
  var siteUrl = "https://youthensoc.org/";
  var title = "Youth Environment Society — YES";
  var desc = "Empowering the next generation of environmental advocates for a sustainable future.";
  var image = siteUrl + "plant%20image.png";
  var redirectUrl = siteUrl + "#article-" + id;

  if (ev) {
    title = ev.title_en + " — YES";
    desc = ev.desc_en;
    if (desc.length > 200) desc = desc.substring(0, 197) + "...";
    
    // Use event image if it starts with http (hosted), otherwise fallback to site logo
    if (ev.image && ev.image.indexOf('http') === 0) {
      image = ev.image;
    }
  }

  // Escape single quotes for HTML attribute and JS string
  title = title.replace(/'/g, "&#39;");
  desc = desc.replace(/'/g, "&#39;");

  var html = "<!DOCTYPE html><html><head>" +
    "<meta charset='UTF-8'>" +
    "<title>" + title + "</title>" +
    "<meta property='og:title' content='" + title + "'>" +
    "<meta property='og:description' content='" + desc + "'>" +
    "<meta property='og:image' content='" + image + "'>" +
    "<meta property='og:url' content='" + redirectUrl + "'>" +
    "<meta property='og:type' content='article'>" +
    "<meta name='twitter:card' content='summary_large_image'>" +
    "<meta http-equiv='refresh' content='1; url=" + redirectUrl + "'>" +
    "<style>body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f4f0; color: #1a2e1a; text-align: center; } .loader { border: 4px solid #f3f3f3; border-top: 4px solid #2d6a4f; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin: 0 auto 20px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>" +
    "</head><body>" +
    "<div><div class='loader'></div>" +
    "<h3>" + title + "</h3>" +
    "<p>Redirecting to Youth Environment Society...<br><br><a href='" + redirectUrl + "'>Click here if you are not redirected</a></p></div>" +
    "<script>setTimeout(function(){ window.location.href='" + redirectUrl + "'; }, 500);</script>" +
    "</body></html>";

  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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

