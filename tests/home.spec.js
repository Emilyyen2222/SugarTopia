const { test, expect } = require("@playwright/test");

test.describe("首頁 index.html", () => {
  test("AI 問答區塊有正常顯示", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator(".ai-chat-heading h2")).toHaveText(
      "Ask for a dessert recommendation"
    );
    await expect(page.locator("#chatInput")).toBeVisible();
  });

  test("手機版 hero：圖片滿版貼齊螢幕邊緣、文字區塊左邊界對齊、對話框不會超出螢幕", async ({
    page,
  }) => {
    // 踩過的雷：(1) .chat-messages 沒寫 box-sizing，預設 content-box 會讓
    // padding/border 疊加在 width:100% 之上，手機寬度下整個超出螢幕右邊；
    // (2) .overlay-text 多了一個 margin-left: 10px，跟下面的 .ai-chat-heading
    // 左邊界對不齊，看起來像沒有真的靠左對齊。這裡在真實手機寬度下用
    // getBoundingClientRect 直接量，鎖住這三件事。
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/index.html");
    await page.waitForTimeout(200);

    const rects = await page.evaluate(() => {
      const rectOf = (sel) => document.querySelector(sel)?.getBoundingClientRect();
      return {
        swiper: rectOf(".swiper"),
        overlayText: rectOf(".overlay-text"),
        aiChatHeading: rectOf(".ai-chat-heading"),
        chatMessages: rectOf(".chat-messages"),
      };
    });

    expect(rects.swiper.left).toBe(0);
    expect(rects.swiper.right).toBe(375);
    expect(rects.overlayText.left).toBeCloseTo(rects.aiChatHeading.left, 0);
    expect(rects.chatMessages.right).toBeLessThanOrEqual(375);
  });

  test("手機版（≤1024px）AI 問答不會被隱藏，會排在圖片下面、Latest Reviews 上面", async ({
    page,
  }) => {
    // 踩過的雷：.left-side（裝著 AI 問答）原本在 ≤1024px 直接 display:none，
    // 手機版完全用不到 AI 問答。現在改成上下堆疊、圖片在上、AI 問答在下，
    // 這裡確認兩件事：AI 問答真的看得到，而且圖片排在它前面（上面）。
    await page.setViewportSize({ width: 390, height: 850 });
    await page.goto("/index.html");
    await page.waitForTimeout(200);

    await expect(page.locator("#chatForm")).toBeVisible();

    const swiperTop = await page.locator(".swiper").evaluate((el) => el.getBoundingClientRect().top);
    const leftSideTop = await page.locator(".left-side").evaluate((el) => el.getBoundingClientRect().top);
    expect(swiperTop).toBeLessThan(leftSideTop);
  });

  test("手機版 header 不會被卡在正中間的 logo 蓋住，write a review／cupertino.keki 收進漢堡選單", async ({
    page,
  }) => {
    // 踩過的雷：把 write a review／cupertino.keki 移進 header 之後，在真正的
    // 手機寬度（375〜428px）下，header-left（漢堡＋搜尋）跟 position: fixed
    // 卡在正中間的 logo 撞在一起。這裡用 iPhone 常見的 390px 寬度，確認
    // header-left 完全落在 logo 左邊、不會互相蓋住，同時確認這兩個連結真的
    // 出現在漢堡選單裡而不是 header 本體。
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/index.html");
    await page.waitForTimeout(200);

    const headerLeftRight = await page
      .locator(".header-left")
      .evaluate((el) => el.getBoundingClientRect().right);
    const logoLeft = await page
      .locator(".logo-container")
      .evaluate((el) => el.getBoundingClientRect().left);
    expect(headerLeftRight).toBeLessThanOrEqual(logoLeft);

    await expect(page.locator(".actions-write-review")).toBeHidden();
    await page.click("#mobile-menu");
    await expect(page.locator(".nav-menu-mobile-links")).toContainText("write a review");
    await expect(page.locator(".nav-menu-mobile-links")).toContainText("cupertino.keki");
  });

  test("hero 右半邊的圖片輪播四周留白要固定、對稱，不會隨螢幕寬度跑掉", async ({
    page,
  }) => {
    // 踩過的雷：Swiper 官方套件的 CSS 本來就幫 .swiper 設了
    // margin-left/right: auto（給一般區塊置中用），放進這裡的 flex 版面後
    // 被重新解讀成「把多餘空間吃掉、元件縮小置中」，寬螢幕下圖片兩側會露出
    // 不對稱、隨螢幕寬度變動的背景色空隙。設計原本就是要圖片「浮」在色塊
    // 裡、四周留一圈白邊（不是完全貼滿），所以這裡不是斷言「零空隙」，
    // 而是斷言「留白是固定的 40px、左右對稱」，抓的是「留白不穩定/不對稱」
    // 這個 bug 本身，不是「有留白」這件事。
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto("/index.html");
    await page.waitForTimeout(200);

    const rects = await page.evaluate(() => {
      const rectOf = (sel) => document.querySelector(sel)?.getBoundingClientRect();
      return {
        splitSection: rectOf(".split-section"),
        leftSide: rectOf(".left-side"),
        swiper: rectOf(".swiper"),
      };
    });

    const gapLeft = rects.swiper.left - rects.leftSide.right;
    const gapRight = rects.splitSection.right - rects.swiper.right;

    expect(gapLeft).toBeCloseTo(40, 0);
    expect(gapRight).toBeCloseTo(40, 0);
  });

  test("AI 問答對話變長時，最上面的 slogan 不會被固定在頂端的 header 蓋住", async ({
    page,
  }) => {
    // 踩過的雷：.split-section 原本是寫死的 height: 800px，且沒有幫
    // position: fixed 的 header 保留空間。對話一多，.left-side 整體變高，
    // 置中的結果會把 .overlay-text 往上推到 header 底下。這裡直接塞幾則
    // 訊息模擬「聊了一陣子」的狀態，確認 slogan 的位置永遠在 header 下緣
    // 之後，不會被蓋住。
    await page.goto("/index.html");

    await page.evaluate(() => {
      const chatMessages = document.querySelector("#chatMessages");
      const messages = [
        ["user", "I want matcha dessert recommendations please"],
        [
          "assistant",
          "Sure! Based on SugarTopia notes, Matcha Mori House in Songshan has a great matcha mille crepe and hojicha pudding, with quiet seating and outlets for working.",
        ],
        ["user", "What about something with less sugar?"],
        [
          "assistant",
          "For a lighter option, try the hojicha pudding at Matcha Mori House - it has a smooth texture and is not too sweet.",
        ],
      ];
      messages.forEach(([role, text]) => {
        const el = document.createElement("div");
        el.className = `chat-message ${role}`;
        el.textContent = text;
        chatMessages.appendChild(el);
      });
    });

    const headerBottom = await page
      .locator(".header")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const slogonTop = await page
      .locator(".overlay-text")
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(slogonTop).toBeGreaterThanOrEqual(headerBottom);
  });

  test("Latest Reviews 區塊改吃真實評論資料，不再是寫死的 8 張假卡片，也沒有連去空頁面的 View All 連結", async ({
    page,
  }) => {
    await page.goto("/index.html");

    // 評論筆數會隨資料庫內容變動（見 reviews.spec.js），這裡只確認畫面不是
    // 舊版那種「不管資料庫有沒有資料，永遠顯示 8 張一模一樣的假評論」的行為：
    // 要嘛顯示真實評論卡片（店名不是寫死的 "Cupertino.keki"），要嘛顯示空狀態。
    const cardCount = await page.locator(".review-grid .review-card").count();

    if (cardCount > 0) {
      const shopNames = await page.locator(".review-grid .review-card h2").allTextContents();
      expect(shopNames.every((name) => name.trim().length > 0)).toBe(true);
    } else {
      await expect(page.locator(".review-grid .empty-state h2")).toHaveText("No reviews yet");
    }

    // review.html 目前是空頁，這個連結先拿掉了，這裡順便鎖住不要有人不小心加回來
    await expect(page.locator(".review-header .review-view-all")).toHaveCount(0);
  });

  test("Categories 8 個磚都帶有真實的 ?q= 查詢參數，不是全部連到同一個空白分類頁", async ({
    page,
  }) => {
    await page.goto("/index.html");
    const hrefs = await page
      .locator(".category-grid .category-card a")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")));

    expect(hrefs).toHaveLength(8);
    for (const href of hrefs) {
      expect(href).toMatch(/^category\.html\?q=.+/);
    }
    // 8 個磚應該對到 8 種不同分類，不是同一個值複製貼上
    expect(new Set(hrefs).size).toBe(8);
  });

  test("header 的 Categories 下拉選單：預設收起、點了才展開、點外面會收回去", async ({
    page,
  }) => {
    await page.goto("/index.html");

    const menu = page.locator(".nav-menu .nav-categories").first();
    const panel = menu.locator(".nav-categories-panel");

    await expect(panel).toBeHidden();

    await menu.locator(".nav-categories-toggle").click();
    await expect(panel).toBeVisible();

    // 面板裡的分類要跟首頁 Categories 磚用同一份、已經接上真實 ?q= 的清單，
    // 不是另外生一份寫死的清單。
    const hrefs = await panel.locator("a").evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(hrefs).toContain("category.html?q=Cinnamon%20Rolls");
    expect(hrefs).toContain("category.html?q=Dogs%20Friendly");
    expect(hrefs).toHaveLength(8);

    // 點選單外面應該要收起來。改點右半邊的圖片輪播——AI 問答搬進 hero 左半邊
    // 之後，.ai-chat-heading h2 離 header 很近，Categories 面板展開時剛好會
    // 蓋到它，點下去會被面板「攔截」而不是真的點到外面，所以換一個確定在
    // 面板範圍外的目標。
    await page.locator(".swiper-slide img").first().click();
    await expect(panel).toBeHidden();
  });
});
