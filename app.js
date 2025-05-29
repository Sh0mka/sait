// --- Telegram Mini App API ---
const tg = window.Telegram?.WebApp;

// --- Данные пользователя ---
let user = {
  id: tg?.initDataUnsafe?.user?.id || 1,
  first_name: tg?.initDataUnsafe?.user?.first_name || "Гость",
  username: tg?.initDataUnsafe?.user?.username || "",
  stars: 0,
  steps: 0,
  referral: "",
};

// --- API ---
const API_URL = "https://your-api-endpoint.com/api"; // Замените на ваш реальный API URL

async function fetchUserData() {
  try {
    const response = await fetch(`${API_URL}/user/${user.id}`);
    if (!response.ok) throw new Error("Ошибка получения данных пользователя");
    const data = await response.json();
    user = { ...user, ...data };
    updateUI();
  } catch (error) {
    console.error("Ошибка:", error);
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
  } catch (error) {
    console.error("Ошибка:", error);
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
    alert(`Поздравляем! Вы получили ${data.starsAdded} ⭐!`);
  } catch (error) {
    console.error("Ошибка:", error);
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
  }
}

function updateLeaderboardUI(leaderboard) {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  leaderboard.forEach((u, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="min-width:2em;display:inline-block;">${
      i + 1
    }.</span> <b>${u.name}</b> — <span style="color:#229ED9;">${
      u.stars
    } ⭐</span>`;
    list.appendChild(li);
  });
}

// --- UI ---
function updateUI() {
  document.getElementById("user-info").textContent = user.username
    ? `@${user.username}`
    : user.first_name;
  document.getElementById("steps-display").textContent = user.steps;
  document.getElementById("stars-display").textContent = user.stars;
  document.getElementById("referral-link").textContent = getReferralLink();
}

// --- Логика шагов ---
document.getElementById("add-steps-btn").onclick = function () {
  const val = parseInt(document.getElementById("steps-input").value, 10);
  if (!isNaN(val) && val > 0) {
    updateUserSteps(val);
    document.getElementById("steps-input").value = "";
  }
};

// --- Конвертация шагов в звезды ---
document.getElementById("convert-btn").onclick = convertStepsToStars;

// --- Реферальная система ---
function getReferralLink() {
  return `https://t.me/${
    tg?.initDataUnsafe?.bot?.username || "StepStarBot"
  }?start=ref_${user.id}`;
}

document.getElementById("copy-ref-btn").onclick = function () {
  const link = getReferralLink();
  navigator.clipboard.writeText(link);
  alert("Ссылка скопирована!");
};

// --- Инициализация ---
async function init() {
  await fetchUserData();
  await fetchLeaderboard();
  if (tg) tg.ready();
}

init();
