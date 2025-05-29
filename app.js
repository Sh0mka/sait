// --- Telegram Mini App API ---
const tg = window.Telegram?.WebApp;

// --- Данные пользователя (заглушка, потом можно получать с бэка) ---
let user = {
  id: tg?.initDataUnsafe?.user?.id || 1,
  first_name: tg?.initDataUnsafe?.user?.first_name || "Гость",
  username: tg?.initDataUnsafe?.user?.username || "",
  stars: 0,
  steps: 0,
  referral: "",
};

// --- Локальное хранение ---
function saveData() {
  localStorage.setItem("stepstar_user", JSON.stringify(user));
}
function loadData() {
  const data = localStorage.getItem("stepstar_user");
  if (data) {
    user = { ...user, ...JSON.parse(data) };
  }
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
    user.steps += val;
    saveData();
    updateUI();
    document.getElementById("steps-input").value = "";
  }
};

// --- Конвертация шагов в звезды ---
const STEPS_PER_STAR = 1000;
document.getElementById("convert-btn").onclick = function () {
  const starsToAdd = Math.floor(user.steps / STEPS_PER_STAR);
  if (starsToAdd > 0) {
    user.stars += starsToAdd;
    user.steps = user.steps % STEPS_PER_STAR;
    saveData();
    updateUI();
    alert(`Поздравляем! Вы получили ${starsToAdd} ⭐!`);
  } else {
    alert(
      `Недостаточно шагов для конвертации. Нужно ещё ${
        STEPS_PER_STAR - user.steps
      } шагов.`
    );
  }
};

// --- Лидерборд (заглушка, потом можно получать с бэка) ---
function getLeaderboard() {
  // Примерные данные
  return [
    { name: "Аня", stars: 25 },
    { name: "Иван", stars: 20 },
    { name: user.username || user.first_name, stars: user.stars },
    { name: "Олег", stars: 10 },
    { name: "Мария", stars: 7 },
  ].sort((a, b) => b.stars - a.stars);
}
function updateLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  getLeaderboard().forEach((u, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="min-width:2em;display:inline-block;">${
      i + 1
    }.</span> <b>${u.name}</b> — <span style="color:#229ED9;">${
      u.stars
    } ⭐</span>`;
    list.appendChild(li);
  });
}

// --- Реферальная система ---
function getReferralLink() {
  // В реальном приложении ссылка будет уникальной
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
function init() {
  loadData();
  updateUI();
  updateLeaderboard();
  if (tg) tg.ready();
}

init();
