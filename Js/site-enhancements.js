const shops = window.SugarTopiaData || [];
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

function renderShopList() {
  const list = document.querySelector(".dessert-shops");

  if (!list || !shops.length) {
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

  resultContainer.innerHTML = results.map((shop, index) => `
    <div class="shop-item">
      <div class="shop-image">
        <a
          href="shop_detail.html"
          class="map-link"
          data-name="${shop.name}"
          aria-label="View ${shop.name}"
        >
          <img src="${shop.image}" alt="${shop.name}">
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
        <button class="start-order-btn" type="button" data-demo-message="Ordering is a future feature. For now, use this list to explore recommendations.">Start order</button>
      </div>
    </div>
  `).join("");
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
      filterState.tag = button.textContent.trim();
      renderShopList();
      showSiteMessage(`Filtered by ${filterState.tag}.`);
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

document.addEventListener("DOMContentLoaded", () => {
  renderShopList();
  setupSearch();
  setupFilters();
  setupDemoForms();
  setupDemoButtons();
});
