// --- Telegram Mini App API ---
const tg = window.Telegram?.WebApp;
if (!tg) {
  console.error("Telegram WebApp не инициализирован");
  showNotification("Ошибка инициализации Telegram WebApp", "error");
}

// --- Константы ---
const API_URL = "http://localhost:8001/api"; // Локальный адрес для разработки
const STEPS_PER_STAR = 1000;
const MIN_STEPS = 1;
const MAX_STEPS = 1000000;

// --- Состояние приложения ---
let user = {
  id: tg?.initDataUnsafe?.user?.id || 1,
  first_name: tg?.initDataUnsafe?.user?.first_name || "Гость",
  username: tg?.initDataUnsafe?.user?.username || "",
  steps: 0,
  stars: 0,
  rank: 0,
  referral_code: "",
};

// --- Форматирование чисел ---
function formatNumber(num) {
  try {
    return new Intl.NumberFormat("ru-RU").format(num);
  } catch (error) {
    console.error("Ошибка форматирования числа:", error);
    return num.toString();
  }
}

// --- Обновление UI ---
function updateUI() {
  try {
    const elements = {
      userName: document.getElementById("user-name"),
      userRank: document.getElementById("user-rank"),
      stepsDisplay: document.getElementById("steps-display"),
      starsDisplay: document.getElementById("stars-display"),
      referralLink: document.getElementById("referral-link"),
    };

    if (elements.userName) {
      elements.userName.textContent = user.username
        ? `@${user.username}`
        : user.first_name;
    }

    if (elements.userRank) {
      elements.userRank.textContent = `Ранг: #${user.rank}`;
    }

    if (elements.stepsDisplay) {
      elements.stepsDisplay.textContent = formatNumber(user.steps);
    }

    if (elements.starsDisplay) {
      elements.starsDisplay.textContent = formatNumber(user.stars);
    }

    if (elements.referralLink) {
      elements.referralLink.value = getReferralLink();
    }
  } catch (error) {
    console.error("Ошибка при обновлении UI:", error);
    showNotification("Ошибка обновления интерфейса", "error");
  }
}

// --- API запросы ---
async function fetchUserData() {
  try {
    if (!user.id) {
      throw new Error("ID пользователя не определен");
    }

    const response = await fetch(`${API_URL}/user/${user.id}`);
    if (!response.ok) {
      throw new Error(
        `Ошибка получения данных пользователя: ${response.status}`
      );
    }
    const data = await response.json();
    user = { ...user, ...data };
    updateUI();
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification(error.message || "Ошибка загрузки данных", "error");
  }
}

async function updateUserSteps(steps) {
  try {
    if (steps < MIN_STEPS || steps > MAX_STEPS) {
      throw new Error(
        `Количество шагов должно быть от ${MIN_STEPS} до ${MAX_STEPS}`
      );
    }

    const response = await fetch(`${API_URL}/user/${user.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка обновления шагов: ${response.status}`);
    }

    const data = await response.json();
    user.steps = data.steps;
    updateUI();
    showNotification(`Добавлено ${formatNumber(steps)} шагов!`, "success");
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification(error.message || "Ошибка добавления шагов", "error");
  }
}

async function convertStepsToStars() {
  try {
    if (user.steps < STEPS_PER_STAR) {
      throw new Error(
        `Для конвертации необходимо минимум ${STEPS_PER_STAR} шагов`
      );
    }

    const response = await fetch(`${API_URL}/user/${user.id}/convert`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Ошибка конвертации шагов: ${response.status}`);
    }

    const data = await response.json();
    user.stars = data.stars;
    user.steps = data.steps;
    updateUI();
    showNotification(
      `Поздравляем! Вы получили ${formatNumber(data.starsAdded)} ⭐!`,
      "success"
    );
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification(error.message || "Ошибка конвертации шагов", "error");
  }
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) {
      throw new Error(`Ошибка получения лидерборда: ${response.status}`);
    }
    const data = await response.json();
    updateLeaderboardUI(data);
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка загрузки лидерборда", "error");
  }
}

// --- Обновление лидерборда ---
function updateLeaderboardUI(leaderboard) {
  try {
    const list = document.getElementById("leaderboard-list");
    if (!list) return;

    list.innerHTML = "";

    leaderboard.forEach((user, index) => {
      const item = document.createElement("div");
      item.className = "leaderboard-item";
      item.innerHTML = `
        <div class="leaderboard-rank">${index + 1}</div>
        <div class="leaderboard-name">${
          user.username ? `@${user.username}` : user.first_name
        }</div>
        <div class="leaderboard-stars">${formatNumber(user.stars)} ⭐</div>
      `;
      list.appendChild(item);
    });
  } catch (error) {
    console.error("Ошибка при обновлении лидерборда:", error);
    showNotification("Ошибка обновления таблицы лидеров", "error");
  }
}

// --- Реферальная система ---
function getReferralLink() {
  try {
    console.log("Bot data:", tg?.initDataUnsafe?.bot);
    const botUsername = tg?.initDataUnsafe?.bot?.username;
    console.log("Bot username:", botUsername);

    if (!botUsername) {
      console.warn(
        "Имя бота не получено из Telegram WebApp, используем значение по умолчанию"
      );
    }

    const link = `https://t.me/${botUsername || "starstep_bot"}?start=ref_${
      user.referral_code
    }`;
    console.log("Generated link:", link);
    return link;
  } catch (error) {
    console.error("Ошибка при генерации реферальной ссылки:", error);
    return "";
  }
}

// --- Уведомления ---
function showNotification(message, type = "info") {
  try {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((n) => n.remove());

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  } catch (error) {
    console.error("Ошибка при показе уведомления:", error);
  }
}

// --- Обработчики событий ---
function setupEventListeners() {
  try {
    const addStepsBtn = document.getElementById("add-steps-btn");
    const convertBtn = document.getElementById("convert-btn");
    const copyRefBtn = document.getElementById("copy-ref-btn");

    if (addStepsBtn) {
      addStepsBtn.addEventListener("click", () => {
        const input = document.getElementById("steps-input");
        if (!input) return;

        const steps = parseInt(input.value, 10);
        if (!isNaN(steps) && steps > 0) {
          updateUserSteps(steps);
          input.value = "";
        } else {
          showNotification(
            "Пожалуйста, введите корректное количество шагов",
            "error"
          );
        }
      });
    }

    if (convertBtn) {
      convertBtn.addEventListener("click", convertStepsToStars);
    }

    if (copyRefBtn) {
      copyRefBtn.addEventListener("click", async () => {
        try {
          const link = getReferralLink();
          await navigator.clipboard.writeText(link);
          showNotification("Ссылка скопирована!", "success");
        } catch (error) {
          console.error("Ошибка при копировании:", error);
          showNotification("Не удалось скопировать ссылку", "error");
        }
      });
    }
  } catch (error) {
    console.error("Ошибка при настройке обработчиков событий:", error);
    showNotification("Ошибка инициализации интерфейса", "error");
  }
}

// --- Инициализация приложения ---
async function init() {
  try {
    if (!tg) {
      throw new Error("Telegram WebApp не инициализирован");
    }

    // Инициализация Telegram WebApp
    tg.ready();
    tg.expand();

    // Получение данных пользователя
    await fetchUserData();

    // Загрузка лидерборда
    await fetchLeaderboard();

    // Настройка обработчиков событий
    setupEventListeners();

    // Обновление UI
    updateUI();
  } catch (error) {
    console.error("Ошибка инициализации:", error);
    showNotification("Ошибка инициализации приложения", "error");
  }
}

// Запуск приложения
document.addEventListener("DOMContentLoaded", init);
