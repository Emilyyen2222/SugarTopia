const { test, expect } = require("@playwright/test");

function uniqueEmail() {
  return `playwright-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

async function signUp(page, { name = "Playwright Tester", password = "testpassword123" } = {}) {
  const email = uniqueEmail();
  await page.goto("/signup.html");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirm-password", password);
  await page.check("#terms");
  await page.click("button[type=submit]");
  await page.waitForURL("**/index.html");
  return { email, name };
}

test.describe("會員登入/註冊", () => {
  // 這個 describe 底下每支測試都會真的打 POST /api/auth/signup 寫進後端的
  // SQLite。SQLite 同一時間只能有一個寫入者，如果讓 Playwright 用預設的多
  // worker 平行跑這幾支測試，會變成好幾個 signup 請求同時搶著寫同一個
  // sugartopia_app.db，容易踩到 SQLite 的寫入鎖，讓某幾支測試莫名逾時。
  // 用 serial 模式讓這個檔案裡的測試排隊、一支一支跑，就不會撞在一起。
  // 之後如果後端換成 Supabase / PostgreSQL（Phase 6 規劃），支援多個
  // 同時寫入，這行就可以拿掉了。
  test.describe.configure({ mode: "serial" });

  test("註冊會建立帳號、自動登入，header 會顯示使用者名稱", async ({ page }) => {
    const { name } = await signUp(page);
    await expect(page.locator(".auth-user")).toHaveText(`Hi, ${name}`);
  });

  test("已登入的使用者打開 login.html 會被導回首頁，看不到登入表單", async ({
    page,
  }) => {
    await signUp(page);
    await page.goto("/login.html");
    await page.waitForURL("**/index.html");
    // 確認真的是被導開了，不是剛好也在 index.html 上有一個一樣的表單
    await expect(page.locator("[data-auth-form='login']")).toHaveCount(0);
  });

  test("已登入的使用者打開 signup.html 也會被導回首頁", async ({ page }) => {
    await signUp(page);
    await page.goto("/signup.html");
    await page.waitForURL("**/index.html");
  });

  test("沒登入的訪客打開 login.html 會正常看到表單，不會被誤導開", async ({
    page,
  }) => {
    await page.goto("/login.html");
    await expect(page.locator("[data-auth-form='login']")).toBeVisible();
    // 沒登入的情況下網址應該還是停在 login.html，不會被上面那條導開邏輯誤判
    expect(page.url()).toContain("login.html");
  });
});
