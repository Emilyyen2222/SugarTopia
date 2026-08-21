(function () {
  const cloudApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app";
  const localApiUrl = "http://127.0.0.1:8000";
  const localHosts = ["localhost", "127.0.0.1", "::", "[::]", "::1", "[::1]", ""];
  const apiBaseUrl = localHosts.includes(window.location.hostname) ? localApiUrl : cloudApiUrl;
  const storageKey = "sugartopia_auth";

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || null;
    } catch (error) {
      return null;
    }
  }

  function showMessage(text) {
    if (typeof window.showSiteMessage === "function") {
      window.showSiteMessage(text);
      return;
    }

    window.alert(text);
  }

  async function requestFavorites(path, options = {}) {
    const auth = getAuth();

    if (!auth?.token) {
      throw new Error("Please log in to save favorites.");
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Request failed.");
    }

    return data;
  }

  function getFavoriteShops() {
    return requestFavorites("/api/favorites");
  }

  function addFavorite(shopId) {
    return requestFavorites("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ shop_id: shopId }),
    });
  }

  function removeFavorite(shopId) {
    return requestFavorites(`/api/favorites/${encodeURIComponent(shopId)}`, {
      method: "DELETE",
    });
  }

  function updateSaveButton(button, isFavorited) {
    button.classList.toggle("is-favorited", isFavorited);
    button.innerHTML = isFavorited
      ? '<i class="fas fa-bookmark"></i> Saved'
      : '<i class="far fa-bookmark"></i> Save';
  }

  // 給店家詳情頁用：接手原本寫死的 Save 按鈕（拿掉 data-demo-message，換成真的收藏/取消收藏）。
  async function setupSaveButton(shopId) {
    const button = document.querySelector(".action-btn.save");

    if (!button || !shopId) {
      return;
    }

    button.removeAttribute("data-demo-message");

    const auth = getAuth();
    if (auth?.token) {
      try {
        const data = await getFavoriteShops();
        const isFavorited = Array.isArray(data.shops) && data.shops.some((shop) => shop.id === shopId);
        updateSaveButton(button, isFavorited);
      } catch (error) {
        // 抓不到收藏清單就維持預設的「未收藏」樣式，不擋住其他功能。
      }
    }

    button.addEventListener("click", async () => {
      const currentAuth = getAuth();

      if (!currentAuth?.token) {
        showMessage("Please log in to save this shop.");
        window.location.href = "login.html";
        return;
      }

      const isFavorited = button.classList.contains("is-favorited");
      button.disabled = true;

      try {
        if (isFavorited) {
          await removeFavorite(shopId);
          updateSaveButton(button, false);
          showMessage("Removed from your favorites.");
        } else {
          await addFavorite(shopId);
          updateSaveButton(button, true);
          showMessage("Saved to your favorites.");
        }
      } catch (error) {
        showMessage(error.message);
      } finally {
        button.disabled = false;
      }
    });
  }

  // 給「我的收藏」頁面用。
  async function renderFavoritesPage() {
    const container = document.querySelector(".favorites-page");

    if (!container) {
      return;
    }

    const auth = getAuth();

    if (!auth?.token) {
      container.innerHTML = `
        <h1>My Favorites</h1>
        <div class="empty-state">
          <h2>Please log in first</h2>
          <p>You need to be logged in to see your saved shops. <a href="login.html">Log in</a></p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <h1>My Favorites</h1>
      <p class="result-count">Loading your saved shops...</p>
    `;

    try {
      const data = await getFavoriteShops();
      const favoriteShops = Array.isArray(data.shops) ? data.shops : [];

      if (!favoriteShops.length) {
        container.innerHTML = `
          <h1>My Favorites</h1>
          <div class="empty-state">
            <h2>No favorites yet</h2>
            <p>Browse <a href="category.html">dessert shops</a> and tap Save on the ones you like.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <h1>My Favorites</h1>
        <p class="result-count">${favoriteShops.length} shop${favoriteShops.length === 1 ? "" : "s"} saved</p>
        <div class="shop-results"></div>
      `;

      const resultContainer = container.querySelector(".shop-results");
      resultContainer.innerHTML = favoriteShops
        .map((shop, index) => window.buildShopCardHtml(shop, index))
        .join("");
    } catch (error) {
      container.innerHTML = `
        <h1>My Favorites</h1>
        <div class="empty-state">
          <h2>Could not load your favorites</h2>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  window.SugarTopiaFavorites = {
    getFavoriteShops,
    addFavorite,
    removeFavorite,
    setupSaveButton,
  };

  document.addEventListener("DOMContentLoaded", renderFavoritesPage);
})();
