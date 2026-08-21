// Playwright 設定檔。
//
// 前端是純靜態 HTML，所以這裡用 `npm run dev`（也就是 python3 -m http.server 5501）
// 當測試伺服器：Playwright 會在跑測試前自動啟動它、測試結束後自動關掉。
//
// 後端（FastAPI）不會被這裡自動啟動，因為它需要啟用 venv、讀取 .env 裡的
// Gemini API key，跨資料夾自動處理容易變得又脆弱又難懂。所以後端要「自己先手動啟動」，
// 有沒有啟動會在 tests/global-setup.js 先檢查一次，忘記開的話會有清楚的中文錯誤訊息。
//
// fullyParallel 關掉、workers 設成 1：後端目前用 SQLite 存會員資料，SQLite
// 同一時間只允許一個寫入者。如果讓測試平行跑，多個瀏覽器分頭打 signup/login
// 這種會寫進資料庫的 API，偶爾會卡到 SQLite 的寫入鎖，讓某支測試莫名逾時
// （這是實測踩到的，不是猜的）。專案還小，全部序列跑一輪也才十幾秒，換取
// 100% 穩定值得。之後後端如果換成 Supabase / PostgreSQL（Phase 6 規劃），
// 這裡可以拿掉、重新打開平行執行。

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./tests/global-setup.js"),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],

  use: {
    baseURL: "http://127.0.0.1:5501",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 站上的 header 在 1380px 以下會整個收進手機版選單，但目前只有 index.html
        // 真的有漢堡按鈕可以再打開它（其他頁面的 nav-menu 在窄螢幕下完全點不到，
        // 這是既有的缺口，記在 PROJECT_ROADMAP.md，不是這裡要修的範圍）。用桌面寬度
        // 當視窗大小，這樣測試反映的是「桌面瀏覽器打開這個網站」的真實情況。
        // 這個要放在 devices["Desktop Chrome"] 展開「之後」，不然會被它自帶的
        // viewport 蓋掉——這是實測踩到的，Playwright 的 project.use 比 global use
        // 晚合併，devices 展開出來的 viewport 贏。
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5501/index.html",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
