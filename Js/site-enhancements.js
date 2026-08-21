let shops = [];
const cloudApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app";
const localApiUrl = "http://127.0.0.1:8000";
const localHosts = ["localhost", "127.0.0.1", "::", "[::]", "::1", "[::1]", ""];
const apiBaseUrl = localHosts.includes(window.location.hostname) ? localApiUrl : cloudApiUrl;
const shopsApiUrl = `${apiBaseUrl}/api/shops`;
const filterState = {
  rating: 0,
  tag: "",
  features: new Set()
};

function showSiteMessage(text) {
  let message = document.querySelector(".site-message");

  if (!message) {
    message = document.createElement("div");
    message.className = "site-message";
    document.body.appendChild(message);
  }

  message.textContent = text;
  message.classList.add("show");

  window.clearTimeout(message.hideTimer);
  message.hideTimer = window.setTimeout(() => {
    message.classList.remove("show");
  }, 2600);
}

window.showSiteMessage = showSiteMessage;

function buildStars(rating) {
  const rounded = Math.round(rating);
  return "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
}

function normalize(value) {
  return value.toLowerCase().trim();
}

function getSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") || "",
    location: params.get("location") || ""
  };
}

function shopMatches(shop, query, location) {
  const keyword = normalize(query);
  const place = normalize(location);
  const searchable = normalize([
    shop.name,
    shop.category,
    shop.location,
    shop.description,
    shop.tags.join(" ")
  ].join(" "));

  const matchesKeyword = !keyword || searchable.includes(keyword);
  const matchesLocation = !place || normalize(shop.location).includes(place);
  const matchesRating = !filterState.rating || shop.rating >= filterState.rating;
  const matchesTag = !filterState.tag || searchable.includes(normalize(filterState.tag));
  const matchesFeatures = [...filterState.features].every((feature) => searchable.includes(normalize(feature)));

  return matchesKeyword && matchesLocation && matchesRating && matchesTag && matchesFeatures;
}

async function loadShops() {
  const { query, location } = getSearchParams();
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (location) {
    params.set("location", location);
  }

  try {
    const response = await fetch(`${shopsApiUrl}${params.toString() ? `?${params.toString()}` : ""}`);

    if (!response.ok) {
      throw new Error("Shop API request failed.");
    }

    const data = await response.json();
    shops = Array.isArray(data.shops) ? data.shops : shops;
    return true;
  } catch (error) {
    showSiteMessage("Using demo shop data because the backend shop API is unavailable.");
    return false;
  }
}

async function renderShopList() {
  const list = document.querySelector(".dessert-shops");

  if (!list) {
    return;
  }

  list.innerHTML = `
    <h1>Loading dessert shops...</h1>
    <p class="result-count">Fetching shop data from SugarTopia backend.</p>
  `;

  const loaded = await loadShops();

  if (!loaded && !shops.length) {
    list.innerHTML = `
      <h1>No dessert shops yet</h1>
      <p class="result-count">Shop data is not available right now.</p>
    `;
    return;
  }

  const { query, location } = getSearchParams();
  const results = shops.filter((shop) => shopMatches(shop, query, location));
  const title = query || location || filterState.tag
    ? `Search results for ${query || "dessert shops"}${location ? ` in ${location}` : ""}`
    : "All dessert shops and cafes in Taipei";

  list.innerHTML = `
    <h1>${title}</h1>
    <p class="result-count">${results.length} shop${results.length === 1 ? "" : "s"} found</p>
    <div class="shop-results"></div>
  `;

  const resultContainer = list.querySelector(".shop-results");

  if (!results.length) {
    resultContainer.innerHTML = `
      <div class="empty-state">
        <h2>No matching dessert shops yet</h2>
        <p>Try another flavor, category, or Taipei area.</p>
      </div>
    `;
    return;
  }

  resultContainer.innerHTML = results.map((shop, index) => buildShopCardHtml(shop, index)).join("");
  focusFirstShopOnMap(results);
}

function buildShopCardHtml(shop, index) {
  const hasCoordinates = typeof shop.lat === "number" && typeof shop.lng === "number";
  // Google Places 收錄的店家目前刻意不處理照片（避免把 API key 暴露給前端，
  // 見 BACKEND_LEARNING_NOTES.md），所以 shop.image 常常是空字串；空字串當
  // <img src> 用會被瀏覽器當成「載入目前這個網頁本身」，載入失敗又不會保留版面
  // 尺寸，畫面看起來像破圖、還會把旁邊排版擠亂，所以這裡一律補一張本地的
  // 佔位圖，不要讓 src 是空字串。
  const imageSrc = shop.image && shop.image.trim() ? shop.image : "img/no-photo.svg";

  return `
    <div class="shop-item" data-lat="${hasCoordinates ? shop.lat : ""}" data-lng="${hasCoordinates ? shop.lng : ""}" data-name="${shop.name}">
      <div class="shop-image">
        <a
          href="shop_detail.html?id=${encodeURIComponent(shop.id || "")}"
          class="map-link"
          data-name="${shop.name}"
          aria-label="View ${shop.name}"
        >
          <img src="${imageSrc}" alt="${shop.name}">
        </a>
      </div>
      <div class="shop-details">
        <h2>${index + 1}. ${shop.name}</h2>
        <div class="rating">
          <span>${buildStars(shop.rating)}</span>
          <span class="rating-score">${shop.rating.toFixed(1)} (${shop.reviews})</span>
        </div>
        <div class="categories">
          ${shop.tags.map((tag) => `
            <span class="category">
              <button class="category-btn" type="button">${tag}</button>
            </span>
          `).join("")}
        </div>
        <p class="description">${shop.description}</p>
        <div class="services">
          <span>✔ Takeout</span>
          <span>✔ Saved to SugarTopia</span>
        </div>
        ${hasCoordinates ? `<button class="view-on-map-btn" type="button">📍 View on map</button>` : ""}
      </div>
    </div>
  `;
}
window.buildShopCardHtml = buildShopCardHtml;

function updateShopMap(lat, lng, name) {
  const mapFrame = document.getElementById("shopMapEmbed");
  const label = document.getElementById("mapShowingLabel");

  if (!mapFrame || typeof lat !== "number" || typeof lng !== "number") {
    return;
  }

  mapFrame.src = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  mapFrame.setAttribute("title", name ? `Map location for ${name}` : "Shop location");

  if (label) {
    label.textContent = name ? `📍 Showing on map: ${name}` : "";
  }
}
window.updateShopMap = updateShopMap;

function markActiveShopCard(activeCard) {
  document.querySelectorAll(".shop-item.is-shown-on-map").forEach((card) => {
    card.classList.remove("is-shown-on-map");
    const button = card.querySelector(".view-on-map-btn");
    if (button) {
      button.textContent = "📍 View on map";
    }
  });

  if (activeCard) {
    activeCard.classList.add("is-shown-on-map");
    const button = activeCard.querySelector(".view-on-map-btn");
    if (button) {
      button.textContent = "📍 Showing on map";
    }
  }
}

function selectShopOnMap(card, { scroll } = {}) {
  const lat = card ? parseFloat(card.dataset.lat) : NaN;
  const lng = card ? parseFloat(card.dataset.lng) : NaN;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return;
  }

  updateShopMap(lat, lng, card.dataset.name);
  markActiveShopCard(card);

  if (scroll) {
    document.getElementById("shopMapEmbed")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function focusFirstShopOnMap(results) {
  const firstWithCoordinates = results.find(
    (shop) => typeof shop.lat === "number" && typeof shop.lng === "number"
  );

  if (!firstWithCoordinates) {
    return;
  }

  updateShopMap(firstWithCoordinates.lat, firstWithCoordinates.lng, firstWithCoordinates.name);

  const firstCard = document.querySelector(
    `.shop-item[data-name="${CSS.escape(firstWithCoordinates.name)}"]`
  );
  markActiveShopCard(firstCard);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".view-on-map-btn");

  if (!button) {
    return;
  }

  selectShopOnMap(button.closest(".shop-item"), { scroll: true });
});

function showShopDetailError(container) {
  container.innerHTML = `
    <div class="shop-header">
      <div class="shop-info">
        <h1>Shop not found</h1>
        <p>We could not find this shop in the SugarTopia backend. <a href="category.html">Browse all shops</a>.</p>
      </div>
    </div>
  `;
}

async function loadShopDetail() {
  const detail = document.querySelector(".shop-detail");

  if (!detail) {
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    return;
  }

  try {
    const response = await fetch(`${shopsApiUrl}/${encodeURIComponent(id)}`);

    if (!response.ok) {
      throw new Error("Shop not found.");
    }

    const shop = await response.json();

    const heading = detail.querySelector(".shop-info h1");
    if (heading) {
      heading.textContent = shop.name;

      let description = detail.querySelector(".shop-description");
      if (!description) {
        description = document.createElement("p");
        description.className = "shop-description";
        heading.insertAdjacentElement("afterend", description);
      }
      description.textContent = shop.description;
    }

    const stars = detail.querySelector(".rating .stars");
    if (stars) {
      stars.textContent = buildStars(shop.rating);
    }

    const ratingCount = detail.querySelector(".rating .rating-count");
    if (ratingCount) {
      ratingCount.textContent = shop.rating;
    }

    const tagsContainer = detail.querySelector(".tags");
    if (tagsContainer && Array.isArray(shop.tags)) {
      tagsContainer.innerHTML = shop.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
    }

    const image = detail.querySelector(".shop-image img");
    if (image && shop.image) {
      image.src = shop.image;
      image.alt = shop.name;
    }

    const writeReviewButton = detail.querySelector(".action-btn.write-review");
    if (writeReviewButton) {
      writeReviewButton.setAttribute(
        "onclick",
        `location.href='write_review.html?id=${encodeURIComponent(shop.id)}';`
      );
    }

    if (window.SugarTopiaReviews) {
      window.SugarTopiaReviews.renderShopReviews(shop);
    }

    if (window.SugarTopiaFavorites) {
      window.SugarTopiaFavorites.setupSaveButton(shop.id);
    }
  } catch (error) {
    showShopDetailError(detail);
  }
}

async function setupHomeReviewLinks() {
  const links = document.querySelectorAll(".review-card .read-more");

  if (!links.length) {
    return;
  }

  if (!shops.length || !shops[0]?.id) {
    await loadShops();
  }

  if (!shops.length) {
    return;
  }

  links.forEach((link, index) => {
    const shop = shops[index % shops.length];

    if (shop?.id) {
      link.href = `shop_detail.html?id=${encodeURIComponent(shop.id)}`;
    }
  });
}

function setupFilters() {
  document.querySelectorAll(".filters .rating-button").forEach((button) => {
    button.addEventListener("click", () => {
      const stars = (button.textContent.match(/★/g) || []).length;
      filterState.rating = stars;
      renderShopList();
      showSiteMessage(`Showing shops rated ${stars} stars and up.`);
    });
  });

  document.querySelectorAll(".filters .category-button").forEach((button) => {
    button.addEventListener("click", () => {
      // 分類按鈕要跟首頁 Categories 磚的行為一致：直接換成「只看這個分類」，
      // 不是疊加在目前網址已經有的 q 之上。原本的寫法是疊加（AND），
      // 例如網址已經是 ?q=Bagels 時再點側欄的 Cafes，會變成同時要符合
      // Bagels 又符合 Cafes，結果通常是 0 筆，跟使用者「點了就該看到那個
      // 分類」的預期不符。星等、Features 這兩種篩選則維持「在目前結果裡
      // 再narrow」的邏輯不變，因為那本來就是輔助性的次要篩選，不是分類本身。
      const category = button.textContent.trim();
      window.location.href = `category.html?q=${encodeURIComponent(category)}`;
    });
  });

  document.querySelectorAll(".features-filter input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const label = checkbox.closest("label")?.textContent.trim() || "";

      if (checkbox.checked) {
        filterState.features.add(label);
      } else {
        filterState.features.delete(label);
      }

      renderShopList();
    });
  });
}

function handleSearch(searchBar) {
  const inputs = searchBar.querySelectorAll("input");
  const query = inputs[0]?.value.trim() || "";
  const location = inputs[1]?.value.trim() || "";
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (location) {
    params.set("location", location);
  }

  window.location.href = `category.html${params.toString() ? `?${params.toString()}` : ""}`;
}

function setupSearch() {
  document.querySelectorAll(".search-bar").forEach((searchBar) => {
    const button = searchBar.querySelector(".search-btn");
    const inputs = searchBar.querySelectorAll("input");

    button?.addEventListener("click", (event) => {
      event.preventDefault();
      handleSearch(searchBar);
    });

    inputs.forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleSearch(searchBar);
        }
      });
    });
  });
}

function setupDemoForms() {
  document.querySelectorAll(".login-form").forEach((form) => {
    if (form.dataset.authForm) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const password = form.querySelector("#password");
      const confirmPassword = form.querySelector("#confirm-password");
      const terms = form.querySelector("#terms");

      if (confirmPassword && password.value !== confirmPassword.value) {
        showSiteMessage("Passwords do not match.");
        return;
      }

      if (terms && !terms.checked) {
        showSiteMessage("Please agree to the terms first.");
        return;
      }

      showSiteMessage("Demo only: member accounts are not connected to a backend yet.");
    });
  });

  document.querySelectorAll(".review-form").forEach((form) => {
    if (form.dataset.reviewForm) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showSiteMessage("Review saved as a demo. A review backend can be added later.");
      form.reset();
    });
  });

  document.querySelectorAll(".subscribe-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showSiteMessage("Thanks for joining the SugarTopia demo mailing list.");
      form.reset();
    });
  });
}

function setupDemoButtons() {
  document.addEventListener("click", (event) => {
    const demoTarget = event.target.closest("[data-demo-message]");

    if (demoTarget) {
      event.preventDefault();
      showSiteMessage(demoTarget.dataset.demoMessage);
      return;
    }

    const emptyLink = event.target.closest('a[href="#"]');

    if (emptyLink) {
      event.preventDefault();
      showSiteMessage("This section is a demo placeholder for now.");
    }
  });
}

function setupCategoriesMenu() {
  document.querySelectorAll(".nav-categories").forEach((menu) => {
    const toggle = menu.querySelector(".nav-categories-toggle");

    if (!toggle) {
      return;
    }

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const wasOpen = menu.classList.contains("is-open");

      document.querySelectorAll(".nav-categories.is-open").forEach((openMenu) => {
        openMenu.classList.remove("is-open");
      });

      if (!wasOpen) {
        menu.classList.add("is-open");
      }
    });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll(".nav-categories.is-open").forEach((menu) => {
      if (!menu.contains(event.target)) {
        menu.classList.remove("is-open");
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".nav-categories.is-open").forEach((menu) => {
        menu.classList.remove("is-open");
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderShopList();
  loadShopDetail();
  setupHomeReviewLinks();
  setupSearch();
  setupFilters();
  setupDemoForms();
  setupDemoButtons();
  setupCategoriesMenu();
});
