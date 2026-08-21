// 這支檔案會在所有測試開始「之前」先跑一次。
// 目的一：SugarTopia 前端很多頁面都要打後端 API 才有真實資料可以測，
// 如果後端沒有先啟動，測試會在各自的斷言裡失敗，但錯誤訊息通常很難看出
// 「其實只是忘記開後端」。這裡先主動檢查一次，沒開的話就直接用清楚的
// 訊息讓整批測試失敗，而不是留給每一支測試各自用不明原因的 timeout 收場。
//
// 目的二：測試（尤其是 auth.spec.js）會真的呼叫 POST /api/auth/signup 寫進
// 資料庫。如果後端當下用的是平常開發在用的 sugartopia_app.db，測試帳號會
// 混進真實資料，之後還要手動清理。所以這裡也會檢查後端目前連的是哪個
// database 檔案（main.py 的 /health 有回傳這個資訊），如果偵測到是正式
// 開發用的檔案就直接擋下來，請你改用測試專用的資料庫重開後端。

const BACKEND_URL = process.env.SUGARTOPIA_API_URL || "http://127.0.0.1:8000";
const DEV_DATABASE_NAME = "sugartopia_app.db";

module.exports = async () => {
  let health;

  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }
    health = await response.json();
  } catch (error) {
    throw new Error(
      `\n\n找不到跑起來的 SugarTopia 後端（${BACKEND_URL}）。\n` +
        `請先在 SugarTopia_backend 資料夾另開一個終端機執行：\n\n` +
        `  source venv/bin/activate\n` +
        `  DATABASE_PATH=sugartopia_test.db uvicorn main:app --reload\n\n` +
        `後端啟動後再重新執行測試。（原始錯誤：${error.message}）\n`
    );
  }

  if (health.database === DEV_DATABASE_NAME) {
    throw new Error(
      `\n\n後端目前連的是平常開發在用的資料庫（${DEV_DATABASE_NAME}）。\n` +
        `測試會建立真的帳號寫進去，混到你自己的開發資料，所以先擋下來。\n\n` +
        `請把後端終端機停掉（Ctrl+C），改用測試專用的資料庫重新啟動：\n\n` +
        `  DATABASE_PATH=sugartopia_test.db uvicorn main:app --reload\n\n` +
        `這樣後端會自己建一個全新的 sugartopia_test.db（跟平常開發用的檔案完全分開，\n` +
        `已加進 .gitignore，不會被提交），測試愛怎麼寫都不會動到你真正的資料。\n`
    );
  }
};
