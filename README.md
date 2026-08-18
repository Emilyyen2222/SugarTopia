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
2. `category.html` 會用 `Js/site-data.js` 的本地店家資料渲染列表。
3. 分類頁 rating / category / features 篩選可以即時過濾列表。
4. 首頁 AI 問答區已接到 FastAPI 後端 `/api/chat`。
5. Login / Sign Up / Write Review 表單目前是 demo，不會真的寫入資料庫，但會顯示使用者回饋。
6. 沒有功能的 `#` 連結會出現 demo 提示，不會看起來像壞掉。

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

目前前端用的本地假資料。之後如果有資料庫或後端店家 API，可以從這裡開始替換。

```text
Js/site-enhancements.js
```

搜尋、分類篩選、表單 demo、提示訊息等共用互動。

```text
Js/gemini-chat.js
```

首頁 AI 問答，會呼叫：

```text
http://127.0.0.1:8000/api/chat
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

如果要測 AI 問答，後端也要同時開著：

```bash
cd /Users/mike/Documents/emily_project_archive/SugarTopia_backend
source venv/bin/activate
uvicorn main:app --reload
```

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

注意：目前 AI API 網址還是本機：

```javascript
const chatApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app/api/chat";
```

所以前端上 Vercel 後，AI 問答要等 FastAPI 後端也部署到正式網址，才能讓其他人使用。

之後後端部署完成後，要把 `Js/gemini-chat.js` 裡的網址改成正式後端網址，例如：

```javascript
const chatApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app/api/chat";
```

## 下一階段建議

1. 把登入 / 註冊接到真正的會員後端。
2. 把評論表單接到後端資料庫。
3. 把 `Js/site-data.js` 的假資料改成後端 API。
4. 後端部署完成後，把 AI API URL 換成正式網址。
5. 如果功能穩定後，再考慮重構成 Vue。

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
