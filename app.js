// --- Telegram Mini App API ---
const tg = window.Telegram?.WebApp;
tg?.expand();

// --- Константы ---
const API_URL = "https://cold-garlics-add.loca.lt/api";
const STEPS_PER_STAR = 1000;

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
  return new Intl.NumberFormat("ru-RU").format(num);
}

// --- Обновление UI ---
function updateUI() {
  // Обновление информации о пользователе
  document.getElementById("user-name").textContent = user.username
    ? `@${user.username}`
    : user.first_name;
  document.getElementById("user-rank").textContent = `Ранг: #${user.rank}`;

  // Обновление метрик
  document.getElementById("steps-display").textContent = formatNumber(
    user.steps
  );
  document.getElementById("stars-display").textContent = formatNumber(
    user.stars
  );

  // Обновление реферальной ссылки
  document.getElementById("referral-link").value = getReferralLink();
}

// --- API запросы ---
async function fetchUserData() {
  try {
    const response = await fetch(`${API_URL}/user/${user.id}`);
    if (!response.ok) throw new Error("Ошибка получения данных пользователя");
    const data = await response.json();
    user = { ...user, ...data };
    updateUI();
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка загрузки данных", "error");
  }
}

async function updateUserSteps(steps) {
  try {
    const response = await fetch(`${API_URL}/user/${user.id}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    if (!response.ok) throw new Error("Ошибка обновления шагов");
    const data = await response.json();
    user.steps = data.steps;
    updateUI();
    showNotification(`Добавлено ${formatNumber(steps)} шагов!`, "success");
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка добавления шагов", "error");
  }
}

async function convertStepsToStars() {
  try {
    const response = await fetch(`${API_URL}/user/${user.id}/convert`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Ошибка конвертации шагов");
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
    showNotification("Ошибка конвертации шагов", "error");
  }
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) throw new Error("Ошибка получения лидерборда");
    const data = await response.json();
    updateLeaderboardUI(data);
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка загрузки лидерборда", "error");
  }
}

// --- Обновление лидерборда ---
function updateLeaderboardUI(leaderboard) {
  const list = document.getElementById("leaderboard-list");
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
}

// --- Реферальная система ---
function getReferralLink() {
  return `https://t.me/${
    tg?.initDataUnsafe?.bot?.username || "StepStarBot"
  }?start=ref_${user.referral_code}`;
}

// --- Уведомления ---
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// --- Обработчики событий ---
document.getElementById("add-steps-btn").addEventListener("click", () => {
  const input = document.getElementById("steps-input");
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

document
  .getElementById("convert-btn")
  .addEventListener("click", convertStepsToStars);

document.getElementById("copy-ref-btn").addEventListener("click", () => {
  const link = getReferralLink();
  navigator.clipboard.writeText(link);
  showNotification("Ссылка скопирована!", "success");
});

// --- Инициализация ---
async function init() {
  await fetchUserData();
  await fetchLeaderboard();
  if (tg) tg.ready();
}

// --- Запуск приложения ---
init();
