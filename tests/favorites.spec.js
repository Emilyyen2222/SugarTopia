const { test, expect } = require("@playwright/test");

function uniqueEmail() {
  return `playwright-fav-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function signUp(page) {
  const email = uniqueEmail();
  await page.goto("/signup.html");
  await page.fill("#name", "Favorites Tester");
  await page.fill("#email", email);
  await page.fill("#password", "testpassword123");
  await page.fill("#confirm-password", "testpassword123");
  await page.check("#terms");
  await page.click("button[type=submit]");
  await page.waitForURL("**/index.html");
}

// 這個檔案跟 auth.spec.js 一樣會真的寫進資料庫（收藏也是一種寫入），
// 用同樣的理由跑序列模式，見 auth.spec.js 開頭的說明。
test.describe.configure({ mode: "serial" });

test.describe("收藏功能", () => {
  test("沒登入的訪客點 Save 會被導去登入頁，不會直接收藏成功", async ({ page }) => {
    await page.goto("/shop_detail.html?id=matcha-mori-house");
    await page.click(".action-btn.save");
    await page.waitForURL("**/login.html");
  });

  test("登入後點 Save 可以收藏、再點一次可以取消收藏", async ({ page }) => {
    await signUp(page);
    await page.goto("/shop_detail.html?id=matcha-mori-house");

    const saveButton = page.locator(".action-btn.save");
    await expect(saveButton).toContainText("Save");
    await expect(saveButton).not.toHaveClass(/is-favorited/);

    await saveButton.click();
    await expect(saveButton).toHaveClass(/is-favorited/);
    await expect(saveButton).toContainText("Saved");

    await saveButton.click();
    await expect(saveButton).not.toHaveClass(/is-favorited/);
    await expect(saveButton).toContainText("Save");
  });

  test("收藏過的店家會出現在「我的收藏」頁面，重新整理詳情頁也記得收藏狀態", async ({
    page,
  }) => {
    await signUp(page);
    await page.goto("/shop_detail.html?id=matcha-mori-house");
    await page.click(".action-btn.save");
    await expect(page.locator(".action-btn.save")).toHaveClass(/is-favorited/);

    // 重新整理詳情頁，確認收藏狀態是從後端讀回來的，不是只存在當下這次點擊的記憶體裡
    await page.reload();
    await expect(page.locator(".action-btn.save")).toHaveClass(/is-favorited/);

    await page.goto("/favorites.html");
    await expect(page.locator(".favorites-page h1")).toHaveText("My Favorites");
    await expect(page.locator(".favorites-page .shop-item h2")).toContainText(
      "Matcha Mori House"
    );
  });

  test("沒有任何收藏時，我的收藏頁面顯示友善的空狀態", async ({ page }) => {
    await signUp(page);
    await page.goto("/favorites.html");
    await expect(page.locator(".favorites-page .empty-state h2")).toHaveText(
      "No favorites yet"
    );
  });

  test("沒登入的訪客打開我的收藏頁面，會看到請先登入的提示，不是空白或報錯", async ({
    page,
  }) => {
    await page.goto("/favorites.html");
    await expect(page.locator(".favorites-page .empty-state h2")).toHaveText(
      "Please log in first"
    );
  });

  test("已登入的人 header 會出現 My Favorites 連結，可以點過去", async ({
    page,
  }) => {
    await signUp(page);
    await page.goto("/index.html");
    await page.click(".auth-favorites");
    await page.waitForURL("**/favorites.html");
  });
});
