/* =========================================================
   سكربت Google Sheets لدعوة الزفاف
   يحفظ تأكيدات الحضور والمباركات، ويرجع المباركات لعرضها في الدعوة
   طريقة التركيب موجودة في آخر الملف
   ========================================================= */

const SHEET_NAME = "الردود";

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["التاريخ", "الاسم", "الحضور", "عدد الأشخاص", "المباركة", "إظهار المباركة"]);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }
  return sh;
}

// يمنع تنفيذ الصيغ لو كتب أحد نصاً يبدأ بـ = أو + ...
function clean_(v, max) {
  v = String(v || "").trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// استقبال رد جديد من الدعوة
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([
      new Date(),
      clean_(d.name, 60),
      d.attending ? "سيحضر" : "معتذر",
      d.attending ? Number(d.count) || 1 : 0,
      clean_(d.wish, 500),
      true,
    ]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput("ok");
}

// إرجاع المباركات الظاهرة (الأحدث أولاً)
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter(r => r[4] && r[5] !== false && String(r[5]).toUpperCase() !== "FALSE")
    .map(r => ({ name: String(r[1]), text: String(r[4]).replace(/^'/, "") }))
    .reverse();
  return ContentService.createTextOutput(JSON.stringify(wishes))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   طريقة التركيب:
   1) افتح Google Sheets وأنشئ جدولاً جديداً.
   2) من القائمة: Extensions (الإضافات) ← Apps Script.
   3) احذف الكود الموجود والصق هذا الملف كاملاً، ثم احفظ.
   4) Deploy (نشر) ← New deployment ← اختر النوع Web app
        - Execute as: Me
        - Who has access: Anyone
      ثم Deploy، ووافق على الصلاحيات.
   5) انسخ رابط Web app (ينتهي بـ /exec) وضعه في index.html
      داخل CONFIG في الحقل sheetUrl.

   لإخفاء مباركة غير مناسبة: غيّر خانة "إظهار المباركة" لها إلى FALSE.
   ملاحظة: لو عدّلت الكود لاحقاً، انشره من Manage deployments ← Edit ← New version
   حتى يبقى نفس الرابط.
   ========================================================= */
