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

  function formatDate(isoString) {
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "";
    }
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.detail || "Request failed.");
    }

    return data;
  }

  function getShopReviews(shopId) {
    return requestJson(`/api/shops/${encodeURIComponent(shopId)}/reviews`);
  }

  function getLatestReviews(limit = 8) {
    return requestJson(`/api/reviews/latest?limit=${limit}`);
  }

  function submitReview(shopId, rating, text) {
    const auth = getAuth();

    if (!auth?.token) {
      throw new Error("Please log in to write a review.");
    }

    return requestJson(`/api/shops/${encodeURIComponent(shopId)}/reviews`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ rating, text }),
    });
  }

  function buildReviewCardHtml(review) {
    const shopId = review.shopId || "";
    return `
      <div class="review-card">
        <div class="review-item">
          <div class="review-user">
            <img src="img/profile.jpg" alt="${review.reviewerName}" class="user-avatar">
            <div class="user-info">
              <p class="user-name">${review.reviewerName}</p>
              <p class="post-time">${formatDate(review.createdAt)}</p>
            </div>
          </div>
          <div class="review-content">
            <h2>${review.shopName || shopId}</h2>
            <div class="rating">
              <span>${window.buildStars ? window.buildStars(review.rating) : "★".repeat(review.rating)}</span>
            </div>
            ${review.shopImage ? `<img src="${review.shopImage}" alt="${review.shopName || ""}" class="review-image">` : ""}
            <p class="review-text">${review.text}</p>
            <a href="shop_detail.html?id=${encodeURIComponent(shopId)}" class="read-more">Read more</a>
          </div>
        </div>
      </div>
    `;
  }

  // 給首頁 Latest Reviews 區塊用：整個換成真實評論，不再是寫死的 8 張假卡片。
  async function renderLatestReviews() {
    const grid = document.querySelector(".review-grid");

    if (!grid) {
      return;
    }

    try {
      const data = await getLatestReviews(8);
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];

      if (!reviews.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <h2>No reviews yet</h2>
            <p>Be the first to <a href="write_review.html">write a review</a>.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = reviews.map((review) => buildReviewCardHtml(review)).join("");
    } catch (error) {
      // 抓不到就保持原本畫面（通常是後端暫時連不上），不強制蓋成錯誤訊息，
      // 避免首頁一進來就整片變成技術性錯誤字樣。
    }
  }

  // 給店家詳情頁用：把 shop.comments 那種寫死的種子文字，換成真正的使用者評論。
  async function renderShopReviews(shop) {
    const reviewList = document.querySelector(".shop-detail .review-list");

    if (!reviewList) {
      return;
    }

    try {
      const data = await getShopReviews(shop.id);
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];

      if (!reviews.length) {
        reviewList.innerHTML = `
          <div class="empty-state">
            <h2>No reviews yet</h2>
            <p>Be the first to <a href="write_review.html?id=${encodeURIComponent(shop.id)}">write a review</a> for ${shop.name}.</p>
          </div>
        `;
        return;
      }

      reviewList.innerHTML = reviews
        .map(
          (review) => `
        <div class="review-item">
          <div class="reviewer-info">
            <img src="img/profile.jpg" alt="${review.reviewerName}">
            <div class="reviewer-details">
              <h4>${review.reviewerName}</h4>
              <p>${formatDate(review.createdAt)}</p>
            </div>
          </div>
          <div class="review-content">
            <div class="rating-date">
              <div class="stars">${window.buildStars ? window.buildStars(review.rating) : "★".repeat(review.rating)}</div>
            </div>
            <p class="review-text">${review.text}</p>
          </div>
        </div>
      `
        )
        .join("");
    } catch (error) {
      reviewList.innerHTML = "<p>Could not load reviews right now.</p>";
    }
  }

  // 給 write_review.html 用。
  async function setupWriteReviewForm() {
    const form = document.querySelector("[data-review-form]");

    if (!form) {
      return;
    }

    const shopField = document.querySelector("#dessert-shop-field");
    const id = new URLSearchParams(window.location.search).get("id");

    let lockedShop = null;

    if (id) {
      try {
        lockedShop = await requestJson(`/api/shops/${encodeURIComponent(id)}`);
        shopField.innerHTML = `<p class="locked-shop-name">${lockedShop.name}</p>
          <input type="hidden" id="dessert-shop-id" value="${lockedShop.id}">`;
      } catch (error) {
        shopField.innerHTML = `<p>Could not find this shop. <a href="category.html">Browse all shops</a>.</p>`;
        form.querySelector("button[type=submit]").disabled = true;
        return;
      }
    } else {
      try {
        const data = await requestJson("/api/shops");
        const options = (data.shops || [])
          .map((shop) => `<option value="${shop.id}">${shop.name}</option>`)
          .join("");
        shopField.innerHTML = `
          <select id="dessert-shop-id" required>
            <option value="" disabled selected>Choose a shop</option>
            ${options}
          </select>
        `;
      } catch (error) {
        shopField.innerHTML = `<p>Could not load the shop list right now.</p>`;
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const auth = getAuth();
      if (!auth?.token) {
        showMessage("Please log in to write a review.");
        window.location.href = "login.html";
        return;
      }

      const shopId = document.querySelector("#dessert-shop-id")?.value;
      const text = document.querySelector("#review-text")?.value.trim() || "";
      const ratingInput = form.querySelector("input[name='rating']:checked");
      const rating = ratingInput ? Number(ratingInput.value) : 0;

      if (!shopId) {
        showMessage("Please choose which shop you're reviewing.");
        return;
      }

      if (!rating) {
        showMessage("Please pick a star rating.");
        return;
      }

      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;

      try {
        await submitReview(shopId, rating, text);
        showMessage("Thanks! Your review has been posted.");
        window.location.href = `shop_detail.html?id=${encodeURIComponent(shopId)}`;
      } catch (error) {
        showMessage(error.message);
        submitButton.disabled = false;
      }
    });
  }

  window.SugarTopiaReviews = {
    getShopReviews,
    getLatestReviews,
    submitReview,
    renderShopReviews,
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderLatestReviews();
    setupWriteReviewForm();
  });
})();
