const { test, expect } = require("@playwright/test");

// 這個檔案專門鎖住一個踩過的雷：style.css / category.css / shop_detail.css
// 都各自有一條 `html { font-size: clamp(1rem, 2vw, 3rem); }`，會讓網站的
// rem 字級單位隨瀏覽器視窗寬度跑掉——視窗越寬，1rem 實際變得越大（最多到
// 48px，是正常 16px 的 3 倍），造成寬螢幕上文字整個爆版、互相蓋住。
// 已經改成固定 16px，這裡確保不管視窗多寬、開哪個頁面，1rem 永遠等於
// 瀏覽器標準的 16px，不會有人不小心又把 clamp() 加回去。
async function getRootFontSize(page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
}

const pagesToCheck = [
  { path: "/index.html", label: "首頁（style.css）" },
  { path: "/category.html", label: "分類頁（category.css）" },
  { path: "/shop_detail.html?id=matcha-mori-house", label: "店家詳情頁（shop_detail.css）" },
];

test.describe("字體大小不會隨視窗寬度跑掉", () => {
  for (const { path, label } of pagesToCheck) {
    test(`${label}：1rem 在窄視窗跟寬視窗都固定是 16px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      expect(await getRootFontSize(page)).toBe("16px");

      // 模擬很寬的桌機螢幕（例如 2560px 寬），這正是之前爆版的視窗寬度
      await page.setViewportSize({ width: 2560, height: 1200 });
      await page.reload();
      expect(await getRootFontSize(page)).toBe("16px");
    });
  }
});
