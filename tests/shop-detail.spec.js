const { test, expect } = require("@playwright/test");

test.describe("店家詳情頁 shop_detail.html", () => {
  test("帶真實 id 會顯示對應店家的真實資料，不是寫死的假店家", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.goto("/shop_detail.html?id=matcha-mori-house");

    await expect(page.locator(".shop-info h1")).toHaveText("Matcha Mori House");
    await expect(page.locator(".shop-description")).toContainText(
      "matcha mille crepe"
    );
    await expect(page.locator(".tags .tag")).toHaveText([
      "Matcha",
      "Pudding",
      "Hojicha",
      "Quiet",
      "Work Friendly",
      "Limited Time",
    ]);
    // 評論筆數會隨其他測試檔案（reviews.spec.js）寫入的資料變動，這裡不鎖死
    // 筆數，只確認評論區塊是「真的評論」或「沒有評論的空狀態」，不是舊版那種
    // 不管有沒有真的評論、永遠顯示 3 則寫死種子文字的行為。
    const reviewCount = await page.locator(".review-list .review-item").count();
    if (reviewCount === 0) {
      await expect(page.locator(".review-list .empty-state h2")).toHaveText("No reviews yet");
    } else {
      await expect(page.locator(".review-list .review-item h4").first()).not.toHaveText("SugarTopia User");
    }

    // 這是之前 shop_detail.html 底部殘留一段沒用到的 Swiper 初始化腳本留下的
    // console 錯誤，已經刪掉了，這裡鎖住不要有人不小心複製貼上加回來。
    expect(errors.some((e) => e.includes("Swiper"))).toBe(false);
  });

  test("查無此店的 id 會顯示『Shop not found』，不是空白頁或殘留假資料", async ({
    page,
  }) => {
    await page.goto("/shop_detail.html?id=this-shop-does-not-exist");
    await expect(page.locator(".shop-info h1")).toHaveText("Shop not found");
  });
});
