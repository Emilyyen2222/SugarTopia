# SugarTopia Frontend 筆記

這是 SugarTopia 的前端靜態網站，目前使用：

```text
HTML
CSS
JavaScript
```

目前不是 Vue 專案，也沒有使用 Vite / Nuxt。這不影響先串接後端 API，因為瀏覽器原生 JavaScript 可以直接用 `fetch()` 呼叫後端。

## 目前已整理的功能

1. 首頁搜尋欄可以跳到 `category.html` 並帶入搜尋條件。
2. `category.html` 會優先呼叫後端 `GET /api/shops` 渲染列表。
3. 分類頁 rating / category / features 篩選可以即時過濾列表。
4. 首頁 AI 問答區已接到 FastAPI 後端 `/api/chat`。
5. Login / Sign Up 已經接到真正的後端會員系統（`/api/auth/signup`、`/api/auth/login`、`/api/auth/logout`、`/api/auth/me`），登入狀態存在 `localStorage`，已登入的人打開 login/signup 頁會自動導回首頁。
6. 沒有功能的 `#` 連結會出現 demo 提示，不會看起來像壞掉。
7. 店家詳情頁 `shop_detail.html` 會依網址 `?id=` 動態讀取後端真實店家資料，查無資料會顯示「Shop not found」。
8. 收藏功能已接到真正的後端（`GET/POST /api/favorites`、`DELETE /api/favorites/{shop_id}`）：登入後可以在店家詳情頁點 Save 收藏/取消收藏，`favorites.html`「我的收藏」頁面可以看到自己收藏的店家，header 登入後會自動出現「My Favorites」連結。
9. 評論功能已接到真正的後端（`GET/POST /api/shops/{id}/reviews`、`GET /api/reviews/latest`）：`write_review.html` 真的會把評論存進資料庫（從店家詳情頁點 Write a review 會鎖定該店家，直接打開則是下拉選單選店家），店家詳情頁評論區跟首頁 Latest Reviews 都改成顯示真實評論，不再是寫死的假資料。
10. 全站 header 已經統一：原本每個頁面各自不同的分類連結／導覽列，改成單一「Categories」下拉選單（`.nav-menu .nav-categories`），選單內容直接沿用首頁 Categories 區塊那 8 個真實分類，不是另外一份清單。已登入時「My Favorites」會出現在 Categories 旁邊，不會擠到右側跟 logo 打架。
11. 修過一輪全站字體大小：之前很多地方（店家評分、標籤、按鈕文字、使用者名稱……）不小心把 `font-size` 寫成 `0.1rem`〜`0.5rem`（只有 1.6px〜8px），已經全部改成正常可讀的大小。
12. `shop_detail.html` 拿掉了 Menu / What's the vibe 兩個區塊（原本是跟真實店家對不上的肉桂捲示意圖），也拿掉了 `Js/site-data.js` 那份跟後端完全不同的 6 家假店家備援資料。
13. 修掉一個字體在寬螢幕上會爆版的問題（`html` 的 `font-size` 原本會隨視窗寬度浮動，最寬到 3 倍），現在固定 16px，任何視窗寬度下字級都一致。也把全站一直沒真的載入的 Poppins 字體接上 Google Fonts。
14. 新增一頁內部測試工具 `admin_places.html`，可以輸入店名向後端查真實 Google 店家資料（地址、評分、營業時間、Google Maps 連結），跟現有 7 家樣本店對照用，也可以直接點「加入 SugarTopia」補上分類/標籤後存進資料庫（後端 `POST /api/shops/curated`），存進去的店會馬上出現在 `/api/shops`、分類頁、店家詳情頁，跟其他真實店家一樣能被收藏、被評論。這頁刻意沒有掛在任何導覽列或連結上，只能直接打網址進去，不是給一般使用者看的功能。
15. 修掉分類頁右下角地圖沒有真的接上店家資料的問題：地圖原本是寫死的固定網址，現在會依照搜尋結果動態更新，每張有座標的店家卡片可以點「📍 View on map」對準那家店的位置；地圖上方會標出目前顯示的是哪家店，對應的卡片也會被反白標出來，一眼就看得出來現在地圖對到哪一筆結果。拿掉了原本示意用、沒有實際功能的「Start order」按鈕。

## 重要檔案

```text
index.html
```

首頁。

```text
category.html
```

甜點店列表與搜尋結果頁。

```text
Js/site-data.js
```

本地備用假資料。如果後端店家 API 暫時無法使用，前端會退回使用這份資料。

```text
Js/site-enhancements.js
```

搜尋、分類篩選、表單 demo、提示訊息等共用互動。分類頁會從後端取得店家資料：

```text
https://sugartopia-backend-673387630043.asia-east1.run.app/api/shops
```

```text
Js/gemini-chat.js
```

首頁 AI 問答，會呼叫：

```text
https://sugartopia-backend-673387630043.asia-east1.run.app/api/chat
```

```text
vercel.json
```

Vercel 靜態部署設定。

## 本機測試方式

現在可以用 npm script 開前端：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia
npm run dev
```

成功後打開：

```text
http://127.0.0.1:5501
```

如果你已經用 VS Code Live Server 開在 `5501`，`npm run dev` 可能會因為 port 被佔用而失敗。這時候二選一就好：

```text
方式一：繼續用 Go Live
方式二：先關掉 Live Server，再 npm run dev
```

如果只是看前端畫面，可以直接開：

```text
index.html
```

比較推薦用 VS Code Live Server，網址通常會像：

```text
http://127.0.0.1:5500/index.html
```

如果要測正式 AI 問答，現在可以直接使用 Cloud Run 線上後端。

如果你想測本機後端，也可以同時開著：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia_backend
source venv/bin/activate
uvicorn main:app --reload
```

## 自動化測試（Playwright E2E）

`tests/` 底下是用 Playwright 寫的端對端測試，會實際開一個瀏覽器把首頁、分類搜尋、店家詳情頁、註冊/登入流程都跑一次，確認畫面上真的長對樣子，不是只看程式碼猜。

第一次使用前先安裝：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia
npm install
npx playwright install chromium
```

跑測試前**要先手動啟動後端**（測試會打真實的 `/api/shops`、`/api/auth/*`），前端伺服器 Playwright 會自動幫你開/關，不用自己另外開。**注意這裡要用 `DATABASE_PATH` 指到一個測試專用的資料庫**，不要用平常開發在用的那個：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia_backend
source venv/bin/activate
DATABASE_PATH=sugartopia_test.db uvicorn main:app --reload
```

第一次執行會自動建立一個全新的 `sugartopia_test.db`（跟平常開發用的 `sugartopia_app.db` 完全分開的檔案，已加進 `.gitignore`），測試建立的假帳號都只會寫進這個檔案，不會混進你自己的開發資料。

接著回前端資料夾跑測試：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia
npm run test:e2e
```

想要看得到瀏覽器畫面、單步除錯，用互動介面：

```bash
npm run test:e2e:ui
```

如果忘記先開後端，`tests/global-setup.js` 會直接擋下來、印出清楚的中文提示；如果後端有開但用的是平常開發的 `sugartopia_app.db`，也會被擋下來、提示你改用 `DATABASE_PATH=sugartopia_test.db` 重開，不會讓測試資料不小心混進你的開發資料庫。

測試設定成只用 1 個 worker 序列執行（`playwright.config.js` 裡有寫原因）：後端目前用 SQLite 存會員資料，SQLite 同一時間只能有一個寫入者，平行測試會偶爾撞到寫入鎖讓某支測試莫名逾時，這是實測踩過的雷，不是預防性寫著好看的。之後後端換成 Supabase / PostgreSQL 之後可以把這個限制拿掉。

目前涵蓋的流程：

```text
首頁 AI 問答區、Latest Reviews 卡片、Categories 8 個磚的連結
分類頁搜尋（含查無資料時要顯示對的訊息，不能顯示成「後端掛了」）
店家詳情頁吃真實資料、查無此店時的錯誤畫面
註冊 → 自動登入 → header 顯示使用者
已登入的人打開 login/signup 會被導回首頁；沒登入的人不會被誤導開
收藏功能：沒登入點 Save 會被導去登入頁；登入後可以收藏/取消收藏；收藏狀態重新整理後還在；「我的收藏」頁面看得到收藏清單、也有正確的空狀態
評論功能：沒有評論時顯示空狀態而非假評論；從店家詳情頁寫評論會鎖定店家；沒登入送出會被導開；登入後送出評論會出現在店家詳情頁跟首頁 Latest Reviews；沒帶 id 打開會看到真實店家下拉選單；帶不存在的店家 id 會顯示錯誤
header 的 Categories 下拉選單：預設收起、點了才展開、點選單外面會自動收回去，選單內容跟首頁 Categories 磚是同一份真實分類
分類頁右下角的地圖：搜尋結果渲染完會自動對準第一筆有座標的店家；點某張卡片的「View on map」會換成那家店的座標，不是全部共用同一個寫死的位置
```

測試視窗固定用桌面寬度（1440×900）：目前 header 在 1380px 以下會整個收進手機版選單，但只有 `index.html` 真的有漢堡按鈕能再打開它，其他頁面窄螢幕下完全點不到 nav-menu，這是已知、還沒處理的缺口（見 `PROJECT_ROADMAP.md`）。

## Vercel 部署方式

先進前端資料夾：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia
```

如果還沒有安裝 Vercel CLI：

```bash
npm i -g vercel
```

第一次部署預覽版：

```bash
vercel
```

正式部署：

```bash
vercel --prod
```

注意：目前 AI API 網址已經是 Cloud Run 正式後端：

```javascript
const chatApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app/api/chat";
```

分類頁店家列表也會呼叫 Cloud Run：

```javascript
const shopsApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app/api/shops";
```

## 下一階段建議

1. 把收藏、評論表單接到後端資料庫（登入 / 註冊已經是真的了，見上面「目前已整理的功能」）。
2. 如果功能穩定後，再考慮重構成 Vue。

## 中英文切換要現在做嗎？

建議先不要現在完整做。

原因是中英文切換不是只加一顆按鈕，還需要整理全站文字：

1. Header / footer 文字。
2. 首頁標題與搜尋 placeholder。
3. 店家分類與評論文字。
4. Login / Sign Up / Write Review 表單。
5. AI 問答區提示文字。
6. 錯誤訊息與 demo 提示。

目前比較好的順序是：

```text
先把前端功能跑通
再整理資料與頁面
最後做中英文切換
```

之後要做時，可以用一個 `translations.js` 集中管理文案，例如：

```javascript
const translations = {
  en: {
    searchPlaceholder: "Search Dessert Shops"
  },
  zh: {
    searchPlaceholder: "搜尋甜點店"
  }
};
```

如果現在硬做，很容易變成有些地方有翻譯、有些地方還是英文，後面維護會比較亂。
