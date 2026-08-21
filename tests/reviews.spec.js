const { test, expect } = require("@playwright/test");

function uniqueEmail() {
  return `playwright-review-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function signUp(page, name = "Review Writer") {
  const email = uniqueEmail();
  await page.goto("/signup.html");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", "testpassword123");
  await page.fill("#confirm-password", "testpassword123");
  await page.check("#terms");
  await page.click("button[type=submit]");
  await page.waitForURL("**/index.html");
}

// 這個檔案會真的寫評論進資料庫，理由跟 auth.spec.js / favorites.spec.js 一樣，序列執行。
test.describe.configure({ mode: "serial" });

test.describe("評論功能", () => {
  test("店家詳情頁還沒有評論時，顯示友善的空狀態而不是假評論", async ({ page }) => {
    await page.goto("/shop_detail.html?id=cloud-nine-gelato");
    await expect(page.locator(".review-list .empty-state h2")).toHaveText(
      "No reviews yet"
    );
  });

  test("從店家詳情頁點 Write a review 會帶著這間店的 id 過去，店名鎖定不能改", async ({
    page,
  }) => {
    await signUp(page);
    await page.goto("/shop_detail.html?id=matcha-mori-house");
    await page.click(".action-btn.write-review");
    await page.waitForURL("**/write_review.html?id=matcha-mori-house");
    await expect(page.locator(".locked-shop-name")).toHaveText("Matcha Mori House");
  });

  test("沒登入的人填完表單送出，會被導去登入頁，不會真的送出評論", async ({
    page,
  }) => {
    await page.goto("/write_review.html?id=matcha-mori-house");
    await page.fill("#review-text", "隨便寫一段測試用的評論內容");
    await page.locator("label[for='star1']").click();
    await page.click("button[type=submit]");
    await page.waitForURL("**/login.html");
  });

  test("登入後寫評論會成功送出，導回店家詳情頁並看到剛剛寫的內容", async ({
    page,
  }) => {
    await signUp(page, "真心推薦者");
    await page.goto("/write_review.html?id=matcha-mori-house");
    await page.fill("#review-text", "座位很舒服，抹茶千層真的好吃！");
    await page.locator("label[for='star1']").click();
    await page.click("button[type=submit]");
    await page.waitForURL("**/shop_detail.html?id=matcha-mori-house");

    const firstReview = page.locator(".review-list .review-item").first();
    await expect(firstReview.locator(".review-text")).toHaveText(
      "座位很舒服，抹茶千層真的好吃！"
    );
    await expect(firstReview.locator("h4")).toHaveText("真心推薦者");
  });

  test("剛剛寫的評論會出現在首頁 Latest Reviews（不再是寫死的假資料）", async ({
    page,
  }) => {
    await page.goto("/index.html");
    await expect(page.locator(".review-grid .review-card h2").first()).toHaveText(
      "Matcha Mori House"
    );
    await expect(
      page.locator(".review-grid .review-card .review-text").first()
    ).toHaveText("座位很舒服，抹茶千層真的好吃！");
  });

  test("沒有帶 id 直接打開 write_review.html，會看到真實店家清單的下拉選單", async ({
    page,
  }) => {
    await page.goto("/write_review.html");
    const options = await page.locator("#dessert-shop-id option").allTextContents();
    expect(options).toContain("Matcha Mori House");
    expect(options.length).toBeGreaterThan(1);
  });

  test("帶不存在的店家 id 打開 write_review.html，會顯示找不到店家，送出按鈕被停用", async ({
    page,
  }) => {
    await page.goto("/write_review.html?id=does-not-exist");
    await expect(page.locator("#dessert-shop-field")).toContainText(
      "Could not find this shop"
    );
    await expect(page.locator("button[type=submit]")).toBeDisabled();
  });
});
