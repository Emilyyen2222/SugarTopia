(function () {
  const cloudApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app";
  const localApiUrl = "http://127.0.0.1:8000";
  const localHosts = ["localhost", "127.0.0.1", "::", "[::]", "::1", "[::1]", ""];
  const isLocal = localHosts.includes(window.location.hostname);
  const apiBaseUrl = isLocal ? localApiUrl : cloudApiUrl;
  const storageKey = "sugartopia_auth";

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || null;
    } catch (error) {
      return null;
    }
  }

  function setAuth(auth) {
    localStorage.setItem(storageKey, JSON.stringify(auth));
  }

  function clearAuth() {
    localStorage.removeItem(storageKey);
  }

  function showMessage(text) {
    if (typeof window.showSiteMessage === "function") {
      window.showSiteMessage(text);
      return;
    }

    window.alert(text);
  }

  async function requestAuth(path, options = {}) {
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

  async function refreshCurrentUser() {
    const auth = getAuth();

    if (!auth?.token) {
      return null;
    }

    try {
      const data = await requestAuth("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      setAuth({
        ...auth,
        user: data.user,
      });
      return data.user;
    } catch (error) {
      clearAuth();
      return null;
    }
  }

  function updateHeader(user) {
    document.querySelectorAll(".actions").forEach((actions) => {
      const loginLink = actions.querySelector(".btn-login");
      const signupLink = actions.querySelector(".btn-signup");
      const avatarButton = actions.querySelector(".login_avatar");
      let userBadge = actions.querySelector(".auth-user");
      let logoutButton = actions.querySelector(".auth-logout");

      if (user) {
        loginLink?.classList.add("is-hidden");
        signupLink?.classList.add("is-hidden");
        avatarButton?.classList.add("is-hidden");

        if (!userBadge) {
          userBadge = document.createElement("span");
          userBadge.className = "auth-user";
          actions.appendChild(userBadge);
        }

        if (!logoutButton) {
          logoutButton = document.createElement("button");
          logoutButton.type = "button";
          logoutButton.className = "auth-logout";
          logoutButton.textContent = "Log Out";
          actions.appendChild(logoutButton);
        }

        userBadge.textContent = `Hi, ${user.name}`;
      } else {
        loginLink?.classList.remove("is-hidden");
        signupLink?.classList.remove("is-hidden");
        avatarButton?.classList.remove("is-hidden");
        userBadge?.remove();
        logoutButton?.remove();
      }
    });
  }

  function setupLoginForm() {
    const form = document.querySelector("[data-auth-form='login']");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const email = form.querySelector("#email")?.value.trim() || "";
      const password = form.querySelector("#password")?.value || "";

      submitButton.disabled = true;
      submitButton.textContent = "Logging in...";

      try {
        const data = await requestAuth("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuth(data);
        showMessage(`Welcome back, ${data.user.name}.`);
        window.location.href = "index.html";
      } catch (error) {
        showMessage(error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Log In";
      }
    });
  }

  function setupSignupForm() {
    const form = document.querySelector("[data-auth-form='signup']");

    if (!form) {
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const name = form.querySelector("#name")?.value.trim() || "";
      const email = form.querySelector("#email")?.value.trim() || "";
      const password = form.querySelector("#password")?.value || "";
      const confirmPassword = form.querySelector("#confirm-password")?.value || "";
      const terms = form.querySelector("#terms");

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        return;
      }

      if (terms && !terms.checked) {
        showMessage("Please agree to the terms first.");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";

      try {
        const data = await requestAuth("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setAuth(data);
        showMessage(`Welcome to SugarTopia, ${data.user.name}.`);
        window.location.href = "index.html";
      } catch (error) {
        showMessage(error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Sign Up";
      }
    });
  }

  function setupLogout() {
    document.addEventListener("click", async (event) => {
      const button = event.target.closest(".auth-logout");

      if (!button) {
        return;
      }

      const auth = getAuth();
      button.disabled = true;

      try {
        if (auth?.token) {
          await requestAuth("/api/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          });
        }
      } catch (error) {
        // Local state is cleared even if the server session is already gone.
      } finally {
        clearAuth();
        updateHeader(null);
        showMessage("You have logged out.");
        button.disabled = false;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    updateHeader(getAuth()?.user || null);
    setupLoginForm();
    setupSignupForm();
    setupLogout();
    updateHeader(await refreshCurrentUser());
  });
})();
