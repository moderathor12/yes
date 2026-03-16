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

    // Yeni satır ekle
    sheet.appendRow([new Date(), email]);

    return buildResponse({ result: "success", message: "Kaydınız alındı!" });

  } catch (err) {
    return buildResponse({ result: "error", message: err.message });
  }
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
//  YENİ: TOPLU EL-POSTA GÖNDERME ÖZELLİĞİ
// ============================================================

/**
 * Google Tablo açıldığında üstte özel menü oluşturur.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 YES Community')
    .addItem('Toplu Mesaj Gönder', 'sendBulkEmail')
    .addToUi();
}

/**
 * Tablodaki tüm kullanıcılara toplu e-posta gönderir.
 */
function sendBulkEmail() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    ui.alert('Hata', 'Tabloda hiç e-posta adresi bulunamadı!', ui.ButtonSet.OK);
    return;
  }

  // 1. Konu Başlığını Sor
  var subjectResponse = ui.prompt('E-posta Gönder', 'E-posta konusunu (Subject) girin:', ui.ButtonSet.OK_CANCEL);
  if (subjectResponse.getSelectedButton() !== ui.Button.OK) return;
  var subject = subjectResponse.getResponseText();

  // 2. Mesaj İçeriğini Sor
  var messageResponse = ui.prompt('E-posta Gönder', 'Mesajınızı yazın (Tüm kullanıcılara gidecek):', ui.ButtonSet.OK_CANCEL);
  if (messageResponse.getSelectedButton() !== ui.Button.OK) return;
  var message = messageResponse.getResponseText();

  // 3. Onay Al
  var confirm = ui.alert('Onay', (data.length - 1) + ' kişiye e-posta gönderilecek. Hazır mısın?', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var sentCount = 0;
  var errorCount = 0;

  // İlk satır başlık olduğu için 1. satırdan başla
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
        Logger.log('Gönderilemedi: ' + email + ' - Hata: ' + e.message);
      }
    }
  }

  ui.alert('Tamamlandı', sentCount + ' mesaj başarıyla gönderildi. ' + (errorCount > 0 ? errorCount + ' hata oluştu.' : ''), ui.ButtonSet.OK);
}

