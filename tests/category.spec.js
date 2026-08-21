const { test, expect } = require("@playwright/test");

test.describe("分類頁 category.html", () => {
  test("搜尋 matcha 可以找到後端真實的抹茶店家", async ({ page }) => {
    await page.goto("/category.html?q=matcha");
    await expect(page.locator(".result-count")).toHaveText("1 shop found");
    await expect(page.locator(".shop-item h2")).toContainText("Matcha Mori House");
  });

  test("查無資料的分類要顯示友善的『沒有符合的店家』，不能顯示成『後端掛了』", async ({
    page,
  }) => {
    // Macaron 目前的樣本資料裡沒有任何店家，這是刻意測試「後端有回應、
    // 但結果剛好是 0 筆」跟「後端真的連不上」要顯示不同訊息這件事。
    await page.goto("/category.html?q=Macaron");
    await expect(page.locator(".empty-state h2")).toHaveText(
      "No matching dessert shops yet"
    );
    await expect(page.locator(".result-count")).not.toContainText(
      "not available"
    );
  });

  test("店家卡片的連結會帶上真實的 shop id，可以點進對應詳情頁", async ({
    page,
  }) => {
    await page.goto("/category.html?q=matcha");
    const href = await page
      .locator(".shop-item .map-link")
      .first()
      .getAttribute("href");
    expect(href).toBe("shop_detail.html?id=matcha-mori-house");
  });

  test("右下角的地圖會跟著搜尋結果動態更新，不再是寫死的固定位置", async ({
    page,
  }) => {
    // matcha-mori-house 在松山區，渲染完結果後地圖應該自動對準它，
    // 不是專案原本那個永遠不變的台北市預設位置。
    await page.goto("/category.html?q=matcha");
    await expect(page.locator("#shopMapEmbed")).toHaveAttribute(
      "src",
      /25\.05,121\.5578/
    );

    // q=cake 會同時找到大安區跟內湖區兩家店，先確認自動對準第一筆（大安區），
    // 再點第二家的「View on map」，確認地圖真的換成內湖區的座標，
    // 證明每張卡片各自帶著自己的座標，不是全部共用同一組。
    await page.goto("/category.html?q=cake");
    await expect(page.locator(".shop-item")).toHaveCount(2);
    await expect(page.locator("#shopMapEmbed")).toHaveAttribute(
      "src",
      /25\.0263,121\.5432/
    );

    await page.locator(".shop-item").nth(1).locator(".view-on-map-btn").click();
    await expect(page.locator("#shopMapEmbed")).toHaveAttribute(
      "src",
      /25\.0693,121\.5885/
    );
  });

  test("側欄的分類篩選按鈕會換成只看那個分類，不會疊加在目前網址的搜尋條件上", async ({
    page,
  }) => {
    // 之前的寫法是「疊加」：網址已經是 ?q=Bagels 時，再點側欄的 Cafes
    // 篩選按鈕，邏輯會變成同時要符合 Bagels 又符合 Cafes，通常兜不出結果，
    // 跟首頁 Categories 磚點 Cafes 的結果完全不一樣，會讓人以為資料不見了。
    await page.goto("/category.html?q=Bagels");
    await expect(page.locator(".shop-item")).toHaveCount(1);

    await page.locator(".filters .category-button", { hasText: "Cafes" }).click();
    await page.waitForURL("**/category.html?q=Cafes");
    await expect(page.locator(".shop-item").first()).toBeVisible();
  });

  test("沒有照片的店家（例如 Google Places 收錄進來、目前刻意不處理照片的店家）會顯示佔位圖，不是破圖", async ({
    page,
  }) => {
    // 這裡故意不倚賴資料庫裡剛好有哪家真實店家沒照片——curated_shops 的
    // 店家一定要打真的 Google Places API 才能建立，測試環境不該依賴呼叫
    // 外部真實 API。直接呼叫 buildShopCardHtml()（跟 renderShopList() 用的
    // 是同一份邏輯）餵一個 image 是空字串的假資料，驗證的是「畫面遇到沒有
    // 照片的店家時會怎麼處理」這個邏輯本身，不是某一筆特定的真實資料。
    await page.goto("/category.html?q=Bagels");
    await expect(page.locator(".shop-item").first()).toBeVisible();

    const cardHtml = await page.evaluate(() => {
      return window.buildShopCardHtml(
        { id: "no-photo-test", name: "No Photo Shop", rating: 4.5, reviews: "1 review", tags: [], description: "", image: "" },
        0
      );
    });

    expect(cardHtml).toContain('src="img/no-photo.svg"');
    expect(cardHtml).not.toContain('src=""');

    await page.setContent(cardHtml);
    const naturalWidth = await page.locator("img").evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });
});
