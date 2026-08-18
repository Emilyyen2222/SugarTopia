const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const chatApiUrl = "https://sugartopia-backend-673387630043.asia-east1.run.app/api/chat";

function formatReply(value) {
  if (typeof value === "string") {
    return value
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/^\s*#{1,6}\s+/gm, "")
      .replace(/```/g, "")
      .trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatReply(item))
      .filter(Boolean)
      .join("\n");
  }

  if (value && typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text;
    }

    if (typeof value.content === "string") {
      return value.content;
    }

    if (Array.isArray(value.content)) {
      return formatReply(value.content);
    }

    return JSON.stringify(value, null, 2);
  }

  return "";
}

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

if (chatForm && chatInput && chatMessages) {
  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userMessage = chatInput.value.trim();

    if (!userMessage) {
      return;
    }

    addMessage("user", userMessage);
    chatInput.value = "";
    chatInput.disabled = true;

    const loadingMessage = addMessage("assistant", "思考中...");

    try {
      const response = await fetch(chatApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage
        })
      });

      const data = await response.json();

      if (!response.ok) {
        loadingMessage.textContent = data.detail || "後端發生錯誤，請稍後再試。";
        return;
      }

      loadingMessage.textContent = formatReply(data.reply || data.error) || "沒有收到回覆。";
    } catch (error) {
      loadingMessage.textContent = "連不上後端，請稍後再試。";
    } finally {
      chatInput.disabled = false;
      chatInput.focus();
    }
  });
}
